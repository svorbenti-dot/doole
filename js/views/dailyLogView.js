// Bildschirm: Tagesprotokoll für ein Profil an einem bestimmten Tag.
import { getDailyLog, saveDailyLog, MEAL_SLOT_LABELS } from "../dailyLog.js";
import { showToast } from "../toast.js";
import { renderDateNav } from "../calendar.js";
import { ICON_MEAL, ICON_WATER, ICON_SLEEP, ICON_WEIGHT, ICON_ACTIVITY, ICON_NOTE, ICON_PLUS, ICON_TRASH } from "../icons.js";

function mealCardHtml(slot, meal) {
  const label = MEAL_SLOT_LABELS[slot];
  return `
    <div class="section-card" data-meal-slot="${slot}">
      <h3>${ICON_MEAL} ${label}</h3>
      <div class="field">
        <label for="${slot}-zeit">Uhrzeit</label>
        <input id="${slot}-zeit" type="time" value="${meal.zeit || ""}">
      </div>
      <div class="field">
        <label for="${slot}-was">Was gegessen</label>
        <input id="${slot}-was" type="text" value="${meal.was || ""}">
      </div>
      <div class="field">
        <label for="${slot}-getraenk">Getränk</label>
        <input id="${slot}-getraenk" type="text" value="${meal.getraenk || ""}">
      </div>
      <div class="field">
        <label for="${slot}-portion">Portionsgröße</label>
        <input id="${slot}-portion" type="text" value="${meal.portion || ""}">
      </div>
      <div class="field">
        <label for="${slot}-saettigung">Sättigung (1-5)</label>
        <input id="${slot}-saettigung" type="number" min="1" max="5" value="${meal.saettigung ?? ""}">
      </div>
    </div>
  `;
}

function activityRowHtml(index, activity) {
  return `
    <div class="field" data-activity-index="${index}" style="display:flex;gap:var(--space-2);align-items:flex-end;">
      <div style="flex:2;">
        <label for="activity-${index}-art">Art</label>
        <input id="activity-${index}-art" type="text" value="${activity.art || ""}">
      </div>
      <div style="flex:1;">
        <label for="activity-${index}-dauer">Dauer (Min)</label>
        <input id="activity-${index}-dauer" type="number" min="0" value="${activity.dauerMin ?? ""}">
      </div>
      <div style="flex:1;">
        <label for="activity-${index}-zustand">Zustand</label>
        <input id="activity-${index}-zustand" type="text" value="${activity.zustand || ""}">
      </div>
      <button type="button" class="btn btn-secondary" data-remove-activity="${index}" aria-label="Aktivität entfernen" style="flex:0;">${ICON_TRASH}</button>
    </div>
  `;
}

