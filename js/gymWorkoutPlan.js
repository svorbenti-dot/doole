// Fitness-Studio-Trainingsplan (Geräte-Übungen) aus Doole, gruppiert nach
// Wochentag (0=Sonntag .. 6=Samstag) - gleiche Wochenstruktur wie das
// Home-Training. Rückenfreundlich: keine Übungen mit Belastung der unteren
// Wirbelsäule (kein Kreuzheben, kein Rückenstrecker, keine Rotation unter Last).

const BEINE_PO = [
  "Beinpresse – 3 Sätze x 12 Wiederholungen",
  "Beinstrecker (Leg Extension) – 3 Sätze x 12 Wiederholungen",
  "Beinbeuger (Leg Curl) – 3 Sätze x 12 Wiederholungen",
  "Hüftabduktoren-Maschine – 3 Sätze x 15 Wiederholungen",
  "Wadenheben-Maschine (sitzend) – 3 Sätze x 15 Wiederholungen",
  "Ausfallschritte mit Kurzhanteln – 3 Sätze x 10 Wiederholungen pro Seite",
];

const BRUST_ARME = [
  "Brustpresse (Chest Press Maschine) – 3 Sätze x 12 Wiederholungen",
  "Butterfly / Kabelzug Fliegende – 3 Sätze x 12 Wiederholungen",
  "Schulterdrücken-Maschine – 3 Sätze x 10 Wiederholungen",
  "Bizeps-Curl am Kabelzug – 3 Sätze x 12 Wiederholungen",
  "Trizepsdrücken am Kabelzug (Seilzug) – 3 Sätze x 12 Wiederholungen",
  "Assistierter Dip (Dip-Maschine) – 3 Sätze x 10 Wiederholungen",
];

const RUECKEN_MOBILITAET = [
  "Latzug breit (Lat Pulldown) – 3 Sätze x 12 Wiederholungen",
  "Kabelzug Rudern sitzend, Brust gestützt – 3 Sätze x 12 Wiederholungen",
  "Reverse-Fly-Maschine (hintere Schulter) – 3 Sätze x 15 Wiederholungen",
  "Face Pulls am Kabelzug – 3 Sätze x 15 Wiederholungen",
  "Assistierter Klimmzug – 3 Sätze x 8 Wiederholungen",
  "Katze-Kuh Mobilisation auf der Matte – 2 Sätze x 10 Wiederholungen",
];

const BAUCH_GANZKOERPER = [
  "Bauchmaschine (Crunch-Maschine) – 3 Sätze x 15 Wiederholungen",
  "Seilzug-Crunches (kniend am Kabelzug) – 3 Sätze x 15 Wiederholungen",
  "Knieheben am Dip-Stand (Captain's Chair) – 3 Sätze x 12 Wiederholungen",
  "Rudergerät (Rowing-Maschine) – 3 Sätze x 30 Sekunden",
  "Crosstrainer-Intervall – 2 Sätze x 60 Sekunden",
  "Plank am Kabelzug (Unterarmstütz an Griffen) – 3 Sätze x 20 Sekunden",
];

// 0 = Sonntag fehlt absichtlich (Ruhetag, kein Training).
export const GYM_WEEKDAY_WORKOUTS = {
  1: { focus: "Beine & Po", exercises: BEINE_PO },
  2: { focus: "Brust & Arme", exercises: BRUST_ARME },
  3: { focus: "Rücken & Mobilität", exercises: RUECKEN_MOBILITAET },
  4: { focus: "Beine & Po", exercises: BEINE_PO },
  5: { focus: "Brust & Arme", exercises: BRUST_ARME },
  6: { focus: "Bauch & Ganzkörper", exercises: BAUCH_GANZKOERPER },
};

export function getTodaysGymWorkout(weekday) {
  return GYM_WEEKDAY_WORKOUTS[weekday] || null;
}
