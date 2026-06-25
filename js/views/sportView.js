// Bildschirm: Sport - Umschalter Home Training / Fitness Studio.
import { getPlanDay, getPhaseInfo, getTodaysWorkout } from "../workoutPlan.js";
import { getTodaysGymWorkout } from "../gymWorkoutPlan.js";
import { getSportTab, setSportTab, ensureTrainingStartDate, hasSeenHealthDisclaimer, markHealthDisclaimerSeen } from "../sportSettings.js";
import { WEEKDAYS, todayISO } from "../calendar.js";
import { renderWorkoutPlayer } from "./workoutPlayerView.js";

function phaseHeaderHtml(planDay, phaseInfo) {
  return `
    <div class="section-card sport-phase-card">
      <p class="sport-day-counter">Tag ${planDay} von 90</p>
      <h3>${phaseInfo.emoji} Phase: ${phaseInfo.label}</h3>
      <p class="sport-phase-detail">Woche ${phaseInfo.week} · Pause zwischen Sätzen: ${phaseInfo.restSeconds} Sekunden</p>
    </div>
  `;
}

function exerciseCardsHtml(workout, icon) {
  const cards = workout.exercises.map((entry) => {
    const [name, detail] = entry.split(" – ");
    return `
      <div class="section-card sport-exercise-card">
        <h3>${name}</h3>
        <p class="sport-exercise-detail">${detail}</p>
      </div>
    `;
  }).join("");

  return `
    <p class="sport-focus-label">${icon} ${workout.focus}</p>
    ${cards}
    <button type="button" id="start-training-btn" class="btn btn-primary sport-start-btn">🏋️ Training starten</button>
  `;
}

function restDayHtml() {
  return `
    <div class="section-card sport-rest-card">
      <h3>😌 Ruhetag</h3>
      <p>Erhol dich! Heute ist kein Training geplant. Nutze den Tag für Entspannung, leichte Spaziergänge oder lockeres Dehnen – dein Körper braucht die Pause, um sich zu erholen und stärker zu werden.</p>
    </div>
  `;
}

function trainingDayHtml(weekday, workout, icon) {
  return `
    <p class="sport-day-label">${WEEKDAYS[weekday]}</p>
    ${workout ? exerciseCardsHtml(workout, icon) : restDayHtml()}
  `;
}

function showHealthDisclaimer(profileId) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-card">
      <h3>⚠️ Wichtiger Hinweis</h3>
      <p>Dieser Trainingsplan ist ein allgemeiner Vorschlag. Bei Rückenproblemen oder anderen Beschwerden sprich bitte mit einem Arzt oder Physiotherapeuten bevor du startest.</p>
      <button type="button" id="health-disclaimer-ok" class="btn btn-primary">Verstanden</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector("#health-disclaimer-ok").addEventListener("click", async () => {
    await markHealthDisclaimerSeen(profileId);
    overlay.remove();
  });
}

export async function renderSportView(container, headerContainer, profile) {
  headerContainer.innerHTML = `<h1 style="font-family:var(--font-headline);font-size:var(--font-size-display);color:#fff;">Sport</h1>`;

  if (!(await hasSeenHealthDisclaimer(profile.id))) {
    showHealthDisclaimer(profile.id);
  }

  let activeTab = await getSportTab(profile.id);
  const startISO = await ensureTrainingStartDate(profile.id);
  const planDay = getPlanDay(startISO, todayISO());
  const phaseInfo = getPhaseInfo(planDay);
  const weekday = new Date().getDay();
  const homeWorkout = getTodaysWorkout(weekday, phaseInfo.key);
  const gymWorkout = getTodaysGymWorkout(weekday);

  function renderContent() {
    const isHome = activeTab === "home";
    const activeWorkout = isHome ? homeWorkout : gymWorkout;
    const icon = isHome ? "🏠" : "🏋️";

    container.innerHTML = `
      ${phaseHeaderHtml(planDay, phaseInfo)}
      <div class="sport-toggle-group">
        <button type="button" class="sport-toggle ${activeTab === "home" ? "selected" : ""}" data-sport-tab="home">🏠 Home Training</button>
        <button type="button" class="sport-toggle ${activeTab === "studio" ? "selected" : ""}" data-sport-tab="studio">🏋️ Fitness Studio</button>
      </div>
      ${trainingDayHtml(weekday, activeWorkout, icon)}
    `;

    container.querySelectorAll("[data-sport-tab]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (btn.dataset.sportTab === activeTab) return;
        activeTab = btn.dataset.sportTab;
        await setSportTab(profile.id, activeTab);
        renderContent();
      });
    });

    const startBtn = container.querySelector("#start-training-btn");
    if (startBtn) {
      startBtn.addEventListener("click", () => {
        renderWorkoutPlayer(container, headerContainer, {
          workout: activeWorkout,
          profile,
          modeLabel: isHome ? "Home Training" : "Fitness Studio",
          onExit: () => renderSportView(container, headerContainer, profile),
        });
      });
    }
  }

  renderContent();
}
