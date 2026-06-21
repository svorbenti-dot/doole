# Doole Mobile-UX-Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Doole's Tagesprotokoll-Bildschirm für exzellente Mobile-UX überarbeiten: Autosave-Bestätigung, Akkordeon-Mahlzeitenkarten mit Stimmungs-Tracking, Wasser-Stepper, neue Farbpalette mit Kente-Header-Muster, und kompakte Karten für die restlichen Felder.

**Architecture:** Reine Erweiterung der bestehenden Phase-1-Architektur (vanilla ES modules, keine neuen Abhängigkeiten). `js/dailyLog.js` bekommt neue Konstanten/Datenfelder, `js/views/dailyLogView.js` wird schrittweise umgebaut, `css/tokens.css`/`css/styles.css` bekommen neue Tokens und Komponenten-Klassen.

**Tech Stack:** Unverändert — vanilla HTML/CSS/JS, ES modules, IndexedDB.

## Global Constraints

- Abweichung vom bisherigen Phase-1-Grundsatz "keine Emojis": dieses Redesign verwendet Emoji gezielt für Mahlzeiten-Vorschau, Stimmungs-Picker (Gefühl vorher/nachher) und Schlafqualität, auf explizite Anweisung des Nutzers. SVG-Icons (`js/icons.js`) bleiben für Navigation, Header-Icons und alle bestehenden Screens unverändert in Kraft — diese Abweichung gilt nur für die neuen Felder in dieser Liste.
- Alle Touch-Ziele mindestens 44×44px (`--touch-min`).
- Alle Schriftgrößen mindestens 16px (`--font-size-body`).
- Alle Texte/Kommentare weiterhin Deutsch.
- Keine neuen externen Abhängigkeiten, kein Build-Tool.
- IndexedDB-Zugriff weiterhin ausschließlich über `js/db.js`.
- Bestehende Architektur-Grenzen bleiben: View-Module rufen nur Domain-Module/`toast.js`/`icons.js` auf.

---

### Task M1: Speichern-Bestätigung (Bug-Fix) und Datenmodell-Erweiterung

**Files:**
- Modify: `js/dailyLog.js`
- Modify: `js/views/dailyLogView.js`
- Modify: `index.html`

**Interfaces:**
- Produces (new exports from `js/dailyLog.js`): `PORTION_OPTIONS: {value, label}[]`, `GEFUEHL_VORHER: {value, emoji, label}[]`, `GEFUEHL_NACHHER: {value, emoji, label}[]`, `MEAL_SLOT_EMOJIS: {[slot]: string}`, `WATER_GOAL_ML: number`, `SCHLAF_QUALITAET: {value, emoji, label}[]`.
- `createEmptyDailyLog`'s meal objects gain two new fields: `gefuehlVorher`, `gefuehlNachher` (both `number|null`).

- [ ] **Step 1: Extend the daily log domain module**

In `js/dailyLog.js`, replace the `emptyMeal` function:

```js
function emptyMeal() {
  return { zeit: "", was: "", getraenk: "", portion: "", saettigung: null, gefuehlVorher: null, gefuehlNachher: null };
}
```

Add these exports at the end of the file, after `MEAL_SLOT_LABELS`:

```js
export const MEAL_SLOT_EMOJIS = {
  fruehstueck: "🍳",
  snack1: "🍎",
  mittag: "🍲",
  snack2: "🥨",
  abendbrot: "🍽️",
};

export const PORTION_OPTIONS = [
  { value: "klein", label: "Klein" },
  { value: "mittel", label: "Mittel" },
  { value: "gross", label: "Groß" },
];

export const GEFUEHL_VORHER = [
  { value: 1, emoji: "😟", label: "Besorgt" },
  { value: 2, emoji: "😐", label: "Neutral" },
  { value: 3, emoji: "🙂", label: "Zufrieden" },
  { value: 4, emoji: "😊", label: "Froh" },
  { value: 5, emoji: "🤩", label: "Begeistert" },
];

export const GEFUEHL_NACHHER = [
  { value: 1, emoji: "🤢", label: "Unwohl" },
  { value: 2, emoji: "😴", label: "Müde" },
  { value: 3, emoji: "😐", label: "Neutral" },
  { value: 4, emoji: "🙂", label: "Zufrieden" },
  { value: 5, emoji: "😊", label: "Gut" },
];

export const SCHLAF_QUALITAET = [
  { value: 1, emoji: "😫", label: "Schlecht" },
  { value: 2, emoji: "😐", label: "Okay" },
  { value: 3, emoji: "😴", label: "Gut" },
];

export const WATER_GOAL_ML = 4000;
```

