// Persönliche Essen-Datenbank: merkt sich pro Gericht den Kalorienwert bei
// "Klein" (Faktor 1.0) und rechnet daraus Mittel (1.4) und Groß (2.0) hoch.
import { putItem, getAllItems } from "./db.js";

export const PORTION_FACTORS = { klein: 1.0, mittel: 1.4, gross: 2.0 };

function normalizeFoodKey(name) {
  return name.trim().toLowerCase();
}

// Speichert/aktualisiert einen Eintrag, sobald Name, Portionsgröße und
// Kalorien vorhanden sind. Die Kalorien werden auf die Basisgröße "Klein"
// zurückgerechnet, damit alle drei Größen daraus ableitbar sind.
export async function saveFoodDatabaseEntry(name, portion, kalorien) {
  const factor = PORTION_FACTORS[portion];
  if (!name || !name.trim() || !factor || kalorien == null) return;
  const id = normalizeFoodKey(name);
  if (!id) return;
  const baseKcal = Math.round(kalorien / factor);
  await putItem("foodDatabase", { id, name: name.trim(), baseKcal, updatedAt: Date.now() });
}

// Liefert bis zu 5 Treffer, deren Name die Suche enthält (Autocomplete).
export async function searchFoodDatabase(query) {
  const q = normalizeFoodKey(query);
  if (!q) return [];
  const all = await getAllItems("foodDatabase");
  return all.filter((f) => f.id.includes(q)).slice(0, 5);
}

// Liefert die Kalorien für Klein/Mittel/Groß ausgehend vom Basiswert (Klein).
export function foodSizeOptions(baseKcal) {
  return Object.entries(PORTION_FACTORS).map(([value, factor]) => ({
    value,
    kcal: Math.round(baseKcal * factor),
  }));
}
