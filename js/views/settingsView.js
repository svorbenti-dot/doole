// Bildschirm: Einstellungen - Profil wechseln/löschen, Backup (Task 10 ergänzt Export/Import hier).
import { getAllProfiles, deleteProfile } from "../profiles.js";
import { ICON_TRASH } from "../icons.js";

export async function renderSettingsView(container, currentProfile, callbacks) {
  const profiles = await getAllProfiles();

  container.innerHTML = `
    <h2 style="font-size:var(--font-size-section-title);color:var(--color-secondary);margin-bottom:var(--space-4);">Einstellungen</h2>
    <div class="section-card">
      <h3>Profile</h3>
      <div id="settings-profile-list" style="display:flex;flex-direction:column;gap:var(--space-2);"></div>
    </div>
    <div id="backup-card"></div>
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
        renderSettingsView(container, profile.id === currentProfile.id ? remaining[0] : currentProfile, callbacks);
      }
    });

    row.appendChild(switchBtn);
    row.appendChild(deleteBtn);
    list.appendChild(row);
  });
}
