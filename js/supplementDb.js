// Persönliche Supplements-Datenbank: merkt sich Namen bereits eingetragener
// Supplements für Autocomplete-Vorschläge bei künftigen Einträgen.
import { putItem, getAllItems } from "./db.js";

function normalizeSupplementKey(name) {
  return name.trim().toLowerCase();
}

// Speichert/aktualisiert einen Eintrag, sobald Name und Emoji-Bewertung
// vorhanden sind.
export async function saveSupplementDatabaseEntry(name) {
  if (!name || !name.trim()) return;
  const id = normalizeSupplementKey(name);
  if (!id) return;
  await putItem("supplementDatabase", { id, name: name.trim(), updatedAt: Date.now() });
}

// Liefert bis zu 5 Treffer, deren Name die Suche enthält (Autocomplete).
export async function searchSupplementDatabase(query) {
  const q = normalizeSupplementKey(query);
  if (!q) return [];
  const all = await getAllItems("supplementDatabase");
  return all.filter((s) => s.id.includes(q)).slice(0, 5);
}
