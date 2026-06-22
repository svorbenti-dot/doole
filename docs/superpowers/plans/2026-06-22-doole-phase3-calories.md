# Doole Phase 3 — Kalorien-System & Supplements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Profile um Körperdaten erweitern, daraus automatisch ein Kalorienziel (Mifflin-St-Jeor) berechnen, dieses Ziel in Tagesansicht und Übersicht sichtbar machen, und Supplements von Freitext zu mehreren Einträgen mit Gefühls-Tracking umbauen.

**Architecture:** Reines Berechnungsmodul `js/calorieCalc.js` (keine UI, kein DB-Zugriff), erweiterte Domain-Module `js/profiles.js`/`js/dailyLog.js`/`js/stats.js`, UI-Erweiterungen in den bestehenden View-Dateien nach etabliertem Pattern (Chip-Buttons, Emoji-Picker, Listen mit "+ Hinzufügen"). Auto-Save bei jeder Feldänderung, kein Speichern-Button — wie der Rest der App.

**Tech Stack:** Vanilla ES-Module, kein Build-Tool, IndexedDB (`js/db.js`), kein Test-Framework (Verifikation über `node --check` + manuelles Durchrechnen von Beispieldaten + Live-Browser-Test wo möglich).

## Global Constraints

- Design-Tokens unverändert: Creme `#FAF6F0`, Terrakotta `#C1502E`, Gold `#D9A441`, Smaragd-Varianten `#27543F`/`#2C5F4F`.
- Mobile-first, Touch-Ziele min. 44px (`var(--touch-min)`), Schrift min. 16px.
- Keine Texteingaben für Bewertungen — Emoji-Buttons mit Text-Label (`emoji-btn`/`emoji-picker`-Pattern), nicht Emoji ohne Label.
- Auto-Save bei jeder Feldänderung, kein expliziter Speichern-Button.
- Alle neuen Körperdaten-Felder sind optional. Fehlt eines, bleiben `bmr`/`tdee`/`calorieGoal` `null`, abhängige UI blendet sich ohne Fehler aus.
- Deutsche Beschriftung durchgehend.
- IndexedDB ist schemaless — kein `db.js`-Migrationsschritt nötig, Migration alter Felder passiert beim Lesen in den Domain-Modulen.
- Windows/PowerShell 5.1 für alle Shell-Befehle: kein `&&`, einzelne Befehle oder `;` verwenden.

---

### Task 1: `js/calorieCalc.js` — Mifflin-St-Jeor-Berechnung

**Files:**
- Create: `js/calorieCalc.js`

**Interfaces:**
- Produces: `GENDER_OPTIONS` (Array `{value, label}`), `ACTIVITY_LEVELS` (Array `{value, label, factor}`), `calculateCalorieTargets({weightKg, heightCm, age, gender, activityLevel})` → `{bmr, tdee, calorieGoal}` (alle integer, gerundet) oder `null`, wenn eines der fünf Felder `null`/`undefined`/leer ist.

- [ ] **Step 1: Datei erstellen**

```js
// Reine Berechnungslogik für Kalorienziele nach Mifflin-St-Jeor. Keine UI, kein DB-Zugriff.

export const GENDER_OPTIONS = [
  { value: "mann", label: "Mann" },
  { value: "frau", label: "Frau" },
];

export const ACTIVITY_LEVELS = [
  { value: "sitzend", label: "Sitzend", factor: 1.2 },
  { value: "leicht_aktiv", label: "Leicht aktiv", factor: 1.375 },
  { value: "aktiv", label: "Aktiv", factor: 1.55 },
  { value: "sehr_aktiv", label: "Sehr aktiv", factor: 1.725 },
];

export function calculateCalorieTargets({ weightKg, heightCm, age, gender, activityLevel }) {
  if (weightKg == null || heightCm == null || age == null || gender == null || activityLevel == null) {
    return null;
  }

  const activity = ACTIVITY_LEVELS.find((opt) => opt.value === activityLevel);
  if (!activity) return null;

  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr = gender === "mann" ? base + 5 : base - 161;
  const tdee = bmr * activity.factor;
  const calorieGoal = tdee - 500;

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calorieGoal: Math.round(calorieGoal),
  };
}
```

- [ ] **Step 2: Syntax-Check**

Run: `node --check js/calorieCalc.js`
Expected: kein Output (Exit-Code 0).

- [ ] **Step 3: Logik per Hand durchrechnen (kein Test-Framework im Projekt vorhanden)**

Beispiel 1 — Mann, 30 Jahre, 180cm, 80kg, aktiv:
`calculateCalorieTargets({ weightKg: 80, heightCm: 180, age: 30, gender: "mann", activityLevel: "aktiv" })`
- `base = 10×80 + 6.25×180 − 5×30 = 800 + 1125 − 150 = 1775`
- `bmr = 1775 + 5 = 1780`
- `tdee = 1780 × 1.55 = 2759`
- `calorieGoal = 2759 − 500 = 2259`
- Erwartet: `{ bmr: 1780, tdee: 2759, calorieGoal: 2259 }` ✓

Beispiel 2 — Frau, 25 Jahre, 165cm, 60kg, sitzend:
`calculateCalorieTargets({ weightKg: 60, heightCm: 165, age: 25, gender: "frau", activityLevel: "sitzend" })`
- `base = 10×60 + 6.25×165 − 5×25 = 600 + 1031.25 − 125 = 1506.25`
- `bmr = 1506.25 − 161 = 1345.25` → gerundet `1345`
- `tdee = 1345.25 × 1.2 = 1614.3` → gerundet `1614`
- `calorieGoal = 1614.3 − 500 = 1114.3` → gerundet `1114`
- Erwartet: `{ bmr: 1345, tdee: 1614, calorieGoal: 1114 }` ✓ (Rundung erfolgt jeweils einzeln auf das Endergebnis, nicht kumulativ — `tdee`/`calorieGoal` werden aus den ungerundeten Zwischenwerten berechnet.)

Beispiel 3 — fehlendes Feld:
`calculateCalorieTargets({ weightKg: 80, heightCm: 180, age: 30, gender: "mann", activityLevel: null })` → `null` ✓

Hinweis im Report: Live-Browser-Verifikation ist auf Task 5/6 verschoben (sobald die UI das Modul aufruft).

- [ ] **Step 4: Commit**

```bash
git add js/calorieCalc.js
git commit -m "feat: Mifflin-St-Jeor Kalorienberechnung als reines Modul"
```

---

### Task 2: `js/profiles.js` — Körperdaten-Felder + `updateProfile()`

**Files:**
- Modify: `js/profiles.js`

**Interfaces:**
- Consumes: `calculateCalorieTargets` aus `js/calorieCalc.js` (Task 1) — `{bmr, tdee, calorieGoal} | null`.
- Produces: `createProfile({name, color, icon, age, heightCm, weightKg, gender, activityLevel})` (alle Körperdaten-Parameter optional, Default `null`) — speichert zusätzlich berechnete `bmr`/`tdee`/`calorieGoal`. Neue Funktion `updateProfile(profile)` — nimmt ein vollständiges Profil-Objekt (mit `id`), persistiert via `putItem`.

- [ ] **Step 1: Datei ersetzen**

Aktueller Inhalt (komplette Datei):

```js
// Fachlogik für Familienprofile. Kennt nur Daten, keine UI.
import { putItem, getAllItems, deleteItem } from "./db.js";
import { showToast } from "./toast.js";

export async function createProfile({ name, color, icon }) {
  try {
    return await putItem("profiles", { name, color, icon, createdAt: Date.now() });
  } catch (err) {
    showToast("Profil konnte nicht angelegt werden.", "error");
    throw err;
  }
}

export async function getAllProfiles() {
  try {
    return await getAllItems("profiles");
  } catch (err) {
    showToast("Profile konnten nicht geladen werden.", "error");
    return [];
  }
}

export async function deleteProfile(id) {
  try {
    await deleteItem("profiles", id);
  } catch (err) {
    showToast("Profil konnte nicht gelöscht werden.", "error");
    throw err;
  }
}
```

