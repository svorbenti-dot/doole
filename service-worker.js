// Cache-first-Strategie für alle statischen Dateien, damit die App nach
// dem ersten Aufruf komplett offline funktioniert. Nutzerdaten liegen
// ohnehin in IndexedDB und werden hier nicht angefasst.
const CACHE_NAME = "doole-cache-v5";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/tokens.css",
  "./css/styles.css",
  "./js/app.js",
  "./js/db.js",
  "./js/calorieCalc.js",
  "./js/toast.js",
  "./js/profiles.js",
  "./js/dailyLog.js",
  "./js/calendar.js",
  "./js/backup.js",
  "./js/icons.js",
  "./js/escapeHtml.js",
  "./js/charts.js",
  "./js/stats.js",
  "./js/views/profileSelect.js",
  "./js/views/dailyLogView.js",
  "./js/views/settingsView.js",
  "./js/views/calendarView.js",
  "./js/views/overviewView.js",
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
