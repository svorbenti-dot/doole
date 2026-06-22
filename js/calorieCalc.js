// Reine Berechnungslogik für Kalorienziele nach Mifflin-St-Jeor. Keine UI, kein DB-Zugriff.

export const GENDER_OPTIONS = [
  { value: "mann", label: "Mann" },
  { value: "frau", label: "Frau" },
];

export const ACTIVITY_LEVELS = [
  { value: "sitzend", label: "Sitzend", factor: 1.2 },
  { value: "leicht_aktiv", label: "Leicht aktiv", factor: 1.375 },
  { value: "aktiv", label: "Aktiv", factor: 1.55 },
  { value: "sehr_aktiv", label: "Sehr aktiv", factor: 1.725 },
];

export function calculateCalorieTargets({ weightKg, heightCm, age, gender, activityLevel }) {
  if (weightKg == null || heightCm == null || age == null || gender == null || activityLevel == null) {
    return null;
  }

  const activity = ACTIVITY_LEVELS.find((opt) => opt.value === activityLevel);
  if (!activity) return null;

  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr = gender === "mann" ? base + 5 : base - 161;
  const tdee = bmr * activity.factor;
  const calorieGoal = tdee - 500;

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calorieGoal: Math.round(calorieGoal),
  };
}
