// Bildschirm: Geführter Workout-Player - läuft Übung für Übung durch,
// mit Übungs-/Pausen-Timer, Beep-Signal und Gesamttimer.
import { getExerciseIcon } from "../exerciseIcons.js";
import { playBeep } from "../beep.js";
import { getDailyLog, saveDailyLog } from "../dailyLog.js";
import { todayISO } from "../calendar.js";
import { celebrateMilestoneOnce } from "../milestones.js";

const WORK_SECONDS = 45;
const REST_SECONDS = 15;
const TOTAL_SECONDS = 20 * 60;

let activeIntervalId = null;
let activeWakeLock = null;

function releaseActiveWakeLock() {
  if (activeWakeLock) {
    activeWakeLock.release().catch(() => {});
    activeWakeLock = null;
  }
}

// Stoppt eine laufende Session, falls der Nutzer zu einem anderen Tab
// wechselt, ohne über den Stop-Button zu gehen.
export function stopActiveWorkoutSession() {
  if (activeIntervalId) {
    clearInterval(activeIntervalId);
    activeIntervalId = null;
  }
  releaseActiveWakeLock();
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
  let lastTickTime = Date.now();

  function clearTimer() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    activeIntervalId = null;
    releaseActiveWakeLock();
  }

  async function requestWakeLock() {
    if (!("wakeLock" in navigator)) return;
    try {
      activeWakeLock = await navigator.wakeLock.request("screen");
    } catch (err) {
      // Wake Lock nicht verfügbar (z.B. Browser-Unterstützung fehlt) - Training läuft trotzdem weiter.
    }
  }

  async function logActivity() {
    if (!profile) return;
    const log = await getDailyLog(profile.id, todayISO());
    const minutes = Math.max(1, Math.round((TOTAL_SECONDS - totalSecondsLeft) / 60));
    log.activities.push({ art: `${workout.focus} (${modeLabel})`, dauerMin: minutes, zustand: "gut" });
    await saveDailyLog(log);
    await celebrateMilestoneOnce(profile.id, "first_workout", "Erstes Training abgeschlossen! Weiter so!");
  }

  function completeWorkout() {
    finished = true;
    clearTimer();
    logActivity();
    render();
  }

  // Verarbeitet eine simulierte Sekunde. Gibt false zurück, wenn die Session
  // dadurch beendet wurde (z.B. nach Tab-Wechsel/Bildschirm-aus, wenn mehrere
  // Sekunden auf einmal nachgeholt werden müssen).
  function processOneSecond() {
    totalSecondsLeft = Math.max(0, totalSecondsLeft - 1);
    phaseSecondsLeft -= 1;

    if (totalSecondsLeft <= 0) {
      completeWorkout();
      return false;
    }

    if (phaseSecondsLeft <= 0) {
      playBeep();
      if (phase === "work" && index === exercises.length - 1) {
        completeWorkout();
        return false;
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

    return true;
  }

  // Misst die tatsächlich vergangene Zeit über Date.now() statt simpel pro
  // Interval-Aufruf -1 zu rechnen - so bleibt der Timer auch korrekt, wenn
  // der Tab im Hintergrund war und setInterval gedrosselt/verzögert wurde.
  function tick() {
    if (paused || finished) return;

    const now = Date.now();
    const elapsedSeconds = Math.floor((now - lastTickTime) / 1000);
    if (elapsedSeconds <= 0) return;
    lastTickTime += elapsedSeconds * 1000;

    for (let i = 0; i < elapsedSeconds; i++) {
      if (!processOneSecond()) break;
    }

    if (!finished) render();
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
      if (!paused) {
        // Beim Fortsetzen neu starten, damit die Pausenzeit nicht als
        // vergangene Trainingszeit mitgezählt wird.
        lastTickTime = Date.now();
      }
      render();
    });
    container.querySelector("#player-stop-btn").addEventListener("click", () => {
      clearTimer();
      onExit();
    });
  }

  headerContainer.innerHTML = `<h1 style="font-family:var(--font-headline);font-size:var(--font-size-display);color:#fff;">Sport</h1>`;
  render();
  lastTickTime = Date.now();
  intervalId = setInterval(tick, 1000);
  activeIntervalId = intervalId;
  requestWakeLock();
}
