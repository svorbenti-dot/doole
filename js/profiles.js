// Fachlogik für Familienprofile. Kennt nur Daten, keine UI.
import { putItem, getAllItems, deleteItem } from "./db.js";
import { showToast } from "./toast.js";
import { calculateCalorieTargets } from "./calorieCalc.js";

export async function createProfile({
  name, color, icon,
  age = null, heightCm = null, weightKg = null, gender = null, activityLevel = null,
}) {
  try {
    const targets = calculateCalorieTargets({ weightKg, heightCm, age, gender, activityLevel });
    return await putItem("profiles", {
      name, color, icon, createdAt: Date.now(),
      age, heightCm, weightKg, gender, activityLevel,
      bmr: targets ? targets.bmr : null,
      tdee: targets ? targets.tdee : null,
      calorieGoal: targets ? targets.calorieGoal : null,
    });
  } catch (err) {
    showToast("Profil konnte nicht angelegt werden.", "error");
    throw err;
  }
}

export async function updateProfile(profile) {
  try {
    return await putItem("profiles", profile);
  } catch (err) {
    showToast("Profil konnte nicht gespeichert werden.", "error");
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
