# Doole Phase 3 — Kalorien-System & Supplements (Design)

**Goal:** Profile mit Körperdaten erweitern, daraus automatisch ein tägliches Kalorienziel (Mifflin-St-Jeor) berechnen, dieses Ziel in Tagesansicht und Monatsübersicht sichtbar machen, und Supplements von Freitext zu mehreren Einträgen mit Gefühls-Tracking umbauen.

**Bereits umgesetzt (kein Implementierungsbedarf in Phase 3):**
- Feature 16 (Aktivität "Zustand" als Emoji-Buttons): existiert bereits als `AKTIVITAET_ZUSTAND` in `js/dailyLog.js`, verwendet in `dailyLogView.js`.
- Feature 2 (optionales Kalorien-Feld pro Mahlzeit + Tagessumme): existiert bereits (`meal.kalorien`, `kcalTotalHtml` in `dailyLogView.js`).

## Global Constraints

- Design-Tokens bleiben unverändert: Creme `#FAF6F0`, Terrakotta `#C1502E`, Gold `#D9A441`, Smaragd-Varianten `#27543F`/`#2C5F4F`.
- Mobile-first, Touch-Ziele min. 44px, Schrift min. 16px (bestehende `--touch-min`/Tokens verwenden).
- Keine Texteingaben für Bewertungen — Emoji-Buttons mit Text-Label, konsistent mit bestehendem `emoji-btn`/`emoji-picker`-Pattern aus `dailyLogView.js`.
- Auto-Save bei jeder Feldänderung, kein expliziter Speichern-Button (bestehendes App-Verhalten).
- Alle neuen Körperdaten-Felder sind optional. Fehlt eines, bleiben `bmr`/`tdee`/`calorieGoal` `null` und alle davon abhängigen UI-Teile blenden sich ohne Fehler aus.
- Deutsche Beschriftung durchgehend.
- IndexedDB-Datenmodell ist schemaless (kein Migrationsschritt in `db.js` nötig) — Migration alter Felder passiert beim Lesen in den Domain-Modulen.

---

## Datenmodell

### Profil (`profiles`-Store, erweitert in `js/profiles.js`)

```js
{
  id, name, color, icon, createdAt,   // bestehend, unverändert
  age: null,            // Jahre, integer
  heightCm: null,        // integer
  weightKg: null,        // number, kann Dezimalstellen haben
  gender: null,           // "mann" | "frau"
  activityLevel: null,    // "sitzend" | "leicht_aktiv" | "aktiv" | "sehr_aktiv"
  bmr: null,               // berechnet, integer kcal
  tdee: null,              // berechnet, integer kcal
  calorieGoal: null,       // berechnet, integer kcal (= tdee - 500)
}
```

`bmr`/`tdee`/`calorieGoal` werden ausschließlich von `js/calorieCalc.js` berechnet und in `createProfile`/`updateProfile` mitgespeichert — nie direkt vom UI gesetzt.

### Tagesprotokoll (`dailyLogs`-Store, `js/dailyLog.js`)

`supplements` wechselt von `string` zu Array:

```js
supplements: [{ name: "Vitamin D", feeling: "besser" }]   // feeling: einer der SUPPLEMENT_GEFUEHL-Werte oder null
```

**Migration:** In `getDailyLog()`, nach dem Laden aus der DB: falls `existing.supplements` ein String ist, wird er konvertiert:
- nicht-leerer String → `[{ name: <string>, feeling: null }]`
- leerer String → `[]`

`createEmptyDailyLog()` liefert für neue Protokolle `supplements: []`.

---

## Neues Modul: `js/calorieCalc.js`

Reine Berechnungsfunktionen, keine UI, kein DB-Zugriff.

```js
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

// Liefert {bmr, tdee, calorieGoal} (gerundet auf ganze kcal) oder null,
// wenn eines der fünf Eingabefelder fehlt.
export function calculateCalorieTargets({ weightKg, heightCm, age, gender, activityLevel }) { ... }
```

Mifflin-St-Jeor:
- Mann: `BMR = 10×kg + 6.25×cm − 5×Alter + 5`
- Frau: `BMR = 10×kg + 6.25×cm − 5×Alter − 161`
- `TDEE = BMR × Aktivitätsfaktor`
- `Tagesziel = TDEE − 500`

---

## Feature 1 — Profil-Erstellung erweitern (`js/views/profileSelect.js`)