Ersetzen durch:

```js
// Fachlogik für Familienprofile. Kennt nur Daten, keine UI.
import { putItem, getAllItems, deleteItem } from "./db.js";
import { showToast } from "./toast.js";
import { calculateCalorieTargets } from "./calorieCalc.js";

export async function createProfile({
  name, color, icon,
  age = null, heightCm = null, weightKg = null, gender = null, activityLevel = null,
}) {
  try {
    const targets = calculateCalorieTargets({ weightKg, heightCm, age, gender, activityLevel });
    return await putItem("profiles", {
      name, color, icon, createdAt: Date.now(),
      age, heightCm, weightKg, gender, activityLevel,
      bmr: targets ? targets.bmr : null,
      tdee: targets ? targets.tdee : null,
      calorieGoal: targets ? targets.calorieGoal : null,
    });
  } catch (err) {
    showToast("Profil konnte nicht angelegt werden.", "error");
    throw err;
  }
}

export async function updateProfile(profile) {
  try {
    return await putItem("profiles", profile);
  } catch (err) {
    showToast("Profil konnte nicht gespeichert werden.", "error");
    throw err;
  }
}

export async function getAllProfiles() {
  try {
    return await getAllItems("profiles");
  } catch (err) {
    showToast("Profile konnten nicht geladen werden.", "error");
    return [];
  }
}

export async function deleteProfile(id) {
  try {
    await deleteItem("profiles", id);
  } catch (err) {
    showToast("Profil konnte nicht gelöscht werden.", "error");
    throw err;
  }
}
```

- [ ] **Step 2: Syntax-Check**

Run: `node --check js/profiles.js`
Expected: kein Output (Exit-Code 0).

- [ ] **Step 3: Logik durchrechnen**

`createProfile({ name: "Anna", color: "#C1502E", icon: "A" })` → `targets` ist `null` (alle Körperdaten-Felder `null`) → gespeichertes Objekt hat `age: null, ..., bmr: null, tdee: null, calorieGoal: null`. Kein Fehler, `putItem` bekommt ein valides Objekt.

`createProfile({ name: "Ben", color: "#D9A441", icon: "B", age: 30, heightCm: 180, weightKg: 80, gender: "mann", activityLevel: "aktiv" })` → `targets = { bmr: 1780, tdee: 2759, calorieGoal: 2259 }` (siehe Task 1, Beispiel 1) → gespeichertes Objekt hat diese drei Werte gesetzt.

Hinweis im Report: Live-Browser-Verifikation folgt in Task 4 (Profil-Erstellungsformular ruft `createProfile` mit echten Formulardaten auf).

- [ ] **Step 4: Commit**

```bash
git add js/profiles.js
git commit -m "feat: Profil um Koerperdaten und berechnetes Kalorienziel erweitern"
```

---

### Task 3: `js/dailyLog.js` — Supplements-Migration, `SUPPLEMENT_GEFUEHL`, `getLatestWeightEntry`

**Files:**
- Modify: `js/dailyLog.js`

**Interfaces:**
- Consumes: `getAllItems` aus `js/db.js` (bereits vorhanden, neu importiert).
- Produces: `SUPPLEMENT_GEFUEHL` (Array `{value, emoji, label}`), `getLatestWeightEntry(profileId)` → `{date, weightKg}` (jüngster Tag mit `weightKg != null`) oder `null`. `createEmptyDailyLog()` liefert `supplements: []` statt `""`. `getDailyLog()` migriert alte String-Supplements beim Laden automatisch zu Array-Form.

- [ ] **Step 1: Import-Zeile erweitern**

Aktuell (`js/dailyLog.js:2`):
```js
import { getItem, putItem } from "./db.js";
```

Ersetzen durch:
```js
import { getItem, putItem, getAllItems } from "./db.js";
```

- [ ] **Step 2: `supplements`-Default in `createEmptyDailyLog` ändern**

Aktuell (`js/dailyLog.js:26`):
```js
    supplements: "",
```

Ersetzen durch:
```js
    supplements: [],
```

- [ ] **Step 3: Migration in `getDailyLog` einbauen**

Aktuell:
```js
export async function getDailyLog(profileId, dateISO) {
  try {
    const existing = await getItem("dailyLogs", `${profileId}_${dateISO}`);
    return existing || createEmptyDailyLog(profileId, dateISO);
  } catch (err) {
    showToast("Tagesprotokoll konnte nicht geladen werden.", "error");
    return createEmptyDailyLog(profileId, dateISO);
  }
}
```

Ersetzen durch:
```js
function migrateSupplements(log) {
  if (typeof log.supplements === "string") {
    log.supplements = log.supplements.trim()
      ? [{ name: log.supplements, feeling: null }]
      : [];
  }
  return log;
}

export async function getDailyLog(profileId, dateISO) {
  try {
    const existing = await getItem("dailyLogs", `${profileId}_${dateISO}`);
    return existing ? migrateSupplements(existing) : createEmptyDailyLog(profileId, dateISO);
  } catch (err) {
    showToast("Tagesprotokoll konnte nicht geladen werden.", "error");
    return createEmptyDailyLog(profileId, dateISO);
  }
}
```

- [ ] **Step 4: `SUPPLEMENT_GEFUEHL`-Konstante und `getLatestWeightEntry` anfügen**

Am Ende der Datei (nach `AKTIVITAET_ZUSTAND`) anfügen:

```js

export const SUPPLEMENT_GEFUEHL = [
  { value: "neutral", emoji: "😐", label: "Neutral" },
  { value: "besser", emoji: "🙂", label: "Besser" },
  { value: "viel_besser", emoji: "💪", label: "Viel besser" },
  { value: "muede", emoji: "😴", label: "Müde" },
  { value: "schlecht", emoji: "🤢", label: "Schlecht" },
];

export async function getLatestWeightEntry(profileId) {
  const allLogs = await getAllItems("dailyLogs");
  const withWeight = allLogs
    .filter((log) => log.profileId === profileId && log.weightKg != null)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  return withWeight.length ? { date: withWeight[0].date, weightKg: withWeight[0].weightKg } : null;
}
```

- [ ] **Step 5: Syntax-Check**

Run: `node --check js/dailyLog.js`
Expected: kein Output (Exit-Code 0).

- [ ] **Step 6: Migration durchrechnen**

`migrateSupplements({ supplements: "Vitamin D" })` → `{ supplements: [{ name: "Vitamin D", feeling: null }] }` ✓
`migrateSupplements({ supplements: "" })` → `{ supplements: [] }` ✓
`migrateSupplements({ supplements: [{ name: "Magnesium", feeling: "besser" }] })` → unverändert (kein String) ✓

`getLatestWeightEntry`: bei Logs `[{date:"2026-06-10", weightKg:80, profileId:1}, {date:"2026-06-15", weightKg:79, profileId:1}, {date:"2026-06-12", weightKg:1, profileId:2}]` und `profileId=1` → sortiert absteigend nach Datum → `[2026-06-15, 2026-06-10]` → Rückgabe `{date:"2026-06-15", weightKg:79}` ✓. Bei `profileId=3` (kein Log) → `null` ✓.

Hinweis im Report: Live-Browser-Verifikation folgt in Task 5 (Recalc-Button) und Task 7 (Supplements-UI).

- [ ] **Step 7: Commit**

```bash
git add js/dailyLog.js
git commit -m "feat: Supplements-Migration zu Array, SUPPLEMENT_GEFUEHL, getLatestWeightEntry"
```

---

### Task 4: `js/views/profileSelect.js` — Profil-Erstellung um Körperdaten erweitern

**Files:**
- Modify: `js/views/profileSelect.js`

