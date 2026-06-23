// Bildschirm: Sport - Umschalter Home Training / Fitness Studio.
import { getPlanDay, getPhaseInfo, getTodaysWorkout } from "../workoutPlan.js";
import { getSportTab, setSportTab, ensureTrainingStartDate } from "../sportSettings.js";
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

function exerciseCardsHtml(workout) {
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
    <p class="sport-focus-label">🏠 ${workout.focus}</p>
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

function homeTrainingHtml(weekday, workout) {
  return `
    <p class="sport-day-label">${WEEKDAYS[weekday]}</p>
    ${workout ? exerciseCardsHtml(workout) : restDayHtml()}
  `;
}

function studioPlaceholderHtml() {
  return `
    <div class="section-card sport-placeholder-card">
      <h3>🏋️ Fitness Studio</h3>
      <p>Kommt bald!</p>
    </div>
  `;
}

export async function renderSportView(container, headerContainer, profile) {
  headerContainer.innerHTML = `<h1 style="font-family:var(--font-headline);font-size:var(--font-size-display);color:#fff;">Sport</h1>`;

  let activeTab = await getSportTab();
  const startISO = await ensureTrainingStartDate();
  const planDay = getPlanDay(startISO, todayISO());
  const phaseInfo = getPhaseInfo(planDay);
  const weekday = new Date().getDay();
  const workout = getTodaysWorkout(weekday, phaseInfo.key);

  function renderContent() {
    container.innerHTML = `
      ${phaseHeaderHtml(planDay, phaseInfo)}
      <div class="sport-toggle-group">
        <button type="button" class="sport-toggle ${activeTab === "home" ? "selected" : ""}" data-sport-tab="home">🏠 Home Training</button>
        <button type="button" class="sport-toggle ${activeTab === "studio" ? "selected" : ""}" data-sport-tab="studio">🏋️ Fitness Studio</button>
      </div>
      ${activeTab === "home" ? homeTrainingHtml(weekday, workout) : studioPlaceholderHtml()}
    `;

    container.querySelectorAll("[data-sport-tab]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (btn.dataset.sportTab === activeTab) return;
        activeTab = btn.dataset.sportTab;
        await setSportTab(activeTab);
        renderContent();
      });
    });

    const startBtn = container.querySelector("#start-training-btn");
    if (startBtn) {
      startBtn.addEventListener("click", () => {
        renderWorkoutPlayer(container, headerContainer, {
          workout,
          profile,
          onExit: () => renderSportView(container, headerContainer, profile),
        });
      });
    }
  }

  renderContent();
}
