// Bildschirm: Profil auswählen oder neues Profil anlegen.
import { getAllProfiles, createProfile } from "../profiles.js";
import { ICON_PLUS } from "../icons.js";
import { escapeHtml } from "../escapeHtml.js";

const AVAILABLE_COLORS = ["#C1502E", "#D9A441", "#27543F", "#2C3E66"];

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
      <span style="width:32px;height:32px;border-radius:50%;background:${profile.color};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600;">${escapeHtml(profile.icon)}</span>
      <span>${escapeHtml(profile.name)}</span>
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