**Interfaces:**
- Consumes: `GENDER_OPTIONS`, `ACTIVITY_LEVELS` aus `js/calorieCalc.js` (Task 1); `createProfile` aus `js/profiles.js` (Task 2, jetzt mit Körperdaten-Parametern).
- Produces: keine neuen Exporte — UI-only Erweiterung.

- [ ] **Step 1: Import-Zeile erweitern**

Aktuell (`js/views/profileSelect.js:2`):
```js
import { getAllProfiles, createProfile } from "../profiles.js";
```

Ersetzen durch:
```js
import { getAllProfiles, createProfile } from "../profiles.js";
import { GENDER_OPTIONS, ACTIVITY_LEVELS } from "../calorieCalc.js";
```

- [ ] **Step 2: Formular um Körperdaten-Felder erweitern**

Aktuell:
```js
        <div class="field">
          <label>Farbe</label>
          <div id="color-picker" style="display:flex;gap:var(--space-2);"></div>
        </div>
        <button type="submit" class="btn btn-primary">${ICON_PLUS} Profil anlegen</button>
      </form>
```

Ersetzen durch:
```js
        <div class="field">
          <label>Farbe</label>
          <div id="color-picker" style="display:flex;gap:var(--space-2);"></div>
        </div>
        <div class="field">
          <label for="new-profile-age">Alter (Jahre)</label>
          <input id="new-profile-age" type="number" min="0" max="120">
        </div>
        <div class="field">
          <label for="new-profile-height">Größe (cm)</label>
          <input id="new-profile-height" type="number" min="0" max="250">
        </div>
        <div class="field">
          <label for="new-profile-weight">Gewicht (kg)</label>
          <input id="new-profile-weight" type="number" min="0" max="300" step="0.1">
        </div>
        <div class="field">
          <label>Geschlecht</label>
          <div class="chip-group" id="new-profile-gender">${GENDER_OPTIONS.map((opt) => `<button type="button" class="chip" data-chip-value="${opt.value}">${opt.label}</button>`).join("")}</div>
        </div>
        <div class="field">
          <label>Aktivitätslevel</label>
          <div class="chip-group" id="new-profile-activity">${ACTIVITY_LEVELS.map((opt) => `<button type="button" class="chip" data-chip-value="${opt.value}">${opt.label}</button>`).join("")}</div>
        </div>
        <button type="submit" class="btn btn-primary">${ICON_PLUS} Profil anlegen</button>
      </form>
```

- [ ] **Step 3: Chip-Auswahl-State und Klick-Handler verdrahten**

Aktuell (nach dem Farb-Picker-Block, vor dem Submit-Handler):
```js
  const colorPicker = container.querySelector("#color-picker");
  let selectedColor = AVAILABLE_COLORS[0];
  AVAILABLE_COLORS.forEach((color, index) => {
    const swatch = document.createElement("button");
    swatch.type = "button";
    swatch.style.width = "var(--touch-min)";
    swatch.style.height = "var(--touch-min)";
    swatch.style.borderRadius = "50%";
    swatch.style.background = color;
    swatch.style.border = index === 0 ? "3px solid var(--color-text)" : "3px solid transparent";
    swatch.addEventListener("click", () => {
      selectedColor = color;
      [...colorPicker.children].forEach((c) => (c.style.border = "3px solid transparent"));
      swatch.style.border = "3px solid var(--color-text)";
    });
    colorPicker.appendChild(swatch);
  });

  container.querySelector("#new-profile-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = container.querySelector("#new-profile-name").value.trim();
    if (!name) return;
    const icon = name.charAt(0).toUpperCase();
    const created = await createProfile({ name, color: selectedColor, icon });
    onProfileSelected(created);
  });
```

Ersetzen durch:
```js
  const colorPicker = container.querySelector("#color-picker");
  let selectedColor = AVAILABLE_COLORS[0];
  AVAILABLE_COLORS.forEach((color, index) => {
    const swatch = document.createElement("button");
    swatch.type = "button";
    swatch.style.width = "var(--touch-min)";
    swatch.style.height = "var(--touch-min)";
    swatch.style.borderRadius = "50%";
    swatch.style.background = color;
    swatch.style.border = index === 0 ? "3px solid var(--color-text)" : "3px solid transparent";
    swatch.addEventListener("click", () => {
      selectedColor = color;
      [...colorPicker.children].forEach((c) => (c.style.border = "3px solid transparent"));
      swatch.style.border = "3px solid var(--color-text)";
    });
    colorPicker.appendChild(swatch);
  });

  let selectedGender = null;
  container.querySelector("#new-profile-gender").querySelectorAll("[data-chip-value]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedGender = btn.dataset.chipValue;
      container.querySelector("#new-profile-gender").querySelectorAll("[data-chip-value]").forEach((b) => b.classList.toggle("selected", b === btn));
    });
  });

  let selectedActivityLevel = null;
  container.querySelector("#new-profile-activity").querySelectorAll("[data-chip-value]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedActivityLevel = btn.dataset.chipValue;
      container.querySelector("#new-profile-activity").querySelectorAll("[data-chip-value]").forEach((b) => b.classList.toggle("selected", b === btn));
    });
  });

  container.querySelector("#new-profile-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = container.querySelector("#new-profile-name").value.trim();
    if (!name) return;
    const icon = name.charAt(0).toUpperCase();
    const ageValue = container.querySelector("#new-profile-age").value;
    const heightValue = container.querySelector("#new-profile-height").value;
    const weightValue = container.querySelector("#new-profile-weight").value;
    const created = await createProfile({
      name, color: selectedColor, icon,
      age: ageValue ? Number(ageValue) : null,
      heightCm: heightValue ? Number(heightValue) : null,
      weightKg: weightValue ? Number(weightValue) : null,
      gender: selectedGender,
      activityLevel: selectedActivityLevel,
    });
    onProfileSelected(created);
  });
```

- [ ] **Step 4: Syntax-Check**

Run: `node --check js/views/profileSelect.js`
Expected: kein Output (Exit-Code 0).

- [ ] **Step 5: Browser-Test**

Server starten (`node serve.js`), `http://localhost:8080` öffnen, neues Profil mit allen 5 Körperdaten-Feldern anlegen (z.B. Alter 30, Größe 180, Gewicht 80, Geschlecht Mann, Aktivität Aktiv) → Profil wird angelegt, kein Fehler in der Konsole. Anschließend ein zweites Profil ohne Körperdaten anlegen → ebenfalls erfolgreich.

Falls kein Live-Browser-Test möglich ist: Hinweis im Report, dass die Verifikation auf den nächsten Schritt mit Browser-Zugriff verschoben wird; stattdessen den Submit-Handler-Code gegen `calculateCalorieTargets` aus Task 1 durchrechnen — mit den Beispielwerten aus Step 5 entsteht ein `createProfile`-Aufruf identisch zu Task 2 Step 3 Beispiel 2.

- [ ] **Step 6: Commit**

```bash
git add js/views/profileSelect.js
git commit -m "feat: Profil-Erstellung um Koerperdaten-Felder erweitern"
```

---

### Task 5: `js/views/settingsView.js` — Körperdaten-Karte + "Kalorien neu berechnen"

**Files:**
- Modify: `js/views/settingsView.js`

**Interfaces:**
- Consumes: `updateProfile` aus `js/profiles.js` (Task 2); `calculateCalorieTargets`, `GENDER_OPTIONS`, `ACTIVITY_LEVELS` aus `js/calorieCalc.js` (Task 1); `getLatestWeightEntry` aus `js/dailyLog.js` (Task 3); `showToast` aus `js/toast.js`.
- Produces: keine neuen Exporte.

- [ ] **Step 1: Imports erweitern**

Aktuell (`js/views/settingsView.js:1-4`):
```js
// Bildschirm: Einstellungen - Profil wechseln/löschen, Backup (Task 10 ergänzt Export/Import hier).
import { getAllProfiles, deleteProfile } from "../profiles.js";
import { ICON_TRASH } from "../icons.js";
import { exportAllData, importAllData } from "../backup.js";
```

