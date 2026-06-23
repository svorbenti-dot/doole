// Bildschirm: Profil auswählen oder neues Profil anlegen.
import { getAllProfiles, createProfile } from "../profiles.js";
import { GENDER_OPTIONS, ACTIVITY_LEVELS } from "../calorieCalc.js";
import { ICON_PLUS } from "../icons.js";
import { escapeHtml } from "../escapeHtml.js";
import { importAllData } from "../backup.js";
import { showToast } from "../toast.js";

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
        <div class="field">
          <label for="new-profile-age">Alter (Jahre)</label>
          <input id="new-profile-age" type="number" min="0" max="120">
        </div>
        <div class="field">
          <label for="new-profile-height">Größe (cm)</label>
          <input id="new-profile-height" type="number" min="0" max="250">
        </div>
        <div class="field">
          <label for="new-profile-weight">Gewicht (kg)</label>
          <input id="new-profile-weight" type="number" min="0" max="300" step="0.1">
        </div>
        <div class="field">
          <label>Geschlecht</label>
          <div class="chip-group" id="new-profile-gender">${GENDER_OPTIONS.map((opt) => `<button type="button" class="chip" data-chip-value="${opt.value}">${opt.label}</button>`).join("")}</div>
        </div>
        <div class="field">
          <label>Aktivitätslevel</label>
          <div class="chip-group" id="new-profile-activity">${ACTIVITY_LEVELS.map((opt) => `<button type="button" class="chip" data-chip-value="${opt.value}">${opt.label}</button>`).join("")}</div>
        </div>
        <button type="submit" class="btn btn-primary">${ICON_PLUS} Profil anlegen</button>
      </form>
    </div>
    <div class="section-card">
      <h3>Backup importieren</h3>
      <p style="color:var(--color-text-muted);font-size:var(--font-size-label);margin-bottom:var(--space-3);">Hast du schon ein Backup? Stelle deine Profile und Tagesprotokolle hier wieder her.</p>
      <div class="field">
        <label for="profile-select-import-file">Backup-Datei importieren</label>
        <input id="profile-select-import-file" type="file" accept="application/json">
      </div>
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

  let selectedGender = null;
  container.querySelector("#new-profile-gender").querySelectorAll("[data-chip-value]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedGender = btn.dataset.chipValue;
      container.querySelector("#new-profile-gender").querySelectorAll("[data-chip-value]").forEach((b) => b.classList.toggle("selected", b === btn));
    });
  });

  let selectedActivityLevel = null;
  container.querySelector("#new-profile-activity").querySelectorAll("[data-chip-value]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedActivityLevel = btn.dataset.chipValue;
      container.querySelector("#new-profile-activity").querySelectorAll("[data-chip-value]").forEach((b) => b.classList.toggle("selected", b === btn));
    });
  });

  container.querySelector("#new-profile-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = container.querySelector("#new-profile-name").value.trim();
    if (!name) return;
    const icon = name.charAt(0).toUpperCase();
    const ageValue = container.querySelector("#new-profile-age").value;
    const heightValue = container.querySelector("#new-profile-height").value;
    const weightValue = container.querySelector("#new-profile-weight").value;
    const created = await createProfile({
      name, color: selectedColor, icon,
      age: ageValue ? Number(ageValue) : null,
      heightCm: heightValue ? Number(heightValue) : null,
      weightKg: weightValue ? Number(weightValue) : null,
      gender: selectedGender,
      activityLevel: selectedActivityLevel,
    });
    onProfileSelected(created);
  });

  container.querySelector("#profile-select-import-file").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const confirmed = confirm("Import überschreibt vorhandene Profile/Protokolle mit denselben IDs. Fortfahren?");
    if (!confirmed) {
      event.target.value = "";
      return;
    }
    const text = await file.text();
    await importAllData(text);
    showToast("Backup importiert ✓");
    renderProfileSelect(container, onProfileSelected);
  });
}
