// Export/Import aller Daten als JSON-Datei (Backup-Funktion).
import { getAllItems, putItem } from "./db.js";
import { showToast } from "./toast.js";

export async function exportAllData() {
  try {
    const profiles = await getAllItems("profiles");
    const dailyLogs = await getAllItems("dailyLogs");
    const settings = await getAllItems("settings");
    const foodDatabase = await getAllItems("foodDatabase");
    const supplementDatabase = await getAllItems("supplementDatabase");
    const payload = { exportedAt: new Date().toISOString(), profiles, dailyLogs, settings, foodDatabase, supplementDatabase };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `doole-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    showToast("Export fehlgeschlagen.", "error");
    throw err;
  }
}

export async function importAllData(jsonText) {
  try {
    const payload = JSON.parse(jsonText);
    for (const profile of payload.profiles || []) {
      await putItem("profiles", profile);
    }
    for (const log of payload.dailyLogs || []) {
      await putItem("dailyLogs", log);
    }
    for (const setting of payload.settings || []) {
      await putItem("settings", setting);
    }
    for (const food of payload.foodDatabase || []) {
      await putItem("foodDatabase", food);
    }
    for (const supplement of payload.supplementDatabase || []) {
      await putItem("supplementDatabase", supplement);
    }
  } catch (err) {
    showToast("Import fehlgeschlagen. Ist die Datei eine gültige Doole-Backup-Datei?", "error");
    throw err;
  }
}