- [ ] **Step 2: Add a success toast on every save**

In `js/views/dailyLogView.js`, add `showToast` to the existing import line:

```js
import { getDailyLog, saveDailyLog, MEAL_SLOT_LABELS } from "../dailyLog.js";
```

becomes:

```js
import { getDailyLog, saveDailyLog, MEAL_SLOT_LABELS } from "../dailyLog.js";
import { showToast } from "../toast.js";
```

Replace the `persist` function:

```js
  async function persist() {
    await saveDailyLog(log);
  }
```

with:

```js
  async function persist() {
    try {
      await saveDailyLog(log);
      showToast("Gespeichert ✓");
    } catch (err) {
      // saveDailyLog hat bereits einen Fehler-Toast angezeigt.
    }
  }
```

- [ ] **Step 3: Make toasts screen-reader friendly**

In `index.html`, change the toast root line:

```html
  <div id="toast-root"></div>
```

to:

```html
  <div id="toast-root" aria-live="polite"></div>
```

- [ ] **Step 4: Manually verify in the browser**

Run `npx serve . -l 3000`, open a profile's daily log, change the weight field and click away (blur). Expected: a toast "Gespeichert ✓" appears and disappears after 4 seconds. Reload the page: the new value persisted.

- [ ] **Step 5: Commit**

```bash
git add js/dailyLog.js js/views/dailyLogView.js index.html
git commit -m "Mobile-UX: Speichern-Bestätigung und Datenmodell-Erweiterung für Akkordeon-Felder"
```

---

### Task M2: Mahlzeiten-Akkordeon mit Stimmungs-Tracking

**Files:**
- Modify: `js/views/dailyLogView.js`
- Modify: `css/styles.css`

**Interfaces:**
- Consumes: `MEAL_SLOT_EMOJIS`, `PORTION_OPTIONS`, `GEFUEHL_VORHER`, `GEFUEHL_NACHHER` from `js/dailyLog.js` (Task M1); `ICON_CHEVRON_RIGHT` from `js/icons.js`.
- Produces: meal cards render as a single-open accordion; `mealCardHtml` signature unchanged externally (still called per slot), internal structure rewritten.

- [ ] **Step 1: Extend imports**

In `js/views/dailyLogView.js`, replace the two import lines for `dailyLog.js` and `icons.js`:

```js
import { getDailyLog, saveDailyLog, MEAL_SLOT_LABELS } from "../dailyLog.js";
import { showToast } from "../toast.js";
import { renderDateNav } from "../calendar.js";
import { ICON_MEAL, ICON_WATER, ICON_SLEEP, ICON_WEIGHT, ICON_ACTIVITY, ICON_NOTE, ICON_PLUS, ICON_TRASH } from "../icons.js";
```

with:

```js
import {
  getDailyLog, saveDailyLog, MEAL_SLOT_LABELS, MEAL_SLOT_EMOJIS,
  PORTION_OPTIONS, GEFUEHL_VORHER, GEFUEHL_NACHHER, SCHLAF_QUALITAET, WATER_GOAL_ML,
} from "../dailyLog.js";
import { showToast } from "../toast.js";
import { renderDateNav } from "../calendar.js";
import { ICON_WATER, ICON_SLEEP, ICON_WEIGHT, ICON_ACTIVITY, ICON_NOTE, ICON_PLUS, ICON_TRASH, ICON_CHEVRON_RIGHT } from "../icons.js";
```

(`ICON_MEAL` is no longer used — the accordion header uses an emoji instead.)

- [ ] **Step 2: Replace `mealCardHtml` with the accordion version**

Replace the entire `mealCardHtml` function with:

```js
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
          <span class="accordion-preview" data-accordion-preview="${slot}">${mealPreviewText(meal)}</span>
        </span>
        <span class="accordion-chevron" aria-hidden="true">${ICON_CHEVRON_RIGHT}</span>
      </button>
      <div class="accordion-body" id="body-${slot}" hidden>
        <div class="field">
          <label for="${slot}-zeit">Uhrzeit</label>
          <input id="${slot}-zeit" type="time" value="${meal.zeit || ""}">
        </div>
        <div class="field">
          <label for="${slot}-was">Was gegessen</label>
          <textarea id="${slot}-was" rows="3">${meal.was || ""}</textarea>
        </div>
        <div class="field">
          <label for="${slot}-getraenk">Getränk</label>
          <input id="${slot}-getraenk" type="text" value="${meal.getraenk || ""}">
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
```

- [ ] **Step 3: Replace the meal-wiring block**

