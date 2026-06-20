// Bildschirm: Tagesprotokoll für ein Profil an einem bestimmten Tag.
import { getDailyLog, saveDailyLog, MEAL_SLOT_LABELS } from "../dailyLog.js";
import { renderDateNav } from "../calendar.js";
import { ICON_MEAL, ICON_WATER, ICON_SLEEP, ICON_WEIGHT } from "../icons.js";

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
  `;

  // Speichert das gesamte Log neu, sobald sich ein Feld ändert.
  async function persist() {
    await saveDailyLog(log);
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
}
