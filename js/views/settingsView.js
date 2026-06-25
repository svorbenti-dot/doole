// Bildschirm: Einstellungen - Profil wechseln/löschen, Backup, Koerperdaten & Kalorienziel.
import { getAllProfiles, deleteProfile, updateProfile } from "../profiles.js";
import { ICON_TRASH, ICON_PLUS } from "../icons.js";
import { exportAllData, importAllData } from "../backup.js";
import { calculateCalorieTargets, GENDER_OPTIONS, ACTIVITY_LEVELS } from "../calorieCalc.js";
import { getLatestWeightEntry } from "../dailyLog.js";
import { showToast } from "../toast.js";
import { renderProfileSelect } from "./profileSelect.js";

function calorieTargetsText(profile) {
  if (profile.calorieGoal == null) return "Trage Alter, Größe, Gewicht, Geschlecht und Aktivitätslevel ein, um ein Kalorienziel zu berechnen.";
  return `Grundumsatz: ${profile.bmr} kcal · Gesamtverbrauch: ${profile.tdee} kcal · Tagesziel: ${profile.calorieGoal} kcal`;
}

export async function renderSettingsView(container, currentProfile, callbacks) {
  const profiles = await getAllProfiles();

  container.innerHTML = `
    <h2 style="font-size:var(--font-size-section-title);color:var(--color-secondary);margin-bottom:var(--space-4);">Einstellungen</h2>
    <div class="section-card">
      <h3>Profile</h3>
      <div id="settings-profile-list" style="display:flex;flex-direction:column;gap:var(--space-2);margin-bottom:var(--space-3);"></div>
      <button type="button" id="add-profile-btn" class="btn btn-secondary">${ICON_PLUS} Neues Profil anlegen</button>
    </div>
    <div class="section-card">
      <h3>Körperdaten &amp; Kalorienziel</h3>
      <div class="field">
        <label for="body-age">Alter (Jahre)</label>
        <input id="body-age" type="number" min="0" max="120" value="${currentProfile.age ?? ""}">
      </div>
      <div class="field">
        <label for="body-height">Größe (cm)</label>
        <input id="body-height" type="number" min="0" max="250" value="${currentProfile.heightCm ?? ""}">
      </div>
      <div class="field">
        <label for="body-weight">Gewicht (kg)</label>
        <input id="body-weight" type="number" min="0" max="300" step="0.1" value="${currentProfile.weightKg ?? ""}">
      </div>
      <div class="field">
        <label>Geschlecht</label>
        <div class="chip-group" id="body-gender">${GENDER_OPTIONS.map((opt) => `<button type="button" class="chip ${currentProfile.gender === opt.value ? "selected" : ""}" data-chip-value="${opt.value}">${opt.label}</button>`).join("")}</div>
      </div>
      <div class="field">
        <label>Aktivitätslevel</label>
        <div class="chip-group" id="body-activity">${ACTIVITY_LEVELS.map((opt) => `<button type="button" class="chip ${currentProfile.activityLevel === opt.value ? "selected" : ""}" data-chip-value="${opt.value}">${opt.label}</button>`).join("")}</div>
      </div>
      <p id="calorie-targets-display" style="color:var(--color-text-muted);font-size:var(--font-size-label);">${calorieTargetsText(currentProfile)}</p>
      <button type="button" id="recalc-btn" class="btn btn-secondary">Kalorien neu berechnen</button>
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
        // Wenn das aktive Profil gelöscht wurde, den App-State über das neue aktive Profil informieren
        if (profile.id === currentProfile.id) {
          callbacks.onActiveProfileChanged(remaining[0]);
        }
        renderSettingsView(container, profile.id === currentProfile.id ? remaining[0] : currentProfile, callbacks);
      }
    });

    row.appendChild(switchBtn);
    row.appendChild(deleteBtn);
    list.appendChild(row);
  });

  container.querySelector("#add-profile-btn").addEventListener("click", () => {
    renderProfileSelect(container, callbacks.onProfileSwitch);
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
    showToast("Backup importiert ✓");
    renderSettingsView(container, currentProfile, callbacks);
  });

  async function recalculateAndSave() {
    const targets = calculateCalorieTargets({
      weightKg: currentProfile.weightKg,
      heightCm: currentProfile.heightCm,
      age: currentProfile.age,
      gender: currentProfile.gender,
      activityLevel: currentProfile.activityLevel,
    });
    currentProfile.bmr = targets ? targets.bmr : null;
    currentProfile.tdee = targets ? targets.tdee : null;
    currentProfile.calorieGoal = targets ? targets.calorieGoal : null;
    await updateProfile(currentProfile);
    container.querySelector("#calorie-targets-display").textContent = calorieTargetsText(currentProfile);
    if (callbacks.onActiveProfileChanged) callbacks.onActiveProfileChanged(currentProfile);
  }

  container.querySelector("#body-age").addEventListener("change", (e) => {
    currentProfile.age = e.target.value ? Number(e.target.value) : null;
    recalculateAndSave();
  });
  container.querySelector("#body-height").addEventListener("change", (e) => {
    currentProfile.heightCm = e.target.value ? Number(e.target.value) : null;
    recalculateAndSave();
  });
  container.querySelector("#body-weight").addEventListener("change", (e) => {
    currentProfile.weightKg = e.target.value ? Number(e.target.value) : null;
    recalculateAndSave();
  });
  container.querySelector("#body-gender").querySelectorAll("[data-chip-value]").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentProfile.gender = btn.dataset.chipValue;
      container.querySelector("#body-gender").querySelectorAll("[data-chip-value]").forEach((b) => b.classList.toggle("selected", b === btn));
      recalculateAndSave();
    });
  });
  container.querySelector("#body-activity").querySelectorAll("[data-chip-value]").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentProfile.activityLevel = btn.dataset.chipValue;
      container.querySelector("#body-activity").querySelectorAll("[data-chip-value]").forEach((b) => b.classList.toggle("selected", b === btn));
      recalculateAndSave();
    });
  });

  container.querySelector("#recalc-btn").addEventListener("click", async () => {
    const latest = await getLatestWeightEntry(currentProfile.id);
    if (!latest) {
      showToast("Kein Gewichts-Eintrag im Tagesprotokoll gefunden.", "error");
      return;
    }
    if (currentProfile.age == null || currentProfile.heightCm == null || currentProfile.gender == null || currentProfile.activityLevel == null) {
      showToast("Bitte zuerst Alter, Größe, Geschlecht und Aktivitätslevel angeben.", "error");
      return;
    }
    currentProfile.weightKg = latest.weightKg;
    container.querySelector("#body-weight").value = latest.weightKg;
    await recalculateAndSave();
    showToast("Kalorien neu berechnet ✓");
  });
}