export async function renderDailyLogView(container, headerContainer, profile, dateISO, onDateChange) {
  renderDateNav(headerContainer, dateISO, onDateChange);
  const log = await getDailyLog(profile.id, dateISO);

  container.innerHTML = `
    ${Object.entries(log.meals).map(([slot, meal]) => mealCardHtml(slot, meal)).join("")}
    <div class="section-card">
      <h3>${ICON_WATER} Wasser, Schlaf, Gewicht</h3>
      <div class="field">
        <label for="water-ml">Wasser (ml)</label>
        <input id="water-ml" type="number" min="0" step="50" value="${log.waterMl ?? ""}">
      </div>
      <div class="field">
        <label for="sleep-hours">${ICON_SLEEP} Schlaf (Stunden)</label>
        <input id="sleep-hours" type="number" min="0" max="24" step="0.5" value="${log.sleep.stunden ?? ""}">
      </div>
      <div class="field">
        <label for="sleep-quality">Schlafqualität (1-3)</label>
        <input id="sleep-quality" type="number" min="1" max="3" value="${log.sleep.qualitaet ?? ""}">
      </div>
      <div class="field">
        <label for="weight-kg">${ICON_WEIGHT} Gewicht (kg)</label>
        <input id="weight-kg" type="number" min="0" step="0.1" value="${log.weightKg ?? ""}">
      </div>
    </div>
    <div class="section-card">
      <h3>Alkohol &amp; Supplements</h3>
      <div class="field" style="display:flex;align-items:center;gap:var(--space-2);">
        <input id="alcohol-yes" type="checkbox" style="width:auto;min-height:auto;" ${log.alcohol.getrunken ? "checked" : ""}>
        <label for="alcohol-yes" style="margin:0;">Alkohol getrunken</label>
      </div>
      <div class="field">
        <label for="alcohol-info">Art / Menge</label>
        <input id="alcohol-info" type="text" value="${log.alcohol.info || ""}">
      </div>
      <div class="field">
        <label for="supplements">Supplements</label>
        <input id="supplements" type="text" value="${log.supplements || ""}">
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
      <h3>${ICON_NOTE} Notizen</h3>
      <div class="field">
        <textarea id="notes" rows="3">${log.notes || ""}</textarea>
      </div>
    </div>
  `;

  // Speichert das gesamte Log neu, sobald sich ein Feld ändert.
  async function persist() {
    try {
      await saveDailyLog(log);
      showToast("Gespeichert ✓");
    } catch (err) {
      // saveDailyLog hat bereits einen Fehler-Toast angezeigt.
    }
  }

  Object.keys(log.meals).forEach((slot) => {
    const card = container.querySelector(`[data-meal-slot="${slot}"]`);
    card.querySelector(`#${slot}-zeit`).addEventListener("change", (e) => { log.meals[slot].zeit = e.target.value; persist(); });
    card.querySelector(`#${slot}-was`).addEventListener("change", (e) => { log.meals[slot].was = e.target.value; persist(); });
    card.querySelector(`#${slot}-getraenk`).addEventListener("change", (e) => { log.meals[slot].getraenk = e.target.value; persist(); });
    card.querySelector(`#${slot}-portion`).addEventListener("change", (e) => { log.meals[slot].portion = e.target.value; persist(); });
    card.querySelector(`#${slot}-saettigung`).addEventListener("change", (e) => { log.meals[slot].saettigung = e.target.value ? Number(e.target.value) : null; persist(); });
  });

  container.querySelector("#water-ml").addEventListener("change", (e) => { log.waterMl = e.target.value ? Number(e.target.value) : null; persist(); });
  container.querySelector("#sleep-hours").addEventListener("change", (e) => { log.sleep.stunden = e.target.value ? Number(e.target.value) : null; persist(); });
  container.querySelector("#sleep-quality").addEventListener("change", (e) => { log.sleep.qualitaet = e.target.value ? Number(e.target.value) : null; persist(); });
  container.querySelector("#weight-kg").addEventListener("change", (e) => { log.weightKg = e.target.value ? Number(e.target.value) : null; persist(); });

  container.querySelector("#alcohol-yes").addEventListener("change", (e) => { log.alcohol.getrunken = e.target.checked; persist(); });
  container.querySelector("#alcohol-info").addEventListener("change", (e) => { log.alcohol.info = e.target.value; persist(); });
  container.querySelector("#supplements").addEventListener("change", (e) => { log.supplements = e.target.value; persist(); });
  container.querySelector("#notes").addEventListener("change", (e) => { log.notes = e.target.value; persist(); });

  function wireActivityRow(index) {
    const row = container.querySelector(`[data-activity-index="${index}"]`);
    row.querySelector(`#activity-${index}-art`).addEventListener("change", (e) => { log.activities[index].art = e.target.value; persist(); });
    row.querySelector(`#activity-${index}-dauer`).addEventListener("change", (e) => { log.activities[index].dauerMin = e.target.value ? Number(e.target.value) : null; persist(); });
    row.querySelector(`#activity-${index}-zustand`).addEventListener("change", (e) => { log.activities[index].zustand = e.target.value; persist(); });
    row.querySelector(`[data-remove-activity="${index}"]`).addEventListener("click", () => {
      log.activities.splice(index, 1);
      persist();
      renderDailyLogView(container, headerContainer, profile, dateISO, onDateChange);
    });
  }

  log.activities.forEach((_, index) => wireActivityRow(index));

  container.querySelector("#add-activity").addEventListener("click", () => {
    log.activities.push({ art: "", dauerMin: null, zustand: "" });
    persist();
    renderDailyLogView(container, headerContainer, profile, dateISO, onDateChange);
  });
}