Ersetzen durch:
```js
// Bildschirm: Einstellungen - Profil wechseln/löschen, Backup, Koerperdaten & Kalorienziel.
import { getAllProfiles, deleteProfile, updateProfile } from "../profiles.js";
import { ICON_TRASH } from "../icons.js";
import { exportAllData, importAllData } from "../backup.js";
import { calculateCalorieTargets, GENDER_OPTIONS, ACTIVITY_LEVELS } from "../calorieCalc.js";
import { getLatestWeightEntry } from "../dailyLog.js";
import { showToast } from "../toast.js";
```

- [ ] **Step 2: Körperdaten-Karte ins Template einfügen**

Aktuell:
```js
  container.innerHTML = `
    <h2 style="font-size:var(--font-size-section-title);color:var(--color-secondary);margin-bottom:var(--space-4);">Einstellungen</h2>
    <div class="section-card">
      <h3>Profile</h3>
      <div id="settings-profile-list" style="display:flex;flex-direction:column;gap:var(--space-2);"></div>
    </div>
    <div class="section-card">
      <h3>Daten-Backup</h3>
```

Ersetzen durch:
```js
  container.innerHTML = `
    <h2 style="font-size:var(--font-size-section-title);color:var(--color-secondary);margin-bottom:var(--space-4);">Einstellungen</h2>
    <div class="section-card">
      <h3>Profile</h3>
      <div id="settings-profile-list" style="display:flex;flex-direction:column;gap:var(--space-2);"></div>
    </div>
    <div class="section-card">
      <h3>Körperdaten &amp; Kalorienziel</h3>
      <div class="field">
        <label for="body-age">Alter (Jahre)</label>
        <input id="body-age" type="number" min="0" max="120" value="${currentProfile.age ?? ""}">
      </div>
      <div class="field">
        <label for="body-height">Größe (cm)</label>
        <input id="body-height" type="number" min="0" max="250" value="${currentProfile.heightCm ?? ""}">
      </div>
      <div class="field">
        <label for="body-weight">Gewicht (kg)</label>
        <input id="body-weight" type="number" min="0" max="300" step="0.1" value="${currentProfile.weightKg ?? ""}">
      </div>
      <div class="field">
        <label>Geschlecht</label>
        <div class="chip-group" id="body-gender">${GENDER_OPTIONS.map((opt) => `<button type="button" class="chip ${currentProfile.gender === opt.value ? "selected" : ""}" data-chip-value="${opt.value}">${opt.label}</button>`).join("")}</div>
      </div>
      <div class="field">
        <label>Aktivitätslevel</label>
        <div class="chip-group" id="body-activity">${ACTIVITY_LEVELS.map((opt) => `<button type="button" class="chip ${currentProfile.activityLevel === opt.value ? "selected" : ""}" data-chip-value="${opt.value}">${opt.label}</button>`).join("")}</div>
      </div>
      <p id="calorie-targets-display" style="color:var(--color-text-muted);font-size:var(--font-size-label);">${calorieTargetsText(currentProfile)}</p>
      <button type="button" id="recalc-btn" class="btn btn-secondary">Kalorien neu berechnen</button>
    </div>
    <div class="section-card">
      <h3>Daten-Backup</h3>
```

- [ ] **Step 3: Helper-Funktion `calorieTargetsText` ergänzen**

Vor `export async function renderSettingsView(...)` einfügen:
```js
function calorieTargetsText(profile) {
  if (profile.calorieGoal == null) return "Trage Alter, Größe, Gewicht, Geschlecht und Aktivitätslevel ein, um ein Kalorienziel zu berechnen.";
  return `Grundumsatz: ${profile.bmr} kcal · Gesamtverbrauch: ${profile.tdee} kcal · Tagesziel: ${profile.calorieGoal} kcal`;
}
```

- [ ] **Step 4: Auto-Save + Recalc-Button verdrahten**

Aktuell (Ende der Funktion, nach dem Import-Listener):
```js
  container.querySelector("#import-file").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const confirmed = confirm("Import überschreibt vorhandene Profile/Protokolle mit denselben IDs. Fortfahren?");
    if (!confirmed) {
      event.target.value = "";
      return;
    }
    const text = await file.text();
    await importAllData(text);
    renderSettingsView(container, currentProfile, callbacks);
  });
}
```

Ersetzen durch:
```js
  container.querySelector("#import-file").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const confirmed = confirm("Import überschreibt vorhandene Profile/Protokolle mit denselben IDs. Fortfahren?");
    if (!confirmed) {
      event.target.value = "";
      return;
    }
    const text = await file.text();
    await importAllData(text);
    renderSettingsView(container, currentProfile, callbacks);
  });

  async function recalculateAndSave() {
    const targets = calculateCalorieTargets({
      weightKg: currentProfile.weightKg,
      heightCm: currentProfile.heightCm,
      age: currentProfile.age,
      gender: currentProfile.gender,
      activityLevel: currentProfile.activityLevel,
    });
    currentProfile.bmr = targets ? targets.bmr : null;
    currentProfile.tdee = targets ? targets.tdee : null;
    currentProfile.calorieGoal = targets ? targets.calorieGoal : null;
    await updateProfile(currentProfile);
    container.querySelector("#calorie-targets-display").textContent = calorieTargetsText(currentProfile);
    if (callbacks.onActiveProfileChanged) callbacks.onActiveProfileChanged(currentProfile);
  }

  container.querySelector("#body-age").addEventListener("change", (e) => {
    currentProfile.age = e.target.value ? Number(e.target.value) : null;
    recalculateAndSave();
  });
  container.querySelector("#body-height").addEventListener("change", (e) => {
    currentProfile.heightCm = e.target.value ? Number(e.target.value) : null;
    recalculateAndSave();
  });
  container.querySelector("#body-weight").addEventListener("change", (e) => {
    currentProfile.weightKg = e.target.value ? Number(e.target.value) : null;
    recalculateAndSave();
  });
  container.querySelector("#body-gender").querySelectorAll("[data-chip-value]").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentProfile.gender = btn.dataset.chipValue;
      container.querySelector("#body-gender").querySelectorAll("[data-chip-value]").forEach((b) => b.classList.toggle("selected", b === btn));
      recalculateAndSave();
    });
  });
  container.querySelector("#body-activity").querySelectorAll("[data-chip-value]").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentProfile.activityLevel = btn.dataset.chipValue;
      container.querySelector("#body-activity").querySelectorAll("[data-chip-value]").forEach((b) => b.classList.toggle("selected", b === btn));
      recalculateAndSave();
    });
  });

  container.querySelector("#recalc-btn").addEventListener("click", async () => {
    const latest = await getLatestWeightEntry(currentProfile.id);
    if (!latest) {
      showToast("Kein Gewichts-Eintrag im Tagesprotokoll gefunden.", "error");
      return;
    }
    if (currentProfile.age == null || currentProfile.heightCm == null || currentProfile.gender == null || currentProfile.activityLevel == null) {
      showToast("Bitte zuerst Alter, Größe, Geschlecht und Aktivitätslevel angeben.", "error");
      return;
    }
    currentProfile.weightKg = latest.weightKg;
    container.querySelector("#body-weight").value = latest.weightKg;
    await recalculateAndSave();
    showToast("Kalorien neu berechnet ✓");
  });
}
```

Hinweis: `recalculateAndSave` setzt voraus, dass `currentProfile` dasselbe Objekt ist, das auch in `app.js` als aktives Profil gehalten wird, bzw. dass `callbacks.onActiveProfileChanged` (bereits bestehender Callback aus Phase 1, siehe Profil-Löschen-Handler in dieser Datei) den App-State aktualisiert, damit andere Views (Tagesansicht, Übersicht) das neue `calorieGoal` sehen.

- [ ] **Step 5: Syntax-Check**

Run: `node --check js/views/settingsView.js`
Expected: kein Output (Exit-Code 0).

- [ ] **Step 6: Browser-Test**

