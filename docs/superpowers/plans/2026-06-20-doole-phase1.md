# Doole Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Phase 1 of "Doole" — a local-only, installable PWA for family fitness/nutrition tracking with multiple profiles, a daily log form, calendar navigation, and JSON backup.

**Architecture:** Vanilla HTML/CSS/JS (ES modules), no framework, no build tool. A thin `app.js` router switches between full-screen views (`profileSelect`, `dailyLogView`, `settingsView`) rendered into a shared `#app-content` element. All persistence goes through a generic IndexedDB wrapper (`db.js`); domain modules (`profiles.js`, `dailyLog.js`) sit on top of it and know nothing about the DOM. View modules know the domain modules but not each other.

**Tech Stack:** HTML5, CSS3 (custom properties for design tokens), JavaScript ES modules, IndexedDB, Service Worker / Web App Manifest (PWA). No npm dependencies are shipped in the app itself; `npx serve` is used only as a local dev server during testing.

## Global Constraints

- No server, no external runtime services — the shipped app must work fully offline after first load.
- All data lives in IndexedDB only; no automated test framework is used in Phase 1 (per spec) — every task is verified by manual browser testing with an exact procedure and expected result.
- Fonts and icons are bundled locally (no Google Fonts CDN at runtime).
- Colors: background `#F5EEDF`, surface `#FBF6EA`, primary `#B3552C`, accent `#D9A441`, secondary `#27543F`, text `#262626`, muted text `#8a8473`, border `#ECE2CC` — exact hex values, do not approximate.
- Fonts: headlines `Fraunces`, body/UI `Work Sans`.
- Spacing scale: 4/8/12/16/24/32/48px. Type scale: 13/16/18/20/28px (16px is the minimum body size).
- Touch targets minimum 44×44px. No emoji used as functional icons — use the SVG icon set from `js/icons.js`.
- Code comments are written in German (the user is a beginner reading German).
- All commits are local (this repo has no remote); commit after every task.

---

### Task 1: Project skeleton, design tokens, fonts, and icon set

**Files:**
- Create: `index.html`
- Create: `css/tokens.css`
- Create: `css/styles.css`
- Create: `js/icons.js`
- Create: `assets/fonts/` (font files, downloaded — see Step 1)

**Interfaces:**
- Produces: CSS custom properties (`--color-*`, `--font-*`, `--space-*`, `--radius-*`) usable by all later CSS. `js/icons.js` exports named string constants `ICON_HOME`, `ICON_CALENDAR`, `ICON_CHART`, `ICON_PROFILE`, `ICON_MEAL`, `ICON_WATER`, `ICON_SLEEP`, `ICON_WEIGHT`, `ICON_ACTIVITY`, `ICON_NOTE`, `ICON_CHEVRON_LEFT`, `ICON_CHEVRON_RIGHT`, `ICON_PLUS`, `ICON_TRASH` (each an inline `<svg>...</svg>` string, stroke-based, `width="24" height="24"`, `aria-hidden="true"` — callers wrap them with their own `aria-label` on the parent button).
- Consumes: nothing (first task).

- [ ] **Step 1: Download the two font families locally**

Run from the project root:

```bash
mkdir -p assets/fonts
curl -fL "https://raw.githubusercontent.com/fontsource/font-files/main/fonts/google/fraunces/files/fraunces-latin-400-normal.woff2" -o assets/fonts/fraunces-400.woff2
curl -fL "https://raw.githubusercontent.com/fontsource/font-files/main/fonts/google/fraunces/files/fraunces-latin-600-normal.woff2" -o assets/fonts/fraunces-600.woff2
curl -fL "https://raw.githubusercontent.com/fontsource/font-files/main/fonts/google/work-sans/files/work-sans-latin-400-normal.woff2" -o assets/fonts/work-sans-400.woff2
curl -fL "https://raw.githubusercontent.com/fontsource/font-files/main/fonts/google/work-sans/files/work-sans-latin-500-normal.woff2" -o assets/fonts/work-sans-500.woff2
curl -fL "https://raw.githubusercontent.com/fontsource/font-files/main/fonts/google/work-sans/files/work-sans-latin-600-normal.woff2" -o assets/fonts/work-sans-600.woff2
ls -la assets/fonts
```

Expected: 5 `.woff2` files listed, each with a non-zero size (typically 10–50 KB).

**Fallback if any `curl` returns a 404 or an HTML error page instead of font data:** open `https://fonts.google.com/specimen/Fraunces` and `https://fonts.google.com/specimen/Work+Sans` in a browser, download the static (non-variable) family, pick weights 400/600 for Fraunces and 400/500/600 for Work Sans, convert the `.ttf` files to `.woff2` at `https://transfonter.org` (upload, check "WOFF2", download), and save them under the exact filenames used above.

- [ ] **Step 2: Create the design tokens stylesheet**

Create `css/tokens.css`:

```css
/* Design-Tokens: zentrale Variablen für Farben, Abstände, Schriftgrößen.
   Andere CSS-Dateien greifen nur über diese Variablen auf Werte zu,
   damit das Design an einer Stelle geändert werden kann. */
:root {
  /* Farben */
  --color-bg: #F5EEDF;
  --color-surface: #FBF6EA;
  --color-primary: #B3552C;
  --color-accent: #D9A441;
  --color-secondary: #27543F;
  --color-text: #262626;
  --color-text-muted: #8a8473;
  --color-border: #ECE2CC;
  --color-danger: #B3261E;

  /* Schriftarten */
  --font-headline: "Fraunces", Georgia, serif;
  --font-body: "Work Sans", -apple-system, sans-serif;

  /* Schriftgrößen-Skala */
  --font-size-label: 13px;
  --font-size-body: 16px;
  --font-size-card-title: 18px;
  --font-size-section-title: 20px;
  --font-size-display: 28px;

  /* Abstands-Skala (4/8/12/16/24/32/48px) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;

  /* Sonstiges */
  --radius-card: 14px;
  --radius-pill: 999px;
  --touch-min: 44px;
}

@font-face {
  font-family: "Fraunces";
  src: url("../assets/fonts/fraunces-400.woff2") format("woff2");
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: "Fraunces";
  src: url("../assets/fonts/fraunces-600.woff2") format("woff2");
  font-weight: 600;
  font-display: swap;
}
@font-face {
  font-family: "Work Sans";
  src: url("../assets/fonts/work-sans-400.woff2") format("woff2");
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: "Work Sans";
  src: url("../assets/fonts/work-sans-500.woff2") format("woff2");
  font-weight: 500;
  font-display: swap;
}
@font-face {
  font-family: "Work Sans";
  src: url("../assets/fonts/work-sans-600.woff2") format("woff2");
  font-weight: 600;
  font-display: swap;
}
```

- [ ] **Step 3: Create the base stylesheet with app shell layout**

Create `css/styles.css`:

