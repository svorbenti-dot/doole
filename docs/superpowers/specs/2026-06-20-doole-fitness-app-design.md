# Doole — Fitness- & Ernährungs-Tracking-App (Design, Phase 1)

## Überblick

"Doole" (Wolof: Kraft/Stärke/Energie) ist eine browserbasierte PWA für die tägliche Ernährungs- und Gesundheitsdokumentation einer Familie. Sie läuft komplett lokal (kein Server, keine externen Dienste), speichert Daten in IndexedDB und ist mobile-first gestaltet, mit westafrikanisch inspiriertem, reduziert-elegantem Design.

Diese Spec deckt **Phase 1** ab: Profile, Tagesprotokoll, Kalender-Navigation, Backup. Phase 2 (Wochen-/Monatsübersicht mit Graphen) und Phase 3 (90-Tage-Guide, Heimtrainings als PDF) sind bewusst nicht Teil dieser Spec, werden aber bei Architekturentscheidungen mitgedacht (siehe "Spätere Phasen" unten).

## Tech-Stack

- **Reines HTML/CSS/JavaScript** (ES-Module), kein Framework, kein Build-Tool.
- **IndexedDB** über einen selbst geschriebenen, kommentierten Wrapper (`db.js`) — kein externes Paket.
- Alle Schriftarten und Icons werden **lokal als Dateien** mitgeliefert (kein Google-Fonts-CDN, keine externen Aufrufe), damit die App vollständig offline funktioniert.

## Projektstruktur

```
Doole/
├── index.html
├── manifest.json          # PWA-Manifest
├── service-worker.js      # Offline-Caching
├── css/
│   ├── tokens.css         # Farben, Abstände, Schriftgrößen als CSS-Variablen
│   └── styles.css         # Komponenten-Styles
├── js/
│   ├── app.js              # Einstiegspunkt, einfacher View-Router
│   ├── db.js                # IndexedDB-Wrapper (öffnen, speichern, lesen, löschen)
│   ├── profiles.js           # Profil-Logik (kennt db.js, nicht die UI)
│   ├── dailyLog.js             # Tagesprotokoll-Logik
│   ├── calendar.js              # Datums-Navigation
│   ├── backup.js                 # JSON-Export/Import
│   └── views/                     # eine Datei pro Bildschirm
│       ├── profileSelect.js
│       ├── dailyLogView.js
│       └── settingsView.js
└── assets/
    ├── fonts/              # lokale Schriftdateien (woff2)
    └── icons/              # SVG-Icons + PWA-App-Icons
```

**Trennung der Verantwortlichkeiten:** `db.js` kennt nur generische Speicher-Operationen (Store, Key, Value) — es weiß nichts von "Profilen" oder "Tagesprotokollen". `profiles.js` und `dailyLog.js` bauen darauf auf und kennen die Fachlogik, aber keine UI. Die `views/`-Dateien rendern HTML und reagieren auf Nutzereingaben, rufen aber nur die Fachlogik-Module auf. Diese Trennung erlaubt, in Phase 2/3 neue Views (Wochenübersicht, Trainingsguide) hinzuzufügen, ohne bestehende Module zu verändern.

## Datenmodell (IndexedDB)

Datenbankname: `doole-db`.

**Object Store `profiles`** (Key: `id`, auto-increment):
```js
{ id, name, color, icon, createdAt }
```

**Object Store `dailyLogs`** (Key: `id` = `"${profileId}_${datum}"`, z.B. `"3_2026-06-20"`):
```js
{
  id: "3_2026-06-20",
  profileId: 3,
  date: "2026-06-20",          // ISO-Format YYYY-MM-DD
  meals: {
    fruehstueck: { zeit, was, getraenk, portion, saettigung },  // saettigung: 1-5
    snack1:      { zeit, was, getraenk, portion, saettigung },
    mittag:      { zeit, was, getraenk, portion, saettigung },
    snack2:      { zeit, was, getraenk, portion, saettigung },
    abendbrot:   { zeit, was, getraenk, portion, saettigung }
  },
  waterMl: 1400,
  sleep: { stunden, qualitaet },     // qualitaet: 1-3
  weightKg: 72.3,
  alcohol: { getrunken: true, info: "1 Glas Wein" },
  supplements: "Vitamin D, Magnesium",   // Freitext
  activities: [ { art, dauerMin, zustand } ],   // Liste, mehrere Einträge möglich
  notes: ""
}
```

Ein Eintrag pro Profil und Tag. Die 5 Mahlzeiten-Felder sind fest (ein Formular-Slot je Mahlzeit). `activities` ist eine erweiterbare Liste, da an einem Tag mehrere Aktivitäten stattfinden können.

## Screens & Navigation

1. **Profil-Auswahl** (Startbildschirm): Liste vorhandener Profile (Name + Farbe/Icon) zum Antippen, Möglichkeit "Neues Profil anlegen" (Name + Farbe/Icon wählen).
2. **Tagesprotokoll** (Hauptbildschirm nach Profilwahl): Kopfbereich mit Profilname und Datums-Navigation (Pfeile vor/zurück + Tippen auf Datum öffnet Kalender-Auswahl). Darunter Formular-Karten für Mahlzeiten, Wasser/Schlaf/Gewicht, Alkohol/Supplements, Aktivität (Liste + "Aktivität hinzufügen"), Notizen.
3. **Einstellungen** (über Profil-Icon erreichbar): Profil wechseln/verwalten, Daten exportieren/importieren (JSON).