Formular "Neues Profil anlegen" bekommt zusätzlich (alle optional, kein `required`):
- Alter (Zahlenfeld, Jahre)
- Größe (Zahlenfeld, cm)
- Gewicht (Zahlenfeld, kg)
- Geschlecht: 2 Chip-Buttons (Mann/Frau), analog zu bestehendem `chipGroupHtml`-Pattern
- Aktivitätslevel: 4 Chip-Buttons, analog

Beim Absenden: sind alle 5 Felder gesetzt, wird `calculateCalorieTargets()` aufgerufen und das Ergebnis mit den Rohwerten in `createProfile()` übergeben. Fehlt eines, werden nur die vorhandenen Rohwerte gespeichert, `bmr`/`tdee`/`calorieGoal` bleiben `null`.

## Körperdaten-Karte in Einstellungen (`js/views/settingsView.js`)

Neue `section-card` "Körperdaten & Kalorienziel", bearbeitet die aktuell aktive Profil-Person (`currentProfile`, wie der Rest von `settingsView.js`):

- Dieselben 5 Felder wie bei der Erstellung, vorbefüllt mit aktuellen Profilwerten, Auto-Save bei jeder Änderung via `updateProfile()` (neue Funktion in `profiles.js`, ruft `putItem("profiles", profile)`).
- Bei jeder Änderung: `calculateCalorieTargets()` neu ausführen; sind alle 5 Felder gesetzt → Ergebnis speichern und anzeigen; sonst `bmr`/`tdee`/`calorieGoal` auf `null` setzen und Anzeige ausblenden.
- Anzeige (nur wenn `calorieGoal != null`): "Grundumsatz: X kcal · Gesamtverbrauch: Y kcal · Tagesziel: Z kcal".

## Feature 5 — "Kalorien neu berechnen"-Button (selbe Karte)

Button neben der Anzeige. Klick-Verhalten:
1. Sucht über alle `dailyLogs` des aktiven Profils den Eintrag mit dem spätesten Datum, bei dem `weightKg != null` (neue Funktion `getLatestWeightEntry(profileId)` in `js/dailyLog.js`, durchsucht `getAllItems("dailyLogs")`).
2. Kein Eintrag gefunden → Toast "Kein Gewichts-Eintrag im Tagesprotokoll gefunden." Kein weiterer Effekt.
3. Eintrag gefunden, aber Alter/Größe/Geschlecht/Aktivitätslevel fehlen im Profil → Toast "Bitte zuerst Alter, Größe, Geschlecht und Aktivitätslevel angeben." Kein weiterer Effekt.
4. Sonst: `profile.weightKg` = gefundener Wert, `calculateCalorieTargets()` neu ausführen, Profil speichern, Anzeige aktualisieren, Erfolgs-Toast "Kalorien neu berechnet ✓".

## Feature 3 — Tages-Kalorienkarte erweitern (`js/views/dailyLogView.js`)

Bestehende `kcalTotalHtml()`/`#kcal-total-card` wird erweitert. Eingabe: Tagessumme aus den Mahlzeiten (wie bisher) + `profile.calorieGoal`.

- `profile.calorieGoal == null`: unverändertes Verhalten von heute (nur "Kalorien heute: X kcal").
- `profile.calorieGoal != null`:
  - Zeile "Gegessen X / Ziel Y kcal"
  - Fortschrittsbalken, Breite `min(100%, X/Y×100)`
  - Differenz `diff = Y - X`:
    - `diff > 0` (Defizit) → 😊 "Defizit `diff` kcal"
    - `diff === 0` → 😐 "Ziel erreicht"
    - `diff < 0` (Überschuss) → 😟 "`-diff` kcal über Ziel"

## Feature 4 — Kalorien in Übersicht (`js/stats.js`, `js/views/overviewView.js`)

`getOverviewStats(profile)` (Signatur ändert sich von `profileId` zu `profile`-Objekt, da `calorieGoal` für die Defizit-Berechnung benötigt wird; intern weiter `profile.id` für die Log-Filterung nutzen):

Neu zurückgegeben:
- `avgKcalPerDay`: Durchschnitt der Tagessummen (Summe der `meal.kalorien` je Tag) über alle Tage im 30-Tage-Fenster, die mindestens einen Kalorienwert haben. `null`, wenn keine Daten.
- `avgDeficit`: nur berechnet, wenn `profile.calorieGoal != null` — Durchschnitt von `(calorieGoal - Tagessumme)` über dieselben Tage. `null` sonst.
- `kcalPoints`: Array `{label, value}` analog zu `weightPoints`/`moodPoints`, Tagessumme pro Tag mit Kalorieneinträgen.