```css
/* Basis-Reset und Grundlayout für die App-Hülle (Header, Inhalt, Bottom-Nav) */
* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: var(--font-size-body);
  line-height: 1.5;
}

h1, h2, h3 {
  font-family: var(--font-headline);
  margin: 0;
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}

.app-header {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary) 75%, var(--color-accent) 75%, var(--color-accent) 100%);
  color: #fff;
  padding: var(--space-4) var(--space-4) var(--space-3);
  flex-shrink: 0;
}

.app-content {
  flex: 1;
  padding: var(--space-4);
  padding-bottom: calc(var(--space-7) + var(--touch-min));
  overflow-y: auto;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  background: #fff;
  border-top: 1px solid var(--color-border);
  padding: var(--space-2) 0;
  padding-bottom: max(var(--space-2), env(safe-area-inset-bottom));
}

.bottom-nav .nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: var(--touch-min);
  min-height: var(--touch-min);
  justify-content: center;
  font-size: var(--font-size-label);
  color: var(--color-text-muted);
  background: none;
  border: none;
  font-family: var(--font-body);
}

.bottom-nav .nav-item.active {
  color: var(--color-primary);
  font-weight: 600;
}

.bottom-nav .nav-item:disabled {
  opacity: 0.5;
}

.section-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: var(--space-4);
  margin-bottom: var(--space-3);
}

.section-card h3 {
  font-size: var(--font-size-card-title);
  color: var(--color-secondary);
  margin-bottom: var(--space-3);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.field {
  margin-bottom: var(--space-3);
}

.field label {
  display: block;
  font-size: var(--font-size-label);
  color: var(--color-text-muted);
  text-transform: uppercase;
  margin-bottom: var(--space-1);
}

.field input, .field select, .field textarea {
  width: 100%;
  min-height: var(--touch-min);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--space-2);
  font-family: var(--font-body);
  font-size: var(--font-size-body);
  background: #fff;
  color: var(--color-text);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: var(--touch-min);
  min-width: var(--touch-min);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-pill);
  border: none;
  font-family: var(--font-body);
  font-weight: 600;
  font-size: var(--font-size-body);
  cursor: pointer;
}

.btn-primary {
  background: var(--color-primary);
  color: #fff;
}

.btn-secondary {
  background: var(--color-surface);
  color: var(--color-secondary);
  border: 1px solid var(--color-border);
}

#toast-root {
  position: fixed;
  bottom: calc(var(--touch-min) + var(--space-5));
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
}

.toast {
  background: var(--color-secondary);
  color: #fff;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--space-2);
  margin-bottom: var(--space-2);
  font-size: var(--font-size-body);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.toast.toast-error {
  background: var(--color-danger);
}
```

- [ ] **Step 4: Create the icon module**

Create `js/icons.js`:

```js
// Zentrales SVG-Icon-Set. Statt Emojis nutzen wir gezeichnete Strich-Icons,
// damit das Erscheinungsbild auf jedem Gerät identisch aussieht.
// Jedes Icon ist 24x24px, Strichbreite 1.75px, ohne Füllung (nur Outline).

export const ICON_HOME = `<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>`;

export const ICON_CALENDAR = `<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M8 3v4"/><path d="M16 3v4"/></svg>`;

export const ICON_CHART = `<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10"/><path d="M12 20V4"/><path d="M20 20v-7"/></svg>`;

export const ICON_PROFILE = `<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>`;

export const ICON_MEAL = `<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v7a3 3 0 003 3v8"/><path d="M9 3v7"/><path d="M6 3v4"/><path d="M18 3c-2 2-2 5-2 7 0 1.5 1 2.5 2 2.5V21"/></svg>`;

export const ICON_WATER = `<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s7 7.5 7 12a7 7 0 01-14 0c0-4.5 7-12 7-12z"/></svg>`;

export const ICON_SLEEP = `<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 119.5 4a6.5 6.5 0 1010.5 10.5z"/></svg>`;

export const ICON_WEIGHT = `<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9 12a3 3 0 016 0"/></svg>`;

export const ICON_ACTIVITY = `<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 13h3l3 7 4-14 3 7h5"/></svg>`;

export const ICON_NOTE = `<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h11l3 3v13H5z"/><path d="M9 9h6"/><path d="M9 13h6"/><path d="M9 17h4"/></svg>`;

export const ICON_CHEVRON_LEFT = `<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>`;

export const ICON_CHEVRON_RIGHT = `<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>`;

export const ICON_PLUS = `<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>`;

export const ICON_TRASH = `<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/></svg>`;
```

- [ ] **Step 5: Create the HTML shell**

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Doole</title>
  <link rel="manifest" href="manifest.json">
  <meta name="theme-color" content="#B3552C">
  <link rel="stylesheet" href="css/tokens.css">
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <div id="app">
    <header id="app-header" class="app-header"></header>
    <main id="app-content" class="app-content"></main>
    <nav id="app-bottom-nav" class="bottom-nav"></nav>
  </div>
  <div id="toast-root"></div>
  <script type="module" src="js/app.js"></script>
</body>
</html>
```

Also create a placeholder `js/app.js` so the page doesn't 404 on load (this file will be fully implemented in Task 4):

```js
// Wird in Task 4 vollständig implementiert.
document.getElementById("app-content").textContent = "Doole wird geladen...";
```

- [ ] **Step 6: Manually verify in the browser**

Run:

```bash
npx serve . -l 3000
```

Open `http://localhost:3000` in a browser. Expected: a page with a terracotta/gold gradient header bar, a cream background, and the text "Doole wird geladen..." in the body. Open DevTools → Network tab, reload, and confirm the five `.woff2` files load with status 200 (not 404). Stop the server with Ctrl+C when done.

- [ ] **Step 7: Commit**

```bash
git add index.html css/tokens.css css/styles.css js/icons.js js/app.js assets/fonts
git commit -m "Projekt-Grundgerüst: HTML-Shell, Design-Tokens, Schriftarten, Icon-Set"
```

---

### Task 2: IndexedDB wrapper and toast notifications

**Files:**
- Create: `js/db.js`
- Create: `js/toast.js`

**Interfaces:**
- Produces: `openDatabase(): Promise<IDBDatabase>`, `putItem(storeName: string, item: object): Promise<void>`, `getItem(storeName: string, key: string|number): Promise<object|undefined>`, `getAllItems(storeName: string): Promise<object[]>`, `deleteItem(storeName: string, key: string|number): Promise<void>`. `showToast(message: string, type?: "info"|"error"): void`.
- Consumes: nothing from prior tasks (pure infrastructure).

- [ ] **Step 1: Create the toast helper**

Create `js/toast.js`:

```js
// Zeigt kurze Hinweis-Meldungen am unteren Bildschirmrand an (z.B. Fehler).
// Wird automatisch nach 4 Sekunden wieder entfernt.
export function showToast(message, type = "info") {
  const root = document.getElementById("toast-root");
  const el = document.createElement("div");
  el.className = type === "error" ? "toast toast-error" : "toast";
  el.textContent = message;
  root.appendChild(el);
  setTimeout(() => {
    el.remove();
  }, 4000);
}
```

- [ ] **Step 2: Create the IndexedDB wrapper**

Create `js/db.js`:

```js
// Generischer IndexedDB-Wrapper. Dieses Modul kennt nur "Stores" (Tabellen)
// und "Items" (Datensätze) - es weiß nichts über Profile oder Tagesprotokolle.
// So bleibt es wiederverwendbar, falls in späteren Phasen neue Stores nötig sind.

const DB_NAME = "doole-db";
const DB_VERSION = 1;

let dbPromise = null;

// Öffnet die Datenbank (oder legt sie beim ersten Aufruf an) und gibt
// immer dieselbe Promise zurück, damit die DB nur einmal geöffnet wird.
export function openDatabase() {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("profiles")) {
        db.createObjectStore("profiles", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("dailyLogs")) {
        db.createObjectStore("dailyLogs", { keyPath: "id" });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

// Speichert ein Item (legt es an oder überschreibt ein vorhandenes mit
// demselben Key). Gibt bei Profilen das gespeicherte Item inkl. neuer id zurück.
export async function putItem(storeName, item) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => {
      resolve({ ...item, id: request.result });
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function getItem(storeName, key) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function getAllItems(storeName) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function deleteItem(storeName, key) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => {
      resolve();
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}
```

- [ ] **Step 3: Manually verify in the browser console**

Run `npx serve . -l 3000`, open `http://localhost:3000`, open DevTools Console, and paste:

```js
const db = await import("./js/db.js");
await db.putItem("profiles", { name: "Test", color: "#B3552C", icon: "A", createdAt: Date.now() });
console.log(await db.getAllItems("profiles"));
```

Expected: an array with one object containing `id: 1, name: "Test", ...`. Then open DevTools → Application → IndexedDB → `doole-db` → `profiles` and confirm the row is visible there too.

Clean up the test row so later tasks start from an empty store:

```js
await db.deleteItem("profiles", 1);
```

- [ ] **Step 4: Commit**

```bash
git add js/db.js js/toast.js
git commit -m "IndexedDB-Wrapper und Toast-Benachrichtigungen"
```

---

### Task 3: Profile domain logic

**Files:**
- Create: `js/profiles.js`