**Bottom-Navigation** (max. 4 Einträge, bereitet Phase 2/3 vor, Tabs außer "Heute" sind in Phase 1 deaktiviert/Platzhalter):
- Heute (aktiv, führt zu Tagesprotokoll am aktuellen Datum)
- Kalender (Platzhalter für Phase 2)
- Übersicht (Platzhalter für Phase 2, Graphen)
- Profil (Einstellungen/Profilwechsel)

## Backup (Export/Import)

In den Einstellungen: Button "Daten exportieren" erzeugt eine JSON-Datei mit allen Profilen und Tagesprotokollen zum Download. Button "Daten importieren" liest eine solche Datei wieder ein. Vor dem Import (überschreibt ggf. vorhandene Daten) erscheint ein Bestätigungsdialog.

## Design-System

**Farbpalette ("Helles Studio"):**
- Hintergrund: `#F5EEDF` (Sand), Karten: `#FBF6EA`
- Primärfarbe: `#B3552C` (Terrakotta)
- Akzent: `#D9A441` (Ocker/Gold)
- Sekundär/Überschriften: `#27543F` (dunkles Smaragdgrün)
- Text: Anthrazit (`#262626`)

**Typografie** (lokal gehostet, kein CDN):
- Headlines: *Fraunces* (warmer Serifen-Font), sparsam für Profilname, große Überschriften, Datumsanzeige
- UI/Body/Zahlen: *Work Sans*, für Formulare, Karten, Navigation
- Schriftgrößen-Skala: 13px (Labels) · 16px (Body, Minimum auf Mobile) · 18px (Kartentitel) · 20px (Sektionstitel) · 28px (große Überschriften)

**Abstands-Skala:** 4 · 8 · 12 · 16 · 24 · 32 · 48px, konsistent für Padding/Gaps.

**Icons:** Einheitliches Set selbst gezeichneter SVG-Linien-Icons (Strichbreite 1,75px), lokal als Dateien, mit `aria-label`. Keine Emojis als UI-Icons. Touch-Targets mindestens 44×44px.

**Kente-inspirierte Muster:** Nur als dezentes, abstraktes geometrisches Deko-Element (z.B. dünner Rauten-/Zickzack-Streifen im Header oder als Trenner), niedrige Deckkraft (~10%), keine Nachbildung konkreter kulturell spezifischer Muster, keine flächendeckende Übersättigung.

**Layout:** Karten-basiertes Mobile-First-Layout (siehe genehmigtes Mockup), feste Bottom-Navigation, Header mit Profil + Datums-Navigation.

## PWA

- `manifest.json`: Name "Doole", `display: standalone`, `theme_color` Terrakotta, `background_color` Sand, App-Icons (192px/512px + maskable Variante).
- `service-worker.js`: Cache-first-Strategie für alle statischen Dateien (HTML/CSS/JS/Fonts/Icons) → App funktioniert nach dem ersten Aufruf vollständig offline. Nutzerdaten liegen ohnehin lokal in IndexedDB.
- Service Worker benötigen `http://`/`https://`, nicht `file://`. Zum lokalen Testen wird ein einfacher lokaler Server benötigt (z.B. VS-Code-Erweiterung "Live Server").

## Fehlerbehandlung & Validierung

- Zahlenfelder (Wasser, Gewicht, Schlafstunden, Aktivitätsdauer) mit `type="number"` und sinnvollen Grenzen (`min`, `step`).
- Jede IndexedDB-Operation läuft in try/catch; bei Fehler erscheint ein kurzer Hinweis ("Speichern fehlgeschlagen, bitte erneut versuchen") statt eines Absturzes.
- Bestätigungsdialog vor zerstörerischen Aktionen: Profil löschen, Daten-Import.
- Freundlicher Leer-Zustand, wenn ein Profil noch keine Einträge hat.

## Testing-Ansatz

Bewusst **kein automatisiertes Test-Framework** in Phase 1 (kein Build-Tool vorhanden, zusätzliches Tooling für den Anfang nicht nötig). Stattdessen manuelles Testen im Browser:

- DevTools-Konsole auf Fehler prüfen
- Application-Tab zur Kontrolle der IndexedDB-Inhalte
- Lighthouse-Check für PWA-Tauglichkeit
- Manuelle Checkliste vor Abschluss: Profil anlegen/wechseln, Tageseintrag speichern, Tag wechseln (Daten bleiben pro Tag getrennt), Seite neu laden (Daten bleiben erhalten), Offline-Test (Netzwerk in DevTools deaktivieren), Export/Import einmal durchspielen, Installation als App auf dem Handy testen.

## Spätere Phasen (nicht Teil dieser Spec, nur mitgedacht)

- **Phase 2:** Wochen-/Monatsübersicht mit Graphen. Die Trennung von Fachlogik (`dailyLog.js`) und Views erlaubt, eine neue `views/overviewView.js` hinzuzufügen, die vorhandene `dailyLogs`-Einträge über einen Datumsbereich liest und aggregiert, ohne das Datenmodell zu ändern.
- **Phase 3:** 90-Tage-Fitness-Guide + 20-Minuten-Heimtrainings als PDF. Würde eigene Datenstrukturen (Trainingspläne) und eine PDF-Erzeugung (z.B. über die Browser-Druckfunktion oder eine lokal eingebundene Bibliothek) ergänzen — unabhängig vom Phase-1-Code.