Server starten, Einstellungen öffnen, Körperdaten eintragen → Anzeige "Grundumsatz: ... · Gesamtverbrauch: ... · Tagesziel: ..." erscheint nach jeder Änderung automatisch (kein Speichern-Button nötig), Toast "Gespeichert" erscheint NICHT nötig hier (nur Profil-Updates, kein `saveDailyLog`) — stattdessen sollte die Anzeige sich live aktualisieren. "Kalorien neu berechnen" klicken: ohne vorhandenen Gewichts-Log → Fehler-Toast; mit Log-Eintrag aber fehlenden Profilfeldern → anderer Fehler-Toast; mit allem vorhanden → Erfolg-Toast und aktualisiertes Gewicht/Ziel.

Falls kein Live-Browser-Test möglich ist: Hinweis im Report; stattdessen den `recalculateAndSave`-Codepfad mit den Beispieldaten aus Task 1/Task 3 durchrechnen: `currentProfile = {id:1, age:30, heightCm:180, weightKg:75, gender:"mann", activityLevel:"aktiv"}`, `getLatestWeightEntry` liefert `{date:"2026-06-20", weightKg:79}` → nach Klick: `currentProfile.weightKg = 79` → `calculateCalorieTargets({weightKg:79, heightCm:180, age:30, gender:"mann", activityLevel:"aktiv"})` → `base = 790+1125-150=1765`, `bmr=1770`, `tdee=1770×1.55=2743.5→2744` (Rundung nur am Ende), `calorieGoal=2243.5→2244` (aus unrundedem `2743.5−500=2243.5`) — Ergebnis ungleich Null, Anzeige aktualisiert sich korrekt.

- [ ] **Step 7: Commit**

```bash
git add js/views/settingsView.js
git commit -m "feat: Koerperdaten-Karte mit Auto-Save und Kalorien-neu-berechnen-Button"
```

---

### Task 6: `js/views/dailyLogView.js` — Feature 3: Tages-Kalorienkarte erweitern

**Files:**
- Modify: `js/views/dailyLogView.js`
- Modify: `css/styles.css`

**Interfaces:**
- Consumes: `profile.calorieGoal` (aus Task 2/5, kann `null` sein).
- Produces: `kcalTotalHtml(log, profile)` (Signatur erweitert um `profile`-Parameter).

- [ ] **Step 1: `kcalTotalHtml` erweitern**

Aktuell (`js/views/dailyLogView.js:117-120`):
```js
function kcalTotalHtml(log) {
  const total = Object.values(log.meals).reduce((sum, meal) => sum + (meal.kalorien || 0), 0);
  return `<h3>Kalorien heute</h3><p class="kcal-total-value">${total} kcal</p>`;
}
```

Ersetzen durch:
```js
function kcalTotalHtml(log, profile) {
  const total = Object.values(log.meals).reduce((sum, meal) => sum + (meal.kalorien || 0), 0);
  const goal = profile.calorieGoal;

  if (goal == null) {
    return `<h3>Kalorien heute</h3><p class="kcal-total-value">${total} kcal</p>`;
  }

  const diff = goal - total;
  let statusEmoji;
  let statusText;
  if (diff > 0) {
    statusEmoji = "😊";
    statusText = `Defizit ${diff} kcal`;
  } else if (diff === 0) {
    statusEmoji = "😐";
    statusText = "Ziel erreicht";
  } else {
    statusEmoji = "😟";
    statusText = `${-diff} kcal über Ziel`;
  }
  const progressPct = goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : 0;

  return `
    <h3>Kalorien heute</h3>
    <p class="kcal-total-value">Gegessen ${total} / Ziel ${goal} kcal</p>
    <div class="water-progress"><div class="water-progress-fill" style="width:${progressPct}%"></div></div>
    <p class="kcal-status">${statusEmoji} ${statusText}</p>
  `;
}
```

- [ ] **Step 2: Call-Sites anpassen**

Aktuell (`js/views/dailyLogView.js:154`):
```js
    <div class="section-card" id="kcal-total-card">${kcalTotalHtml(log)}</div>
```

Ersetzen durch:
```js
    <div class="section-card" id="kcal-total-card">${kcalTotalHtml(log, profile)}</div>
```

Aktuell (`js/views/dailyLogView.js:228-230`):
```js
  function updateMealKcalTotal() {
    container.querySelector("#kcal-total-card").innerHTML = kcalTotalHtml(log);
  }
```

Ersetzen durch:
```js
  function updateMealKcalTotal() {
    container.querySelector("#kcal-total-card").innerHTML = kcalTotalHtml(log, profile);
  }
```

- [ ] **Step 3: CSS-Regel für `.kcal-status` ergänzen**

Aktuell (`css/styles.css:591-597`):
```css
/* Kalorien-Tagessumme */
.kcal-total-value {
  font-family: var(--font-headline);
  font-size: var(--font-size-section-title);
  color: var(--color-secondary);
  margin: 0;
}
```

Ersetzen durch:
```css
/* Kalorien-Tagessumme */
.kcal-total-value {
  font-family: var(--font-headline);
  font-size: var(--font-size-section-title);
  color: var(--color-secondary);
  margin: 0 0 var(--space-2) 0;
}

.kcal-status {
  font-size: var(--font-size-label);
  color: var(--color-text-muted);
  margin: var(--space-2) 0 0 0;
}
```

- [ ] **Step 4: Syntax-Check**

Run: `node --check js/views/dailyLogView.js`
Expected: kein Output (Exit-Code 0).

- [ ] **Step 5: Logik durchrechnen**

`profile.calorieGoal = null` → unverändertes Verhalten (nur "Kalorien heute: X kcal"), keine Regression.

`profile.calorieGoal = 2259`, Tagessumme `total = 1859` → `diff = 400 > 0` → 😊 "Defizit 400 kcal", `progressPct = round(1859/2259×100) = 82` → Balken auf 82%.

`profile.calorieGoal = 2259`, `total = 2259` → `diff = 0` → 😐 "Ziel erreicht", `progressPct = 100`.

`profile.calorieGoal = 2259`, `total = 2500` → `diff = -241` → 😟 "241 kcal über Ziel", `progressPct = min(100, round(2500/2259×100)) = 100` (gekappt).

- [ ] **Step 6: Browser-Test**

Server starten, Tagesansicht öffnen (Profil mit gesetztem Kalorienziel), Mahlzeiten-Kalorien unter/über/exakt Ziel eintragen → Karte zeigt korrekten Text/Smiley/Balken, aktualisiert sich live ohne Neuladen. Profil ohne Kalorienziel öffnen → unverändertes altes Verhalten, kein Fehler.

Falls kein Live-Browser-Test möglich ist: Hinweis im Report; die Hand-Rechnung aus Step 5 deckt alle drei Fallunterscheidungen ab.

- [ ] **Step 7: Commit**

```bash
git add js/views/dailyLogView.js css/styles.css
git commit -m "feat: Tages-Kalorienkarte um Ziel, Defizit-Smiley und Fortschrittsbalken erweitern"
```

---

### Task 7: `js/views/dailyLogView.js` — Feature 6: Supplements-Liste umbauen

**Files:**
- Modify: `js/views/dailyLogView.js`

**Interfaces:**
- Consumes: `SUPPLEMENT_GEFUEHL` aus `js/dailyLog.js` (Task 3); `log.supplements` ist jetzt ein Array (durch Migration in Task 3 garantiert, auch für Altdaten).
- Produces: keine neuen Exporte.

- [ ] **Step 1: Import erweitern**

Aktuell (`js/views/dailyLogView.js:2-5`):
```js
import {
  getDailyLog, saveDailyLog, MEAL_SLOT_LABELS, MEAL_SLOT_EMOJIS,
  PORTION_OPTIONS, GEFUEHL_VORHER, GEFUEHL_NACHHER, SCHLAF_QUALITAET, WATER_GOAL_ML, AKTIVITAET_ZUSTAND,
} from "../dailyLog.js";
```