**Interfaces:**
- Consumes: `putItem`, `getAllItems`, `deleteItem` from `js/db.js` (Task 2); `showToast` from `js/toast.js` (Task 2).
- Produces: `createProfile({ name, color, icon }): Promise<{id, name, color, icon, createdAt}>`, `getAllProfiles(): Promise<Array<{id, name, color, icon, createdAt}>>`, `deleteProfile(id): Promise<void>`.

- [ ] **Step 1: Create the profiles module**

Create `js/profiles.js`:

```js
// Fachlogik für Familienprofile. Kennt nur Daten, keine UI.
import { putItem, getAllItems, deleteItem } from "./db.js";
import { showToast } from "./toast.js";

export async function createProfile({ name, color, icon }) {
  try {
    return await putItem("profiles", { name, color, icon, createdAt: Date.now() });
  } catch (err) {
    showToast("Profil konnte nicht angelegt werden.", "error");
    throw err;
  }
}

export async function getAllProfiles() {
  try {
    return await getAllItems("profiles");
  } catch (err) {
    showToast("Profile konnten nicht geladen werden.", "error");
    return [];
  }
}

export async function deleteProfile(id) {
  try {
    await deleteItem("profiles", id);
  } catch (err) {
    showToast("Profil konnte nicht gelöscht werden.", "error");
    throw err;
  }
}
```

- [ ] **Step 2: Manually verify in the browser console**

With `npx serve . -l 3000` running and the page open, in DevTools Console:

```js
const profiles = await import("./js/profiles.js");
const created = await profiles.createProfile({ name: "Amara", color: "#B3552C", icon: "A" });
console.log(created);
console.log(await profiles.getAllProfiles());
await profiles.deleteProfile(created.id);
console.log(await profiles.getAllProfiles());
```

Expected: first log shows `{id: 1, name: "Amara", ...}`, second log shows an array with that one profile, third log (after delete) shows an empty array `[]`.

- [ ] **Step 3: Commit**

```bash
git add js/profiles.js
git commit -m "Profil-Fachlogik (anlegen, laden, löschen)"
```

---

### Task 4: Profile selection view and app router

**Files:**
- Create: `js/views/profileSelect.js`
- Modify: `js/app.js` (replace placeholder content from Task 1)

**Interfaces:**
- Consumes: `getAllProfiles`, `createProfile` from `js/profiles.js` (Task 3); `ICON_PLUS` from `js/icons.js` (Task 1).
- Produces: `renderProfileSelect(container: HTMLElement, onProfileSelected: (profile) => void): Promise<void>`. `app.js` produces a module-level `state` object `{ currentProfile, currentDateISO }` and a `showProfileSelect()` function used by `js/views/settingsView.js` in Task 9.

- [ ] **Step 1: Create the profile selection view**

Create `js/views/profileSelect.js`:

```js
// Bildschirm: Profil auswählen oder neues Profil anlegen.
import { getAllProfiles, createProfile } from "../profiles.js";
import { ICON_PLUS } from "../icons.js";

const AVAILABLE_COLORS = ["#B3552C", "#D9A441", "#27543F", "#2C3E66"];

export async function renderProfileSelect(container, onProfileSelected) {
  const profiles = await getAllProfiles();

  container.innerHTML = `
    <h2 style="font-size:var(--font-size-section-title);color:var(--color-secondary);margin-bottom:var(--space-4);">Wer bist du?</h2>
    <div id="profile-list" style="display:flex;flex-direction:column;gap:var(--space-3);margin-bottom:var(--space-5);"></div>
    <div class="section-card">
      <h3>Neues Profil anlegen</h3>
      <form id="new-profile-form">
        <div class="field">
          <label for="new-profile-name">Name</label>
          <input id="new-profile-name" name="name" type="text" required maxlength="40">
        </div>
        <div class="field">
          <label>Farbe</label>
          <div id="color-picker" style="display:flex;gap:var(--space-2);"></div>
        </div>
        <button type="submit" class="btn btn-primary">${ICON_PLUS} Profil anlegen</button>
      </form>
    </div>
  `;

  const list = container.querySelector("#profile-list");
  profiles.forEach((profile) => {
    const btn = document.createElement("button");
    btn.className = "btn btn-secondary";
    btn.style.justifyContent = "flex-start";
    btn.style.width = "100%";
    btn.innerHTML = `
      <span style="width:32px;height:32px;border-radius:50%;background:${profile.color};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600;">${profile.icon}</span>
      <span>${profile.name}</span>
    `;
    btn.addEventListener("click", () => onProfileSelected(profile));
    list.appendChild(btn);
  });

  const colorPicker = container.querySelector("#color-picker");
  let selectedColor = AVAILABLE_COLORS[0];
  AVAILABLE_COLORS.forEach((color, index) => {
    const swatch = document.createElement("button");
    swatch.type = "button";
    swatch.style.width = "var(--touch-min)";
    swatch.style.height = "var(--touch-min)";
    swatch.style.borderRadius = "50%";
    swatch.style.background = color;
    swatch.style.border = index === 0 ? "3px solid var(--color-text)" : "3px solid transparent";
    swatch.addEventListener("click", () => {
      selectedColor = color;
      [...colorPicker.children].forEach((c) => (c.style.border = "3px solid transparent"));
      swatch.style.border = "3px solid var(--color-text)";
    });
    colorPicker.appendChild(swatch);
  });

  container.querySelector("#new-profile-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = container.querySelector("#new-profile-name").value.trim();
    if (!name) return;
    const icon = name.charAt(0).toUpperCase();
    const created = await createProfile({ name, color: selectedColor, icon });
    onProfileSelected(created);
  });
}
```

- [ ] **Step 2: Wire it up in the app router**

Replace the contents of `js/app.js`:

```js
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
```

- [ ] **Step 3: Manually verify in the browser**

Run `npx serve . -l 3000`, open `http://localhost:3000`. Expected: "Wer bist du?" heading, an empty profile list, and a "Neues Profil anlegen" card. Type a name, pick a color swatch (border highlight moves), click "Profil anlegen". Expected: the page now shows "Profil ausgewählt: <name>". Reload the page: the new profile now appears as a button in the list; clicking it shows "Profil ausgewählt: <name>" again.

- [ ] **Step 4: Commit**

```bash
git add js/views/profileSelect.js js/app.js
git commit -m "Profil-Auswahl-Screen und App-Router-Grundgerüst"
```

---

### Task 5: Date helper functions and date navigation component

**Files:**
- Create: `js/calendar.js`

**Interfaces:**
- Consumes: `ICON_CHEVRON_LEFT`, `ICON_CHEVRON_RIGHT` from `js/icons.js` (Task 1).
- Produces: `todayISO(): string`, `addDaysISO(dateISO: string, n: number): string`, `formatDateDisplay(dateISO: string): string`, `getMonthMatrix(year: number, month: number): Array<Array<string|null>>` (month is 0-based, each inner array is one calendar week of 7 cells, `null` for days outside the month), `renderDateNav(container: HTMLElement, dateISO: string, onDateChange: (newDateISO: string) => void): void`.

- [ ] **Step 1: Create the calendar module**

Create `js/calendar.js`:

```js
// Datums-Hilfsfunktionen und die Datums-Navigationsleiste (Pfeile vor/zurück
// plus ein Kalender-Popup zum direkten Springen zu einem Tag).
// Alle Daten werden als ISO-String "YYYY-MM-DD" gespeichert und verglichen,
// damit es keine Zeitzonen-Verwirrung gibt.
import { ICON_CHEVRON_LEFT, ICON_CHEVRON_RIGHT } from "./icons.js";

const WEEKDAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

function pad2(n) {
  return String(n).padStart(2, "0");
}

export function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

export function addDaysISO(dateISO, n) {
  const [year, month, day] = dateISO.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + n);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function formatDateDisplay(dateISO) {
  const [year, month, day] = dateISO.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return `${WEEKDAYS[date.getDay()]}, ${day}. ${MONTHS[month - 1]} ${year}`;
}

// Liefert eine Monatsansicht als Wochen-Array für das Kalender-Popup.
// month ist 0-basiert (0 = Januar). Tage außerhalb des Monats sind null.
export function getMonthMatrix(year, month) {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(`${year}-${pad2(month + 1)}-${pad2(day)}`);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

// Rendert die Datums-Navigation: Pfeile vor/zurück plus ein Datum, das beim
// Antippen ein Monats-Kalender-Popup öffnet. onDateChange wird mit dem neuen
// Datum aufgerufen, der Aufrufer ist dafür verantwortlich, die Ansicht neu zu rendern.
export function renderDateNav(container, dateISO, onDateChange) {
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;color:#fff;position:relative;">
      <button type="button" id="date-prev" aria-label="Vorheriger Tag" style="background:none;border:none;color:#fff;min-width:var(--touch-min);min-height:var(--touch-min);">${ICON_CHEVRON_LEFT}</button>
      <button type="button" id="date-label" style="background:none;border:none;color:#fff;font-family:var(--font-headline);font-size:var(--font-size-card-title);font-weight:600;min-height:var(--touch-min);">${formatDateDisplay(dateISO)}</button>
      <button type="button" id="date-next" aria-label="Nächster Tag" style="background:none;border:none;color:#fff;min-width:var(--touch-min);min-height:var(--touch-min);">${ICON_CHEVRON_RIGHT}</button>
      <div id="date-picker-popup" style="display:none;position:absolute;top:100%;left:0;right:0;background:#fff;color:var(--color-text);border-radius:var(--space-2);padding:var(--space-3);box-shadow:0 4px 12px rgba(0,0,0,0.25);z-index:10;"></div>
    </div>
  `;
  container.querySelector("#date-prev").addEventListener("click", () => onDateChange(addDaysISO(dateISO, -1)));
  container.querySelector("#date-next").addEventListener("click", () => onDateChange(addDaysISO(dateISO, 1)));

  let popupYear = Number(dateISO.split("-")[0]);
  let popupMonth = Number(dateISO.split("-")[1]) - 1;

  function renderPopup() {
    const popup = container.querySelector("#date-picker-popup");
    const weeks = getMonthMatrix(popupYear, popupMonth);
    popup.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-2);">
        <button type="button" id="popup-prev-month" aria-label="Vorheriger Monat">${ICON_CHEVRON_LEFT}</button>
        <strong>${MONTHS[popupMonth]} ${popupYear}</strong>
        <button type="button" id="popup-next-month" aria-label="Nächster Monat">${ICON_CHEVRON_RIGHT}</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;">
        ${weeks.flat().map((cellISO) => `
          <button type="button" data-day-iso="${cellISO || ""}" style="min-height:var(--touch-min);background:${cellISO === dateISO ? "var(--color-primary)" : "none"};color:${cellISO === dateISO ? "#fff" : "var(--color-text)"};border:none;border-radius:var(--space-1);">${cellISO ? Number(cellISO.split("-")[2]) : ""}</button>
        `).join("")}
      </div>
    `;
    popup.querySelector("#popup-prev-month").addEventListener("click", () => {
      popupMonth -= 1;
      if (popupMonth < 0) { popupMonth = 11; popupYear -= 1; }
      renderPopup();
    });
    popup.querySelector("#popup-next-month").addEventListener("click", () => {
      popupMonth += 1;
      if (popupMonth > 11) { popupMonth = 0; popupYear += 1; }
      renderPopup();
    });
    popup.querySelectorAll("[data-day-iso]").forEach((btn) => {
      const cellISO = btn.getAttribute("data-day-iso");
      if (!cellISO) return;
      btn.addEventListener("click", () => {
        popup.style.display = "none";
        onDateChange(cellISO);
      });
    });
  }

  container.querySelector("#date-label").addEventListener("click", () => {
    const popup = container.querySelector("#date-picker-popup");
    const isOpen = popup.style.display === "block";
    if (isOpen) {
      popup.style.display = "none";
    } else {
      renderPopup();
      popup.style.display = "block";
    }
  });
}
```

- [ ] **Step 2: Manually verify in the browser console**

With the dev server running, in DevTools Console:

```js
const cal = await import("./js/calendar.js");
console.log(cal.todayISO());
console.log(cal.addDaysISO("2026-06-20", 1));
console.log(cal.addDaysISO("2026-06-01", -1));
console.log(cal.formatDateDisplay("2026-06-20"));
console.log(cal.getMonthMatrix(2026, 5).length);
console.log(cal.getMonthMatrix(2026, 5)[0]);
```

Expected: today's date as `YYYY-MM-DD`; `"2026-06-21"`; `"2026-05-31"`; `"Samstag, 20. Juni 2026"`; a number (5 or 6, the week-row count for June 2026); the first week array containing some `null` entries followed by `"2026-06-01"` onward (June 1, 2026 is a Monday, so the array starts with one `null` for Sunday).

- [ ] **Step 3: Commit**

```bash
git add js/calendar.js
git commit -m "Datums-Hilfsfunktionen und Datums-Navigationsleiste"
```

---

### Task 6: Daily log domain logic

**Files:**
- Create: `js/dailyLog.js`

**Interfaces:**
- Consumes: `getItem`, `putItem` from `js/db.js` (Task 2); `showToast` from `js/toast.js` (Task 2).
- Produces: `createEmptyDailyLog(profileId, dateISO): object` (shape documented in Step 1), `getDailyLog(profileId, dateISO): Promise<object>`, `saveDailyLog(log): Promise<void>`.

- [ ] **Step 1: Create the daily log module**

Create `js/dailyLog.js`:

```js
// Fachlogik für Tagesprotokolle. Ein Eintrag pro Profil und Tag.
import { getItem, putItem } from "./db.js";
import { showToast } from "./toast.js";

const MEAL_SLOTS = ["fruehstueck", "snack1", "mittag", "snack2", "abendbrot"];

function emptyMeal() {
  return { zeit: "", was: "", getraenk: "", portion: "", saettigung: null };
}

export function createEmptyDailyLog(profileId, dateISO) {
  const meals = {};
  MEAL_SLOTS.forEach((slot) => {
    meals[slot] = emptyMeal();
  });

  return {
    id: `${profileId}_${dateISO}`,
    profileId,
    date: dateISO,
    meals,
    waterMl: null,
    sleep: { stunden: null, qualitaet: null },
    weightKg: null,
    alcohol: { getrunken: false, info: "" },
    supplements: "",
    activities: [],
    notes: "",
  };
}

export async function getDailyLog(profileId, dateISO) {
  try {
    const existing = await getItem("dailyLogs", `${profileId}_${dateISO}`);
    return existing || createEmptyDailyLog(profileId, dateISO);
  } catch (err) {
    showToast("Tagesprotokoll konnte nicht geladen werden.", "error");
    return createEmptyDailyLog(profileId, dateISO);
  }
}

export async function saveDailyLog(log) {
  try {
    await putItem("dailyLogs", log);
  } catch (err) {
    showToast("Speichern fehlgeschlagen, bitte erneut versuchen.", "error");
    throw err;
  }
}

export const MEAL_SLOT_LABELS = {
  fruehstueck: "Frühstück",
  snack1: "Snack",
  mittag: "Mittag",
  snack2: "Snack",
  abendbrot: "Abendbrot",
};
```

- [ ] **Step 2: Manually verify in the browser console**

With the dev server running, in DevTools Console:

```js
const log = await import("./js/dailyLog.js");
const empty = await log.getDailyLog(1, "2026-06-20");
console.log(empty);
empty.waterMl = 1000;
await log.saveDailyLog(empty);
console.log(await log.getDailyLog(1, "2026-06-20"));
```

Expected: first log shows an object with `id: "1_2026-06-20"`, all five meal slots present, `waterMl: null`. Second log (after save and reload) shows `waterMl: 1000`. Confirm in DevTools → Application → IndexedDB → `doole-db` → `dailyLogs` that the row `1_2026-06-20` exists.

- [ ] **Step 3: Commit**

