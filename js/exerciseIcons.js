// Einfache Strichmännchen-SVGs für den Workout-Player (Home Training und
// Fitness Studio). Jede Übung wird per Stichwort-Suche im Namen einer von
// rund 40 Bewegungs-/Geräte-Kategorien zugeordnet - das reicht, um die Übung
// auf einen Blick wiederzuerkennen, ohne für jede Übungsvariante ein eigenes
// Icon zu pflegen.
const HEAD = `<circle cx="50" cy="14" r="9"/>`;
const GROUND = `<line x1="8" y1="92" x2="92" y2="92"/>`;

function svg(inner) {
  return `<svg aria-hidden="true" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

const ICONS = {
  squat: svg(`
    ${HEAD}
    <line x1="50" y1="23" x2="50" y2="50"/>
    <line x1="50" y1="28" x2="75" y2="20"/>
    <line x1="50" y1="28" x2="25" y2="20"/>
    <line x1="50" y1="50" x2="32" y2="65"/>
    <line x1="32" y1="65" x2="36" y2="90"/>
    <line x1="50" y1="50" x2="68" y2="65"/>
    <line x1="68" y1="65" x2="64" y2="90"/>
  `),
  lunge: svg(`
    ${HEAD}
    <line x1="50" y1="23" x2="47" y2="50"/>
    <line x1="50" y1="28" x2="65" y2="18"/>
    <line x1="50" y1="28" x2="35" y2="40"/>
    <line x1="47" y1="50" x2="65" y2="66"/>
    <line x1="65" y1="66" x2="60" y2="90"/>
    <line x1="47" y1="50" x2="33" y2="60"/>
    <line x1="33" y1="60" x2="20" y2="88"/>
  `),
  wallsit: svg(`
    <line x1="15" y1="4" x2="15" y2="96"/>
    <circle cx="26" cy="16" r="9"/>
    <line x1="26" y1="25" x2="26" y2="55"/>
    <line x1="26" y1="55" x2="58" y2="55"/>
    <line x1="58" y1="55" x2="58" y2="90"/>
    <line x1="26" y1="32" x2="40" y2="40"/>
  `),
  bridge: svg(`
    ${GROUND}
    <circle cx="16" cy="84" r="8"/>
    <line x1="22" y1="84" x2="45" y2="68"/>
    <line x1="45" y1="68" x2="62" y2="80"/>
    <line x1="62" y1="80" x2="68" y2="92"/>
    <line x1="22" y1="84" x2="22" y2="92"/>
  `),
  calfraise: svg(`
    ${HEAD}
    <line x1="50" y1="23" x2="50" y2="55"/>
    <line x1="50" y1="30" x2="35" y2="42"/>
    <line x1="50" y1="30" x2="65" y2="42"/>
    <line x1="50" y1="55" x2="45" y2="84"/>
    <line x1="45" y1="84" x2="42" y2="88"/>
    <line x1="50" y1="55" x2="55" y2="84"/>
    <line x1="55" y1="84" x2="58" y2="88"/>
    <line x1="38" y1="76" x2="38" y2="66"/>
    <line x1="62" y1="76" x2="62" y2="66"/>
  `),
  legraise: svg(`
    ${HEAD}
    <line x1="50" y1="23" x2="50" y2="55"/>
    <line x1="50" y1="30" x2="38" y2="44"/>
    <line x1="50" y1="30" x2="62" y2="44"/>
    <line x1="50" y1="55" x2="46" y2="90"/>
    <line x1="50" y1="55" x2="78" y2="62"/>
  `),
  pushup: svg(`
    ${GROUND}
    <circle cx="18" cy="76" r="8"/>
    <line x1="24" y1="78" x2="62" y2="78"/>
    <line x1="62" y1="78" x2="86" y2="84"/>
    <line x1="32" y1="78" x2="36" y2="90"/>
    <line x1="36" y1="90" x2="42" y2="84"/>
  `),
  dip: svg(`
    <line x1="58" y1="40" x2="84" y2="40"/>
    <circle cx="64" cy="24" r="8"/>
    <line x1="64" y1="32" x2="64" y2="52"/>
    <line x1="64" y1="40" x2="48" y2="40"/>
    <line x1="48" y1="40" x2="48" y2="62"/>
    <line x1="64" y1="52" x2="40" y2="58"/>
    <line x1="40" y1="58" x2="34" y2="78"/>
  `),
  plank: svg(`
    ${GROUND}
    <circle cx="16" cy="74" r="8"/>
    <line x1="22" y1="76" x2="62" y2="76"/>
    <line x1="62" y1="76" x2="86" y2="82"/>
    <line x1="30" y1="76" x2="32" y2="92"/>
  `),
  sideplank: svg(`
    ${GROUND}
    <circle cx="18" cy="78" r="8"/>
    <line x1="24" y1="80" x2="58" y2="64"/>
    <line x1="58" y1="64" x2="86" y2="68"/>
    <line x1="24" y1="80" x2="22" y2="92"/>
    <line x1="30" y1="74" x2="22" y2="50"/>
  `),
  armcircle: svg(`
    ${HEAD}
    <line x1="50" y1="23" x2="50" y2="60"/>
    <line x1="50" y1="28" x2="20" y2="28"/>
    <line x1="50" y1="28" x2="80" y2="28"/>
    <circle cx="17" cy="28" r="6"/>
    <circle cx="83" cy="28" r="6"/>
    <line x1="50" y1="60" x2="42" y2="90"/>
    <line x1="50" y1="60" x2="58" y2="90"/>
  `),
  catcow: svg(`
    <circle cx="14" cy="58" r="8"/>
    <line x1="20" y1="68" x2="20" y2="86"/>
    <line x1="20" y1="55" x2="50" y2="38"/>
    <line x1="50" y1="38" x2="74" y2="56"/>
    <line x1="74" y1="56" x2="74" y2="80"/>
    <line x1="82" y1="56" x2="82" y2="80"/>
  `),
  birddog: svg(`
    <circle cx="28" cy="48" r="8"/>
    <line x1="28" y1="56" x2="10" y2="38"/>
    <line x1="28" y1="56" x2="62" y2="56"/>
    <line x1="32" y1="68" x2="32" y2="86"/>
    <line x1="62" y1="56" x2="86" y2="40"/>
    <line x1="58" y1="68" x2="58" y2="86"/>
  `),
  deadbug: svg(`
    ${GROUND}
    <circle cx="24" cy="82" r="8"/>
    <line x1="32" y1="82" x2="58" y2="82"/>
    <line x1="32" y1="82" x2="28" y2="55"/>
    <line x1="38" y1="82" x2="44" y2="90"/>
    <line x1="58" y1="82" x2="68" y2="60"/>
    <line x1="68" y1="60" x2="64" y2="48"/>
    <line x1="58" y1="82" x2="84" y2="84"/>
  `),
  mobility: svg(`
    <circle cx="68" cy="46" r="8"/>
    <line x1="63" y1="53" x2="40" y2="80"/>
    <line x1="40" y1="80" x2="28" y2="84"/>
    <line x1="63" y1="53" x2="88" y2="42"/>
    <line x1="40" y1="80" x2="40" y2="92"/>
  `),
  mountainclimber: svg(`
    ${GROUND}
    <circle cx="14" cy="74" r="8"/>
    <line x1="20" y1="76" x2="54" y2="76"/>
    <line x1="20" y1="76" x2="22" y2="90"/>
    <line x1="54" y1="76" x2="84" y2="82"/>
    <line x1="54" y1="76" x2="44" y2="62"/>
    <line x1="44" y1="62" x2="34" y2="70"/>
  `),
  crunch: svg(`
    ${HEAD}
    <line x1="50" y1="23" x2="54" y2="52"/>
    <line x1="54" y1="52" x2="60" y2="88"/>
    <line x1="50" y1="28" x2="36" y2="46"/>
    <line x1="54" y1="52" x2="34" y2="48"/>
    <line x1="34" y1="48" x2="30" y2="62"/>
  `),
  jumpingjack: svg(`
    <circle cx="50" cy="12" r="9"/>
    <line x1="50" y1="21" x2="50" y2="54"/>
    <line x1="50" y1="25" x2="20" y2="4"/>
    <line x1="50" y1="25" x2="80" y2="4"/>
    <line x1="50" y1="54" x2="25" y2="90"/>
    <line x1="50" y1="54" x2="75" y2="90"/>
  `),
  burpee: svg(`
    ${GROUND}
    <circle cx="28" cy="58" r="8"/>
    <line x1="32" y1="64" x2="30" y2="86"/>
    <line x1="32" y1="64" x2="52" y2="72"/>
    <line x1="52" y1="72" x2="86" y2="78"/>
    <line x1="44" y1="86" x2="44" y2="74"/>
  `),
  generic: svg(`
    ${HEAD}
    <line x1="50" y1="23" x2="50" y2="60"/>
    <line x1="50" y1="28" x2="30" y2="45"/>
    <line x1="50" y1="28" x2="70" y2="45"/>
    <line x1="50" y1="60" x2="38" y2="90"/>
    <line x1="50" y1="60" x2="62" y2="90"/>
  `),

  // --- Fitness-Studio / Geräte-Übungen ---
  legpress: svg(`
    <line x1="10" y1="78" x2="10" y2="92"/>
    <line x1="10" y1="92" x2="35" y2="92"/>
    <line x1="14" y1="40" x2="30" y2="75"/>
    <circle cx="13" cy="33" r="8"/>
    <line x1="30" y1="75" x2="55" y2="62"/>
    <line x1="55" y1="62" x2="78" y2="50"/>
    <line x1="78" y1="30" x2="82" y2="70"/>
  `),
  legextension: svg(`
    <line x1="15" y1="20" x2="15" y2="70"/>
    <circle cx="25" cy="18" r="8"/>
    <line x1="25" y1="26" x2="25" y2="65"/>
    <line x1="25" y1="65" x2="50" y2="65"/>
    <line x1="50" y1="65" x2="72" y2="80"/>
    <line x1="70" y1="62" x2="74" y2="90"/>
  `),
  legcurl: svg(`
    <line x1="8" y1="70" x2="75" y2="70"/>
    <circle cx="14" cy="64" r="8"/>
    <line x1="20" y1="68" x2="52" y2="68"/>
    <line x1="52" y1="68" x2="62" y2="48"/>
    <line x1="60" y1="44" x2="66" y2="52"/>
  `),
  hipabduction: svg(`
    <circle cx="50" cy="16" r="8"/>
    <line x1="50" y1="24" x2="50" y2="58"/>
    <line x1="50" y1="58" x2="26" y2="74"/>
    <line x1="26" y1="74" x2="30" y2="90"/>
    <line x1="50" y1="58" x2="74" y2="74"/>
    <line x1="74" y1="74" x2="70" y2="90"/>
    <line x1="20" y1="74" x2="26" y2="74"/>
    <line x1="74" y1="74" x2="80" y2="74"/>
  `),
  chestpress: svg(`
    <line x1="15" y1="18" x2="15" y2="70"/>
    <circle cx="25" cy="16" r="8"/>
    <line x1="25" y1="24" x2="25" y2="63"/>
    <line x1="25" y1="33" x2="66" y2="28"/>
    <line x1="25" y1="40" x2="66" y2="45"/>
    <line x1="25" y1="63" x2="20" y2="86"/>
    <line x1="25" y1="63" x2="34" y2="86"/>
  `),
  pecfly: svg(`
    <line x1="15" y1="18" x2="15" y2="70"/>
    <circle cx="25" cy="16" r="8"/>
    <line x1="25" y1="24" x2="25" y2="63"/>
    <polyline points="25,30 6,38 22,50"/>
    <polyline points="25,36 44,44 28,54"/>
    <line x1="25" y1="63" x2="20" y2="86"/>
    <line x1="25" y1="63" x2="34" y2="86"/>
  `),
  shoulderpressmachine: svg(`
    <line x1="15" y1="30" x2="15" y2="75"/>
    <circle cx="25" cy="22" r="8"/>
    <line x1="25" y1="30" x2="25" y2="70"/>
    <line x1="25" y1="35" x2="14" y2="8"/>
    <line x1="25" y1="35" x2="36" y2="8"/>
    <line x1="25" y1="70" x2="20" y2="90"/>
    <line x1="25" y1="70" x2="32" y2="90"/>
  `),
  bicepscurl: svg(`
    ${HEAD}
    <line x1="50" y1="23" x2="50" y2="58"/>
    <line x1="50" y1="58" x2="45" y2="88"/>
    <line x1="50" y1="58" x2="55" y2="88"/>
    <line x1="58" y1="80" x2="58" y2="45"/>
    <line x1="50" y1="30" x2="58" y2="45"/>
    <line x1="58" y1="45" x2="48" y2="28"/>
  `),
  tricepspushdown: svg(`
    ${HEAD}
    <line x1="50" y1="23" x2="50" y2="58"/>
    <line x1="50" y1="58" x2="45" y2="88"/>
    <line x1="50" y1="58" x2="55" y2="88"/>
    <line x1="58" y1="10" x2="58" y2="42"/>
    <line x1="50" y1="28" x2="58" y2="42"/>
    <line x1="58" y1="42" x2="58" y2="65"/>
  `),
  latpulldown: svg(`
    <line x1="20" y1="10" x2="70" y2="10"/>
    <circle cx="45" cy="22" r="8"/>
    <line x1="45" y1="30" x2="45" y2="65"/>
    <line x1="45" y1="34" x2="26" y2="14"/>
    <line x1="45" y1="34" x2="64" y2="14"/>
    <line x1="45" y1="65" x2="35" y2="80"/>
    <line x1="45" y1="65" x2="55" y2="80"/>
  `),
  seatedrow: svg(`
    ${GROUND}
    <circle cx="20" cy="58" r="8"/>
    <line x1="26" y1="62" x2="46" y2="80"/>
    <line x1="46" y1="80" x2="70" y2="80"/>
    <line x1="70" y1="62" x2="70" y2="80"/>
    <line x1="26" y1="64" x2="50" y2="66"/>
  `),
  reversefly: svg(`
    <line x1="15" y1="20" x2="15" y2="70"/>
    <circle cx="25" cy="18" r="8"/>
    <line x1="25" y1="26" x2="25" y2="63"/>
    <line x1="25" y1="32" x2="55" y2="24"/>
    <line x1="25" y1="40" x2="55" y2="48"/>
    <line x1="25" y1="63" x2="20" y2="86"/>
    <line x1="25" y1="63" x2="34" y2="86"/>
  `),
  facepull: svg(`
    ${HEAD}
    <line x1="50" y1="23" x2="50" y2="58"/>
    <line x1="50" y1="58" x2="43" y2="88"/>
    <line x1="50" y1="58" x2="57" y2="88"/>
    <polyline points="50,28 30,22 45,16"/>
    <polyline points="50,28 70,22 55,16"/>
  `),
  assistedpullup: svg(`
    <line x1="20" y1="10" x2="80" y2="10"/>
    <line x1="35" y1="10" x2="45" y2="30"/>
    <line x1="65" y1="10" x2="55" y2="30"/>
    <circle cx="50" cy="33" r="8"/>
    <line x1="50" y1="41" x2="50" y2="65"/>
    <polyline points="50,65 44,80 54,85"/>
    <line x1="50" y1="65" x2="58" y2="78"/>
  `),
  abcrunchmachine: svg(`
    <line x1="35" y1="70" x2="60" y2="70"/>
    <line x1="25" y1="35" x2="25" y2="55"/>
    <circle cx="34" cy="42" r="8"/>
    <polyline points="34,50 42,58 50,68"/>
    <line x1="50" y1="68" x2="45" y2="84"/>
    <line x1="50" y1="68" x2="60" y2="80"/>
  `),
  cablecrunch: svg(`
    <line x1="45" y1="20" x2="45" y2="50"/>
    <circle cx="46" cy="56" r="8"/>
    <polyline points="46,64 42,78 40,86"/>
    <line x1="40" y1="86" x2="30" y2="88"/>
    <line x1="42" y1="58" x2="50" y2="56"/>
  `),
  captainschair: svg(`
    <line x1="20" y1="8" x2="20" y2="92"/>
    <line x1="20" y1="30" x2="32" y2="32"/>
    <circle cx="40" cy="20" r="8"/>
    <line x1="38" y1="28" x2="34" y2="55"/>
    <polyline points="34,55 55,50 60,60"/>
  `),
  rowingmachine: svg(`
    ${GROUND}
    <circle cx="22" cy="55" r="8"/>
    <line x1="28" y1="60" x2="44" y2="78"/>
    <line x1="44" y1="78" x2="62" y2="82"/>
    <line x1="78" y1="68" x2="78" y2="86"/>
    <line x1="62" y1="82" x2="78" y2="68"/>
    <line x1="30" y1="62" x2="50" y2="64"/>
    <line x1="50" y1="64" x2="78" y2="78"/>
  `),
  crosstrainer: svg(`
    <circle cx="50" cy="12" r="9"/>
    <line x1="50" y1="21" x2="48" y2="50"/>
    <polyline points="48,50 60,65 70,80"/>
    <polyline points="48,50 38,60 30,75"/>
    <line x1="50" y1="25" x2="35" y2="35"/>
    <line x1="50" y1="25" x2="65" y2="15"/>
    <line x1="22" y1="77" x2="38" y2="77"/>
    <line x1="62" y1="82" x2="78" y2="82"/>
  `),
};

function classify(name) {
  const n = name.toLowerCase();
  if (n.includes("burpee")) return "burpee";
  if (n.includes("wandsitzen") || n.includes("wall sit")) return "wallsit";
  if (n.includes("ausfallschritt") || n.includes("lunge") || n.includes("split squat") || n.includes("curtsy")) return "lunge";
  if (n.includes("squat") || n.includes("kniebeuge")) return "squat";
  if (n.includes("bridge")) return "bridge";
  if (n.includes("wadenheben") || n.includes("calf")) return "calfraise";
  if (n.includes("beinheben")) return "legraise";
  if (n.includes("liegestütz") || n.includes("push-up") || n.includes("push up") || n.includes("plyo")) return "pushup";
  if (n.includes("dips") || n.includes("assistierter dip")) return "dip";
  if (n.includes("side plank") || n.includes("seitlicher unterarmstütz")) return "sideplank";
  if (n.includes("plank")) return "plank";
  if (n.includes("armkreisen")) return "armcircle";
  if (n.includes("katze-kuh") || n.includes("cat-cow")) return "catcow";
  if (n.includes("vogel-hund") || n.includes("bird dog")) return "birddog";
  if (n.includes("dead bug")) return "deadbug";
  if (n.includes("mountain climber")) return "mountainclimber";
  if (n.includes("fahrrad-crunch") || n.includes("knee-to-elbow")) return "crunch";
  if (n.includes("jumping jack") || n.includes("high knees")) return "jumpingjack";
  if (n.includes("schulterblätter") || n.includes("scapular") || n.includes("rotation") || n.includes("kindhaltung") || n.includes("child's pose") || n.includes("hüftbeuger") || n.includes("dehnung")) return "mobility";
  // --- Fitness-Studio / Geräte-Übungen ---
  if (n.includes("beinpresse")) return "legpress";
  if (n.includes("beinstrecker") || n.includes("leg extension")) return "legextension";
  if (n.includes("beinbeuger") || n.includes("leg curl")) return "legcurl";
  if (n.includes("hüftabduktor")) return "hipabduction";
  if (n.includes("brustpresse") || n.includes("chest press")) return "chestpress";
  if (n.includes("butterfly") || n.includes("fliegende")) return "pecfly";
  if (n.includes("schulterdrücken")) return "shoulderpressmachine";
  if (n.includes("bizeps")) return "bicepscurl";
  if (n.includes("trizeps")) return "tricepspushdown";
  if (n.includes("latzug")) return "latpulldown";
  if (n.includes("rudergerät") || n.includes("rowing")) return "rowingmachine";
  if (n.includes("rudern")) return "seatedrow";
  if (n.includes("reverse-fly") || n.includes("reverse fly")) return "reversefly";
  if (n.includes("face pull")) return "facepull";
  if (n.includes("klimmzug")) return "assistedpullup";
  if (n.includes("bauchmaschine")) return "abcrunchmachine";
  if (n.includes("seilzug-crunch")) return "cablecrunch";
  if (n.includes("dip-stand") || n.includes("captain")) return "captainschair";
  if (n.includes("crosstrainer")) return "crosstrainer";
  return "generic";
}

export function getExerciseIcon(name) {
  return ICONS[classify(name)] || ICONS.generic;
}
