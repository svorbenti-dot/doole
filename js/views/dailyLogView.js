// Bildschirm: Tagesprotokoll für ein Profil an einem bestimmten Tag.
import {
  getDailyLog, saveDailyLog, MEAL_SLOT_LABELS, MEAL_SLOT_EMOJIS,
  PORTION_OPTIONS, GEFUEHL_VORHER, GEFUEHL_NACHHER, SCHLAF_QUALITAET, WATER_GOAL_ML, AKTIVITAET_ZUSTAND, SUPPLEMENT_GEFUEHL, MEDITATION_GEFUEHL, YOGA_GEFUEHL,
  activityKcalBurn, sportActivityKcalBurn, SPORTARTEN, YOGA_KCAL_BURN, STEP_KCAL_PER_STEP, TAGESFORM_OPTIONS, DAILY_DEFICIT_KCAL,
} from "../dailyLog.js";
import { showToast } from "../toast.js";
import { renderDateNav, todayISO } from "../calendar.js";
import { ICON_WATER, ICON_SLEEP, ICON_WEIGHT, ICON_ACTIVITY, ICON_NOTE, ICON_PLUS, ICON_TRASH, ICON_CHEVRON_RIGHT } from "../icons.js";
import { escapeHtml } from "../escapeHtml.js";
import { formatNumberDE } from "../format.js";
import { computeAndSaveDeficitStreak } from "../streak.js";
import { celebrateMilestoneOnce, weightStepMilestone } from "../milestones.js";
import { saveFoodDatabaseEntry, searchFoodDatabase, foodSizeOptions } from "../foodDb.js";

// Deckel bei 800 kcal (≈ 20.000 Schritte) gegen unrealistisch hohe Boni.
function stepsKcalBurn(steps) {
  return steps != null ? Math.min(800, Math.round(steps * STEP_KCAL_PER_STEP)) : 0;
}