```bash
git add js/dailyLog.js
git commit -m "Tagesprotokoll-Fachlogik (laden, speichern, leeres Protokoll)"
```

---

### Task 7: Daily log view — meals, water, sleep, weight

**Files:**
- Create: `js/views/dailyLogView.js`
- Modify: `js/app.js` (wire profile selection to the daily log view instead of the placeholder text)

**Interfaces:**
- Consumes: `getDailyLog`, `saveDailyLog`, `MEAL_SLOT_LABELS` from `js/dailyLog.js` (Task 6); `renderDateNav`, `todayISO` from `js/calendar.js` (Task 5); `ICON_MEAL`, `ICON_WATER`, `ICON_SLEEP`, `ICON_WEIGHT` from `js/icons.js` (Task 1).
- Produces: `renderDailyLogView(container: HTMLElement, headerContainer: HTMLElement, profile: object, dateISO: string, onDateChange: (newDateISO: string) => void): Promise<void>` — Task 8 extends this same file to add alcohol/supplements/activities/notes to the same render call.

- [ ] **Step 1: Create the daily log view with meals and vitals**

Create `js/views/dailyLogView.js`:

```js
// Bildschirm: Tagesprotokoll für ein Profil an einem bestimmten Tag.
import { getDailyLog, saveDailyLog, MEAL_SLOT_LABELS } from "../dailyLog.js";
import { renderDateNav } from "../calendar.js";
import { ICON_MEAL, ICON_WATER, ICON_SLEEP, ICON_WEIGHT } from "../icons.js";

function mealCardHtml(slot, meal) {
  const label = MEAL_SLOT_LABELS[slot];
  return `
    <div class="section-card" data-meal-slot="${slot}">
      <h3>${ICON_MEAL} ${label}</h3>
      <div class="field">
        <label for="${slot}-zeit">Uhrzeit</label>
        <input id="${slot}-zeit" type="time" value="${meal.zeit || ""}">
      </div>
      <div class="field">
        <label for="${slot}-was">Was gegessen</label>
        <input id="${slot}-was" type="text" value="${meal.was || ""}">
      </div>
      <div class="field">
        <label for="${slot}-getraenk">Getränk</label>
        <input id="${slot}-getraenk" type="text" value="${meal.getraenk || ""}">
      </div>
      <div class="field">
        <label for="${slot}-portion">Portionsgröße</label>
        <input id="${slot}-portion" type="text" value="${meal.portion || ""}">
      </div>
      <div class="field">
        <label for="${slot}-saettigung">Sättigung (1-5)</label>
        <input id="${slot}-saettigung" type="number" min="1" max="5" value="${meal.saettigung ?? ""}">
      </div>
    </div>
  `;
}

export async function renderDailyLogView(container, headerContainer, profile, dateISO, onDateChange) {
  renderDateNav(headerContainer, dateISO, onDateChange);
  const log = await getDailyLog(profile.id, dateISO);

  container.innerHTML = `
    ${Object.entries(log.meals).map(([slot, meal]) => mealCardHtml(slot, meal)).join("")}
    <div class="section-card">
      <h3>${ICON_WATER} Wasser, Schlaf, Gewicht</h3>
      <div class="field">
        <label for="water-ml">Wasser (ml)</label>
        <input id="water-ml" type="number" min="0" step="50" value="${log.waterMl ?? ""}">
      </div>
      <div class="field">
        <label for="sleep-hours">${ICON_SLEEP} Schlaf (Stunden)</label>
        <input id="sleep-hours" type="number" min="0" max="24" step="0.5" value="${log.sleep.stunden ?? ""}">
      </div>
      <div class="field">
        <label for="sleep-quality">Schlafqualität (1-3)</label>
        <input id="sleep-quality" type="number" min="1" max="3" value="${log.sleep.qualitaet ?? ""}">
      </div>
      <div class="field">
        <label for="weight-kg">${ICON_WEIGHT} Gewicht (kg)</label>
        <input id="weight-kg" type="number" min="0" step="0.1" value="${log.weightKg ?? ""}">
      </div>
    </div>
  `;

  // Speichert das gesamte Log neu, sobald sich ein Feld ändert.
  async function persist() {
    await saveDailyLog(log);
  }

  Object.keys(log.meals).forEach((slot) => {
    const card = container.querySelector(`[data-meal-slot="${slot}"]`);
    card.querySelector(`#${slot}-zeit`).addEventListener("change", (e) => { log.meals[slot].zeit = e.target.value; persist(); });
    card.querySelector(`#${slot}-was`).addEventListener("change", (e) => { log.meals[slot].was = e.target.value; persist(); });
    card.querySelector(`#${slot}-getraenk`).addEventListener("change", (e) => { log.meals[slot].getraenk = e.target.value; persist(); });
    card.querySelector(`#${slot}-portion`).addEventListener("change", (e) => { log.meals[slot].portion = e.target.value; persist(); });
    card.querySelector(`#${slot}-saettigung`).addEventListener("change", (e) => { log.meals[slot].saettigung = e.target.value ? Number(e.target.value) : null; persist(); });
  });

  container.querySelector("#water-ml").addEventListener("change", (e) => { log.waterMl = e.target.value ? Number(e.target.value) : null; persist(); });
  container.querySelector("#sleep-hours").addEventListener("change", (e) => { log.sleep.stunden = e.target.value ? Number(e.target.value) : null; persist(); });
  container.querySelector("#sleep-quality").addEventListener("change", (e) => { log.sleep.qualitaet = e.target.value ? Number(e.target.value) : null; persist(); });
  container.querySelector("#weight-kg").addEventListener("change", (e) => { log.weightKg = e.target.value ? Number(e.target.value) : null; persist(); });
}
```

- [ ] **Step 2: Wire the daily log view into the app router**

In `js/app.js`, replace the import line and the `onProfileSelected` callback body:

```js
import { renderProfileSelect } from "./views/profileSelect.js";
import { renderDailyLogView } from "./views/dailyLogView.js";
import { todayISO } from "./calendar.js";
```

Replace the `showProfileSelect` function body's callback (the line `contentEl.innerHTML = ...`) with:

```js
export function showProfileSelect() {
  state.currentProfile = null;
  headerEl.innerHTML = `<h1 style="font-family:var(--font-headline);font-size:var(--font-size-display);color:#fff;">Doole</h1>`;
  renderProfileSelect(contentEl, (profile) => {
    state.currentProfile = profile;
    state.currentDateISO = todayISO();
    showDailyLog();
  });
}

function showDailyLog() {
  renderDailyLogView(contentEl, headerEl, state.currentProfile, state.currentDateISO, (newDateISO) => {
    state.currentDateISO = newDateISO;
    showDailyLog();
  });
}
```

- [ ] **Step 3: Manually verify in the browser**

Run `npx serve . -l 3000`, open `http://localhost:3000`, select (or create) a profile. Expected: header shows date navigation with left/right arrows and today's date; content shows 5 meal cards (Frühstück, Snack, Mittag, Snack, Abendbrot) and a "Wasser, Schlaf, Gewicht" card. Fill in "Frühstück → Was gegessen" with "Haferbrei" and tab out of the field. Reload the page. Expected: "Haferbrei" is still there. Click the left arrow. Expected: date changes to yesterday and the form is empty (different day = different log). Click the right arrow twice to return to today: "Haferbrei" reappears. Click the date label itself (not the arrows). Expected: a calendar grid popup opens below the header showing the current month with today highlighted; click a different day in the grid and confirm the header date updates and the popup closes.

- [ ] **Step 4: Commit**

```bash
git add js/views/dailyLogView.js js/app.js
git commit -m "Tagesprotokoll-Screen: Mahlzeiten, Wasser, Schlaf, Gewicht"
```

---

### Task 8: Daily log view — alcohol, supplements, activities, notes

**Files:**
- Modify: `js/views/dailyLogView.js`

**Interfaces:**
- Consumes: same as Task 7, plus `ICON_ACTIVITY`, `ICON_NOTE`, `ICON_PLUS`, `ICON_TRASH` from `js/icons.js` (Task 1).
- Produces: extends `renderDailyLogView` (same signature as Task 7) to also render and persist `alcohol`, `supplements`, `activities`, `notes`.

