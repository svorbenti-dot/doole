// Erzeugt einfache SVG-Linien-Diagramme als HTML-String, ganz ohne externe
// Bibliothek. points ist ein Array von {label, value}. Bei weniger als 2
// Punkten gibt es noch nichts zu verbinden, daher ein Leerzustand-Hinweis.
export function renderLineChart(points, options = {}) {
  const width = options.width || 300;
  const height = options.height || 120;
  const padding = 12;

  if (points.length < 2) {
    return `<p class="chart-empty">Noch nicht genug Daten für einen Verlauf.</p>`;
  }

  const values = points.map((p) => p.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  const stepX = (width - padding * 2) / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = padding + i * stepX;
    const y = padding + (height - padding * 2) * (1 - (p.value - minValue) / range);
    return { x, y };
  });

  const pathD = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const dots = coords.map((c) => `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="3" fill="var(--color-primary)"></circle>`).join("");

  return `
    <div class="chart-wrap">
      <svg class="line-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${options.ariaLabel || "Verlaufsdiagramm"}">
        <path d="${pathD}" fill="none" stroke="var(--color-primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
        ${dots}
      </svg>
      <div class="chart-axis-labels">
        <span>${points[0].label}</span>
        <span>${points[points.length - 1].label}</span>
      </div>
    </div>
  `;
}