Ersetzen durch:
```js
import {
  getDailyLog, saveDailyLog, MEAL_SLOT_LABELS, MEAL_SLOT_EMOJIS,
  PORTION_OPTIONS, GEFUEHL_VORHER, GEFUEHL_NACHHER, SCHLAF_QUALITAET, WATER_GOAL_ML, AKTIVITAET_ZUSTAND,
  SUPPLEMENT_GEFUEHL,
} from "../dailyLog.js";
```

- [ ] **Step 2: `supplementRowHtml`-Helper ergänzen**

Nach `activityRowHtml` (vor `export async function renderDailyLogView`) einfügen:
```js
function supplementRowHtml(index, supplement) {
  return `
    <div class="field" data-supplement-index="${index}">
      <div style="display:flex;gap:var(--space-2);align-items:flex-end;">
        <div style="flex:1;">
          <label for="supplement-${index}-name">Welches Supplement</label>
          <input id="supplement-${index}-name" type="text" value="${escapeHtml(supplement.name || "")}">
        </div>
        <button type="button" class="btn btn-secondary" data-remove-supplement="${index}" aria-label="Supplement entfernen" style="flex:0;">${ICON_TRASH}</button>
      </div>
      <div style="margin-top:var(--space-2);">
        <label>Wie fühlst du dich damit?</label>
        <div class="emoji-picker">${emojiPickerHtml(`supplement-gefuehl-${index}`, SUPPLEMENT_GEFUEHL, supplement.feeling)}</div>
      </div>
    </div>
  `;
}
```

- [ ] **Step 3: Template-Block ersetzen**

Aktuell (`js/views/dailyLogView.js:203-206`):
```js
      <div class="field">
        <label for="supplements">Supplements</label>
        <input id="supplements" type="text" value="${escapeHtml(log.supplements || "")}">
      </div>
```

Ersetzen durch:
```js
      <div class="field">
        <label>Supplements</label>
        <div id="supplement-list" style="display:flex;flex-direction:column;gap:var(--space-2);margin-bottom:var(--space-2);">
          ${log.supplements.map((supplement, index) => supplementRowHtml(index, supplement)).join("")}
        </div>
        <button type="button" id="add-supplement" class="btn btn-secondary">${ICON_PLUS} Supplement hinzufügen</button>
      </div>
```

- [ ] **Step 4: Alten Wiring-Aufruf entfernen**

Aktuell (`js/views/dailyLogView.js:339`):
```js
  container.querySelector("#supplements").addEventListener("change", (e) => { log.supplements = e.target.value; persist(); });
```

Ersetzen durch (Zeile entfernen, keine Ersetzung):
```js

```

(d.h. die Zeile wird ersatzlos gelöscht — der neue Wiring-Code kommt in Step 5 ans Ende der Funktion.)

- [ ] **Step 5: Neues Wiring ans Ende der Funktion anfügen**

Aktuell (Ende der Funktion):
```js
  container.querySelector("#add-activity").addEventListener("click", () => {
    log.activities.push({ art: "", dauerMin: null, zustand: "" });
    persist();
    renderDailyLogView(container, headerContainer, profile, dateISO, onDateChange);
  });
}
```

