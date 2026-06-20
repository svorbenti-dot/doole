// Einstiegspunkt der App: verwaltet den aktuellen Zustand (Profil, Datum)
// und schaltet zwischen den Bildschirmen (Views) um.
import { renderProfileSelect } from "./views/profileSelect.js";

const state = {
  currentProfile: null,
  currentDateISO: null,
};

const contentEl = document.getElementById("app-content");
const headerEl = document.getElementById("app-header");

export function showProfileSelect() {
  state.currentProfile = null;
  headerEl.innerHTML = `<h1 style="font-family:var(--font-headline);font-size:var(--font-size-display);color:#fff;">Doole</h1>`;
  renderProfileSelect(contentEl, (profile) => {
    state.currentProfile = profile;
    contentEl.innerHTML = `<p>Profil ausgewählt: ${profile.name}</p>`;
  });
}

showProfileSelect();