- [ ] **Step 1: Extend the icon imports**

In `js/views/dailyLogView.js`, replace the icon import line:

```js
import { ICON_MEAL, ICON_WATER, ICON_SLEEP, ICON_WEIGHT, ICON_ACTIVITY, ICON_NOTE, ICON_PLUS, ICON_TRASH } from "../icons.js";
```

- [ ] **Step 2: Add an activity-row template helper**

Add this function above `renderDailyLogView` in `js/views/dailyLogView.js`:

```js
function activityRowHtml(index, activity) {
  return `
    <div class="field" data-activity-index="${index}" style="display:flex;gap:var(--space-2);align-items:flex-end;">
      <div style="flex:2;">
        <label for="activity-${index}-art">Art</label>
        <input id="activity-${index}-art" type="text" value="${activity.art || ""}">
      </div>
      <div style="flex:1;">
        <label for="activity-${index}-dauer">Dauer (Min)</label>
        <input id="activity-${index}-dauer" type="number" min="0" value="${activity.dauerMin ?? ""}">
      </div>
      <div style="flex:1;">
        <label for="activity-${index}-zustand">Zustand</label>
        <input id="activity-${index}-zustand" type="text" value="${activity.zustand || ""}">
      </div>
      <button type="button" class="btn btn-secondary" data-remove-activity="${index}" aria-label="Aktivität entfernen" style="flex:0;">${ICON_TRASH}</button>
    </div>
  `;
}
```

- [ ] **Step 3: Append the new section cards to the rendered HTML**

In `renderDailyLogView`, change the `container.innerHTML = ...` block to also include the new cards after the vitals card (insert before the closing backtick of the template literal, right after the `</div>` that closes the "Wasser, Schlaf, Gewicht" `.section-card`):

```js
  container.innerHTML = `
    ${Object.entries(log.meals).map(([slot, meal]) => mealCardHtml(slot, meal)).join("")}
    <div class="section-card">
      <h3>${ICON_WATER} Wasser, Schlaf, Gewicht</h3>
      <div class="field">
        <label for="water-ml">Wasser (ml)</label>
        <input id="water-ml" type="number" min="0" step="50" value="${log.waterMl ?? ""}">
      </div>
      <div class="field">
        <label for="sleep-hours">${ICON_SLEEP} Schlaf (Stunden)</label>
        <input id="sleep-hours" type="number" min="0" max="24" step="0.5" value="${log.sleep.stunden ?? ""}">
      </div>
      <div class="field">
        <label for="sleep-quality">Schlafqualität (1-3)</label>
        <input id="sleep-quality" type="number" min="1" max="3" value="${log.sleep.qualitaet ?? ""}">
      </div>
      <div class="field">
        <label for="weight-kg">${ICON_WEIGHT} Gewicht (kg)</label>
        <input id="weight-kg" type="number" min="0" step="0.1" value="${log.weightKg ?? ""}">
      </div>
    </div>
    <div class="section-card">
      <h3>Alkohol &amp; Supplements</h3>
      <div class="field" style="display:flex;align-items:center;gap:var(--space-2);">
        <input id="alcohol-yes" type="checkbox" style="width:auto;min-height:auto;" ${log.alcohol.getrunken ? "checked" : ""}>
        <label for="alcohol-yes" style="margin:0;">Alkohol getrunken</label>
      </div>
      <div class="field">
        <label for="alcohol-info">Art / Menge</label>
        <input id="alcohol-info" type="text" value="${log.alcohol.info || ""}">
      </div>
      <div class="field">
        <label for="supplements">Supplements</label>
        <input id="supplements" type="text" value="${log.supplements || ""}">
      </div>
    </div>
    <div class="section-card">
      <h3>${ICON_ACTIVITY} Aktivität</h3>
      <div id="activity-list" style="display:flex;flex-direction:column;gap:var(--space-2);margin-bottom:var(--space-3);">
        ${log.activities.map((activity, index) => activityRowHtml(index, activity)).join("")}
      </div>
      <button type="button" id="add-activity" class="btn btn-secondary">${ICON_PLUS} Aktivität hinzufügen</button>
    </div>
    <div class="section-card">
      <h3>${ICON_NOTE} Notizen</h3>
      <div class="field">
        <textarea id="notes" rows="3">${log.notes || ""}</textarea>
      </div>
    </div>
  `;
```

- [ ] **Step 4: Wire up the new fields and the activity list**

In `renderDailyLogView`, after the existing `container.querySelector("#weight-kg")...` listener line, add:

```js
  container.querySelector("#alcohol-yes").addEventListener("change", (e) => { log.alcohol.getrunken = e.target.checked; persist(); });
  container.querySelector("#alcohol-info").addEventListener("change", (e) => { log.alcohol.info = e.target.value; persist(); });
  container.querySelector("#supplements").addEventListener("change", (e) => { log.supplements = e.target.value; persist(); });
  container.querySelector("#notes").addEventListener("change", (e) => { log.notes = e.target.value; persist(); });

  function wireActivityRow(index) {
    const row = container.querySelector(`[data-activity-index="${index}"]`);
    row.querySelector(`#activity-${index}-art`).addEventListener("change", (e) => { log.activities[index].art = e.target.value; persist(); });
    row.querySelector(`#activity-${index}-dauer`).addEventListener("change", (e) => { log.activities[index].dauerMin = e.target.value ? Number(e.target.value) : null; persist(); });
    row.querySelector(`#activity-${index}-zustand`).addEventListener("change", (e) => { log.activities[index].zustand = e.target.value; persist(); });
    row.querySelector(`[data-remove-activity="${index}"]`).addEventListener("click", () => {
      log.activities.splice(index, 1);
      persist();
      renderDailyLogView(container, headerContainer, profile, dateISO, onDateChange);
    });
  }

  log.activities.forEach((_, index) => wireActivityRow(index));

  container.querySelector("#add-activity").addEventListener("click", () => {
    log.activities.push({ art: "", dauerMin: null, zustand: "" });
    persist();
    renderDailyLogView(container, headerContainer, profile, dateISO, onDateChange);
  });
```

- [ ] **Step 5: Manually verify in the browser**

Run `npx serve . -l 3000`, open a profile's daily log. Expected: cards for "Alkohol & Supplements", "Aktivität" (with an empty list and an "Aktivität hinzufügen" button), and "Notizen" appear below the vitals card. Click "Aktivität hinzufügen" twice: two empty activity rows appear. Fill in "Joggen" / "30" / "gut" in the first row. Click the trash icon on the second row: it disappears and the first row's data is unaffected. Reload the page: the "Joggen" activity row is still there with its values. Check the "Alkohol getrunken" box, type a note, reload: both persist.

- [ ] **Step 6: Commit**

```bash
git add js/views/dailyLogView.js
git commit -m "Tagesprotokoll-Screen: Alkohol, Supplements, Aktivitäten, Notizen"
```

---

### Task 9: Bottom navigation and settings view (profile switching/deleting)

**Files:**
- Create: `js/views/settingsView.js`
- Modify: `js/app.js` (render bottom nav, add `showSettings` routing)

**Interfaces:**
- Consumes: `getAllProfiles`, `deleteProfile` from `js/profiles.js` (Task 3); `ICON_HOME`, `ICON_CALENDAR`, `ICON_CHART`, `ICON_PROFILE`, `ICON_TRASH` from `js/icons.js` (Task 1); `showProfileSelect` (defined in `js/app.js` itself).
- Produces: `renderSettingsView(container: HTMLElement, currentProfile: object, callbacks: { onProfileSwitch: (profile) => void, onAllProfilesDeleted: () => void }): Promise<void>`. `js/app.js` produces `renderBottomNav(activeTab: "home"|"settings")`.

- [ ] **Step 1: Create the settings view**

Create `js/views/settingsView.js`:

```js
// Bildschirm: Einstellungen - Profil wechseln/löschen, Backup (Task 10 ergänzt Export/Import hier).
import { getAllProfiles, deleteProfile } from "../profiles.js";
import { ICON_TRASH } from "../icons.js";

