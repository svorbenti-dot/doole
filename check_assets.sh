#!/bin/bash
ASSETS=(
  "index.html"
  "manifest.json"
  "css/tokens.css"
  "css/styles.css"
  "js/app.js"
  "js/db.js"
  "js/toast.js"
  "js/profiles.js"
  "js/dailyLog.js"
  "js/calendar.js"
  "js/backup.js"
  "js/icons.js"
  "js/views/profileSelect.js"
  "js/views/dailyLogView.js"
  "js/views/settingsView.js"
  "assets/fonts/fraunces-400.woff2"
  "assets/fonts/fraunces-600.woff2"
  "assets/fonts/work-sans-400.woff2"
  "assets/fonts/work-sans-500.woff2"
  "assets/fonts/work-sans-600.woff2"
  "assets/icons/icon-192.png"
  "assets/icons/icon-512.png"
  "assets/icons/icon-maskable-512.png"
)

echo "Checking ASSETS_TO_CACHE paths..."
missing=0
for asset in "${ASSETS[@]}"; do
  if [ ! -f "$asset" ]; then
    echo "MISSING: $asset"
    ((missing++))
  fi
done

if [ $missing -eq 0 ]; then
  echo "All assets found!"
else
  echo "$missing assets missing"
fi
