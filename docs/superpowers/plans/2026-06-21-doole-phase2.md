# Doole Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Activate the previously stubbed-out Kalender and Übersicht tabs, add an end-of-day summary card, add an optional per-meal calorie field with a daily total, and replace the free-text "Zustand" field on activities with emoji buttons.

**Architecture:** Same vanilla ES-module, no-build, IndexedDB-backed architecture as Phase 1 and the Mobile-UX redesign. Two new view modules (`js/views/calendarView.js`, `js/views/overviewView.js`) and two new logic modules (`js/charts.js` for a dependency-free SVG line chart, `js/stats.js` for aggregating daily logs into overview metrics). `js/app.js` gains routing for the two new tabs. `js/views/dailyLogView.js` gains a daily-summary card, a per-meal calories field, a daily calorie total, and an emoji-based activity-state picker.

**Tech Stack:** Vanilla JS (ES modules), IndexedDB, no framework, no build tool, no charting library (hand-rolled SVG).

## Global Constraints

- No external dependencies — every line of JS/CSS ships in this repo, no CDN/npm additions.
- Follow the existing "no emoji icons, SVG only" rule for all *new* UI elements in this plan, with one explicit exception carried over from the Mobile-UX redesign: the project already uses emoji for meal-slot icons, mood pickers, and sleep-quality buttons. Task 6 (Aktivität-Zustand) extends that *same, already-accepted* emoji exception to one more rating picker, per the user's explicit request. Do not introduce emoji anywhere else (the calendar, overview stats, charts, and daily-summary icons all use the existing SVG icon set from `js/icons.js`).
- All user-controlled free text interpolated into an `innerHTML` template must go through `escapeHtml` from `js/escapeHtml.js` (already established convention — see `js/views/dailyLogView.js` and `js/views/profileSelect.js`).
- All new touch targets meet the existing `--touch-min: 44px` minimum.
- All new colors/spacing/radii must reference existing tokens in `css/tokens.css` — no new raw hex values or magic pixel numbers.
- German-language UI copy throughout, matching the existing app's tone (e.g. "Übersicht", "Kalender", "Tagesbericht").

---

### Task 1: Kalender-Tab — Monatsansicht und Navigation

**Files:**
- Create: `js/views/calendarView.js`
- Modify: `js/app.js`
- Modify: `css/styles.css`

**Interfaces:**
- Consumes: `getMonthMatrix`, `todayISO` from `js/calendar.js` (already exist); `getAllItems` from `js/db.js` (already exists); `ICON_CHEVRON_LEFT`, `ICON_CHEVRON_RIGHT` from `js/icons.js` (already exist).
- Produces: `renderCalendarView(container, headerContainer, profile, dateISO, onSelectDate)` — an exported async function. `onSelectDate(newDateISO)` is called when the user taps a day; the caller (app.js) is responsible for switching to the daily log for that date.

- [ ] **Step 1: Create the calendar view module**

Create `js/views/calendarView.js`:

```js
// Bildschirm: Monatsansicht zum Springen zu einem beliebigen Tag.
// Tage mit gespeicherten Einträgen bekommen einen kleinen Punkt.
import { getMonthMatrix, todayISO } from "../calendar.js";
import { ICON_CHEVRON_LEFT, ICON_CHEVRON_RIGHT } from "../icons.js";
import { getAllItems } from "../db.js";

const WEEKDAY_SHORT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

export async function renderCalendarView(container, headerContainer, profile, dateISO, onSelectDate) {
  headerContainer.innerHTML = `<h1 style="font-family:var(--font-headline);font-size:var(--font-size-display);color:#fff;">Kalender</h1>`;

  let [year, month] = dateISO.split("-").map(Number);
  month -= 1; // 0-basiert für getMonthMatrix

  const allLogs = await getAllItems("dailyLogs");
  const profileLogDates = new Set(
    allLogs.filter((log) => log.profileId === profile.id).map((log) => log.date)
  );

  function render() {
    const weeks = getMonthMatrix(year, month);
    const today = todayISO();

    container.innerHTML = `
      <div class="section-card calendar-card">
        <div class="calendar-header">
          <button type="button" id="cal-prev-month" aria-label="Vorheriger Monat">${ICON_CHEVRON_LEFT}</button>
          <strong>${MONTHS[month]} ${year}</strong>
          <button type="button" id="cal-next-month" aria-label="Nächster Monat">${ICON_CHEVRON_RIGHT}</button>
        </div>
        <div class="calendar-weekdays">
          ${WEEKDAY_SHORT.map((d) => `<div class="calendar-weekday">${d}</div>`).join("")}
        </div>
        <div class="calendar-grid">
          ${weeks.flat().map((cellISO) => {
            if (!cellISO) return `<div class="calendar-cell empty"></div>`;
            const day = Number(cellISO.split("-")[2]);
            const isToday = cellISO === today;
            const hasEntry = profileLogDates.has(cellISO);
            return `
              <button type="button" class="calendar-cell ${isToday ? "today" : ""}" data-cell-date="${cellISO}">
                <span class="calendar-cell-day">${day}</span>
                ${hasEntry ? `<span class="calendar-cell-dot" aria-hidden="true"></span>` : ""}
              </button>
            `;
          }).join("")}
        </div>
      </div>
    `;

    container.querySelector("#cal-prev-month").addEventListener("click", () => {
      month -= 1;
      if (month < 0) { month = 11; year -= 1; }
      render();
    });
    container.querySelector("#cal-next-month").addEventListener("click", () => {
      month += 1;
      if (month > 11) { month = 0; year += 1; }
      render();
    });
    container.querySelectorAll("[data-cell-date]").forEach((btn) => {
      btn.addEventListener("click", () => onSelectDate(btn.dataset.cellDate));
    });
  }

  render();
}
```