export async function renderSettingsView(container, currentProfile, callbacks) {
  const profiles = await getAllProfiles();

  container.innerHTML = `
    <h2 style="font-size:var(--font-size-section-title);color:var(--color-secondary);margin-bottom:var(--space-4);">Einstellungen</h2>
    <div class="section-card">
      <h3>Profile</h3>
      <div id="settings-profile-list" style="display:flex;flex-direction:column;gap:var(--space-2);"></div>
    </div>
    <div id="backup-card"></div>
  `;

  const list = container.querySelector("#settings-profile-list");
  profiles.forEach((profile) => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "var(--space-2)";

    const switchBtn = document.createElement("button");
    switchBtn.className = "btn btn-secondary";
    switchBtn.style.flex = "1";
    switchBtn.style.justifyContent = "flex-start";
    switchBtn.textContent = profile.name + (profile.id === currentProfile.id ? " (aktiv)" : "");
    switchBtn.addEventListener("click", () => callbacks.onProfileSwitch(profile));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-secondary";
    deleteBtn.setAttribute("aria-label", `Profil ${profile.name} löschen`);
    deleteBtn.innerHTML = ICON_TRASH;
    deleteBtn.addEventListener("click", async () => {
      const confirmed = confirm(`Profil "${profile.name}" und alle zugehörigen Tagesprotokolle wirklich löschen?`);
      if (!confirmed) return;
      await deleteProfile(profile.id);
      const remaining = await getAllProfiles();
      if (remaining.length === 0) {
        callbacks.onAllProfilesDeleted();
      } else {
        renderSettingsView(container, profile.id === currentProfile.id ? remaining[0] : currentProfile, callbacks);
      }
    });

    row.appendChild(switchBtn);
    row.appendChild(deleteBtn);
    list.appendChild(row);
  });
}
```

- [ ] **Step 2: Add bottom navigation rendering and settings routing to app.js**

In `js/app.js`, add this import line alongside the existing ones:

```js
import { renderSettingsView } from "./views/settingsView.js";
```

Add a `renderBottomNav` function and a `showSettings` function, and call `renderBottomNav` from both `showProfileSelect`'s callback path and `showSettings`. Replace the full contents of `js/app.js` with:

```js
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
```

- [ ] **Step 3: Manually verify in the browser**

Run `npx serve . -l 3000`, select a profile, confirm the bottom nav shows 4 items with "Heute" highlighted, and "Kalender"/"Übersicht" look disabled (greyed, not clickable). Click "Profil" (settings icon): expected to see "Einstellungen" header and the profile listed with "(aktiv)" next to its name. Create a second profile from the profile-select screen first if you want to test switching: go back via creating one more profile is not directly reachable from settings in Phase 1, so instead just verify: click the trash icon next to the only profile, confirm the browser confirm-dialog, accept it — expected to land back on "Wer bist du?" with an empty list (since it was the last profile).

- [ ] **Step 4: Commit**

```bash
git add js/views/settingsView.js js/app.js
git commit -m "Bottom-Navigation und Einstellungen-Screen (Profil wechseln/löschen)"
```

---

### Task 10: JSON backup (export/import)

**Files:**
- Create: `js/backup.js`
- Modify: `js/views/settingsView.js` (add the backup card content)

**Interfaces:**
- Consumes: `getAllItems`, `putItem` from `js/db.js` (Task 2); `showToast` from `js/toast.js` (Task 2).
- Produces: `exportAllData(): Promise<void>` (triggers a file download), `importAllData(jsonText: string): Promise<void>`.

- [ ] **Step 1: Create the backup module**

Create `js/backup.js`:

```js
// Export/Import aller Daten als JSON-Datei (Backup-Funktion).
import { getAllItems, putItem } from "./db.js";
import { showToast } from "./toast.js";

