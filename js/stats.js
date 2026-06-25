// Aggregiert Tagesprotokolle eines Profils über die letzten 30 Tage zu
// Kennzahlen für die Übersicht-Ansicht.
import { getAllItems } from "./db.js";
import { addDaysISO, todayISO } from "./calendar.js";
import { activityKcalBurn, YOGA_KCAL_BURN, STEP_KCAL_PER_STEP, DAILY_DEFICIT_KCAL } from "./dailyLog.js";

const OVERVIEW_WINDOW_DAYS = 30;
const STEPS_KCAL_CAP = 800;

export async function getOverviewStats(profileId, calorieGoal, tdee) {
  const allLogs = await getAllItems("dailyLogs");
  const today = todayISO();
  const windowStart = addDaysISO(today, -(OVERVIEW_WINDOW_DAYS - 1));

  const logs = allLogs
    .filter((log) => log.profileId === profileId && log.date >= windowStart && log.date <= today)
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const waterValues = logs.filter((l) => l.waterMl != null).map((l) => l.waterMl);
  const avgWaterMl = waterValues.length ? Math.round(waterValues.reduce((a, b) => a + b, 0) / waterValues.length) : null;

  const activityDayCount = logs.filter((l) => l.activities && l.activities.length > 0).length;

  const meditationDayCount = logs.filter((l) => l.meditation && l.meditation.gemacht).length;

  const yogaDayCount = logs.filter((l) => l.yoga && l.yoga.gemacht).length;

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

  const tagesformPoints = logs
    .filter((l) => l.tagesform != null)
    .map((l) => ({ label: formatShortDate(l.date), value: l.tagesform }));

  const kcalDays = logs
    .map((l) => ({ date: l.date, kcal: dailyKcalTotal(l) }))
    .filter((entry) => entry.kcal !== null);

  const kcalPoints = kcalDays.map((entry) => ({ label: formatShortDate(entry.date), value: entry.kcal }));

  const avgKcalPerDay = kcalDays.length
    ? Math.round(kcalDays.reduce((a, b) => a + b.kcal, 0) / kcalDays.length)
    : null;

  const avgKcalDeficit = kcalDays.length && calorieGoal != null
    ? Math.round(kcalDays.reduce((a, b) => a + (calorieGoal - b.kcal), 0) / kcalDays.length)
    : null;

  const stepsValues = logs.filter((l) => l.steps != null).map((l) => l.steps);
  const avgStepsPerDay = stepsValues.length
    ? Math.round(stepsValues.reduce((a, b) => a + b, 0) / stepsValues.length)
    : null;

  const bestWeek = computeBestWeek(logs, tdee);

  return {
    windowDays: OVERVIEW_WINDOW_DAYS,
    avgWaterMl,
    activityDayCount,
    meditationDayCount,
    yogaDayCount,
    totalDaysLogged: logs.length,
    avgSleepQuality,
    weightPoints,
    moodPoints,
    tagesformPoints,
    avgKcalPerDay,
    avgKcalDeficit,
    kcalPoints,
    avgStepsPerDay,
    bestWeek,
  };
}

// Gleiche Tagesbedarf-Formel wie kcalTotalHtml()/streak.js: TDEE + Sport +
// Yoga + Schritte (gedeckelt) minus 500 kcal Defizit-Ziel.
function dayKcalGoal(log, tdee) {
  const activityBurn = (log.activities || []).reduce((sum, a) => sum + activityKcalBurn(a, log.date), 0);
  const yogaBurn = log.yoga?.gemacht ? YOGA_KCAL_BURN : 0;
  const stepsBurn = log.steps != null ? Math.min(STEPS_KCAL_CAP, Math.round(log.steps * STEP_KCAL_PER_STEP)) : 0;
  return tdee + activityBurn + yogaBurn + stepsBurn - DAILY_DEFICIT_KCAL;
}

// Montag der Kalenderwoche, in der das Datum liegt (als ISO-String).
function getWeekStartISO(dateISO) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const dayOfWeek = new Date(y, m - 1, d).getDay(); // 0=So..6=Sa
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  return addDaysISO(dateISO, -diffToMonday);
}

// Vergleicht alle Kalenderwochen im Zeitraum und liefert die mit den
// meisten erreichten Zielen (Sport-Tage + Defizit-Tage + Meditations-Tage).
function computeBestWeek(logs, tdee) {
  if (!logs.length) return null;

  const weeks = new Map();
  for (const log of logs) {
    const weekStart = getWeekStartISO(log.date);
    if (!weeks.has(weekStart)) {
      weeks.set(weekStart, { sportDays: 0, deficitDays: 0, meditationDays: 0, stepsValues: [] });
    }
    const week = weeks.get(weekStart);
    if (log.activities && log.activities.length > 0) week.sportDays += 1;
    if (log.meditation && log.meditation.gemacht) week.meditationDays += 1;
    if (log.steps != null) week.stepsValues.push(log.steps);
    if (tdee != null) {
      const eaten = dailyKcalTotal(log);
      if (eaten != null && eaten < dayKcalGoal(log, tdee)) {
        week.deficitDays += 1;
      }
    }
  }

  let best = null;
  for (const week of weeks.values()) {
    const score = week.sportDays + week.deficitDays + week.meditationDays;
    if (!best || score > best.score) {
      const avgSteps = week.stepsValues.length
        ? Math.round(week.stepsValues.reduce((a, b) => a + b, 0) / week.stepsValues.length)
        : null;
      best = { score, sportDays: week.sportDays, deficitDays: week.deficitDays, meditationDays: week.meditationDays, avgSteps };
    }
  }
  return best;
}

function dailyKcalTotal(log) {
  const kcalValues = Object.values(log.meals || {})
    .map((meal) => meal.kalorien)
    .filter((v) => v != null);
  if (kcalValues.length === 0) return null;
  return kcalValues.reduce((a, b) => a + b, 0);
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
