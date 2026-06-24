// Fachlogik für Tagesprotokolle. Ein Eintrag pro Profil und Tag.
import { getItem, putItem, getAllItems } from "./db.js";
import { showToast } from "./toast.js";

const MEAL_SLOTS = ["fruehstueck", "snack1", "mittag", "snack2", "abendbrot"];

function emptyMeal() {
  return { zeit: "", was: "", getraenk: "", portion: "", saettigung: null, gefuehlVorher: null, gefuehlNachher: null, kalorien: null };
}

export function createEmptyDailyLog(profileId, dateISO) {
  const meals = {};
  MEAL_SLOTS.forEach((slot) => {
    meals[slot] = emptyMeal();
  });

  return {
    id: `${profileId}_${dateISO}`,
    profileId,
    date: dateISO,
    meals,
    waterMl: null,
    sleep: { stunden: null, qualitaet: null },
    weightKg: null,
    steps: null,
    tagesform: null,
    alcohol: { getrunken: false, info: "" },
    supplements: [],
    activities: [],
    meditation: { gemacht: false, gefuehl: null, dauerMin: null },
    yoga: { gemacht: false, gefuehl: null, dauerMin: null },
    notes: "",
  };
}

function migrateSupplements(log) {
  if (typeof log.supplements === "string") {
    log.supplements = log.supplements.trim()
      ? [{ name: log.supplements, feeling: null }]
      : [];
  }
  return log;
}

function migrateMeditation(log) {
  if (!log.meditation) {
    log.meditation = { gemacht: false, gefuehl: null, dauerMin: null };
  }
  return log;
}

function migrateYoga(log) {
  if (!log.yoga) {
    log.yoga = { gemacht: false, gefuehl: null, dauerMin: null };
  }
  return log;
}

function migrateSteps(log) {
  if (log.steps === undefined) {
    log.steps = null;
  }
  return log;
}

function migrateTagesform(log) {
  if (log.tagesform === undefined) {
    log.tagesform = null;
  }
  return log;
}

export async function getDailyLog(profileId, dateISO) {
  try {
    const existing = await getItem("dailyLogs", `${profileId}_${dateISO}`);
    return existing ? migrateTagesform(migrateSteps(migrateYoga(migrateMeditation(migrateSupplements(existing))))) : createEmptyDailyLog(profileId, dateISO);
  } catch (err) {
    showToast("Tagesprotokoll konnte nicht geladen werden.", "error");
    return createEmptyDailyLog(profileId, dateISO);
  }
}

export async function saveDailyLog(log) {
  try {
    await putItem("dailyLogs", log);
  } catch (err) {
    showToast("Speichern fehlgeschlagen, bitte erneut versuchen.", "error");
    throw err;
  }
}

export const MEAL_SLOT_LABELS = {
  fruehstueck: "Frühstück",
  snack1: "Snack",
  mittag: "Mittag",
  snack2: "Snack",
  abendbrot: "Abendbrot",
};

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

export const TAGESFORM_OPTIONS = [
  { value: 1, emoji: "😴", label: "Müde" },
  { value: 2, emoji: "😐", label: "Okay" },
  { value: 3, emoji: "🙂", label: "Gut" },
  { value: 4, emoji: "💪", label: "Top" },
  { value: 5, emoji: "🔥", label: "Energiegeladen" },
];

export const SCHLAF_QUALITAET = [
  { value: 1, emoji: "😫", label: "Schlecht" },
  { value: 2, emoji: "😐", label: "Okay" },
  { value: 3, emoji: "😴", label: "Gut" },
];

export const WATER_GOAL_ML = 4000;

// Geschätzter Kalorienverbrauch, der zum Tagesziel addiert wird: pro
// geloggter Trainingseinheit (Sport-Tab-Session, ca. 20 Min) und pro
// Yoga-Einheit am Tag. So darf man mehr essen, je mehr man trainiert.
// Fallback-Wert für Aktivitäten ohne erkennbaren Trainingstag (z.B. frei
// eingetragene Aktivitäten wie "Spazieren").
export const ACTIVITY_KCAL_PER_SESSION = 150;
export const YOGA_KCAL_BURN = 80;
export const STEP_KCAL_PER_STEP = 0.04;

// Kalorienverbrauch je Trainingstag/-fokus (Sport-Tab-Session, ca. 20 Min).
export const ACTIVITY_KCAL_BY_FOCUS = {
  "Beine & Po": 180,
  "Brust & Arme": 150,
  "Rücken & Mobilität": 80,
  "Bauch & Ganzkörper": 200,
};

// Ermittelt den Kalorienverbrauch einer Aktivität anhand ihres Trainingstags
// (z.B. "Beine & Po (Home Training)"). Ohne erkennbaren Fokus gilt der
// pauschale Fallback-Wert.
export function activityKcalBurn(activity) {
  const focus = Object.keys(ACTIVITY_KCAL_BY_FOCUS).find(
    (f) => activity.art && activity.art.includes(f)
  );
  return focus ? ACTIVITY_KCAL_BY_FOCUS[focus] : ACTIVITY_KCAL_PER_SESSION;
}

export const AKTIVITAET_ZUSTAND = [
  { value: "schlecht", emoji: "😫", label: "Schlecht" },
  { value: "okay", emoji: "😐", label: "Okay" },
  { value: "gut", emoji: "💪", label: "Gut" },
  { value: "super", emoji: "🔥", label: "Super" },
];

export const SUPPLEMENT_GEFUEHL = [
  { value: "neutral", emoji: "😐", label: "Neutral" },
  { value: "besser", emoji: "😊", label: "Besser" },
  { value: "viel_besser", emoji: "💪", label: "Viel besser" },
  { value: "muede", emoji: "😴", label: "Müde" },
  { value: "schlecht", emoji: "🤢", label: "Schlecht" },
];

export const MEDITATION_GEFUEHL = [
  { value: "entspannt", emoji: "😌", label: "Entspannt" },
  { value: "gut", emoji: "🙂", label: "Gut" },
  { value: "neutral", emoji: "😐", label: "Neutral" },
  { value: "unruhig", emoji: "😟", label: "Unruhig" },
];

export const YOGA_GEFUEHL = [
  { value: "entspannt", emoji: "😌", label: "Entspannt" },
  { value: "gestaerkt", emoji: "💪", label: "Gestärkt" },
  { value: "gut", emoji: "🙂", label: "Gut" },
  { value: "neutral", emoji: "😐", label: "Neutral" },
];

export async function getLatestWeightEntry(profileId) {
  const allLogs = await getAllItems("dailyLogs");
  const withWeight = allLogs
    .filter((log) => log.profileId === profileId && log.weightKg != null)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  return withWeight.length ? { date: withWeight[0].date, weightKg: withWeight[0].weightKg } : null;
}