export async function exportAllData() {
  try {
    const profiles = await getAllItems("profiles");
    const dailyLogs = await getAllItems("dailyLogs");
    const payload = { exportedAt: new Date().toISOString(), profiles, dailyLogs };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `doole-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    showToast("Export fehlgeschlagen.", "error");
    throw err;
  }
}

export async function importAllData(jsonText) {
  try {
    const payload = JSON.parse(jsonText);
    for (const profile of payload.profiles || []) {
      await putItem("profiles", profile);
    }
    for (const log of payload.dailyLogs || []) {
      await putItem("dailyLogs", log);
    }
  } catch (err) {
    showToast("Import fehlgeschlagen. Ist die Datei eine gültige Doole-Backup-Datei?", "error");
    throw err;
  }
}
```

- [ ] **Step 2: Add the backup card to the settings view**

In `js/views/settingsView.js`, add the import line:

```js
import { exportAllData, importAllData } from "../backup.js";
```

Replace the `container.innerHTML` template's `<div id="backup-card"></div>` line with an actual card, and add the wiring after the existing profile-list loop. The full updated function body:

```js
export async function renderSettingsView(container, currentProfile, callbacks) {
  const profiles = await getAllProfiles();

  container.innerHTML = `
    <h2 style="font-size:var(--font-size-section-title);color:var(--color-secondary);margin-bottom:var(--space-4);">Einstellungen</h2>
    <div class="section-card">
      <h3>Profile</h3>
      <div id="settings-profile-list" style="display:flex;flex-direction:column;gap:var(--space-2);"></div>
    </div>
    <div class="section-card">
      <h3>Daten-Backup</h3>
      <p style="color:var(--color-text-muted);font-size:var(--font-size-label);margin-bottom:var(--space-3);">Alle Daten liegen nur auf diesem Gerät. Exportiere regelmäßig ein Backup, damit nichts verloren geht.</p>
      <button type="button" id="export-btn" class="btn btn-primary" style="margin-bottom:var(--space-3);">Daten exportieren</button>
      <div class="field">
        <label for="import-file">Backup-Datei importieren</label>
        <input id="import-file" type="file" accept="application/json">
      </div>
    </div>
  `;

  const list = container.querySelector("#settings-profile-list");
  profiles.forEach((profile) => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "var(--space-2)";

    const switchBtn = document.createElement("button");
    switchBtn.className = "btn btn-secondary";
    switchBtn.style.flex = "1";
    switchBtn.style.justifyContent = "flex-start";
    switchBtn.textContent = profile.name + (profile.id === currentProfile.id ? " (aktiv)" : "");
    switchBtn.addEventListener("click", () => callbacks.onProfileSwitch(profile));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-secondary";
    deleteBtn.setAttribute("aria-label", `Profil ${profile.name} löschen`);
    deleteBtn.innerHTML = ICON_TRASH;
    deleteBtn.addEventListener("click", async () => {
      const confirmed = confirm(`Profil "${profile.name}" und alle zugehörigen Tagesprotokolle wirklich löschen?`);
      if (!confirmed) return;
      await deleteProfile(profile.id);
      const remaining = await getAllProfiles();
      if (remaining.length === 0) {
        callbacks.onAllProfilesDeleted();
      } else {
        renderSettingsView(container, profile.id === currentProfile.id ? remaining[0] : currentProfile, callbacks);
      }
    });

    row.appendChild(switchBtn);
    row.appendChild(deleteBtn);
    list.appendChild(row);
  });

  container.querySelector("#export-btn").addEventListener("click", () => exportAllData());

  container.querySelector("#import-file").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const confirmed = confirm("Import überschreibt vorhandene Profile/Protokolle mit denselben IDs. Fortfahren?");
    if (!confirmed) {
      event.target.value = "";
      return;
    }
    const text = await file.text();
    await importAllData(text);
    renderSettingsView(container, currentProfile, callbacks);
  });
}
```

- [ ] **Step 3: Manually verify in the browser**

Run `npx serve . -l 3000`, go to a profile's daily log, fill in a couple of fields, go to Settings, click "Daten exportieren". Expected: a file `doole-backup-YYYY-MM-DD.json` downloads; open it in a text editor and confirm it contains your profile and daily log under `profiles`/`dailyLogs`. In DevTools → Application → IndexedDB, delete the `doole-db` database entirely (right-click → Delete database), reload the page (you land back on "Wer bist du?" with an empty list). Go directly to a URL that doesn't exist yet for settings — instead, since there's no profile, this step requires re-creating one first: create a temporary profile, open Settings, use "Backup-Datei importieren" to select the previously downloaded JSON file, confirm the dialog. Expected: after import, the original profile (with its original name/id) appears in the list; switch to it and confirm the daily log fields you filled in are back.

- [ ] **Step 4: Commit**

```bash
git add js/backup.js js/views/settingsView.js
git commit -m "JSON-Backup: Daten exportieren und importieren"
```

---

### Task 11: PWA manifest, service worker, and app icons

**Files:**
- Create: `manifest.json`
- Create: `service-worker.js`
- Create: `assets/icons/generate-icons.html` (one-time local tool, browser-based, no Node/Python needed)
- Modify: `js/app.js` (register the service worker)

**Interfaces:**
- Consumes: nothing from prior tasks (the service worker lists static files by path; no JS module interfaces are involved).
- Produces: installable PWA metadata; offline asset caching.

- [ ] **Step 1: Create the icon generator page**

Create `assets/icons/generate-icons.html`:

```html
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Doole-Icon-Generator</title></head>
<body style="font-family:sans-serif;padding:24px;">
  <h1>Doole App-Icon-Generator</h1>
  <p>Klicke die Buttons, um die drei benötigten PNG-Dateien herunterzuladen. Speichere sie anschließend in <code>assets/icons/</code> mit genau diesen Namen: <code>icon-192.png</code>, <code>icon-512.png</code>, <code>icon-maskable-512.png</code>.</p>
  <canvas id="canvas" width="512" height="512" style="border:1px solid #ccc;width:256px;height:256px;"></canvas>
  <div>
    <button onclick="download(192, false, 'icon-192.png')">icon-192.png herunterladen</button>
    <button onclick="download(512, false, 'icon-512.png')">icon-512.png herunterladen</button>
    <button onclick="download(512, true, 'icon-maskable-512.png')">icon-maskable-512.png herunterladen</button>
  </div>
  <script>
    function draw(size, maskable) {
      const canvas = document.getElementById("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");

      // Maskable Icons brauchen Rand-Sicherheitszone (sicherer Bereich = mittlere 80%)
      const bgPadding = maskable ? size * 0.1 : 0;

      ctx.fillStyle = "#F5EEDF";
      ctx.fillRect(0, 0, size, size);

      ctx.fillStyle = "#B3552C";
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, (size - bgPadding * 2) / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#D9A441";
      ctx.font = `bold ${size * 0.45}px Georgia, serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("D", size / 2, size / 2 + size * 0.02);
    }

    function download(size, maskable, filename) {
      draw(size, maskable);
      const canvas = document.getElementById("canvas");
      const link = document.createElement("a");
      link.download = filename;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }

    draw(512, false);
  </script>
</body>
</html>
```

- [ ] **Step 2: Generate the icons**

Run `npx serve . -l 3000`, open `http://localhost:3000/assets/icons/generate-icons.html`, click all three download buttons, and move the three downloaded PNG files into `assets/icons/` (the browser usually downloads to a `Downloads` folder — move/rename them there so the final paths are `assets/icons/icon-192.png`, `assets/icons/icon-512.png`, `assets/icons/icon-maskable-512.png`).

Run to confirm:

```bash
ls assets/icons
```

Expected: `generate-icons.html`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`.

- [ ] **Step 3: Create the manifest**

Create `manifest.json`:

```json
{
  "name": "Doole",
  "short_name": "Doole",
  "description": "Familien-Tracking für Ernährung und Gesundheit",
  "start_url": "./index.html",
  "scope": "./",
  "display": "standalone",
  "background_color": "#F5EEDF",
  "theme_color": "#B3552C",
  "lang": "de",
  "icons": [
    { "src": "assets/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "assets/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "assets/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

- [ ] **Step 4: Create the service worker**

Create `service-worker.js`:

```js
// Cache-first-Strategie für alle statischen Dateien, damit die App nach
// dem ersten Aufruf komplett offline funktioniert. Nutzerdaten liegen
// ohnehin in IndexedDB und werden hier nicht angefasst.
const CACHE_NAME = "doole-cache-v1";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/tokens.css",
  "./css/styles.css",
  "./js/app.js",
  "./js/db.js",
  "./js/toast.js",
  "./js/profiles.js",
  "./js/dailyLog.js",
  "./js/calendar.js",
  "./js/backup.js",
  "./js/icons.js",
  "./js/views/profileSelect.js",
  "./js/views/dailyLogView.js",
  "./js/views/settingsView.js",
  "./assets/fonts/fraunces-400.woff2",
  "./assets/fonts/fraunces-600.woff2",
  "./assets/fonts/work-sans-400.woff2",
  "./assets/fonts/work-sans-500.woff2",
  "./assets/fonts/work-sans-600.woff2",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
```

- [ ] **Step 5: Register the service worker**

In `js/app.js`, add this block at the end of the file (after `showProfileSelect();`):

```js
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js");
  });
}
```

- [ ] **Step 6: Manually verify in the browser**

Run `npx serve . -l 3000`, open `http://localhost:3000`. Open DevTools → Application → Service Workers: confirm a worker is listed as "activated and running". Open DevTools → Application → Manifest: confirm name "Doole", theme color, and all three icons show with no errors. Open DevTools → Lighthouse, run a "Progressive Web App" audit: expect the installability checks to pass. Now test offline: in DevTools → Network, set throttling to "Offline", then reload the page. Expected: the app still loads and shows the profile-select (or daily-log) screen, not a browser error page. Turn "Offline" back off afterward.

- [ ] **Step 7: Commit**

```bash
git add manifest.json service-worker.js assets/icons js/app.js
git commit -m "PWA: Manifest, Service Worker, App-Icons"
```

---

### Task 12: Full manual end-to-end test pass

**Files:** none (verification only).

**Interfaces:** none.

- [ ] **Step 1: Fresh-start walkthrough**

Run `npx serve . -l 3000`. In DevTools → Application → IndexedDB, delete `doole-db` if it exists, then reload, to simulate a brand-new install.

- [ ] **Step 2: Run through the full checklist**

Perform each action below in order and confirm the expected result before moving to the next:

1. Create two profiles ("Amara", color terracotta; "Kofi", color indigo). Expected: both appear in the profile list after creation, with their initial letter shown.
2. Select "Amara". Fill in all 5 meal slots, water, sleep, weight, check "Alkohol getrunken" with info text, add 2 activities, write a note. Expected: every field keeps its value after navigating to yesterday and back to today via the date arrows.
3. Reload the browser tab entirely (not just navigate). Expected: "Amara"'s data from step 2 is still present on today's date.
4. Go to Settings, switch to "Kofi". Expected: today's log for "Kofi" is empty (separate profile = separate data).
5. In Settings, export data. Expected: a `.json` file downloads.
6. While still on "Kofi" in Settings, delete "Kofi" (confirm the dialog). Expected: since "Amara" still exists, you stay on the Settings screen and the profile list now shows only "Amara".
7. Re-import the exported backup file from step 5. Expected: "Kofi" reappears in the profile list.
8. In DevTools → Network, set "Offline", reload the page. Expected: the app loads and is usable (profile select or daily log render normally).
9. On a mobile device (or Chrome DevTools device toolbar), open the site and check for a browser "Install app" / "Add to Home Screen" prompt or menu option. Expected: it is available, and after installing, the app opens in its own window without browser address-bar chrome.

- [ ] **Step 3: Record and fix any deviations**

If any step in the checklist does not match its expected result, treat it as a bug: identify which task's file is responsible, fix it, re-run that one checklist step, then re-run the full checklist from Step 1 once more before considering Phase 1 done.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "Phase 1 abgeschlossen: manueller End-to-End-Testdurchlauf bestanden"
```
