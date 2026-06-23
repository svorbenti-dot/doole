// Datums-Hilfsfunktionen und die Datums-Navigationsleiste (Pfeile vor/zurück
// plus ein Kalender-Popup zum direkten Springen zu einem Tag).
// Alle Daten werden als ISO-String "YYYY-MM-DD" gespeichert und verglichen,
// damit es keine Zeitzonen-Verwirrung gibt.
import { ICON_CHEVRON_LEFT, ICON_CHEVRON_RIGHT } from "./icons.js";

export const WEEKDAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
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

// Anzahl Tage zwischen zwei ISO-Daten (endISO - startISO), z.B. für Tag-X-Zähler.
export function daysBetweenISO(startISO, endISO) {
  const [sy, sm, sd] = startISO.split("-").map(Number);
  const [ey, em, ed] = endISO.split("-").map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  return Math.round((end - start) / 86400000);
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
