// Speichert die gewählte Sport-Unteransicht (Home Training / Fitness Studio)
// sowie das Start-Datum des 90-Tage-Plans in IndexedDB, damit beides
// App-Neustarts überlebt.
import { putItem, getItem } from "./db.js";
import { todayISO } from "./calendar.js";

const SPORT_TAB_KEY = "sportTab";
const TRAINING_START_KEY = "trainingStartDate";

export async function getSportTab() {
  const record = await getItem("settings", SPORT_TAB_KEY);
  return record ? record.value : "home";
}

export async function setSportTab(value) {
  await putItem("settings", { id: SPORT_TAB_KEY, value });
}

// Legt beim allerersten Aufruf das Start-Datum des 90-Tage-Plans fest
// und gibt es danach unverändert zurück.
export async function ensureTrainingStartDate() {
  const record = await getItem("settings", TRAINING_START_KEY);
  if (record) return record.value;
  const startISO = todayISO();
  await putItem("settings", { id: TRAINING_START_KEY, value: startISO });
  return startISO;
}
