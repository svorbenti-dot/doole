// Einmalige Erfolgs-Meilensteine (erstes Training, Streak-Tage, Gewichts-
// Schritte). Welche Meilensteine ein Profil schon gesehen hat, wird in
// IndexedDB (Store "settings") gespeichert, damit jeder nur einmal als
// Glückwunsch-Toast erscheint.
import { getItem, putItem } from "./db.js";
import { showToast } from "./toast.js";

function settingsKey(profileId) {
  return `milestones_${profileId}`;
}

async function getShownMilestones(profileId) {
  const record = await getItem("settings", settingsKey(profileId));
  return record ? record.shown : [];
}

// Zeigt einen Meilenstein-Toast genau einmal pro Profil und Meilenstein-ID.
// Gibt true zurück, wenn der Meilenstein dadurch gerade neu gefeiert wurde.
export async function celebrateMilestoneOnce(profileId, milestoneId, message) {
  const shown = await getShownMilestones(profileId);
  if (shown.includes(milestoneId)) return false;

  shown.push(milestoneId);
  await putItem("settings", { id: settingsKey(profileId), shown });
  showToast(`🎉 ${message}`);
  return true;
}

// Liefert den nächsten 5-kg-Schritt, den ein Gewicht gerade unterschritten
// hat (z.B. 109 kg -> "unter 110 kg").
export function weightStepMilestone(weightKg) {
  let threshold = Math.ceil(weightKg / 5) * 5;
  if (threshold <= weightKg) threshold += 5;
  return { id: `weight_under_${threshold}`, threshold };
}
