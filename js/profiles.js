// Fachlogik für Familienprofile. Kennt nur Daten, keine UI.
import { putItem, getAllItems, deleteItem } from "./db.js";
import { showToast } from "./toast.js";

export async function createProfile({ name, color, icon }) {
  try {
    return await putItem("profiles", { name, color, icon, createdAt: Date.now() });
  } catch (err) {
    showToast("Profil konnte nicht angelegt werden.", "error");
    throw err;
  }
}

export async function getAllProfiles() {
  try {
    return await getAllItems("profiles");
  } catch (err) {
    showToast("Profile konnten nicht geladen werden.", "error");
    return [];
  }
}

export async function deleteProfile(id) {
  try {
    await deleteItem("profiles", id);
  } catch (err) {
    showToast("Profil konnte nicht gelöscht werden.", "error");
    throw err;
  }
}
