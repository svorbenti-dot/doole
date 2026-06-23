// Bildschirm: Geführter Workout-Player - läuft Übung für Übung durch,
// mit Übungs-/Pausen-Timer, Beep-Signal und Gesamttimer.
import { getExerciseIcon } from "../exerciseIcons.js";
import { playBeep } from "../beep.js";
import { getDailyLog, saveDailyLog } from "../dailyLog.js";
import { todayISO } from "../calendar.js";

const WORK_SECONDS = 45;
const REST_SECONDS = 15;
const TOTAL_SECONDS = 20 * 60;

let activeIntervalId = null;

// Stoppt eine laufende Session, falls der Nutzer zu einem anderen Tab
// wechselt, ohne über den Stop-Button zu gehen.
export function stopActiveWorkoutSession() {
  if (activeIntervalId) {
    clearInterval(activeIntervalId);
    activeIntervalId = null;
  }
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function splitExercise(entry) {
  const [name, detail] = entry.split(" – ");
  return { name, detail };
}

export function renderWorkoutPlayer(container, headerContainer, { workout, profile, modeLabel, onExit }) {
  stopActiveWorkoutSession();

  const exercises = workout.exercises;
  let index = 0;
  let phase = "work";
  let phaseSecondsLeft = WORK_SECONDS;
  let totalSecondsLeft = TOTAL_SECONDS;
  let paused = false;
  let finished = false;
  let intervalId = null;

  function clearTimer() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    activeIntervalId = null;
  }

  async function logActivity() {
    if (!profile) return;
    const log = await getDailyLog(profile.id, todayISO());
    const minutes = Math.max(1, Math.round((TOTAL_SECONDS - totalSecondsLeft) / 60));
    log.activities.push({ art: `${workout.focus} (${modeLabel})`, dauerMin: minutes, zustand: "gut" });
    await saveDailyLog(log);
  }

  function completeWorkout() {
    finished = true;
    clearTimer();
    logActivity();
    render();
  }

  function tick() {
    if (paused || finished) return;
    totalSecondsLeft = Math.max(0, totalSecondsLeft - 1);
    phaseSecondsLeft -= 1;

    if (totalSecondsLeft <= 0) {
      completeWorkout();
      return;
    }

    if (phaseSecondsLeft <= 0) {
      playBeep();
      if (phase === "work" && index === exercises.length - 1) {
        completeWorkout();
        return;
      }
      if (phase === "work") {
        phase = "rest";
        phaseSecondsLeft = REST_SECONDS;
      } else {
        index += 1;
        phase = "work";
        phaseSecondsLeft = WORK_SECONDS;
      }
    }

    render();
  }

  function renderFinished() {
    container.innerHTML = `
      <div class="player-screen player-finished">
        <div class="player-finished-emoji">🎉</div>
        <h2>Training abgeschlossen! 💪</h2>
        <p>Super gemacht – ${workout.focus} ist erledigt und wurde automatisch als Aktivität in deinem Tagesprotokoll eingetragen.</p>
        <button type="button" id="player-done-btn" class="btn btn-primary sport-start-btn">Fertig</button>
      </div>
    `;
    container.querySelector("#player-done-btn").addEventListener("click", onExit);
  }

  function render() {
    if (finished) {
      renderFinished();
      return;
    }

    const isRest = phase === "rest";
    const displayed = isRest ? splitExercise(exercises[index + 1]) : splitExercise(exercises[index]);
    const phaseLabel = isRest ? "😌 Pause – nächste Übung" : "🏋️ Übung";

    container.innerHTML = `
      <div class="player-screen">
        <div class="player-total-timer">⏱️ ${formatTime(totalSecondsLeft)}</div>
        <p class="player-progress">Übung ${index + 1} / ${exercises.length}</p>
        <p class="player-phase-label ${isRest ? "rest" : "work"}">${phaseLabel}</p>
        <div class="player-icon">${getExerciseIcon(displayed.name)}</div>
        <h2 class="player-exercise-name">${displayed.name}</h2>
        <p class="player-exercise-detail">${displayed.detail}</p>
        <div class="player-phase-timer ${isRest ? "rest" : "work"}">${phaseSecondsLeft}</div>
        <div class="player-controls">
          <button type="button" id="player-pause-btn" class="btn btn-secondary">${paused ? "▶️ Weiter" : "⏸️ Pause"}</button>
          <button type="button" id="player-stop-btn" class="btn btn-secondary">⏹️ Stop</button>
        </div>
      </div>
    `;

    container.querySelector("#player-pause-btn").addEventListener("click", () => {
      paused = !paused;
      render();
    });
    container.querySelector("#player-stop-btn").addEventListener("click", () => {
      clearTimer();
      onExit();
    });
  }

  headerContainer.innerHTML = `<h1 style="font-family:var(--font-headline);font-size:var(--font-size-display);color:#fff;">Sport</h1>`;
  render();
  intervalId = setInterval(tick, 1000);
  activeIntervalId = intervalId;
}
