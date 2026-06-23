// Home-Training-Plan (Bodyweight, 90 Tage / 3 Phasen) aus
// Doole_90_Tage_Fitnessplan.md, gruppiert nach Phase und Wochentag
// (0=Sonntag .. 6=Samstag).
import { daysBetweenISO } from "./calendar.js";

const PLAN_LENGTH_DAYS = 90;
const WEEKS_PER_PHASE = 4;

function workouts(beinePo, brustArme, ruecken, bauch) {
  return {
    1: { focus: "Beine & Po", exercises: beinePo },
    2: { focus: "Brust & Arme", exercises: brustArme },
    3: { focus: "Rücken & Mobilität", exercises: ruecken },
    4: { focus: "Beine & Po", exercises: beinePo },
    5: { focus: "Brust & Arme", exercises: brustArme },
    6: { focus: "Bauch & Ganzkörper", exercises: bauch },
  };
}

export const PHASES = {
  fundament: {
    label: "Fundament",
    emoji: "🌱",
    weeks: [1, 4],
    restSeconds: 60,
    workouts: workouts(
      [
        "Bodyweight Squats – 3 Sätze x 12 Wiederholungen",
        "Wandsitzen (Wall Sit) – 3 Sätze x 20 Sekunden",
        "Ausfallschritte (Lunges) – 3 Sätze x 10 Wiederholungen pro Seite",
        "Glute Bridge – 3 Sätze x 15 Wiederholungen",
        "Wadenheben (Calf Raises) – 3 Sätze x 15 Wiederholungen",
        "Seitliches Beinheben im Stand – 2 Sätze x 12 Wiederholungen pro Seite",
      ],
      [
        "Knie-Liegestütze – 3 Sätze x 10 Wiederholungen",
        "Diamant-Liegestütze an der Wand – 3 Sätze x 10 Wiederholungen",
        "Trizeps-Dips an der Stuhlkante – 3 Sätze x 10 Wiederholungen",
        "Plank Shoulder Taps – 3 Sätze x 10 Wiederholungen pro Seite",
        "Armkreisen vorwärts/rückwärts – 2 Sätze x 20 Sekunden",
        "Liegestütz-Halten (Hold in der Mitte) – 3 Sätze x 15 Sekunden",
      ],
      [
        "Katze-Kuh (Cat-Cow) – 2 Sätze x 10 Wiederholungen",
        "Vogel-Hund (Bird Dog) – 3 Sätze x 10 Wiederholungen pro Seite",
        "Dead Bug – 3 Sätze x 10 Wiederholungen pro Seite",
        "Schulterblätter zusammenziehen (Scapular Squeeze) – 3 Sätze x 15 Wiederholungen",
        "Brustwirbelsäulen-Rotation im Vierfüßlerstand – 2 Sätze x 10 Wiederholungen pro Seite",
        "Kindhaltung (Child's Pose) – 2 Sätze x 30 Sekunden",
      ],
      [
        "Plank (Unterarmstütz) – 3 Sätze x 20 Sekunden",
        "Mountain Climbers – 3 Sätze x 20 Sekunden",
        "Stehende Fahrrad-Crunches (Standing Knee-to-Elbow) – 3 Sätze x 12 Wiederholungen pro Seite",
        "Glute Bridge March – 3 Sätze x 10 Wiederholungen pro Seite",
        "Jumping Jacks – 3 Sätze x 30 Sekunden",
        "Seitlicher Unterarmstütz auf den Knien (Side Plank) – 2 Sätze x 15 Sekunden pro Seite",
      ],
    ),
  },
  aufbau: {
    label: "Aufbau",
    emoji: "💪",
    weeks: [5, 8],
    restSeconds: 45,
    workouts: workouts(
      [
        "Kniebeugen mit Pause unten – 4 Sätze x 12 Wiederholungen",
        "Bulgarian Split Squats (Hinterer Fuß auf Stuhl) – 3 Sätze x 10 Wiederholungen pro Seite",
        "Ausfallschritte rückwärts – 3 Sätze x 12 Wiederholungen pro Seite",
        "Single-Leg Glute Bridge – 3 Sätze x 12 Wiederholungen pro Seite",
        "Wadenheben einbeinig – 3 Sätze x 12 Wiederholungen pro Seite",
        "Seitliches Beinheben im Stand (zügig) – 3 Sätze x 15 Wiederholungen pro Seite",
      ],
      [
        "Liegestütze (volle Position) – 3 Sätze x 12 Wiederholungen",
        "Schräge Liegestütze (Füße erhöht) – 3 Sätze x 10 Wiederholungen",
        "Trizeps-Dips an der Stuhlkante – 3 Sätze x 12 Wiederholungen",
        "Plank to Push-up – 3 Sätze x 10 Wiederholungen",
        "Diamant-Liegestütze – 3 Sätze x 8 Wiederholungen",
        "Plank Shoulder Taps (zügig) – 3 Sätze x 15 Wiederholungen pro Seite",
      ],
      [
        "Bird Dog mit kurzer Pause oben – 3 Sätze x 12 Wiederholungen pro Seite",
        "Dead Bug mit langsamem Tempo – 3 Sätze x 12 Wiederholungen pro Seite",
        "Plank Shoulder Taps – 3 Sätze x 12 Wiederholungen pro Seite",
        "Seitlicher Unterarmstütz (Side Plank) – 3 Sätze x 20 Sekunden pro Seite",
        "Brustwirbelsäulen-Rotation im Stand – 2 Sätze x 12 Wiederholungen pro Seite",
        "Hüftbeuger-Dehnung im Kniestand – 2 Sätze x 30 Sekunden pro Seite",
      ],
      [
        "Plank mit Schulterklopfen – 3 Sätze x 12 Wiederholungen pro Seite",
        "Mountain Climbers (zügig) – 3 Sätze x 30 Sekunden",
        "Stehende Fahrrad-Crunches (zügig) – 3 Sätze x 15 Wiederholungen pro Seite",
        "Glute Bridge March mit Pause oben – 3 Sätze x 12 Wiederholungen pro Seite",
        "Squat Thrusts (Burpee ohne Liegestütz) – 3 Sätze x 10 Wiederholungen",
        "Side Plank – 3 Sätze x 20 Sekunden pro Seite",
      ],
    ),
  },
  power: {
    label: "Power",
    emoji: "⚡",
    weeks: [9, 12],
    restSeconds: 30,
    workouts: workouts(
      [
        "Jump Squats – 4 Sätze x 12 Wiederholungen",
        "Bulgarian Split Squats – 4 Sätze x 12 Wiederholungen pro Seite",
        "Curtsy Lunges – 4 Sätze x 12 Wiederholungen pro Seite",
        "Single-Leg Glute Bridge mit Pause oben – 4 Sätze x 15 Wiederholungen pro Seite",
        "Wadenheben explosiv – 4 Sätze x 20 Wiederholungen",
        "Squat Pulses – 3 Sätze x 20 Wiederholungen",
      ],
      [
        "Liegestütze – 4 Sätze x 15 Wiederholungen",
        "Diamant-Liegestütze – 4 Sätze x 10 Wiederholungen",
        "Trizeps-Dips mit erhobenen Beinen – 4 Sätze x 12 Wiederholungen",
        "Plyo Push-ups (Klatsch-Liegestütze, alternativ explosive Liegestütze) – 3 Sätze x 8 Wiederholungen",
        "Plank to Push-up – 4 Sätze x 12 Wiederholungen",
        "Schräge Liegestütze (Füße erhöht) – 4 Sätze x 12 Wiederholungen",
      ],
      [
        "Bird Dog mit Knie-Ellbogen-Touch – 4 Sätze x 12 Wiederholungen pro Seite",
        "Dead Bug im Tempo – 4 Sätze x 12 Wiederholungen pro Seite",
        "Side Plank mit Hip Dip – 3 Sätze x 12 Wiederholungen pro Seite",
        "Plank Shoulder Taps (schnell) – 4 Sätze x 15 Wiederholungen pro Seite",
        "Glute Bridge mit Pause + Schulterblatt-Retraktion – 4 Sätze x 15 Wiederholungen",
        "Brustwirbelsäulen-Rotation (dynamisch) – 3 Sätze x 15 Wiederholungen pro Seite",
      ],
      [
        "Plank to Push-up – 4 Sätze x 12 Wiederholungen",
        "Mountain Climbers Sprint – 4 Sätze x 30 Sekunden",
        "Stehende Fahrrad-Crunches (schnell) – 4 Sätze x 15 Wiederholungen pro Seite",
        "Burpees – 4 Sätze x 12 Wiederholungen",
        "Side Plank mit Hip Dip – 4 Sätze x 15 Wiederholungen pro Seite",
        "Jumping Jacks / High Knees – 3 Sätze x 40 Sekunden",
      ],
    ),
  },
};

const MAX_WEEK = WEEKS_PER_PHASE * 3;

// Tag X des 90-Tage-Plans (1-basiert, auf 1..90 begrenzt).
export function getPlanDay(startISO, todayISOStr) {
  const diff = daysBetweenISO(startISO, todayISOStr);
  return Math.min(PLAN_LENGTH_DAYS, Math.max(1, diff + 1));
}

function getWeekNumber(planDay) {
  return Math.min(MAX_WEEK, Math.ceil(planDay / 7));
}

function getPhaseKeyForWeek(week) {
  if (week <= WEEKS_PER_PHASE) return "fundament";
  if (week <= WEEKS_PER_PHASE * 2) return "aufbau";
  return "power";
}

// Liefert Phase, Woche und Pausenzeit für den gegebenen Plan-Tag.
export function getPhaseInfo(planDay) {
  const week = getWeekNumber(planDay);
  const key = getPhaseKeyForWeek(week);
  return { key, week, ...PHASES[key] };
}

export function getTodaysWorkout(weekday, phaseKey) {
  return PHASES[phaseKey].workouts[weekday] || null;
}
