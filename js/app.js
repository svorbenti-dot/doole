// Einstiegspunkt der App: verwaltet den aktuellen Zustand (Profil, Datum)
// und schaltet zwischen den Bildschirmen (Views) um.
import { renderProfileSelect } from "./views/profileSelect.js";
import { renderDailyLogView } from "./views/dailyLogView.js";
import { renderSettingsView } from "./views/settingsView.js";
import { todayISO } from "./calendar.js";
import { ICON_HOME, ICON_CALENDAR, ICON_CHART, ICON_PROFILE } from "./icons.js";

const state = {
  currentProfile: null,
  currentDateISO: null,
};

const contentEl = document.getElementById("app-content");
const headerEl = document.getElementById("app-header");
const bottomNavEl = document.getElementById("app-bottom-nav");

function renderBottomNav(activeTab) {
  bottomNavEl.innerHTML = `
    <button class="nav-item ${activeTab === "home" ? "active" : ""}" id="nav-home" aria-label="Heute">${ICON_HOME}<span>Heute</span></button>
    <button class="nav-item" id="nav-calendar" disabled aria-label="Kalender (bald verfügbar)">${ICON_CALENDAR}<span>Kalender</span></button>
    <button class="nav-item" id="nav-chart" disabled aria-label="Übersicht (bald verfügbar)">${ICON_CHART}<span>Übersicht</span></button>
    <button class="nav-item ${activeTab === "settings" ? "active" : ""}" id="nav-settings" aria-label="Profil/Einstellungen">${ICON_PROFILE}<span>Profil</span></button>
  `;
  bottomNavEl.querySelector("#nav-home").addEventListener("click", showDailyLog);
  bottomNavEl.querySelector("#nav-settings").addEventListener("click", showSettings);
}

export function showProfileSelect() {
  state.currentProfile = null;
  bottomNavEl.innerHTML = "";
  headerEl.innerHTML = `<h1 style="font-family:var(--font-headline);font-size:var(--font-size-display);color:#fff;">Doole</h1>`;
  renderProfileSelect(contentEl, (profile) => {
    state.currentProfile = profile;
    state.currentDateISO = todayISO();
    showDailyLog();
  });
}

function showDailyLog() {
  renderBottomNav("home");
  renderDailyLogView(contentEl, headerEl, state.currentProfile, state.currentDateISO, (newDateISO) => {
    state.currentDateISO = newDateISO;
    showDailyLog();
  });
}

function showSettings() {
  renderBottomNav("settings");
  headerEl.innerHTML = `<h1 style="font-family:var(--font-headline);font-size:var(--font-size-display);color:#fff;">Einstellungen</h1>`;
  renderSettingsView(contentEl, state.currentProfile, {
    onProfileSwitch: (profile) => {
      state.currentProfile = profile;
      state.currentDateISO = todayISO();
      showDailyLog();
    },
    onAllProfilesDeleted: showProfileSelect,
  });
}

showProfileSelect();
