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
