// Zeigt kurze Hinweis-Meldungen am unteren Bildschirmrand an (z.B. Fehler).
// Wird automatisch nach 4 Sekunden wieder entfernt.
export function showToast(message, type = "info") {
  const root = document.getElementById("toast-root");
  const el = document.createElement("div");
  el.className = type === "error" ? "toast toast-error" : "toast";
  el.textContent = message;
  root.appendChild(el);
  setTimeout(() => {
    el.remove();
  }, 4000);
}