Ersetzen durch:
```js
  container.querySelector("#add-activity").addEventListener("click", () => {
    log.activities.push({ art: "", dauerMin: null, zustand: "" });
    persist();
    renderDailyLogView(container, headerContainer, profile, dateISO, onDateChange);
  });

  function wireSupplementRow(index) {
    const row = container.querySelector(`[data-supplement-index="${index}"]`);
    row.querySelector(`#supplement-${index}-name`).addEventListener("change", (e) => { log.supplements[index].name = e.target.value; persist(); });
    row.querySelectorAll(`[data-emoji-group="supplement-gefuehl-${index}"]`).forEach((btn) => {
      btn.addEventListener("click", () => {
        log.supplements[index].feeling = btn.dataset.emojiValue;
        row.querySelectorAll(`[data-emoji-group="supplement-gefuehl-${index}"]`).forEach((b) => b.classList.toggle("selected", b === btn));
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
}
```

- [ ] **Step 6: Syntax-Check**

Run: `node --check js/views/dailyLogView.js`
Expected: kein Output (Exit-Code 0).

- [ ] **Step 7: Migration + Listen-Logik durchrechnen**

Altes Tagesprotokoll mit `supplements: "Vitamin D"` (aus der DB geladen) → `migrateSupplements` (Task 3) wandelt es bereits in `getDailyLog` um zu `[{name: "Vitamin D", feeling: null}]`, bevor `renderDailyLogView` es bekommt → `log.supplements.map(...)` rendert genau einen Eintrag mit vorausgefülltem Namen und leerem Gefühl-Picker. ✓

"+ Hinzufügen" klicken → `log.supplements.push({name:"", feeling:null})` → Re-Render zeigt einen zweiten leeren Eintrag, beide Einträge bleiben unabhängig editierbar (verschiedene `data-supplement-index`). ✓

Löschen-Button bei Index 0 mit zwei Einträgen → `splice(0,1)` → verbleibender Eintrag rutscht auf Index 0, Re-Render erzeugt neue IDs korrekt. ✓

- [ ] **Step 8: Browser-Test**

Server starten, Tagesansicht öffnen, ein Supplement mit Namen + Gefühl-Emoji eintragen, "+ Hinzufügen" für ein zweites, einen Eintrag löschen → alles bleibt nach Reload korrekt gespeichert (IndexedDB). Bestehendes Profil mit altem Freitext-Supplement (falls aus Phase 1/2-Testdaten vorhanden) öffnen → wird als erster Listen-Eintrag angezeigt.

Falls kein Live-Browser-Test möglich ist: Hinweis im Report; Step 7 deckt Migration, Hinzufügen und Löschen durch Hand-Rechnung ab.

- [ ] **Step 9: Commit**

```bash
git add js/views/dailyLogView.js
git commit -m "feat: Supplements von Freitext zu Liste mit Gefuehls-Tracking umbauen"
```

---

### Task 8: `js/stats.js` + `js/views/overviewView.js` — Feature 4: Kalorien in Übersicht

**Files:**
- Modify: `js/stats.js`
- Modify: `js/views/overviewView.js`
- Modify: `js/icons.js`
- Modify: `css/styles.css`

**Interfaces:**
- Consumes: `profile`-Objekt (statt `profileId`) in `getOverviewStats`.
- Produces: `getOverviewStats(profile)` liefert zusätzlich `avgKcalPerDay`, `avgDeficit`, `kcalPoints` (Array `{label, value}, analog `weightPoints`). Neuer Export `ICON_CALORIES` in `js/icons.js`.

- [ ] **Step 1: `ICON_CALORIES` in `js/icons.js` ergänzen**

Am Ende der Datei (nach `ICON_TRASH`) anfügen:
```js

export const ICON_CALORIES = `<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c2 3-2 5-2 8a4 4 0 008 0c0-2-1-3-1-3s1 4-2 4-2-3-1-5c0 0-4 1-4 6a6 6 0 0012 0c0-6-6-7-10-10z"/></svg>`;
```

- [ ] **Step 2: `getOverviewStats` auf `profile`-Parameter umstellen und Kalorien-Kennzahlen ergänzen**

Aktuell (komplette Funktion + Return, `js/stats.js:8-45`):
```js
export async function getOverviewStats(profileId) {
  const allLogs = await getAllItems("dailyLogs");
  const today = todayISO();
  const windowStart = addDaysISO(today, -(OVERVIEW_WINDOW_DAYS - 1));

  const logs = allLogs
    .filter((log) => log.profileId === profileId && log.date >= windowStart && log.date <= today)
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const waterValues = logs.filter((l) => l.waterMl != null).map((l) => l.waterMl);
  const avgWaterMl = waterValues.length ? Math.round(waterValues.reduce((a, b) => a + b, 0) / waterValues.length) : null;

  const activityDayCount = logs.filter((l) => l.activities && l.activities.length > 0).length;

  const sleepQualityValues = logs.filter((l) => l.sleep && l.sleep.qualitaet != null).map((l) => l.sleep.qualitaet);
  const avgSleepQuality = sleepQualityValues.length
    ? sleepQualityValues.reduce((a, b) => a + b, 0) / sleepQualityValues.length
    : null;

  const weightPoints = logs
    .filter((l) => l.weightKg != null)
    .map((l) => ({ label: formatShortDate(l.date), value: l.weightKg }));

  const moodPoints = logs
    .map((l) => dailyMoodAverage(l))
    .filter((entry) => entry !== null)
    .map((entry) => ({ label: formatShortDate(entry.date), value: entry.value }));

  return {
    windowDays: OVERVIEW_WINDOW_DAYS,
    avgWaterMl,
    activityDayCount,
    totalDaysLogged: logs.length,
    avgSleepQuality,
    weightPoints,
    moodPoints,
  };
}
```

Ersetzen durch:
```js
export async function getOverviewStats(profile) {
  const allLogs = await getAllItems("dailyLogs");
  const today = todayISO();
  const windowStart = addDaysISO(today, -(OVERVIEW_WINDOW_DAYS - 1));

  const logs = allLogs
    .filter((log) => log.profileId === profile.id && log.date >= windowStart && log.date <= today)
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const waterValues = logs.filter((l) => l.waterMl != null).map((l) => l.waterMl);
  const avgWaterMl = waterValues.length ? Math.round(waterValues.reduce((a, b) => a + b, 0) / waterValues.length) : null;

  const activityDayCount = logs.filter((l) => l.activities && l.activities.length > 0).length;

  const sleepQualityValues = logs.filter((l) => l.sleep && l.sleep.qualitaet != null).map((l) => l.sleep.qualitaet);
  const avgSleepQuality = sleepQualityValues.length
    ? sleepQualityValues.reduce((a, b) => a + b, 0) / sleepQualityValues.length
    : null;

  const weightPoints = logs
    .filter((l) => l.weightKg != null)
    .map((l) => ({ label: formatShortDate(l.date), value: l.weightKg }));

  const moodPoints = logs
    .map((l) => dailyMoodAverage(l))
    .filter((entry) => entry !== null)
    .map((entry) => ({ label: formatShortDate(entry.date), value: entry.value }));

  const kcalDays = logs
    .map((l) => ({ date: l.date, total: dailyKcalTotal(l) }))
    .filter((entry) => entry.total != null);

  const avgKcalPerDay = kcalDays.length
    ? Math.round(kcalDays.reduce((sum, d) => sum + d.total, 0) / kcalDays.length)
    : null;

  const avgDeficit = profile.calorieGoal != null && kcalDays.length
    ? Math.round(kcalDays.reduce((sum, d) => sum + (profile.calorieGoal - d.total), 0) / kcalDays.length)
    : null;

  const kcalPoints = kcalDays.map((d) => ({ label: formatShortDate(d.date), value: d.total }));

  return {
    windowDays: OVERVIEW_WINDOW_DAYS,
    avgWaterMl,
    activityDayCount,
    totalDaysLogged: logs.length,
    avgSleepQuality,
    weightPoints,
    moodPoints,
    avgKcalPerDay,
    avgDeficit,
    kcalPoints,
  };
}

function dailyKcalTotal(log) {
  const total = Object.values(log.meals || {}).reduce((sum, meal) => sum + (meal.kalorien || 0), 0);
  return total > 0 ? total : null;
}
```

- [ ] **Step 3: Syntax-Check**

Run: `node --check js/stats.js`
Expected: kein Output (Exit-Code 0).

- [ ] **Step 4: `getOverviewStats`-Aufruf in `overviewView.js` anpassen**

Aktuell (`js/views/overviewView.js:11`):
```js
  const stats = await getOverviewStats(profile.id);
```

Ersetzen durch:
```js
  const stats = await getOverviewStats(profile);
```

- [ ] **Step 5: Import von `ICON_CALORIES` ergänzen**

Aktuell (`js/views/overviewView.js:5`):
```js
import { ICON_WATER, ICON_ACTIVITY, ICON_SLEEP } from "../icons.js";
```

Ersetzen durch:
```js
import { ICON_WATER, ICON_ACTIVITY, ICON_SLEEP, ICON_CALORIES } from "../icons.js";
```

- [ ] **Step 6: Neue Stat-Kachel, Defizit-Satz und Trend-Chart ergänzen**

Aktuell (`js/views/overviewView.js:22-47`):
```js
    <div class="section-card overview-stat-grid">
      <div class="overview-stat">
        <span class="overview-stat-icon" aria-hidden="true">${ICON_WATER}</span>
        <span class="overview-stat-value">${stats.avgWaterMl != null ? `${stats.avgWaterMl} ml` : "–"}</span>
        <span class="overview-stat-label">Ø Wasser/Tag</span>
      </div>
      <div class="overview-stat">
        <span class="overview-stat-icon" aria-hidden="true">${ICON_ACTIVITY}</span>
        <span class="overview-stat-value">${stats.activityDayCount}</span>
        <span class="overview-stat-label">Sport-Tage</span>
      </div>
      <div class="overview-stat">
        <span class="overview-stat-icon" aria-hidden="true">${ICON_SLEEP}</span>
        <span class="overview-stat-value">${escapeHtml(avgSleepLabel)}</span>
        <span class="overview-stat-label">Ø Schlafqualität</span>
      </div>
    </div>
    <div class="section-card">
      <h3>Gewichtsverlauf</h3>
      ${renderLineChart(stats.weightPoints, { ariaLabel: "Gewichtsverlauf", height: 140 })}
    </div>
    <div class="section-card">
      <h3>Stimmungs-Trend</h3>
      ${renderLineChart(stats.moodPoints, { ariaLabel: "Stimmungs-Trend", height: 140 })}
    </div>
  `;
}
```

Ersetzen durch:
```js
    <div class="section-card overview-stat-grid">
      <div class="overview-stat">
        <span class="overview-stat-icon" aria-hidden="true">${ICON_WATER}</span>
        <span class="overview-stat-value">${stats.avgWaterMl != null ? `${stats.avgWaterMl} ml` : "–"}</span>
        <span class="overview-stat-label">Ø Wasser/Tag</span>
      </div>
      <div class="overview-stat">
        <span class="overview-stat-icon" aria-hidden="true">${ICON_ACTIVITY}</span>
        <span class="overview-stat-value">${stats.activityDayCount}</span>
        <span class="overview-stat-label">Sport-Tage</span>
      </div>
      <div class="overview-stat">
        <span class="overview-stat-icon" aria-hidden="true">${ICON_SLEEP}</span>
        <span class="overview-stat-value">${escapeHtml(avgSleepLabel)}</span>
        <span class="overview-stat-label">Ø Schlafqualität</span>
      </div>
      <div class="overview-stat">
        <span class="overview-stat-icon" aria-hidden="true">${ICON_CALORIES}</span>
        <span class="overview-stat-value">${stats.avgKcalPerDay != null ? `${stats.avgKcalPerDay} kcal` : "–"}</span>
        <span class="overview-stat-label">Ø Kalorien/Tag</span>
      </div>
    </div>
    ${stats.avgDeficit != null ? `
    <div class="section-card">
      <p class="overview-subtext">${deficitSentence(stats.avgDeficit)}</p>
    </div>` : ""}
    <div class="section-card">
      <h3>Gewichtsverlauf</h3>
      ${renderLineChart(stats.weightPoints, { ariaLabel: "Gewichtsverlauf", height: 140 })}
    </div>
    <div class="section-card">
      <h3>Stimmungs-Trend</h3>
      ${renderLineChart(stats.moodPoints, { ariaLabel: "Stimmungs-Trend", height: 140 })}
    </div>
    <div class="section-card">
      <h3>Kalorien-Trend</h3>
      ${renderLineChart(stats.kcalPoints, { ariaLabel: "Kalorien-Trend", height: 140 })}
    </div>
  `;
}

function deficitSentence(avgDeficit) {
  if (avgDeficit > 0) return `Im Schnitt ${avgDeficit} kcal unter Ziel`;
  if (avgDeficit < 0) return `Im Schnitt ${-avgDeficit} kcal über Ziel`;
  return "Ziel im Schnitt genau erreicht";
}
```

- [ ] **Step 7: Grid-Layout für 4 Kacheln anpassen**

Aktuell (`css/styles.css:513-516`):
```css
.overview-stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
```

Ersetzen durch:
```css
.overview-stat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
```

- [ ] **Step 8: Syntax-Checks**

Run: `node --check js/views/overviewView.js`
Expected: kein Output (Exit-Code 0).
Run: `node --check js/icons.js`
Expected: kein Output (Exit-Code 0).

- [ ] **Step 9: Logik durchrechnen**

Logs der letzten 30 Tage für Profil mit `calorieGoal: 2259`: Tag A `total=1859`, Tag B `total=2100`, Tag C ohne Kalorieneinträge (alle `meal.kalorien` null → `dailyKcalTotal` liefert `null`, wird gefiltert).
- `kcalDays = [{date:A, total:1859}, {date:B, total:2100}]`
- `avgKcalPerDay = round((1859+2100)/2) = 1980`
- `avgDeficit = round(((2259-1859)+(2259-2100))/2) = round((400+159)/2) = round(279.5) = 280` → `deficitSentence(280)` → "Im Schnitt 280 kcal unter Ziel"
- `kcalPoints = [{label:"<A>", value:1859}, {label:"<B>", value:2100}]`

Profil ohne `calorieGoal` (`null`): `avgDeficit = null` → Defizit-Satz-Block wird komplett ausgeblendet (leerer String), restliche Kacheln/Charts unverändert sichtbar.

- [ ] **Step 10: Browser-Test**

Server starten, mehrere Tage mit Mahlzeiten-Kalorien eintragen (über die Tagesansicht), Übersicht öffnen → neue Kachel "Ø Kalorien/Tag", Defizit-Satz (falls Kalorienziel gesetzt) und "Kalorien-Trend"-Chart erscheinen, 2×2-Kachel-Layout auf Mobile sauber.

Falls kein Live-Browser-Test möglich ist: Hinweis im Report; Step 9 deckt Aggregation und Fallback-Verhalten durch Hand-Rechnung ab.

- [ ] **Step 11: Commit**

```bash
git add js/stats.js js/views/overviewView.js js/icons.js css/styles.css
git commit -m "feat: Kalorien-Kennzahlen und Trend-Chart in Uebersicht"
```

---

### Task 9: `service-worker.js` — neue Datei cachen, Cache-Version erhöhen

**Files:**
- Modify: `service-worker.js`

**Interfaces:**
- Keine neuen Exporte — reine Asset-Liste/Versions-Änderung.

- [ ] **Step 1: `CACHE_NAME` erhöhen und `js/calorieCalc.js` ergänzen**

Aktuell (`service-worker.js:4-21`):
```js
const CACHE_NAME = "doole-cache-v2";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/tokens.css",
  "./css/styles.css",
  "./js/app.js",
  "./js/db.js",
  "./js/toast.js",
  "./js/profiles.js",
  "./js/dailyLog.js",
  "./js/calendar.js",
  "./js/backup.js",
  "./js/icons.js",
  "./js/escapeHtml.js",
  "./js/charts.js",
  "./js/stats.js",
```

Ersetzen durch:
```js
const CACHE_NAME = "doole-cache-v3";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/tokens.css",
  "./css/styles.css",
  "./js/app.js",
  "./js/db.js",
  "./js/toast.js",
  "./js/profiles.js",
  "./js/dailyLog.js",
  "./js/calendar.js",
  "./js/backup.js",
  "./js/icons.js",
  "./js/escapeHtml.js",
  "./js/charts.js",
  "./js/stats.js",
  "./js/calorieCalc.js",
```

- [ ] **Step 2: Syntax-Check**

Run: `node --check service-worker.js`
Expected: kein Output (Exit-Code 0).

- [ ] **Step 3: Browser-Test (Offline-Verifikation)**

Server starten, Seite einmal laden (damit der neue Service Worker installiert und alle Assets cacht — alte Cache-Version `v2` wird beim `activate`-Event automatisch gelöscht), DevTools → Network → "Offline" aktivieren, Seite neu laden → App funktioniert weiterhin vollständig inkl. neuer Kalorien-Features.

Falls kein Live-Browser-Test möglich ist: Hinweis im Report; stattdessen `grep -c "js/calorieCalc.js" service-worker.js` (oder `node --check` + manuelles Durchsehen der `ASSETS_TO_CACHE`-Liste) bestätigen, dass die neue Datei tatsächlich in der Liste steht und `CACHE_NAME` auf `v3` erhöht wurde — beides rein textuell verifizierbar ohne Browser.

- [ ] **Step 4: Commit**

```bash
git add service-worker.js
git commit -m "fix: calorieCalc.js zum Service-Worker-Cache hinzufuegen, Cache-Version auf v3 erhoehen"
```

---

## Self-Review

**1. Spec-Abdeckung** (gegen `docs/superpowers/specs/2026-06-22-doole-phase3-calories-design.md`):
- Datenmodell-Erweiterung Profil → Task 2. ✓
- Datenmodell-Erweiterung Supplements + Migration → Task 3. ✓
- `js/calorieCalc.js` mit exakter Mifflin-St-Jeor-Formel → Task 1. ✓
- Feature 1 (Profil-Erstellung) → Task 4. ✓
- Körperdaten-Karte in Einstellungen → Task 5. ✓
- Feature 5 (Kalorien neu berechnen, 3 Fallunterscheidungen) → Task 5, Step 4. ✓
- Feature 3 (Tages-Kalorienkarte mit Smiley/Balken/Differenz) → Task 6. ✓
- Feature 4 (`getOverviewStats(profile)`, `avgKcalPerDay`, `avgDeficit`, `kcalPoints`, neues Icon, Trend-Chart) → Task 8. ✓
- Feature 6 (Supplements-Liste mit `SUPPLEMENT_GEFUEHL`) → Task 7. ✓
- Service-Worker-Cache-Update → Task 9. ✓
- Bereits umgesetzte Features 16/2 bewusst ausgelassen (siehe Spec). ✓

**2. Placeholder-Scan:** Keine "TBD"/"TODO"/"siehe oben" gefunden — jeder Schritt enthält vollständigen, copy-paste-fähigen Code oder eine exakte Diff-Anweisung.

**3. Typ-/Signatur-Konsistenz:**
- `calculateCalorieTargets({weightKg, heightCm, age, gender, activityLevel})` — identisch verwendet in Task 1 (Definition), Task 2 (`createProfile`), Task 5 (`recalculateAndSave`). ✓
- `kcalTotalHtml(log, profile)` — Signatur in Task 6 an beiden Call-Sites (Initial-Render + `updateMealKcalTotal`) konsistent aktualisiert. ✓
- `getOverviewStats(profile)` — Task 8 ändert Definition und den einzigen Call-Site in `overviewView.js` gemeinsam im selben Task. ✓
- `getLatestWeightEntry(profileId)` — Definition in Task 3, Verwendung in Task 5 mit `currentProfile.id` als Argument, übereinstimmend. ✓
- `SUPPLEMENT_GEFUEHL` — Definition in Task 3, Import + Verwendung in Task 7, übereinstimmend benannt. ✓
- `updateProfile(profile)` — Definition in Task 2, Verwendung in Task 5 (`recalculateAndSave`), übereinstimmend (übergibt vollständiges Profil-Objekt mit `id`). ✓

Keine offenen Lücken gefunden.