Replace this block in `renderDailyLogView`:

```js
  Object.keys(log.meals).forEach((slot) => {
    const card = container.querySelector(`[data-meal-slot="${slot}"]`);
    card.querySelector(`#${slot}-zeit`).addEventListener("change", (e) => { log.meals[slot].zeit = e.target.value; persist(); });
    card.querySelector(`#${slot}-was`).addEventListener("change", (e) => { log.meals[slot].was = e.target.value; persist(); });
    card.querySelector(`#${slot}-getraenk`).addEventListener("change", (e) => { log.meals[slot].getraenk = e.target.value; persist(); });
    card.querySelector(`#${slot}-portion`).addEventListener("change", (e) => { log.meals[slot].portion = e.target.value; persist(); });
    card.querySelector(`#${slot}-saettigung`).addEventListener("change", (e) => { log.meals[slot].saettigung = e.target.value ? Number(e.target.value) : null; persist(); });
  });
```

with:

```js
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
    card.querySelector(`#${slot}-was`).addEventListener("change", (e) => { log.meals[slot].was = e.target.value; persist(); });
    card.querySelector(`#${slot}-getraenk`).addEventListener("change", (e) => { log.meals[slot].getraenk = e.target.value; persist(); });

    card.querySelectorAll(`[data-chip-group="portion"]`).forEach((btn) => {
      btn.addEventListener("click", () => {
        log.meals[slot].portion = btn.dataset.chipValue;
        card.querySelectorAll(`[data-chip-group="portion"]`).forEach((b) => b.classList.toggle("selected", b === btn));
        persist();
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
```

(Each `data-chip-group`/`data-circle-group`/`data-emoji-group` selector is scoped to `card`, so the same group name reused across the 5 meal cards never cross-wires.)

- [ ] **Step 4: Add accordion and control styles**

In `css/styles.css`, append at the end of the file:

```css
/* Akkordeon (Mahlzeiten-Karten) */
.accordion-card {
  padding: 0;
  overflow: hidden;
}

.accordion-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  min-height: var(--touch-min);
}

.accordion-emoji {
  font-size: 28px;
  flex-shrink: 0;
}

.accordion-title {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.accordion-name {
  font-family: var(--font-headline);
  font-size: var(--font-size-card-title);
  color: var(--color-secondary);
}

.accordion-preview {
  font-size: var(--font-size-label);
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.accordion-chevron {
  flex-shrink: 0;
  color: var(--color-text-muted);
  transition: transform 200ms ease;
}

.accordion-header.open .accordion-chevron {
  transform: rotate(90deg);
}

.accordion-body {
  padding: 0 var(--space-4) var(--space-4);
}

/* Chips (z.B. Portionsgröße) */
.chip-group {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.chip {
  min-height: var(--touch-min);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
  background: #fff;
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: var(--font-size-body);
  cursor: pointer;
}

.chip.selected {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
  font-weight: 600;
}

/* Kreis-Bewertung (z.B. Sättigung) */
.circle-rating {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.circle {
  width: var(--touch-min);
  height: var(--touch-min);
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: #fff;
  color: var(--color-text);
  font-family: var(--font-body);
  font-weight: 600;
  font-size: var(--font-size-body);
  cursor: pointer;
}

.circle.selected {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: #fff;
}

/* Emoji-Picker (Stimmung, Schlafqualität) */
.emoji-picker {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.emoji-btn {
  min-width: var(--touch-min);
  min-height: var(--touch-min);
  border-radius: var(--space-2);
  border: 1px solid var(--color-border);
  background: #fff;
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: var(--space-1);
}

.emoji-btn.selected {
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.emoji-btn-labeled {
  flex-direction: column;
  gap: 2px;
  width: 72px;
  height: auto;
  padding: var(--space-2);
}

.emoji-btn-labeled .emoji-btn-caption {
  font-size: var(--font-size-label);
  color: var(--color-text-muted);
}

.emoji-btn-labeled.selected .emoji-btn-caption {
  color: #fff;
}
```

- [ ] **Step 5: Manually verify in the browser**

Run `npx serve . -l 3000`, open a profile's daily log. Expected: all 5 meal cards appear collapsed, each showing an emoji, name, and "Noch nichts eingetragen". Tap "Frühstück": it expands, all other cards stay collapsed. Fill in time and "Was gegessen", pick "Mittel" portion, tap circle "4" for Sättigung, tap an emoji for "Gefühl vorher" and one for "Gefühl nachher" — each selection highlights only that option within its own group. Tap "Mittag": "Frühstück" collapses and now shows the time and food text in its preview; "Mittag" expands empty. Reload the page: collapse state resets (expected, not persisted), but all entered values for "Frühstück" are still there when you expand it again.

- [ ] **Step 6: Commit**

```bash
git add js/views/dailyLogView.js css/styles.css
git commit -m "Mobile-UX: Mahlzeiten als Akkordeon-Karten mit Stimmungs-Tracking"
```

---

### Task M3: Wasser-Tracker mit Stepper und Fortschrittsbalken

**Files:**
- Modify: `js/views/dailyLogView.js`
- Modify: `css/styles.css`

**Interfaces:**
- Consumes: `WATER_GOAL_ML` from `js/dailyLog.js` (Task M1); `ICON_WATER` from `js/icons.js`.
- Produces: water card is a standalone `.section-card`, separate from the sleep/weight card (Task M5 splits the rest of that card further).

- [ ] **Step 1: Replace the water field markup**

In `renderDailyLogView`'s `container.innerHTML` template, replace this block:

```js
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
```

with:

```js
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
      <h3>${ICON_SLEEP} Schlaf (Stunden)</h3>
      <div class="field">
        <label for="sleep-hours">Stunden</label>
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
```

(Task M5 will further split the Schlaf/Gewicht card and replace the `#sleep-quality` number input with emoji buttons — keep that input as-is in this task so the page stays functional in between tasks.)

- [ ] **Step 2: Replace the water wiring**

Replace this line:

```js
  container.querySelector("#water-ml").addEventListener("change", (e) => { log.waterMl = e.target.value ? Number(e.target.value) : null; persist(); });
```

with:

```js
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
```

- [ ] **Step 3: Add water-tracker styles**

In `css/styles.css`, append:

```css
/* Wasser-Tracker */
.water-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.water-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.water-stepper-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: var(--color-primary);
  color: #fff;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.water-stepper-btn.minus {
  background: var(--color-surface);
  color: var(--color-primary);
  border: 1px solid var(--color-border);
}

.water-sum {
  flex: 1;
  text-align: center;
  font-family: var(--font-headline);
  font-size: var(--font-size-section-title);
  color: var(--color-secondary);
}

.water-progress {
  height: var(--space-3);
  background: var(--color-border);
  border-radius: var(--radius-pill);
  overflow: hidden;
}

.water-progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--radius-pill);
  transition: width 250ms ease;
}
```

- [ ] **Step 4: Manually verify in the browser**

Run `npx serve . -l 3000`, open a profile's daily log. Expected: a "Wasser" card with a minus button, "0 / 4000 ml", a glass-icon plus button, and an empty progress bar. Tap the plus button 3 times: sum shows "600 / 4000 ml", bar fills to 15%. Tap minus once: "400 / 4000 ml". Reload: value persisted.

- [ ] **Step 5: Commit**

```bash
git add js/views/dailyLogView.js css/styles.css
git commit -m "Mobile-UX: Wasser-Tracker mit Stepper-Buttons und Fortschrittsbalken"
```

---

### Task M4: Design-Tokens, Kartenschatten und Kente-Header-Muster

**Files:**
- Modify: `css/tokens.css`
- Modify: `css/styles.css`

**Interfaces:** none (pure visual styling, no JS/data changes).

- [ ] **Step 1: Update color and radius tokens**

In `css/tokens.css`, replace these four lines in the `:root` block:

```css
  --color-bg: #F5EEDF;
```

with:

```css
  --color-bg: #FAF6F0;
```

Replace:

```css
  --color-primary: #B3552C;
```

with:

```css
  --color-primary: #C1502E;
```

Replace:

```css
  --color-secondary: #27543F;
```

with:

```css
  --color-secondary: #2C5F4F;
```

Replace:

```css
  --radius-card: 14px;
```

with:

```css
  --radius-card: 16px;
```

Add a new token in the `/* Sonstiges */` block, after `--touch-min: 44px;`:

```css
  --shadow-card: 0 4px 14px rgba(44, 26, 12, 0.10);
```

- [ ] **Step 2: Apply the soft shadow to cards**

In `css/styles.css`, in the `.section-card` rule, add the shadow property:

```css
.section-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: var(--space-4);
  margin-bottom: var(--space-3);
}
```

- [ ] **Step 3: Add the Kente-inspired header pattern**

In `css/styles.css`, replace the `.app-header` rule:

```css
.app-header {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary) 75%, var(--color-accent) 75%, var(--color-accent) 100%);
  color: #fff;
  padding: var(--space-4) var(--space-4) var(--space-3);
  flex-shrink: 0;
}
```

with:

```css
.app-header {
  background-color: var(--color-primary);
  background-image:
    repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.07) 0px, rgba(255, 255, 255, 0.07) 4px, transparent 4px, transparent 16px),
    repeating-linear-gradient(-45deg, rgba(0, 0, 0, 0.06) 0px, rgba(0, 0, 0, 0.06) 4px, transparent 4px, transparent 16px),
    linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary) 70%, var(--color-accent) 70%, var(--color-accent) 100%);
  color: #fff;
  padding: var(--space-4) var(--space-4) var(--space-3);
  flex-shrink: 0;
}
```

- [ ] **Step 4: Manually verify in the browser**

Run `npx serve . -l 3000`. Expected: background is a warmer cream, header shows a subtle diagonal crosshatch pattern over the terracotta-to-gold gradient, cards have visibly rounded corners (16px) with a soft drop shadow, and the "Profil" nav label / section headings show the new deeper emerald secondary color.

- [ ] **Step 5: Commit**

```bash
git add css/tokens.css css/styles.css
git commit -m "Mobile-UX: Neue Farbpalette, Kartenschatten und Kente-Muster im Header"
```

---

### Task M5: Restliche Felder als kompakte Karten

**Files:**
- Modify: `js/views/dailyLogView.js`
- Modify: `css/styles.css`

**Interfaces:**
- Consumes: `SCHLAF_QUALITAET` from `js/dailyLog.js` (Task M1).
- Produces: final layout of the daily log screen — water card (M3) + sleep card + weight card + alcohol/supplements card + activity card + notes card, each `.section-card`.

- [ ] **Step 1: Replace the sleep/weight card and the alcohol/supplements card**

Replace this block (left in place by Task M3):

```js
    <div class="section-card">
      <h3>${ICON_SLEEP} Schlaf (Stunden)</h3>
      <div class="field">
        <label for="sleep-hours">Stunden</label>
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
```

with:

```js
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
        <input id="alcohol-info" type="text" value="${log.alcohol.info || ""}">
      </div>
      <div class="field">
        <label for="supplements">Supplements</label>
        <input id="supplements" type="text" value="${log.supplements || ""}">
      </div>
    </div>
```

- [ ] **Step 2: Replace the sleep-quality wiring**

Replace this line:

```js
  container.querySelector("#sleep-quality").addEventListener("change", (e) => { log.sleep.qualitaet = e.target.value ? Number(e.target.value) : null; persist(); });
```

with:

```js
  container.querySelectorAll("[data-sleep-quality-value]").forEach((btn) => {
    btn.addEventListener("click", () => {
      log.sleep.qualitaet = Number(btn.dataset.sleepQualityValue);
      container.querySelectorAll("[data-sleep-quality-value]").forEach((b) => b.classList.toggle("selected", b === btn));
      persist();
    });
  });
```

- [ ] **Step 3: Add the toggle-switch styles**

In `css/styles.css`, append:

```css
/* Toggle-Schalter (z.B. Alkohol) */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 52px;
  height: var(--touch-min);
  flex-shrink: 0;
}

.toggle-switch input {
  opacity: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  cursor: pointer;
}

.toggle-track {
  position: absolute;
  inset: 0;
  background: var(--color-border);
  border-radius: var(--radius-pill);
  pointer-events: none;
  transition: background 200ms ease;
}

.toggle-thumb {
  position: absolute;
  top: 6px;
  left: 6px;
  width: 32px;
  height: 32px;
  background: #fff;
  border-radius: 50%;
  pointer-events: none;
  transition: transform 200ms ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.toggle-switch input:checked ~ .toggle-track {
  background: var(--color-primary);
}

.toggle-switch input:checked ~ .toggle-thumb {
  transform: translateX(20px);
}
```

- [ ] **Step 4: Manually verify in the browser**

Run `npx serve . -l 3000`, open a profile's daily log, scroll past the meal accordions and water card. Expected: a "Schlaf" card with an hours input and 3 labeled emoji buttons (😫 Schlecht, 😐 Okay, 😴 Gut) where tapping one highlights only that one; a separate "Gewicht" card; an "Alkohol & Supplements" card where "Alkohol getrunken" is now a sliding toggle switch instead of a checkbox, at least 44px tall. Toggle it on: the switch slides and turns terracotta. Reload: all values persisted, including the selected sleep-quality emoji and the toggle state.

- [ ] **Step 5: Commit**

```bash
git add js/views/dailyLogView.js css/styles.css
git commit -m "Mobile-UX: Schlaf-, Gewicht- und Alkohol-Karten kompakter und touch-freundlicher"
```

---