(`cellISO`, the day number, and `year`/`month` are all derived from ISO date strings and integers — never user free text — so no `escapeHtml` is needed in this template, consistent with how `js/calendar.js`'s own popup calendar already builds its markup.)

- [ ] **Step 2: Wire the Kalender tab into the router**

In `js/app.js`, add the import:

```js
import { renderDailyLogView } from "./views/dailyLogView.js";
```

becomes:

```js
import { renderDailyLogView } from "./views/dailyLogView.js";
import { renderCalendarView } from "./views/calendarView.js";
```

Replace the `renderBottomNav` function:

```js
function renderBottomNav(activeTab) {
  bottomNavEl.innerHTML = `
    <button class="nav-item ${activeTab === "home" ? "active" : ""}" id="nav-home" aria-label="Heute">${ICON_HOME}<span>Heute</span></button>
    <button class="nav-item" id="nav-calendar" disabled aria-label="Kalender (bald verfügbar)">${ICON_CALENDAR}<span>Kalender</span></button>
    <button class="nav-item" id="nav-chart" disabled aria-label="Übersicht (bald verfügbar)">${ICON_CHART}<span>Übersicht</span></button>
    <button class="nav-item ${activeTab === "settings" ? "active" : ""}" id="nav-settings" aria-label="Profil/Einstellungen">${ICON_PROFILE}<span>Profil</span></button>
  `;
  bottomNavEl.querySelector("#nav-home").addEventListener("click", showDailyLog);
  bottomNavEl.querySelector("#nav-settings").addEventListener("click", showSettings);
}
```

with:

```js
function renderBottomNav(activeTab) {
  bottomNavEl.innerHTML = `
    <button class="nav-item ${activeTab === "home" ? "active" : ""}" id="nav-home" aria-label="Heute">${ICON_HOME}<span>Heute</span></button>
    <button class="nav-item ${activeTab === "calendar" ? "active" : ""}" id="nav-calendar" aria-label="Kalender">${ICON_CALENDAR}<span>Kalender</span></button>
    <button class="nav-item" id="nav-chart" disabled aria-label="Übersicht (bald verfügbar)">${ICON_CHART}<span>Übersicht</span></button>
    <button class="nav-item ${activeTab === "settings" ? "active" : ""}" id="nav-settings" aria-label="Profil/Einstellungen">${ICON_PROFILE}<span>Profil</span></button>
  `;
  bottomNavEl.querySelector("#nav-home").addEventListener("click", showDailyLog);
  bottomNavEl.querySelector("#nav-calendar").addEventListener("click", showCalendar);
  bottomNavEl.querySelector("#nav-settings").addEventListener("click", showSettings);
}
```

(Task 3 will remove the `disabled` attribute from `#nav-chart` the same way — leave it disabled in this task.)

Add a new `showCalendar` function. Insert it after the existing `showDailyLog` function (which ends right before `function showSettings`):

```js
function showCalendar() {
  renderBottomNav("calendar");
  renderCalendarView(contentEl, headerEl, state.currentProfile, state.currentDateISO, (newDateISO) => {
    state.currentDateISO = newDateISO;
    showDailyLog();
  });
}
```

- [ ] **Step 3: Add calendar styles**

In `css/styles.css`, append:

```css
/* Kalender-Ansicht */
.calendar-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: var(--font-headline);
  color: var(--color-secondary);
}

.calendar-header button {
  background: none;
  border: none;
  min-width: var(--touch-min);
  min-height: var(--touch-min);
  color: var(--color-secondary);
  cursor: pointer;
}

.calendar-weekdays,
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--space-1);
}

.calendar-weekday {
  text-align: center;
  font-size: var(--font-size-label);
  color: var(--color-text-muted);
}

.calendar-cell {
  position: relative;
  min-height: var(--touch-min);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border: none;
  border-radius: var(--space-2);
  background: none;
  font-family: var(--font-body);
  font-size: var(--font-size-body);
  color: var(--color-text);
  cursor: pointer;
}

.calendar-cell.empty {
  cursor: default;
}

.calendar-cell.today {
  background: var(--color-primary);
  color: #fff;
  font-weight: 600;
}

.calendar-cell-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--color-accent);
}

.calendar-cell.today .calendar-cell-dot {
  background: #fff;
}
```

- [ ] **Step 4: Manually verify in the browser**

Run `npx serve . -l 3000`, select a profile, tap "Kalender" in the bottom nav. Expected: the current month appears with today highlighted; days you already logged data for show a small dot. Tap a day in a different month (after using the month-arrows) — you land on "Heute" tab showing the daily log for that date, editable and persisting independently per day.

If no browser tool is available, instead verify statically: `node --check js/views/calendarView.js` and `node --check js/app.js`; confirm via grep that `#nav-calendar` no longer has the `disabled` attribute and that `showCalendar` is both defined and wired to a click listener; manually trace `getMonthMatrix`'s existing (already-tested) output against the new template's `data-cell-date` usage to confirm no off-by-one in weekday columns. Note in your report that live-browser verification is deferred.

- [ ] **Step 5: Commit**

```bash
git add js/views/calendarView.js js/app.js css/styles.css
git commit -m "Phase 2: Kalender-Tab mit Monatsansicht und Tages-Navigation"
```

---

### Task 2: Übersicht-Logik — Statistik-Aggregation und SVG-Liniendiagramm

**Files:**
- Create: `js/charts.js`
- Create: `js/stats.js`

**Interfaces:**
- Consumes: `getAllItems` from `js/db.js`; `addDaysISO`, `todayISO` from `js/calendar.js` (all already exist).
- Produces: `renderLineChart(points, options)` from `js/charts.js` — `points` is `{label: string, value: number}[]`; returns an HTML string. `options` may include `width`, `height`, `ariaLabel` (all optional). Produces `getOverviewStats(profileId)` from `js/stats.js` — async, returns `{ windowDays: number, avgWaterMl: number|null, activityDayCount: number, totalDaysLogged: number, avgSleepQuality: number|null, weightPoints: {label,value}[], moodPoints: {label,value}[] }`. Task 3 consumes both of these.

- [ ] **Step 1: Create the SVG line-chart helper**

Create `js/charts.js`:

```js
// Erzeugt einfache SVG-Linien-Diagramme als HTML-String, ganz ohne externe
// Bibliothek. points ist ein Array von {label, value}. Bei weniger als 2
// Punkten gibt es noch nichts zu verbinden, daher ein Leerzustand-Hinweis.
export function renderLineChart(points, options = {}) {
  const width = options.width || 300;
  const height = options.height || 120;
  const padding = 12;

  if (points.length < 2) {
    return `<p class="chart-empty">Noch nicht genug Daten für einen Verlauf.</p>`;
  }

  const values = points.map((p) => p.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  const stepX = (width - padding * 2) / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = padding + i * stepX;
    const y = padding + (height - padding * 2) * (1 - (p.value - minValue) / range);
    return { x, y };
  });

  const pathD = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const dots = coords.map((c) => `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="3" fill="var(--color-primary)"></circle>`).join("");

  return `
    <div class="chart-wrap">
      <svg class="line-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${options.ariaLabel || "Verlaufsdiagramm"}">
        <path d="${pathD}" fill="none" stroke="var(--color-primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
        ${dots}
      </svg>
      <div class="chart-axis-labels">
        <span>${points[0].label}</span>
        <span>${points[points.length - 1].label}</span>
      </div>
    </div>
  `;
}
```

`points[].label` values are always caller-supplied short date strings (e.g. `"12.06."`), never raw user text, so no `escapeHtml` is needed here — `js/stats.js` (Step 2) is the only producer of `points`, and it only ever derives labels from ISO date strings.

- [ ] **Step 2: Create the stats aggregation module**

Create `js/stats.js`:

```js
// Aggregiert Tagesprotokolle eines Profils über die letzten 30 Tage zu
// Kennzahlen für die Übersicht-Ansicht.
import { getAllItems } from "./db.js";
import { addDaysISO, todayISO } from "./calendar.js";

const OVERVIEW_WINDOW_DAYS = 30;

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

function dailyMoodAverage(log) {
  const moodValues = Object.values(log.meals || {})
    .flatMap((meal) => [meal.gefuehlVorher, meal.gefuehlNachher])
    .filter((v) => v != null);
  if (moodValues.length === 0) return null;
  return { date: log.date, value: moodValues.reduce((a, b) => a + b, 0) / moodValues.length };
}

function formatShortDate(dateISO) {
  const [, month, day] = dateISO.split("-");
  return `${day}.${month}.`;
}
```

- [ ] **Step 3: Manually verify in the browser**

This task has no UI yet (Task 3 builds the screen that consumes it). Verify by opening the browser console on any existing screen, running `import("./js/stats.js").then(m => m.getOverviewStats(<a real profile id>)).then(console.log)`, and confirming the shape matches the Interfaces section above.

If no browser tool is available, instead verify statically: `node --check js/charts.js` and `node --check js/stats.js`. Manually trace `getOverviewStats` against a hand-constructed example: 3 logs with `waterMl` 1000/2000/3000 → `avgWaterMl` must be 2000; a log with no `activities` and one with `activities: [{}]` → `activityDayCount` must be 1; confirm `windowStart` is computed as exactly 29 days before today (so the window is 30 days inclusive of today) using `addDaysISO(today, -29)`. Note in your report that live-browser verification is deferred.

- [ ] **Step 4: Commit**

```bash
git add js/charts.js js/stats.js
git commit -m "Phase 2: SVG-Liniendiagramm und Statistik-Aggregation für die Übersicht"
```

---

### Task 3: Übersicht-Tab — Statistik-Bildschirm

**Files:**
- Create: `js/views/overviewView.js`
- Modify: `js/app.js`
- Modify: `css/styles.css`

**Interfaces:**
- Consumes: `getOverviewStats` from `js/stats.js`; `renderLineChart` from `js/charts.js` (both from Task 2); `SCHLAF_QUALITAET` from `js/dailyLog.js` (already exists); `ICON_WATER`, `ICON_ACTIVITY`, `ICON_SLEEP` from `js/icons.js` (already exist); `escapeHtml` from `js/escapeHtml.js` (already exists).
- Produces: `renderOverviewView(container, headerContainer, profile)` — an exported async function, no callback (this tab has no further navigation of its own).

- [ ] **Step 1: Create the overview view module**

Create `js/views/overviewView.js`:

```js
// Bildschirm: Übersicht mit aggregierten Kennzahlen der letzten 30 Tage.
import { getOverviewStats } from "../stats.js";
import { renderLineChart } from "../charts.js";
import { SCHLAF_QUALITAET } from "../dailyLog.js";
import { ICON_WATER, ICON_ACTIVITY, ICON_SLEEP } from "../icons.js";
import { escapeHtml } from "../escapeHtml.js";

export async function renderOverviewView(container, headerContainer, profile) {
  headerContainer.innerHTML = `<h1 style="font-family:var(--font-headline);font-size:var(--font-size-display);color:#fff;">Übersicht</h1>`;

  const stats = await getOverviewStats(profile.id);

  const avgSleepLabel = stats.avgSleepQuality != null
    ? closestSchlafLabel(stats.avgSleepQuality)
    : "Keine Daten";

  container.innerHTML = `
    <div class="section-card">
      <h3>Letzte ${stats.windowDays} Tage für ${escapeHtml(profile.name)}</h3>
      <p class="overview-subtext">${stats.totalDaysLogged} Tag(e) mit Einträgen</p>
    </div>
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

function closestSchlafLabel(avg) {
  const rounded = Math.round(avg);
  const match = SCHLAF_QUALITAET.find((opt) => opt.value === rounded);
  return `${match.emoji} ${match.label} (Ø ${avg.toFixed(1)})`;
}
```

(`avgSleepLabel` is built from `SCHLAF_QUALITAET`'s fixed emoji/label enum, not user text — but it is still passed through `escapeHtml` here for defense-in-depth consistency with every other interpolation in this template; this matches no existing precedent of skipping escaping on enum-derived strings inside a *new* file, so do it uniformly.)

- [ ] **Step 2: Wire the Übersicht tab into the router**

In `js/app.js`, add the import:

```js
import { renderCalendarView } from "./views/calendarView.js";
```

becomes:

```js
import { renderCalendarView } from "./views/calendarView.js";
import { renderOverviewView } from "./views/overviewView.js";
```

Replace the `#nav-chart` line inside `renderBottomNav`:

```js
    <button class="nav-item" id="nav-chart" disabled aria-label="Übersicht (bald verfügbar)">${ICON_CHART}<span>Übersicht</span></button>
```

with:

```js
    <button class="nav-item ${activeTab === "chart" ? "active" : ""}" id="nav-chart" aria-label="Übersicht">${ICON_CHART}<span>Übersicht</span></button>
```

and add a wiring line right after the existing `#nav-calendar` wiring line inside the same function:

```js
  bottomNavEl.querySelector("#nav-calendar").addEventListener("click", showCalendar);
```

becomes:

```js
  bottomNavEl.querySelector("#nav-calendar").addEventListener("click", showCalendar);
  bottomNavEl.querySelector("#nav-chart").addEventListener("click", showOverview);
```

Add a new `showOverview` function, after the `showCalendar` function added in Task 1:

```js
function showOverview() {
  renderBottomNav("chart");
  renderOverviewView(contentEl, headerEl, state.currentProfile);
}
```

- [ ] **Step 3: Add overview styles**

In `css/styles.css`, append:

```css
/* Übersicht-Ansicht */
.overview-subtext {
  color: var(--color-text-muted);
  font-size: var(--font-size-label);
  margin: 0;
}

.overview-stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
}

.overview-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  text-align: center;
}

.overview-stat-icon {
  color: var(--color-primary);
}

.overview-stat-value {
  font-family: var(--font-headline);
  font-size: var(--font-size-card-title);
  color: var(--color-secondary);
}

.overview-stat-label {
  font-size: var(--font-size-label);
  color: var(--color-text-muted);
}

.chart-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.line-chart {
  width: 100%;
  height: auto;
}

.chart-axis-labels {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-label);
  color: var(--color-text-muted);
}

.chart-empty {
  color: var(--color-text-muted);
  font-size: var(--font-size-body);
  margin: 0;
}
```

- [ ] **Step 4: Manually verify in the browser**

Run `npx serve . -l 3000`, log water/sleep-quality/weight/mood values across at least 2 different days for one profile, then tap "Übersicht". Expected: the three stat tiles show sensible averages/counts, and the weight and mood charts each render a line connecting your logged values (or the "Noch nicht genug Daten" message if fewer than 2 days have that value).

If no browser tool is available, instead verify statically: `node --check js/views/overviewView.js` and `node --check js/app.js`; confirm via grep that every key read off `stats` in the template (`avgWaterMl`, `activityDayCount`, `avgSleepQuality`, `weightPoints`, `moodPoints`, `totalDaysLogged`, `windowDays`) is actually present in `getOverviewStats`'s return shape from Task 2's `js/stats.js`. Note in your report that live-browser verification is deferred.

- [ ] **Step 5: Commit**

```bash
git add js/views/overviewView.js js/app.js css/styles.css
git commit -m "Phase 2: Übersicht-Tab mit Statistik-Kacheln und Verlaufsdiagrammen"
```

---

### Task 4: Tagesbericht — Tageszusammenfassung im Tagesprotokoll

**Files:**
- Modify: `js/views/dailyLogView.js`
- Modify: `css/styles.css`

**Interfaces:**
- Consumes: existing module-scope items in `js/views/dailyLogView.js` (`log`, `container`, `persist`, `MEAL_SLOT_EMOJIS`, `MEAL_SLOT_LABELS`, `SCHLAF_QUALITAET`, `WATER_GOAL_ML`, `ICON_WATER`, `ICON_SLEEP`, `ICON_WEIGHT`, `ICON_ACTIVITY`, `ICON_NOTE`, `escapeHtml` — all already imported/defined in this file).
- Produces: a `#daily-summary` element refreshed by a new `updateDailySummary()` function, called from `persist()`. No new exports.

- [ ] **Step 1: Add the daily-summary template function**

In `js/views/dailyLogView.js`, add this function after `mealCardHtml` and before `activityRowHtml`:

```js
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

  return `
    <ul class="daily-summary-list">
      ${mealsHtml}
      <li>${ICON_WATER} <strong>Wasser:</strong> ${log.waterMl || 0} / ${WATER_GOAL_ML} ml</li>
      <li>${ICON_SLEEP} <strong>Schlaf:</strong> ${log.sleep.stunden != null ? `${log.sleep.stunden} Std` : "Keine Angabe"}${sleepQualityOpt ? `, ${sleepQualityOpt.emoji} ${escapeHtml(sleepQualityOpt.label)}` : ""}</li>
      <li>${ICON_WEIGHT} <strong>Gewicht:</strong> ${log.weightKg != null ? `${log.weightKg} kg` : "Keine Angabe"}</li>
      ${activityLine}
      <li><strong>Alkohol:</strong> ${log.alcohol.getrunken ? `Ja${log.alcohol.info ? ` (${escapeHtml(log.alcohol.info)})` : ""}` : "Nein"}</li>
      <li>${ICON_NOTE} <strong>Notizen:</strong> ${log.notes ? escapeHtml(log.notes) : "–"}</li>
    </ul>
  `;
}
```

- [ ] **Step 2: Render the summary card**

In `renderDailyLogView`'s `container.innerHTML` template, the current first line is:

```js
  container.innerHTML = `
    ${Object.entries(log.meals).map(([slot, meal]) => mealCardHtml(slot, meal)).join("")}
```

Insert a new card immediately before it, so the template becomes:

```js
  container.innerHTML = `
    <div class="section-card">
      <h3>Tagesbericht</h3>
      <div id="daily-summary">${dailySummaryHtml(log)}</div>
    </div>
    ${Object.entries(log.meals).map(([slot, meal]) => mealCardHtml(slot, meal)).join("")}
```

- [ ] **Step 3: Refresh the summary on every save**

Replace the `persist` function:

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

with:

```js
  function updateDailySummary() {
    container.querySelector("#daily-summary").innerHTML = dailySummaryHtml(log);
  }

  async function persist() {
    updateDailySummary();
    try {
      await saveDailyLog(log);
      showToast("Gespeichert ✓");
    } catch (err) {
      // saveDailyLog hat bereits einen Fehler-Toast angezeigt.
    }
  }
```

(`updateDailySummary` runs before the `await` so the summary reflects the just-made change immediately, without waiting on the IndexedDB write.)

- [ ] **Step 4: Add daily-summary styles**

In `css/styles.css`, append:

```css
/* Tagesbericht */
.daily-summary-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-size: var(--font-size-body);
}

.daily-summary-list li {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
}

.daily-summary-list svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--color-secondary);
}
```

- [ ] **Step 5: Manually verify in the browser**

Run `npx serve . -l 3000`, open a profile's daily log. Expected: a "Tagesbericht" card at the very top showing "Noch keine Mahlzeit eingetragen.", "Wasser: 0 / 4000 ml", "Schlaf: Keine Angabe", "Gewicht: Keine Angabe", "Aktivität: Keine Aktivität eingetragen.", "Alkohol: Nein", "Notizen: –". Fill in a meal's "Was gegessen" and blur the field: the Tagesbericht card updates immediately to show that meal, without needing a page reload.

If no browser tool is available, instead verify statically: `node --check js/views/dailyLogView.js`; confirm via grep that `#daily-summary` appears exactly twice (the container element and the one `querySelector` in `updateDailySummary`), and manually trace `dailySummaryHtml` against a hand-built example log object (one meal filled in, water at 600, sleep stunden 7 and qualitaet 2, weightKg 70.5, one activity with dauerMin 30, alcohol.getrunken true with info "1 Bier", notes "Guter Tag") to confirm every line renders the expected text with no `undefined`. Note in your report that live-browser verification is deferred.

- [ ] **Step 6: Commit**

```bash
git add js/views/dailyLogView.js css/styles.css
git commit -m "Phase 2: Tagesbericht-Karte mit Live-Zusammenfassung aller Einträge"
```

---

### Task 5: Kalorien-Feld pro Mahlzeit mit Tagessumme

**Files:**
- Modify: `js/dailyLog.js`
- Modify: `js/views/dailyLogView.js`
- Modify: `css/styles.css`

**Interfaces:**
- Produces: `emptyMeal()`'s return shape gains a `kalorien: number|null` field. No new exports.

- [ ] **Step 1: Extend the meal data model**

In `js/dailyLog.js`, replace the `emptyMeal` function:

```js
function emptyMeal() {
  return { zeit: "", was: "", getraenk: "", portion: "", saettigung: null, gefuehlVorher: null, gefuehlNachher: null };
}
```

with:

```js
function emptyMeal() {
  return { zeit: "", was: "", getraenk: "", portion: "", saettigung: null, gefuehlVorher: null, gefuehlNachher: null, kalorien: null };
}
```

- [ ] **Step 2: Add the calories field to the meal accordion**

In `js/views/dailyLogView.js`, in `mealCardHtml`, the current "Getränk" field block is followed directly by the "Portionsgröße" field:

```js
        <div class="field">
          <label for="${slot}-getraenk">Getränk</label>
          <input id="${slot}-getraenk" type="text" value="${escapeHtml(meal.getraenk || "")}">
        </div>
        <div class="field">
          <label>Portionsgröße</label>
```

Insert a new field between them, so it becomes:

```js
        <div class="field">
          <label for="${slot}-getraenk">Getränk</label>
          <input id="${slot}-getraenk" type="text" value="${escapeHtml(meal.getraenk || "")}">
        </div>
        <div class="field">
          <label for="${slot}-kalorien">Kalorien (optional)</label>
          <input id="${slot}-kalorien" type="number" min="0" inputmode="numeric" value="${meal.kalorien ?? ""}">
        </div>
        <div class="field">
          <label>Portionsgröße</label>
```

- [ ] **Step 3: Wire the calories field and the daily total card**

In `renderDailyLogView`, the per-slot wiring loop currently has:

```js
    card.querySelector(`#${slot}-getraenk`).addEventListener("change", (e) => { log.meals[slot].getraenk = e.target.value; persist(); });
```

Add a line right after it:

```js
    card.querySelector(`#${slot}-getraenk`).addEventListener("change", (e) => { log.meals[slot].getraenk = e.target.value; persist(); });
    card.querySelector(`#${slot}-kalorien`).addEventListener("change", (e) => { log.meals[slot].kalorien = e.target.value ? Number(e.target.value) : null; persist(); });
```

Add a `kcalTotalHtml` function after `dailySummaryHtml` and before `activityRowHtml`:

```js
function kcalTotalHtml(log) {
  const total = Object.values(log.meals).reduce((sum, meal) => sum + (meal.kalorien || 0), 0);
  return `<h3>Kalorien heute</h3><p class="kcal-total-value">${total} kcal</p>`;
}
```

In the `container.innerHTML` template, the meal cards are immediately followed by the water card:

```js
    ${Object.entries(log.meals).map(([slot, meal]) => mealCardHtml(slot, meal)).join("")}
    <div class="section-card water-card">
```

Insert a new card between them:

```js
    ${Object.entries(log.meals).map(([slot, meal]) => mealCardHtml(slot, meal)).join("")}
    <div class="section-card" id="kcal-total-card">${kcalTotalHtml(log)}</div>
    <div class="section-card water-card">
```

Update `persist` to also refresh this card. Replace:

```js
  function updateDailySummary() {
    container.querySelector("#daily-summary").innerHTML = dailySummaryHtml(log);
  }

  async function persist() {
    updateDailySummary();
```

with:

```js
  function updateDailySummary() {
    container.querySelector("#daily-summary").innerHTML = dailySummaryHtml(log);
  }

  function updateMealKcalTotal() {
    container.querySelector("#kcal-total-card").innerHTML = kcalTotalHtml(log);
  }

  async function persist() {
    updateDailySummary();
    updateMealKcalTotal();
```

(If the exact text of `persist`'s current first line does not match verbatim — e.g. because Task 4 wrote it slightly differently — locate `async function persist()` and add the `updateMealKcalTotal();` call as the first statement inside its body, alongside the existing `updateDailySummary();` call.)

- [ ] **Step 4: Add calorie-total styles**

In `css/styles.css`, append:

```css
/* Kalorien-Tagessumme */
.kcal-total-value {
  font-family: var(--font-headline);
  font-size: var(--font-size-section-title);
  color: var(--color-secondary);
  margin: 0;
}
```

- [ ] **Step 5: Manually verify in the browser**

Run `npx serve . -l 3000`, open a profile's daily log, expand "Frühstück", enter 350 in "Kalorien (optional)" and blur. Expected: the new "Kalorien heute" card right below the meal cards shows "350 kcal". Enter 200 in "Mittag"'s calories field: the total updates to "550 kcal". Reload the page: both values persisted.

If no browser tool is available, instead verify statically: `node --check js/views/dailyLogView.js` and `node --check js/dailyLog.js`; confirm via grep that `#${slot}-kalorien` is emitted in the template and referenced in exactly one `addEventListener` call per slot, and manually trace `kcalTotalHtml` for meals `{kalorien: 350}, {kalorien: 200}, {kalorien: null}, {kalorien: null}, {kalorien: null}` to confirm it sums to 550 (not `NaN`, since `null` must fall through `|| 0`). Note in your report that live-browser verification is deferred.

- [ ] **Step 6: Commit**

```bash
git add js/dailyLog.js js/views/dailyLogView.js css/styles.css
git commit -m "Phase 2: Optionales Kalorien-Feld pro Mahlzeit mit Tagessumme"
```

---

### Task 6: Aktivität — Zustand als Emoji-Buttons statt Texteingabe

**Files:**
- Modify: `js/dailyLog.js`
- Modify: `js/views/dailyLogView.js`

**Interfaces:**
- Produces (new export from `js/dailyLog.js`): `AKTIVITAET_ZUSTAND: {value: string, emoji: string, label: string}[]`.
- `activity.zustand`'s value changes from arbitrary free text to one of `AKTIVITAET_ZUSTAND`'s four `value` strings (`"schlecht" | "okay" | "gut" | "super"`), or `""` when unset (matching the existing default set by the "Aktivität hinzufügen" button).

- [ ] **Step 1: Add the activity-state enum**

In `js/dailyLog.js`, add this export at the end of the file, after `WATER_GOAL_ML`:

```js
export const AKTIVITAET_ZUSTAND = [
  { value: "schlecht", emoji: "😫", label: "Schlecht" },
  { value: "okay", emoji: "😐", label: "Okay" },
  { value: "gut", emoji: "💪", label: "Gut" },
  { value: "super", emoji: "🔥", label: "Super" },
];
```

- [ ] **Step 2: Replace the Zustand text input with emoji buttons**

In `js/views/dailyLogView.js`, extend the import from `../dailyLog.js`:

```js
import {
  getDailyLog, saveDailyLog, MEAL_SLOT_LABELS, MEAL_SLOT_EMOJIS,
  PORTION_OPTIONS, GEFUEHL_VORHER, GEFUEHL_NACHHER, SCHLAF_QUALITAET, WATER_GOAL_ML,
} from "../dailyLog.js";
```

becomes:

```js
import {
  getDailyLog, saveDailyLog, MEAL_SLOT_LABELS, MEAL_SLOT_EMOJIS,
  PORTION_OPTIONS, GEFUEHL_VORHER, GEFUEHL_NACHHER, SCHLAF_QUALITAET, WATER_GOAL_ML, AKTIVITAET_ZUSTAND,
} from "../dailyLog.js";
```

Replace the `activityRowHtml` function:

```js
function activityRowHtml(index, activity) {
  return `
    <div class="field" data-activity-index="${index}" style="display:flex;gap:var(--space-2);align-items:flex-end;">
      <div style="flex:2;">
        <label for="activity-${index}-art">Art</label>
        <input id="activity-${index}-art" type="text" value="${escapeHtml(activity.art || "")}">
      </div>
      <div style="flex:1;">
        <label for="activity-${index}-dauer">Dauer (Min)</label>
        <input id="activity-${index}-dauer" type="number" min="0" value="${activity.dauerMin ?? ""}">
      </div>
      <div style="flex:1;">
        <label for="activity-${index}-zustand">Zustand</label>
        <input id="activity-${index}-zustand" type="text" value="${escapeHtml(activity.zustand || "")}">
      </div>
      <button type="button" class="btn btn-secondary" data-remove-activity="${index}" aria-label="Aktivität entfernen" style="flex:0;">${ICON_TRASH}</button>
    </div>
  `;
}
```

with:

```js
function activityRowHtml(index, activity) {
  return `
    <div class="field" data-activity-index="${index}">
      <div style="display:flex;gap:var(--space-2);align-items:flex-end;">
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
      <div style="margin-top:var(--space-2);">
        <label>Zustand</label>
        <div class="emoji-picker">${emojiPickerHtml(`zustand-${index}`, AKTIVITAET_ZUSTAND, activity.zustand)}</div>
      </div>
    </div>
  `;
}
```

(`emojiPickerHtml` is the existing helper already defined above `mealCardHtml` in this file — it is generic over any `{value, emoji, label}[]` options array, so it needs no changes.)

- [ ] **Step 3: Update the activity-row wiring**

In `wireActivityRow`, replace:

```js
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
```

with:

```js
  function wireActivityRow(index) {
    const row = container.querySelector(`[data-activity-index="${index}"]`);
    row.querySelector(`#activity-${index}-art`).addEventListener("change", (e) => { log.activities[index].art = e.target.value; persist(); });
    row.querySelector(`#activity-${index}-dauer`).addEventListener("change", (e) => { log.activities[index].dauerMin = e.target.value ? Number(e.target.value) : null; persist(); });
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
```

- [ ] **Step 4: Manually verify in the browser**

Run `npx serve . -l 3000`, open a profile's daily log, tap "Aktivität hinzufügen", fill in "Art" and "Dauer", then tap the "💪 Gut" emoji button under "Zustand". Expected: only that button highlights. Reload the page: the activity row reappears with "💪 Gut" still highlighted (and no other Zustand button selected).

If no browser tool is available, instead verify statically: `node --check js/dailyLog.js` and `node --check js/views/dailyLogView.js`; confirm via grep that `#activity-${index}-zustand` no longer appears anywhere in the file (the old text input and its listener are fully removed) and that `data-emoji-group="zustand-${index}"` is emitted by the template and consumed by exactly one `querySelectorAll` in `wireActivityRow`. Note in your report that live-browser verification is deferred.

- [ ] **Step 5: Commit**

```bash
git add js/dailyLog.js js/views/dailyLogView.js
git commit -m "Phase 2: Aktivität-Zustand als Emoji-Buttons statt Texteingabe"
```
