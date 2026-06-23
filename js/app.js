// Einstiegspunkt der App: verwaltet den aktuellen Zustand (Profil, Datum)
// und schaltet zwischen den Bildschirmen (Views) um.
import { renderProfileSelect } from "./views/profileSelect.js";
import { renderDailyLogView } from "./views/dailyLogView.js";
import { renderCalendarView } from "./views/calendarView.js";
import { renderOverviewView } from "./views/overviewView.js";
import { renderSettingsView } from "./views/settingsView.js";
import { renderSportView } from "./views/sportView.js";
import { stopActiveWorkoutSession } from "./views/workoutPlayerView.js";
import { todayISO } from "./calendar.js";
import { ICON_HOME, ICON_CALENDAR, ICON_CHART, ICON_PROFILE, ICON_SPORT } from "./icons.js";

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
    <button class="nav-item ${activeTab === "sport" ? "active" : ""}" id="nav-sport" aria-label="Sport">${ICON_SPORT}<span>Sport</span></button>
    <button class="nav-item ${activeTab === "calendar" ? "active" : ""}" id="nav-calendar" aria-label="Kalender">${ICON_CALENDAR}<span>Kalender</span></button>
    <button class="nav-item ${activeTab === "chart" ? "active" : ""}" id="nav-chart" aria-label="Übersicht">${ICON_CHART}<span>Übersicht</span></button>
    <button class="nav-item ${activeTab === "settings" ? "active" : ""}" id="nav-settings" aria-label="Profil/Einstellungen">${ICON_PROFILE}<span>Profil</span></button>
  `;
  bottomNavEl.querySelector("#nav-home").addEventListener("click", showDailyLog);
  bottomNavEl.querySelector("#nav-sport").addEventListener("click", showSport);
  bottomNavEl.querySelector("#nav-calendar").addEventListener("click", showCalendar);
  bottomNavEl.querySelector("#nav-chart").addEventListener("click", showOverview);
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
  stopActiveWorkoutSession();
  renderBottomNav("home");
  renderDailyLogView(contentEl, headerEl, state.currentProfile, state.currentDateISO, (newDateISO) => {
    state.currentDateISO = newDateISO;
    showDailyLog();
  });
}

function showSport() {
  renderBottomNav("sport");
  renderSportView(contentEl, headerEl, state.currentProfile);
}

function showCalendar() {
  stopActiveWorkoutSession();
  renderBottomNav("calendar");
  renderCalendarView(contentEl, headerEl, state.currentProfile, state.currentDateISO, (newDateISO) => {
    state.currentDateISO = newDateISO;
    showDailyLog();
  });
}

function showOverview() {
  stopActiveWorkoutSession();
  renderBottomNav("chart");
  renderOverviewView(contentEl, headerEl, state.currentProfile);
}

function showSettings() {
  stopActiveWorkoutSession();
  renderBottomNav("settings");
  headerEl.innerHTML = `<h1 style="font-family:var(--font-headline);font-size:var(--font-size-display);color:#fff;">Einstellungen</h1>`;
  renderSettingsView(contentEl, state.currentProfile, {
    onProfileSwitch: (profile) => {
      state.currentProfile = profile;
      state.currentDateISO = todayISO();
      showDailyLog();
    },
    onActiveProfileChanged: (profile) => {
      state.currentProfile = profile;
    },
    onAllProfilesDeleted: showProfileSelect,
  });
}

showProfileSelect();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js");
  });
}