`overviewView.js`:
- Neue Stat-Kachel "Ø Kalorien/Tag" mit neuem Icon `ICON_CALORIES` (Flammen-Outline, gleicher Stil wie bestehende Icons: 24x24, `stroke-width="1.75"`, kein Fill). Wird in `js/icons.js` ergänzt: `export const ICON_CALORIES = '<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c2 3-2 5-2 8a4 4 0 008 0c0-2-1-3-1-3s1 4-2 4-2-3-1-5c0 0-4 1-4 6a6 6 0 0012 0c0-6-6-7-10-10z"/></svg>';`.
- Satz "Im Schnitt `N` kcal unter Ziel" (bei `avgDeficit > 0`) bzw. "Im Schnitt `N` kcal über Ziel" (bei `avgDeficit < 0`) bzw. "Ziel im Schnitt genau erreicht" (`avgDeficit === 0`) — nur wenn `avgDeficit != null`.
- Neue Chart-Karte "Kalorien-Trend" mit `renderLineChart(stats.kcalPoints, ...)`, analog zu Gewichts-/Stimmungs-Trend.

## Feature 6 — Supplements umbauen (`js/views/dailyLogView.js`)

Neue Konstante in `js/dailyLog.js`:
```js
export const SUPPLEMENT_GEFUEHL = [
  { value: "neutral", emoji: "😐", label: "Neutral" },
  { value: "besser", emoji: "🙂", label: "Besser" },
  { value: "viel_besser", emoji: "💪", label: "Viel besser" },
  { value: "muede", emoji: "😴", label: "Müde" },
  { value: "schlecht", emoji: "🤢", label: "Schlecht" },
];
```

UI in `dailyLogView.js` ersetzt das bisherige `<input id="supplements">`-Textfeld durch eine Liste, analog zum bestehenden Aktivitäten-Listen-Pattern (`activityRowHtml`/`wireActivityRow`/`#add-activity`):
- Pro Eintrag: Textfeld "Welches Supplement" + Emoji-Picker (`SUPPLEMENT_GEFUEHL`) + Löschen-Button.
- "+ Hinzufügen"-Button fügt `{name: "", feeling: null}` hinzu.

---

## Betroffene Dateien

- Neu: `js/calorieCalc.js`
- Geändert: `js/profiles.js` (neue Profilfelder, `updateProfile()`), `js/dailyLog.js` (Supplements-Migration, `SUPPLEMENT_GEFUEHL`, `getLatestWeightEntry()`), `js/stats.js` (Kalorien-Kennzahlen), `js/views/profileSelect.js` (Formular-Erweiterung), `js/views/settingsView.js` (Körperdaten-Karte), `js/views/dailyLogView.js` (Kalorienkarte erweitern, Supplements-Liste), `js/views/overviewView.js` (Kalorien-Kachel/Satz/Chart)
- `service-worker.js`: `js/calorieCalc.js` zu `ASSETS_TO_CACHE` hinzufügen, `CACHE_NAME` auf `doole-cache-v3` erhöhen.

## Testing

Manuelle End-to-End-Tests (kein Test-Framework im Projekt vorhanden, Konsistenz mit Phase 1/2):
- Profil mit allen 5 Körperdaten-Feldern anlegen → BMR/TDEE/Ziel korrekt nach Mifflin-St-Jeor.
- Profil ohne Körperdaten anlegen → keine Kalorienziel-Anzeige irgendwo, kein Fehler.
- Körperdaten nachträglich in Einstellungen ergänzen → Ziel erscheint nachträglich überall.
- "Kalorien neu berechnen" ohne Gewichts-Log-Eintrag → Toast, kein Crash.
- "Kalorien neu berechnen" mit vorhandenem Gewichts-Log-Eintrag → Profilgewicht und Ziel aktualisiert.
- Tagesansicht: Mahlzeiten-Kalorien unter/über/exakt Ziel eintragen → korrekter Smiley/Text/Balken.
- Übersicht: Ø Kalorien/Tag, Ø Defizit, Trend-Graph erscheinen nach mehreren Tagen mit Kalorien-Einträgen.
- Altes Tagesprotokoll mit Freitext-Supplement öffnen → wird als erster Listen-Eintrag angezeigt; neue Einträge hinzufügen/entfernen funktioniert.
- Offline-Test nach Deployment: neue Datei `calorieCalc.js` wird vom Service Worker gecacht.