function tagesformCardHtml(log) {
  return `
    <div class="section-card">
      <h3>Wie startest du in den Tag?</h3>
      <div class="emoji-picker tagesform-picker">
        ${TAGESFORM_OPTIONS.map((opt) => `
          <button type="button" class="emoji-btn emoji-btn-labeled ${log.tagesform === opt.value ? "selected" : ""}" data-tagesform-value="${opt.value}" aria-label="Tagesform: ${opt.label}">
            <span aria-hidden="true">${opt.emoji}</span>
            <span class="emoji-btn-caption">${opt.label}</span>
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

// Liefert den Vorschautext für die Akkordeon-Überschrift. Enthält rohen
// (nicht escapten) Nutzertext — sicher für `.textContent`-Zuweisung
// (siehe refreshAccordionPreviews), MUSS aber escaped werden, bevor er in
// ein innerHTML-Template interpoliert wird (siehe mealCardHtml).
function mealPreviewText(meal) {
  const parts = [];
  if (meal.zeit) parts.push(meal.zeit);
  parts.push(meal.was ? meal.was : "Noch nichts eingetragen");
  return parts.join(" · ");
}

function chipGroupHtml(name, options, currentValue) {
  return options.map((opt) => `
    <button type="button" class="chip ${currentValue === opt.value ? "selected" : ""}" data-chip-group="${name}" data-chip-value="${opt.value}">${opt.label}</button>
  `).join("");
}

function circleRatingHtml(name, currentValue) {
  return [1, 2, 3, 4, 5].map((n) => `
    <button type="button" class="circle ${currentValue === n ? "selected" : ""}" data-circle-group="${name}" data-circle-value="${n}" aria-label="${n} von 5">${n}</button>
  `).join("");
}

function emojiPickerHtml(name, options, currentValue) {
  return options.map((opt) => `
    <button type="button" class="emoji-btn ${currentValue === opt.value ? "selected" : ""}" data-emoji-group="${name}" data-emoji-value="${opt.value}" aria-label="${opt.label}">${opt.emoji}</button>
  `).join("");
}

function mealCardHtml(slot, meal) {
  const label = MEAL_SLOT_LABELS[slot];
  return `
    <div class="section-card accordion-card" data-meal-slot="${slot}">
      <button type="button" class="accordion-header" data-accordion-toggle="${slot}" aria-expanded="false" aria-controls="body-${slot}">
        <span class="accordion-emoji" aria-hidden="true">${MEAL_SLOT_EMOJIS[slot]}</span>
        <span class="accordion-title">
          <span class="accordion-name">${label}</span>
          <span class="accordion-preview" data-accordion-preview="${slot}">${escapeHtml(mealPreviewText(meal))}</span>
        </span>
        <span class="accordion-chevron" aria-hidden="true">${ICON_CHEVRON_RIGHT}</span>
      </button>
      <div class="accordion-body" id="body-${slot}" hidden>
        <div class="field">
          <label for="${slot}-zeit">Uhrzeit</label>
          <input id="${slot}-zeit" type="time" value="${escapeHtml(meal.zeit || "")}">
        </div>
        <div class="field">
          <label for="${slot}-was">Was gegessen</label>
          <textarea id="${slot}-was" rows="3">${escapeHtml(meal.was || "")}</textarea>
          <div class="food-suggestions" id="${slot}-food-suggestions" hidden></div>
        </div>
        <div class="field">
          <label for="${slot}-getraenk">Getränk</label>
          <input id="${slot}-getraenk" type="text" value="${escapeHtml(meal.getraenk || "")}">
        </div>
        <div class="field">
          <label for="${slot}-kalorien">Kalorien (optional)</label>
          <input id="${slot}-kalorien" type="number" min="0" max="5000" inputmode="numeric" value="${meal.kalorien ?? ""}">
          <div class="food-size-buttons" id="${slot}-food-sizes" hidden></div>
        </div>
        <div class="field">
          <label>Portionsgröße</label>
          <div class="chip-group">${chipGroupHtml("portion", PORTION_OPTIONS, meal.portion)}</div>
        </div>
        <div class="field">
          <label>Sättigung</label>
          <div class="circle-rating">${circleRatingHtml("saettigung", meal.saettigung)}</div>
        </div>
        <div class="field">
          <label>Gefühl vorher</label>
          <div class="emoji-picker">${emojiPickerHtml("gefuehlVorher", GEFUEHL_VORHER, meal.gefuehlVorher)}</div>
        </div>
        <div class="field">
          <label>Gefühl nachher</label>
          <div class="emoji-picker">${emojiPickerHtml("gefuehlNachher", GEFUEHL_NACHHER, meal.gefuehlNachher)}</div>
        </div>
      </div>
    </div>
  `;
}

function dailySummaryHtml(log) {
  const eatenMeals = Object.entries(log.meals).filter(([, meal]) => meal.was);
  const mealsHtml = eatenMeals.length
    ? eatenMeals.map(([slot, meal]) => `<li>${MEAL_SLOT_EMOJIS[slot]} <strong>${escapeHtml(MEAL_SLOT_LABELS[slot])}:</strong> ${escapeHtml(meal.was)}</li>`).join("")
    : `<li>Noch keine Mahlzeit eingetragen.</li>`;

  const activityCount = log.activities.length;
  const activityMinutes = log.activities.reduce((sum, a) => sum + (a.dauerMin || 0), 0);
  const activityLine = activityCount > 0
    ? `<li>${ICON_ACTIVITY} <strong>Aktivität:</strong> ${activityCount} Eintrag/Einträge, ${activityMinutes} Min</li>`
    : `<li>${ICON_ACTIVITY} <strong>Aktivität:</strong> Keine Aktivität eingetragen.</li>`;

  const sleepQualityOpt = SCHLAF_QUALITAET.find((o) => o.value === log.sleep.qualitaet);

  const meditationGefuehlOpt = MEDITATION_GEFUEHL.find((o) => o.value === log.meditation.gefuehl);
  const meditationLine = log.meditation.gemacht
    ? `Ja${meditationGefuehlOpt ? `, ${meditationGefuehlOpt.emoji} ${escapeHtml(meditationGefuehlOpt.label)}` : ""}${log.meditation.dauerMin ? `, ${log.meditation.dauerMin} Min` : ""}`
    : "Nein";

  const yogaGefuehlOpt = YOGA_GEFUEHL.find((o) => o.value === log.yoga.gefuehl);
  const yogaLine = log.yoga.gemacht
    ? `Ja${yogaGefuehlOpt ? `, ${yogaGefuehlOpt.emoji} ${escapeHtml(yogaGefuehlOpt.label)}` : ""}${log.yoga.dauerMin ? `, ${log.yoga.dauerMin} Min` : ""}`
    : "Nein";

  return `
    <ul class="daily-summary-list">
      ${mealsHtml}
      <li>${ICON_WATER} <strong>Wasser:</strong> ${log.waterMl || 0} / ${WATER_GOAL_ML} ml</li>
      <li>${ICON_SLEEP} <strong>Schlaf:</strong> ${log.sleep.stunden != null ? `${log.sleep.stunden} Std` : "Keine Angabe"}${sleepQualityOpt ? `, ${sleepQualityOpt.emoji} ${escapeHtml(sleepQualityOpt.label)}` : ""}</li>
      <li>${ICON_WEIGHT} <strong>Gewicht:</strong> ${log.weightKg != null ? `${log.weightKg} kg` : "Keine Angabe"}</li>
      <li>🚶 <strong>Schritte:</strong> ${log.steps != null ? `${formatNumberDE(log.steps)} Schritte (${stepsKcalBurn(log.steps)} kcal)` : "Keine Angabe"}</li>
      ${activityLine}
      <li><strong>Alkohol:</strong> ${log.alcohol.getrunken ? `Ja${log.alcohol.info ? ` (${escapeHtml(log.alcohol.info)})` : ""}` : "Nein"}</li>
      <li>🧘 <strong>Meditation:</strong> ${meditationLine}</li>
      <li>🧘‍♀️ <strong>Yoga:</strong> ${yogaLine}</li>
      <li>${ICON_NOTE} <strong>Notizen:</strong> ${log.notes ? escapeHtml(log.notes) : "–"}</li>
    </ul>
  `;
}

function kcalTotalHtml(log, profile, streak) {
  const total = Object.values(log.meals).reduce((sum, meal) => sum + (meal.kalorien || 0), 0);
  // TDEE (Gesamtumsatz) als Basis, nicht das bereits um 500 kcal reduzierte
  // Abnehm-Kalorienziel - sonst stimmt die "TDEE"-Beschriftung nicht.
  const baseGoal = profile.tdee;

  if (baseGoal == null) {
    return `<h3>Kalorien heute</h3><p class="kcal-total-value">${total} kcal</p>`;
  }

  const activityBurn = log.activities.reduce((sum, activity) => sum + activityKcalBurn(activity), 0);
  const yogaBurn = log.yoga.gemacht ? YOGA_KCAL_BURN : 0;
  const stepsBurn = stepsKcalBurn(log.steps);
  const tagesbedarf = baseGoal + activityBurn + yogaBurn + stepsBurn;
  const zielMitDefizit = tagesbedarf - DAILY_DEFICIT_KCAL;

  const bedarfParts = [`TDEE ${baseGoal}`];
  if (activityBurn > 0) bedarfParts.push(`Sport ${activityBurn}`);
  if (yogaBurn > 0) bedarfParts.push(`Yoga ${yogaBurn}`);
  if (stepsBurn > 0) bedarfParts.push(`Schritte ${stepsBurn}`);

  const diff = tagesbedarf - total;
  let zone;
  let statusEmoji;
  let statusText;
  if (diff > 750) {
    zone = "red";
  } else if (diff < 100) {
    zone = "yellow";
  } else {
    zone = "green";
  }
  if (diff > 0) {
    statusEmoji = "😊";
    statusText = `${diff} kcal unter Tagesbedarf`;
  } else if (diff === 0) {
    statusEmoji = "😐";
    statusText = "Tagesbedarf erreicht";
  } else {
    statusEmoji = "😟";
    statusText = `${-diff} kcal über Tagesbedarf`;
  }
  const progressPct = tagesbedarf > 0 ? Math.min(100, Math.round((total / tagesbedarf) * 100)) : 0;

  const streakHtml = streak > 0
    ? `<p class="kcal-streak">🔥 ${streak} ${streak === 1 ? "Tag" : "Tage"} in Folge im Defizit</p>`
    : "";

  const deficitWarningHtml = diff > 750
    ? `<p class="kcal-deficit-warning">⚠️ Dein Defizit ist heute sehr hoch. Iss noch etwas, um Muskelabbau zu vermeiden.</p>`
    : "";

  return `
    <h3>Kalorien heute</h3>
    <p class="kcal-breakdown">${bedarfParts.join(" + ")} = ${tagesbedarf} kcal Tagesbedarf</p>
    <p class="kcal-ziel-defizit">Ziel mit ${DAILY_DEFICIT_KCAL} Defizit: ${zielMitDefizit} kcal</p>
    <p class="kcal-total-value">Gegessen ${total} kcal</p>
    <div class="water-progress"><div class="water-progress-fill kcal-zone-${zone}" style="width:${progressPct}%"></div></div>
    <p class="kcal-status">${statusEmoji} ${statusText}</p>
    ${deficitWarningHtml}
    ${streakHtml}
  `;
}

function supplementRowHtml(index, supplement) {
  return `
    <div class="field" data-supplement-index="${index}">
      <div style="display:flex;gap:var(--space-2);align-items:flex-end;">
        <div style="flex:1;">
          <label for="supplement-${index}-name">Supplement</label>
          <input id="supplement-${index}-name" type="text" value="${escapeHtml(supplement.name || "")}">
        </div>
        <button type="button" class="btn btn-secondary" data-remove-supplement="${index}" aria-label="Supplement entfernen" style="flex:0;">${ICON_TRASH}</button>
      </div>
      <div style="margin-top:var(--space-2);">
        <label>Wirkung</label>
        <div class="emoji-picker">${emojiPickerHtml(`supplement-feeling-${index}`, SUPPLEMENT_GEFUEHL, supplement.feeling)}</div>
      </div>
    </div>
  `;
}

function activityRowHtml(index, activity) {
  const kcalPreview = sportActivityKcalBurn(activity);
  return `
    <div class="field" data-activity-index="${index}">
      <label for="activity-${index}-sport">Sportart (optional)</label>
      <select id="activity-${index}-sport">
        <option value="">– Eigene Eingabe –</option>
        ${SPORTARTEN.map((s) => `<option value="${s.value}" ${activity.sport === s.value ? "selected" : ""}>${s.emoji} ${s.label} (${s.kcalPer30Min} kcal/30 Min)</option>`).join("")}
      </select>
      <div style="display:flex;gap:var(--space-2);align-items:flex-end;margin-top:var(--space-2);">
        <div style="flex:2;">
          <label for="activity-${index}-art">Art</label>
          <input id="activity-${index}-art" type="text" value="${escapeHtml(activity.art || "")}">
        </div>
        <div style="flex:1;">
          <label for="activity-${index}-dauer">Dauer (Min)</label>
          <input id="activity-${index}-dauer" type="number" min="0" value="${activity.dauerMin ?? ""}">
        </div>
        <button type="button" class="btn btn-secondary" data-remove-activity="${index}" aria-label="Aktivität entfernen" style="flex:0;">${ICON_TRASH}</button>
      </div>
      ${kcalPreview != null ? `<p class="activity-kcal-preview">≈ ${kcalPreview} kcal</p>` : ""}
      <div style="margin-top:var(--space-2);">
        <label>Zustand</label>
        <div class="emoji-picker">${emojiPickerHtml(`zustand-${index}`, AKTIVITAET_ZUSTAND, activity.zustand)}</div>
      </div>
    </div>
  `;
}

export async function renderDailyLogView(container, headerContainer, profile, dateISO, onDateChange) {
  renderDateNav(headerContainer, dateISO, onDateChange);
  const log = await getDailyLog(profile.id, dateISO);
  // Der Streak bezieht sich immer auf "heute", nicht auf den gerade angezeigten Tag.
  const streak = dateISO === todayISO() ? await computeAndSaveDeficitStreak(profile.id, profile.tdee) : 0;

  container.innerHTML = `
    ${tagesformCardHtml(log)}
    <div class="section-card">
      <h3>Tagesbericht</h3>
      <div id="daily-summary">${dailySummaryHtml(log)}</div>
      <div id="kcal-total-card" class="kcal-total-section">${kcalTotalHtml(log, profile, streak)}</div>
    </div>
    ${Object.entries(log.meals).map(([slot, meal]) => mealCardHtml(slot, meal)).join("")}
    <div class="section-card water-card">
      <h3>${ICON_WATER} Wasser</h3>
      <div class="water-row">
        <button type="button" class="water-stepper-btn minus" id="water-minus" aria-label="200 Milliliter abziehen">−</button>
        <div class="water-sum" id="water-sum">${log.waterMl || 0} / ${WATER_GOAL_ML} ml</div>
        <button type="button" class="water-stepper-btn" id="water-plus" aria-label="200 Milliliter hinzufügen">${ICON_WATER}</button>
      </div>
      <div class="water-progress"><div class="water-progress-fill" id="water-progress-fill" style="width:${Math.min(100, ((log.waterMl || 0) / WATER_GOAL_ML) * 100)}%"></div></div>
    </div>
    <div class="section-card">
      <h3>${ICON_SLEEP} Schlaf</h3>
      <div class="field">
        <label for="sleep-hours">Stunden</label>
        <input id="sleep-hours" type="number" min="0" max="24" step="0.5" value="${log.sleep.stunden ?? ""}">
      </div>
      <div class="field">
        <label>Schlafqualität</label>
        <div class="emoji-picker">
          ${SCHLAF_QUALITAET.map((opt) => `
            <button type="button" class="emoji-btn emoji-btn-labeled ${log.sleep.qualitaet === opt.value ? "selected" : ""}" data-sleep-quality-value="${opt.value}" aria-label="Schlafqualität: ${opt.label}">
              <span aria-hidden="true">${opt.emoji}</span>
              <span class="emoji-btn-caption">${opt.label}</span>
            </button>
          `).join("")}
        </div>
      </div>
    </div>
    <div class="section-card">
      <h3>${ICON_WEIGHT} Gewicht</h3>
      <div class="field">
        <label for="weight-kg">Kilogramm</label>
        <input id="weight-kg" type="number" min="0" step="0.1" value="${log.weightKg ?? ""}">
      </div>
    </div>
    <div class="section-card">
      <h3>🚶 Schritte</h3>
      <div class="field">
        <label for="steps-input">Schritte heute</label>
        <input id="steps-input" type="number" min="0" step="1" inputmode="numeric" value="${log.steps ?? ""}">
      </div>
    </div>
    <div class="section-card">
      <h3>Alkohol &amp; Supplements</h3>
      <div class="field" style="display:flex;align-items:center;gap:var(--space-3);">
        <label class="toggle-switch">
          <input type="checkbox" id="alcohol-yes" ${log.alcohol.getrunken ? "checked" : ""}>
          <span class="toggle-track"></span>
          <span class="toggle-thumb"></span>
        </label>
        <label for="alcohol-yes" style="margin:0;">Alkohol getrunken</label>
      </div>
      <div class="field">
        <label for="alcohol-info">Art / Menge</label>
        <input id="alcohol-info" type="text" value="${escapeHtml(log.alcohol.info || "")}">
      </div>
      <div class="field">
        <label>Supplements</label>
        <div id="supplement-list" style="display:flex;flex-direction:column;gap:var(--space-2);margin-bottom:var(--space-3);">
          ${log.supplements.map((supplement, index) => supplementRowHtml(index, supplement)).join("")}
        </div>
        <button type="button" id="add-supplement" class="btn btn-secondary">${ICON_PLUS} Supplement hinzufügen</button>
      </div>
    </div>
    <div class="section-card">
      <h3>${ICON_ACTIVITY} Aktivität</h3>
      <div id="activity-list" style="display:flex;flex-direction:column;gap:var(--space-2);margin-bottom:var(--space-3);">
        ${log.activities.map((activity, index) => activityRowHtml(index, activity)).join("")}
      </div>
      <button type="button" id="add-activity" class="btn btn-secondary">${ICON_PLUS} Aktivität hinzufügen</button>
    </div>
    <div class="section-card">
      <h3>🧘 Meditation</h3>
      <div class="field" style="display:flex;align-items:center;gap:var(--space-3);">
        <label class="toggle-switch">
          <input type="checkbox" id="meditation-yes" ${log.meditation.gemacht ? "checked" : ""}>
          <span class="toggle-track"></span>
          <span class="toggle-thumb"></span>
        </label>
        <label for="meditation-yes" style="margin:0;">Heute meditiert?</label>
      </div>
      ${log.meditation.gemacht ? `
        <div class="field">
          <label>Wie gefühlt?</label>
          <div class="emoji-picker">${emojiPickerHtml("meditation-gefuehl", MEDITATION_GEFUEHL, log.meditation.gefuehl)}</div>
        </div>
        <div class="field">
          <label for="meditation-dauer">Dauer in Minuten (optional)</label>
          <input id="meditation-dauer" type="number" min="0" value="${log.meditation.dauerMin ?? ""}">
        </div>
      ` : ""}
    </div>
    <div class="section-card">
      <h3>🧘‍♀️ Yoga</h3>
      <div class="field" style="display:flex;align-items:center;gap:var(--space-3);">
        <label class="toggle-switch">
          <input type="checkbox" id="yoga-yes" ${log.yoga.gemacht ? "checked" : ""}>
          <span class="toggle-track"></span>
          <span class="toggle-thumb"></span>
        </label>
        <label for="yoga-yes" style="margin:0;">Heute Yoga gemacht?</label>
      </div>
      ${log.yoga.gemacht ? `
        <div class="field">
          <label>Wie gefühlt?</label>
          <div class="emoji-picker">${emojiPickerHtml("yoga-gefuehl", YOGA_GEFUEHL, log.yoga.gefuehl)}</div>
        </div>
        <div class="field">
          <label for="yoga-dauer">Dauer in Minuten (optional)</label>
          <input id="yoga-dauer" type="number" min="0" value="${log.yoga.dauerMin ?? ""}">
        </div>
      ` : ""}
    </div>
    <div class="section-card">
      <h3>${ICON_NOTE} Notizen</h3>
      <div class="field">
        <textarea id="notes" rows="3">${escapeHtml(log.notes || "")}</textarea>
      </div>
    </div>
  `;

  // Speichert das gesamte Log neu, sobald sich ein Feld ändert.
  function updateDailySummary() {
    container.querySelector("#daily-summary").innerHTML = dailySummaryHtml(log);
  }

  function updateMealKcalTotal() {
    container.querySelector("#kcal-total-card").innerHTML = kcalTotalHtml(log, profile, streak);
  }

  async function persist() {
    updateDailySummary();
    updateMealKcalTotal();
    try {
      await saveDailyLog(log);
      showToast("Gespeichert ✓");
    } catch (err) {
      // saveDailyLog hat bereits einen Fehler-Toast angezeigt.
    }
  }

  // Sobald Name, Portionsgröße und Kalorien einer Mahlzeit vorhanden sind,
  // landet das Gericht automatisch in der persönlichen Essen-Datenbank.
  function trySaveFood(slot) {
    const meal = log.meals[slot];
    saveFoodDatabaseEntry(meal.was, meal.portion, meal.kalorien);
  }

  function showFoodSizeButtons(card, slot, baseKcal) {
    const sizesEl = card.querySelector(`#${slot}-food-sizes`);
    sizesEl.hidden = false;
    sizesEl.innerHTML = foodSizeOptions(baseKcal).map((opt) => {
      const portionOpt = PORTION_OPTIONS.find((p) => p.value === opt.value);
      return `<button type="button" class="chip" data-food-size="${opt.value}" data-food-size-kcal="${opt.kcal}">${portionOpt.label} (${opt.kcal} kcal)</button>`;
    }).join("");
    sizesEl.querySelectorAll("[data-food-size]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const portionValue = btn.dataset.foodSize;
        const kcalValue = Number(btn.dataset.foodSizeKcal);
        log.meals[slot].portion = portionValue;
        log.meals[slot].kalorien = kcalValue;
        card.querySelector(`#${slot}-kalorien`).value = kcalValue;
        card.querySelectorAll(`[data-chip-group="portion"]`).forEach((b) => b.classList.toggle("selected", b.dataset.chipValue === portionValue));
        sizesEl.hidden = true;
        persist();
      });
    });
  }

  let openMealSlot = null;

  function refreshAccordionPreviews() {
    Object.keys(log.meals).forEach((s) => {
      const previewEl = container.querySelector(`[data-accordion-preview="${s}"]`);
      previewEl.textContent = mealPreviewText(log.meals[s]);
    });
  }

  function setOpenMealSlot(slot) {
    refreshAccordionPreviews();
    openMealSlot = slot;
    Object.keys(log.meals).forEach((s) => {
      const card = container.querySelector(`[data-meal-slot="${s}"]`);
      const header = card.querySelector(".accordion-header");
      const body = card.querySelector(".accordion-body");
      const isOpen = s === slot;
      body.hidden = !isOpen;
      header.setAttribute("aria-expanded", String(isOpen));
      header.classList.toggle("open", isOpen);
    });
  }

  Object.keys(log.meals).forEach((slot) => {
    const card = container.querySelector(`[data-meal-slot="${slot}"]`);

    card.querySelector(".accordion-header").addEventListener("click", () => {
      setOpenMealSlot(openMealSlot === slot ? null : slot);
    });

    card.querySelector(`#${slot}-zeit`).addEventListener("change", (e) => { log.meals[slot].zeit = e.target.value; persist(); });
    const wasTextarea = card.querySelector(`#${slot}-was`);
    const suggestionsEl = card.querySelector(`#${slot}-food-suggestions`);
    wasTextarea.addEventListener("change", (e) => { log.meals[slot].was = e.target.value; persist(); trySaveFood(slot); });
    wasTextarea.addEventListener("input", async () => {
      const query = wasTextarea.value.trim();
      if (query.length < 2) {
        suggestionsEl.hidden = true;
        suggestionsEl.innerHTML = "";
        return;
      }
      const matches = await searchFoodDatabase(query);
      if (!matches.length) {
        suggestionsEl.hidden = true;
        suggestionsEl.innerHTML = "";
        return;
      }
      suggestionsEl.hidden = false;
      suggestionsEl.innerHTML = matches.map((f) => `<button type="button" class="food-suggestion-btn" data-food-name="${escapeHtml(f.name)}" data-food-kcal="${f.baseKcal}">${escapeHtml(f.name)}</button>`).join("");
      suggestionsEl.querySelectorAll("[data-food-name]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const name = btn.dataset.foodName;
          const baseKcal = Number(btn.dataset.foodKcal);
          wasTextarea.value = name;
          log.meals[slot].was = name;
          suggestionsEl.hidden = true;
          suggestionsEl.innerHTML = "";
          showFoodSizeButtons(card, slot, baseKcal);
          persist();
        });
      });
    });
    card.querySelector(`#${slot}-getraenk`).addEventListener("change", (e) => { log.meals[slot].getraenk = e.target.value; persist(); });
    card.querySelector(`#${slot}-kalorien`).addEventListener("change", (e) => {
      log.meals[slot].kalorien = e.target.value ? Number(e.target.value) : null;
      if (log.meals[slot].kalorien != null && log.meals[slot].kalorien > 5000) {
        showToast("Das sind sehr viele Kalorien für eine Mahlzeit - bitte prüfen.", "error");
      }
      persist();
      trySaveFood(slot);
    });

    card.querySelectorAll(`[data-chip-group="portion"]`).forEach((btn) => {
      btn.addEventListener("click", () => {
        log.meals[slot].portion = btn.dataset.chipValue;
        card.querySelectorAll(`[data-chip-group="portion"]`).forEach((b) => b.classList.toggle("selected", b === btn));
        persist();
        trySaveFood(slot);
      });
    });

    card.querySelectorAll(`[data-circle-group="saettigung"]`).forEach((btn) => {
      btn.addEventListener("click", () => {
        log.meals[slot].saettigung = Number(btn.dataset.circleValue);
        card.querySelectorAll(`[data-circle-group="saettigung"]`).forEach((b) => b.classList.toggle("selected", b === btn));
        persist();
      });
    });

    card.querySelectorAll(`[data-emoji-group="gefuehlVorher"]`).forEach((btn) => {
      btn.addEventListener("click", () => {
        log.meals[slot].gefuehlVorher = Number(btn.dataset.emojiValue);
        card.querySelectorAll(`[data-emoji-group="gefuehlVorher"]`).forEach((b) => b.classList.toggle("selected", b === btn));
        persist();
      });
    });

    card.querySelectorAll(`[data-emoji-group="gefuehlNachher"]`).forEach((btn) => {
      btn.addEventListener("click", () => {
        log.meals[slot].gefuehlNachher = Number(btn.dataset.emojiValue);
        card.querySelectorAll(`[data-emoji-group="gefuehlNachher"]`).forEach((b) => b.classList.toggle("selected", b === btn));
        persist();
      });
    });
  });

  function updateWaterDisplay() {
    container.querySelector("#water-sum").textContent = `${log.waterMl || 0} / ${WATER_GOAL_ML} ml`;
    container.querySelector("#water-progress-fill").style.width = `${Math.min(100, ((log.waterMl || 0) / WATER_GOAL_ML) * 100)}%`;
  }

  container.querySelector("#water-plus").addEventListener("click", () => {
    log.waterMl = (log.waterMl || 0) + 200;
    updateWaterDisplay();
    persist();
  });

  container.querySelector("#water-minus").addEventListener("click", () => {
    log.waterMl = Math.max(0, (log.waterMl || 0) - 200);
    updateWaterDisplay();
    persist();
  });
  container.querySelectorAll("[data-tagesform-value]").forEach((btn) => {
    btn.addEventListener("click", () => {
      log.tagesform = Number(btn.dataset.tagesformValue);
      container.querySelectorAll("[data-tagesform-value]").forEach((b) => b.classList.toggle("selected", b === btn));
      persist();
    });
  });
  container.querySelector("#sleep-hours").addEventListener("change", (e) => { log.sleep.stunden = e.target.value ? Number(e.target.value) : null; persist(); });
  container.querySelectorAll("[data-sleep-quality-value]").forEach((btn) => {
    btn.addEventListener("click", () => {
      log.sleep.qualitaet = Number(btn.dataset.sleepQualityValue);
      container.querySelectorAll("[data-sleep-quality-value]").forEach((b) => b.classList.toggle("selected", b === btn));
      persist();
    });
  });
  container.querySelector("#weight-kg").addEventListener("change", (e) => {
    log.weightKg = e.target.value ? Number(e.target.value) : null;
    if (log.weightKg != null) {
      const { id, threshold } = weightStepMilestone(log.weightKg);
      celebrateMilestoneOnce(profile.id, id, `Gewicht erstmals unter ${threshold} kg!`);
    }
    persist();
  });
  container.querySelector("#steps-input").addEventListener("change", (e) => {
    log.steps = e.target.value ? Math.max(0, Math.round(Number(e.target.value))) : null;
    e.target.value = log.steps ?? "";
    persist();
  });

  container.querySelector("#alcohol-yes").addEventListener("change", (e) => { log.alcohol.getrunken = e.target.checked; persist(); });
  container.querySelector("#alcohol-info").addEventListener("change", (e) => { log.alcohol.info = e.target.value; persist(); });
  container.querySelector("#notes").addEventListener("change", (e) => { log.notes = e.target.value; persist(); });

  container.querySelector("#meditation-yes").addEventListener("change", (e) => {
    log.meditation.gemacht = e.target.checked;
    persist();
    renderDailyLogView(container, headerContainer, profile, dateISO, onDateChange);
  });
  const meditationDauerInput = container.querySelector("#meditation-dauer");
  if (meditationDauerInput) {
    meditationDauerInput.addEventListener("change", (e) => { log.meditation.dauerMin = e.target.value ? Number(e.target.value) : null; persist(); });
  }
  container.querySelectorAll(`[data-emoji-group="meditation-gefuehl"]`).forEach((btn) => {
    btn.addEventListener("click", () => {
      log.meditation.gefuehl = btn.dataset.emojiValue;
      container.querySelectorAll(`[data-emoji-group="meditation-gefuehl"]`).forEach((b) => b.classList.toggle("selected", b === btn));
      persist();
    });
  });

  container.querySelector("#yoga-yes").addEventListener("change", (e) => {
    log.yoga.gemacht = e.target.checked;
    persist();
    renderDailyLogView(container, headerContainer, profile, dateISO, onDateChange);
  });
  const yogaDauerInput = container.querySelector("#yoga-dauer");
  if (yogaDauerInput) {
    yogaDauerInput.addEventListener("change", (e) => { log.yoga.dauerMin = e.target.value ? Number(e.target.value) : null; persist(); });
  }
  container.querySelectorAll(`[data-emoji-group="yoga-gefuehl"]`).forEach((btn) => {
    btn.addEventListener("click", () => {
      log.yoga.gefuehl = btn.dataset.emojiValue;
      container.querySelectorAll(`[data-emoji-group="yoga-gefuehl"]`).forEach((b) => b.classList.toggle("selected", b === btn));
      persist();
    });
  });

  function wireSupplementRow(index) {
    const row = container.querySelector(`[data-supplement-index="${index}"]`);
    row.querySelector(`#supplement-${index}-name`).addEventListener("change", (e) => { log.supplements[index].name = e.target.value; persist(); });
    row.querySelectorAll(`[data-emoji-group="supplement-feeling-${index}"]`).forEach((btn) => {
      btn.addEventListener("click", () => {
        log.supplements[index].feeling = btn.dataset.emojiValue;
        row.querySelectorAll(`[data-emoji-group="supplement-feeling-${index}"]`).forEach((b) => b.classList.toggle("selected", b === btn));
        persist();
      });
    });
    row.querySelector(`[data-remove-supplement="${index}"]`).addEventListener("click", () => {
      log.supplements.splice(index, 1);
      persist();
      renderDailyLogView(container, headerContainer, profile, dateISO, onDateChange);
    });
  }

  log.supplements.forEach((_, index) => wireSupplementRow(index));

  container.querySelector("#add-supplement").addEventListener("click", () => {
    log.supplements.push({ name: "", feeling: null });
    persist();
    renderDailyLogView(container, headerContainer, profile, dateISO, onDateChange);
  });

  function wireActivityRow(index) {
    const row = container.querySelector(`[data-activity-index="${index}"]`);
    row.querySelector(`#activity-${index}-sport`).addEventListener("change", (e) => {
      const sportValue = e.target.value || null;
      log.activities[index].sport = sportValue;
      if (sportValue) {
        const sport = SPORTARTEN.find((s) => s.value === sportValue);
        log.activities[index].art = `${sport.emoji} ${sport.label}`;
      }
      persist();
      renderDailyLogView(container, headerContainer, profile, dateISO, onDateChange);
    });
    row.querySelector(`#activity-${index}-art`).addEventListener("change", (e) => { log.activities[index].art = e.target.value; persist(); });
    row.querySelector(`#activity-${index}-dauer`).addEventListener("change", (e) => {
      log.activities[index].dauerMin = e.target.value ? Number(e.target.value) : null;
      persist();
      if (log.activities[index].sport) {
        renderDailyLogView(container, headerContainer, profile, dateISO, onDateChange);
      }
    });
    row.querySelectorAll(`[data-emoji-group="zustand-${index}"]`).forEach((btn) => {
      btn.addEventListener("click", () => {
        log.activities[index].zustand = btn.dataset.emojiValue;
        row.querySelectorAll(`[data-emoji-group="zustand-${index}"]`).forEach((b) => b.classList.toggle("selected", b === btn));
        persist();
      });
    });
    row.querySelector(`[data-remove-activity="${index}"]`).addEventListener("click", () => {
      log.activities.splice(index, 1);
      persist();
      renderDailyLogView(container, headerContainer, profile, dateISO, onDateChange);
    });
  }

  log.activities.forEach((_, index) => wireActivityRow(index));

  container.querySelector("#add-activity").addEventListener("click", () => {
    log.activities.push({ art: "", dauerMin: null, zustand: "", sport: null });
    persist();
    renderDailyLogView(container, headerContainer, profile, dateISO, onDateChange);
  });
}
