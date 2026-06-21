// Fachlogik für Tagesprotokolle. Ein Eintrag pro Profil und Tag.
import { getItem, putItem } from "./db.js";
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
    alcohol: { getrunken: false, info: "" },
    supplements: "",
    activities: [],
    notes: "",
  };
}

export async function getDailyLog(profileId, dateISO) {
  try {
    const existing = await getItem("dailyLogs", `${profileId}_${dateISO}`);
    return existing || createEmptyDailyLog(profileId, dateISO);
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

export const SCHLAF_QUALITAET = [
  { value: 1, emoji: "😫", label: "Schlecht" },
  { value: 2, emoji: "😐", label: "Okay" },
  { value: 3, emoji: "😴", label: "Gut" },
];

export const WATER_GOAL_ML = 4000;
