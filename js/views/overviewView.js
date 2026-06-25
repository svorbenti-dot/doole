// Bildschirm: Übersicht mit aggregierten Kennzahlen der letzten 30 Tage.
import { getOverviewStats } from "../stats.js";
import { renderLineChart } from "../charts.js";
import { SCHLAF_QUALITAET } from "../dailyLog.js";
import { ICON_WATER, ICON_SLEEP, ICON_MEAL } from "../icons.js";
import { escapeHtml } from "../escapeHtml.js";
import { formatNumberDE } from "../format.js";

export async function renderOverviewView(container, headerContainer, profile) {
  headerContainer.innerHTML = `<h1 style="font-family:var(--font-headline);font-size:var(--font-size-display);color:#fff;">Übersicht</h1>`;

  const stats = await getOverviewStats(profile.id, profile.calorieGoal, profile.tdee);

  const avgSleepLabel = stats.avgSleepQuality != null
    ? closestSchlafLabel(stats.avgSleepQuality)
    : "Keine Daten";

  container.innerHTML = `
    <div class="section-card">
      <h3>Letzte ${stats.windowDays} Tage für ${escapeHtml(profile.name)}</h3>
      <p class="overview-subtext">${stats.totalDaysLogged} Tag(e) mit Einträgen</p>
    </div>
    <div class="section-card overview-stat-grid">
      <div class="overview-stat">
        <span class="overview-stat-icon" aria-hidden="true">${ICON_WATER}</span>
        <span class="overview-stat-value">${stats.avgWaterMl != null ? `${stats.avgWaterMl} ml` : "–"}</span>
        <span class="overview-stat-label">Ø Wasser/Tag</span>
      </div>
      <div class="overview-stat">
        <span class="overview-stat-icon" aria-hidden="true">${ICON_SLEEP}</span>
        <span class="overview-stat-value">${escapeHtml(avgSleepLabel)}</span>
        <span class="overview-stat-label">Ø Schlafqualität</span>
      </div>
    </div>
    <div class="section-card overview-stat-grid">
      <div class="overview-stat">
        <span class="overview-stat-icon" aria-hidden="true">${ICON_MEAL}</span>
        <span class="overview-stat-value">${stats.avgKcalPerDay != null ? `${stats.avgKcalPerDay} kcal` : "–"}</span>
        <span class="overview-stat-label">Ø Kalorien/Tag</span>
      </div>
      <div class="overview-stat">
        <span class="overview-stat-icon" aria-hidden="true">${ICON_MEAL}</span>
        <span class="overview-stat-value">${stats.avgKcalDeficit != null ? `${stats.avgKcalDeficit > 0 ? "−" : "+"}${Math.abs(stats.avgKcalDeficit)} kcal` : "–"}</span>
        <span class="overview-stat-label">Ø Defizit/Tag</span>
      </div>
      <div class="overview-stat">
        <span class="overview-stat-icon" aria-hidden="true">🧘</span>
        <span class="overview-stat-value">${stats.meditationDayCount}</span>
        <span class="overview-stat-label">Meditations-Tage</span>
      </div>
    </div>
    <div class="section-card">
      <h3>Bewegung</h3>
      <p class="overview-movement-line">🚶 ${stats.avgStepsPerDay != null ? `Ø ${formatNumberDE(stats.avgStepsPerDay)} Schritte/Tag` : "Keine Schritte erfasst"} · 🧘 ${stats.yogaDayCount}× Yoga · 🏋️ ${stats.activityDayCount}× Sport</p>
    </div>
    ${stats.bestWeek && stats.bestWeek.score > 0 ? `
    <div class="section-card">
      <h3>🏆 Wochen-Highlight</h3>
      <p class="overview-best-week">Beste Woche: ${stats.bestWeek.sportDays}× Sport, ${stats.bestWeek.deficitDays} Tage im Defizit, ${stats.bestWeek.meditationDays}× meditiert, ${stats.bestWeek.avgSteps != null ? `Ø ${formatNumberDE(stats.bestWeek.avgSteps)} Schritte` : "keine Schritte erfasst"} 🏆</p>
    </div>
    ` : ""}
    <div class="section-card">
      <h3>Kalorien-Trend</h3>
      ${renderLineChart(stats.kcalPoints, { ariaLabel: "Kalorien-Trend", height: 140 })}
    </div>
    <div class="section-card">
      <h3>Gewichtsverlauf</h3>
      ${renderLineChart(stats.weightPoints, { ariaLabel: "Gewichtsverlauf", height: 140 })}
    </div>
    <div class="section-card">
      <h3>Stimmungs-Trend</h3>
      ${renderLineChart(stats.moodPoints, { ariaLabel: "Stimmungs-Trend", height: 140 })}
    </div>
    <div class="section-card">
      <h3>Tagesform-Trend</h3>
      ${renderLineChart(stats.tagesformPoints, { ariaLabel: "Tagesform-Trend", height: 140 })}
    </div>
  `;
}

function closestSchlafLabel(avg) {
  const rounded = Math.round(avg);
  const match = SCHLAF_QUALITAET.find((opt) => opt.value === rounded);
  return `${match.emoji} ${match.label} (Ø ${avg.toFixed(1)})`;
}
