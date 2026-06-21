// Bildschirm: Monatsansicht zum Springen zu einem beliebigen Tag.
// Tage mit gespeicherten Einträgen bekommen einen kleinen Punkt.
import { getMonthMatrix, todayISO } from "../calendar.js";
import { ICON_CHEVRON_LEFT, ICON_CHEVRON_RIGHT } from "../icons.js";
import { getAllItems } from "../db.js";

const WEEKDAY_SHORT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

export async function renderCalendarView(container, headerContainer, profile, dateISO, onSelectDate) {
  headerContainer.innerHTML = `<h1 style="font-family:var(--font-headline);font-size:var(--font-size-display);color:#fff;">Kalender</h1>`;

  let [year, month] = dateISO.split("-").map(Number);
  month -= 1; // 0-basiert für getMonthMatrix

  const allLogs = await getAllItems("dailyLogs");
  const profileLogDates = new Set(
    allLogs.filter((log) => log.profileId === profile.id).map((log) => log.date)
  );

  function render() {
    const weeks = getMonthMatrix(year, month);
    const today = todayISO();

    container.innerHTML = `
      <div class="section-card calendar-card">
        <div class="calendar-header">
          <button type="button" id="cal-prev-month" aria-label="Vorheriger Monat">${ICON_CHEVRON_LEFT}</button>
          <strong>${MONTHS[month]} ${year}</strong>
          <button type="button" id="cal-next-month" aria-label="Nächster Monat">${ICON_CHEVRON_RIGHT}</button>
        </div>
        <div class="calendar-weekdays">
          ${WEEKDAY_SHORT.map((d) => `<div class="calendar-weekday">${d}</div>`).join("")}
        </div>
        <div class="calendar-grid">
          ${weeks.flat().map((cellISO) => {
            if (!cellISO) return `<div class="calendar-cell empty"></div>`;
            const day = Number(cellISO.split("-")[2]);
            const isToday = cellISO === today;
            const hasEntry = profileLogDates.has(cellISO);
            return `
              <button type="button" class="calendar-cell ${isToday ? "today" : ""}" data-cell-date="${cellISO}">
                <span class="calendar-cell-day">${day}</span>
                ${hasEntry ? `<span class="calendar-cell-dot" aria-hidden="true"></span>` : ""}
              </button>
            `;
          }).join("")}
        </div>
      </div>
    `;

    container.querySelector("#cal-prev-month").addEventListener("click", () => {
      month -= 1;
      if (month < 0) { month = 11; year -= 1; }
      render();
    });
    container.querySelector("#cal-next-month").addEventListener("click", () => {
      month += 1;
      if (month > 11) { month = 0; year += 1; }
      render();
    });
    container.querySelectorAll("[data-cell-date]").forEach((btn) => {
      btn.addEventListener("click", () => onSelectDate(btn.dataset.cellDate));
    });
  }

  render();
}
