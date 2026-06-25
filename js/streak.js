// Berechnet die aktuelle "Tage in Folge im Kaloriendefizit"-Serie eines
// Profils und speichert den Wert in IndexedDB (Store "settings").
import { getAllItems, putItem } from "./db.js";
import { addDaysISO, todayISO } from "./calendar.js";
import { activityKcalBurn, YOGA_KCAL_BURN, STEP_KCAL_PER_STEP, DAILY_DEFICIT_KCAL } from "./dailyLog.js";
import { celebrateMilestoneOnce } from "./milestones.js";

function dayKcalEaten(log) {
  const values = Object.values(log.meals || {})
    .map((meal) => meal.kalorien)
    .filter((v) => v != null);
  return values.length ? values.reduce((a, b) => a + b, 0) : null;
}

// Gleiche Berechnung wie kcalTotalHtml() in dailyLogView.js: TDEE + Sport +
// Yoga + Schritte (mit 800-kcal-Deckel) als Tagesbedarf, davon minus 500 als
// Defizit-Ziel - damit Streak und Kalorien-Karte konsistent sind.
function dayKcalGoal(log, tdee) {
  const activityBurn = (log.activities || []).reduce((sum, activity) => sum + activityKcalBurn(activity, log.date), 0);
  const yogaBurn = log.yoga?.gemacht ? YOGA_KCAL_BURN : 0;
  const stepsBurn = log.steps != null ? Math.min(800, Math.round(log.steps * STEP_KCAL_PER_STEP)) : 0;
  const tagesbedarf = tdee + activityBurn + yogaBurn + stepsBurn;
  return tagesbedarf - DAILY_DEFICIT_KCAL;
}

// Zählt rückwärts ab heute, wie viele Tage in Folge im Defizit waren.
// Der heutige Tag bricht die Serie nicht ab, wenn noch keine Kalorien
// eingetragen sind (er wird einfach übersprungen, nicht gewertet).
export async function computeAndSaveDeficitStreak(profileId, tdee) {
  if (tdee == null) return 0;

  const allLogs = await getAllItems("dailyLogs");
  const byDate = new Map(
    allLogs.filter((log) => log.profileId === profileId).map((log) => [log.date, log])
  );

  let streak = 0;
  let day = todayISO();
  let isToday = true;

  while (true) {
    const log = byDate.get(day);
    const eaten = log ? dayKcalEaten(log) : null;

    if (eaten != null) {
      if (eaten < dayKcalGoal(log, tdee)) {
        streak += 1;
        day = addDaysISO(day, -1);
        isToday = false;
        continue;
      }
      break;
    }

    if (isToday) {
      day = addDaysISO(day, -1);
      isToday = false;
      continue;
    }
    break;
  }

  await putItem("settings", { id: `streak_${profileId}`, value: streak });

  if (streak >= 7) {
    await celebrateMilestoneOnce(profileId, "streak_7", "7 Tage in Folge im Kaloriendefizit! Starke Leistung!");
  }
  if (streak >= 30) {
    await celebrateMilestoneOnce(profileId, "streak_30", "30 Tage in Folge im Kaloriendefizit! Unglaubliche Disziplin!");
  }

  return streak;
}
