// Speichert die gewählte Sport-Unteransicht (Home Training / Fitness Studio)
// sowie das Start-Datum des 90-Tage-Plans in IndexedDB, damit beides
// App-Neustarts überlebt.
import { putItem, getItem } from "./db.js";
import { todayISO } from "./calendar.js";

export async function getSportTab(profileId) {
  const record = await getItem("settings", `sportTab_${profileId}`);
  return record ? record.value : "home";
}

export async function setSportTab(profileId, value) {
  await putItem("settings", { id: `sportTab_${profileId}`, value });
}

// Legt beim allerersten Aufruf das Start-Datum des 90-Tage-Plans fest
// und gibt es danach unverändert zurück.
export async function ensureTrainingStartDate(profileId) {
  const record = await getItem("settings", `trainingStartDate_${profileId}`);
  if (record) return record.value;
  const startISO = todayISO();
  await putItem("settings", { id: `trainingStartDate_${profileId}`, value: startISO });
  return startISO;
}

// Gesundheits-Hinweis im Sport-Tab: nur beim allerersten Öffnen anzeigen.
export async function hasSeenHealthDisclaimer(profileId) {
  const record = await getItem("settings", `healthDisclaimerShown_${profileId}`);
  return !!record;
}

export async function markHealthDisclaimerSeen(profileId) {
  await putItem("settings", { id: `healthDisclaimerShown_${profileId}`, value: true });
}
