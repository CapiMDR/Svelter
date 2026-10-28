<script>
  import { settingsStore } from "../lib/stores/settingsStore.js";
  import { backupStore } from "../lib/stores/backupStore.js";
  import { modalStore } from "../lib/stores/modalStore.js";
  import { toastStore } from "../lib/stores/toastStore.js";

  let { onDataImported = () => {}, routineActive = false } = $props();
  let isOpen = $state(false);
  let transferAction = $state(null);
  let selectedFile = $state(null);
  let fileInput = $state();
  let selection = $state({ routines: true, statistics: true });

  function toggle() {
    isOpen = !isOpen;
  }

  function close() {
    isOpen = false;
    closeTransfer();
  }

  function openTransfer(action) {
    transferAction = action;
    selectedFile = null;
    selection = { routines: true, statistics: true };
  }

  function closeTransfer() {
    transferAction = null;
    selectedFile = null;
  }

  function hasSelection() {
    return selection.routines || selection.statistics;
  }

  async function exportSelected() {
    try {
      await backupStore.exportData(selection);
      toastStore.success("Backup exported");
      closeTransfer();
    } catch {
      toastStore.error("Could not export the backup");
    }
  }

  function chooseFile() {
    fileInput?.click();
  }

  function handleFile(event) {
    selectedFile = event.currentTarget.files?.[0] ?? null;
  }

  function requestImport(mode) {
    if (!selectedFile || !hasSelection() || $backupStore.busy) return;

    const isReplace = mode === "replace";
    modalStore.show({
      title: isReplace ? "Replace existing data?" : "Merge backup data?",
      content: isReplace
        ? "This permanently removes the selected existing data before importing the backup."
        : "This adds backup routines and aliases, and skips sessions that already have the same ID.",
      acceptText: isReplace ? "Replace" : "Merge",
      closeText: "Cancel",
      onAccept: () => importSelected(mode),
    });
  }

  async function importSelected(mode) {
    if (!selectedFile) return;
    try {
      await backupStore.importData(selectedFile, { ...selection, mode });
      await onDataImported();
      toastStore.success(mode === "replace" ? "Backup replaced existing data" : "Backup merged successfully");
      closeTransfer();
    } catch (error) {
      toastStore.error(error.message ?? "Could not import the backup");
    }
  }
</script>

<div class="settings-menu">
  <button class="settings-trigger" onclick={toggle} aria-expanded={isOpen} aria-controls="settings-panel" title="Open settings">
    <span class="material-icons">settings</span>
    <span class="settings-label">Settings</span>
  </button>

  {#if isOpen}
    <div id="settings-panel" class="settings-panel" role="menu">
      <div class="settings-header">
        <h2>Settings</h2>
        <button class="close-button" onclick={close} aria-label="Close settings">
          <span class="material-icons">close</span>
        </button>
      </div>
      <div class="setting-row">
        <div>
          <span class="setting-name">Keep screen awake</span>
          <p>Prevent the screen from sleeping during an active routine.</p>
        </div>
        <label class="toggle" aria-label="Keep screen awake during a routine">
          <input
            type="checkbox"
            checked={$settingsStore.wakeLockEnabled}
            onchange={(event) => settingsStore.save("wakeLockEnabled", event.currentTarget.checked)}
          />
          <span></span>
        </label>
      </div>
      <div class="setting-row">
        <div>
          <span class="setting-name">Countdown vibration</span>
          <p>Vibrate when a countdown reaches zero.</p>
        </div>
        <label class="toggle" aria-label="Vibrate when a countdown finishes">
          <input
            type="checkbox"
            checked={$settingsStore.vibrateOnCountdownFinish}
            onchange={(event) => settingsStore.save("vibrateOnCountdownFinish", event.currentTarget.checked)}
          />
          <span></span>
        </label>
      </div>
      <div class="data-actions">
        <span class="setting-name">Backup data</span>
        <p>
          {routineActive
            ? "Finish or cancel the active routine before managing backups."
            : "Export or import routines, weekday aliases, and session statistics."}
        </p>
        <div class="backup-buttons">
          <button onclick={() => openTransfer("export")} disabled={routineActive || $backupStore.busy}
            ><span class="material-icons">upload</span> Export</button
          >
          <button onclick={() => openTransfer("import")} disabled={routineActive || $backupStore.busy}
            ><span class="material-icons">download</span> Import</button
          >
        </div>
      </div>
    </div>
  {/if}

  {#if transferAction}
    <div class="transfer-backdrop" role="presentation">
      <dialog open class="transfer-dialog" aria-labelledby="transfer-title">
        <header>
          <h2 id="transfer-title">{transferAction === "export" ? "Export backup" : "Import backup"}</h2>
          <button class="close-button" onclick={closeTransfer} aria-label="Close"><span class="material-icons">close</span></button>
        </header>
        <p>Select what the JSON backup should include or use.</p>
        <label class="data-choice"
          ><input type="checkbox" bind:checked={selection.routines} />
          <span><strong>Routines</strong><small>Workouts and weekday aliases. App preferences are excluded.</small></span></label
        >
        <label class="data-choice"
          ><input type="checkbox" bind:checked={selection.statistics} />
          <span><strong>Statistics</strong><small>Completed and partial routine sessions.</small></span></label
        >

        {#if transferAction === "export"}
          <footer>
            <button class="button danger" onclick={closeTransfer}>Cancel</button><button
              class="button accept"
              onclick={exportSelected}
              disabled={!hasSelection() || $backupStore.busy}>Export JSON</button
            >
          </footer>
        {:else}
          <input class="file-input" bind:this={fileInput} type="file" accept="application/json,.json" onchange={handleFile} />
          <button class="file-picker" onclick={chooseFile}>{selectedFile ? selectedFile.name : "Choose JSON backup"}</button>
          <div class="import-warning">
            <strong>Choose how to import</strong>
            <p><b>Merge</b> adds routines and aliases, and skips sessions that already have the same ID.</p>
            <p><b>Replace</b> permanently removes the selected existing data before importing the backup.</p>
          </div>
          <footer>
            <button class="button danger" onclick={closeTransfer}>Cancel</button><button
              class="button accept"
              onclick={() => requestImport("merge")}
              disabled={!selectedFile || !hasSelection() || $backupStore.busy}>Merge</button
            ><button class="button accept" onclick={() => requestImport("replace")} disabled={!selectedFile || !hasSelection() || $backupStore.busy}
              >Replace</button
            >
          </footer>
        {/if}
      </dialog>
    </div>
  {/if}
</div>

<style>
  .settings-menu {
    position: relative;
  }

  .settings-trigger {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-sm);
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.14);
    color: var(--text-secondary);
  }

  .settings-trigger:hover {
    color: var(--color-accent-primary);
    border-color: var(--color-accent-primary);
  }

  .settings-panel {
    position: absolute;
    top: calc(100% + var(--spacing-sm));
    right: 0;
    z-index: 200;
    width: min(320px, calc(100vw - var(--spacing-lg)));
    padding: var(--spacing-md);
    background: var(--bg-secondary);
    border: 1px solid var(--color-accent-primary);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
  }

  .settings-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-sm);
  }

  .settings-header h2 {
    margin: 0;
    font-size: var(--font-size-lg);
  }

  .settings-panel p {
    margin: var(--spacing-sm) 0 0;
    color: var(--text-secondary);
  }

  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-md);
    padding: var(--spacing-md) 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .setting-row:last-child {
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .setting-name {
    font-weight: 700;
  }

  .setting-row p {
    font-size: var(--font-size-sm);
    margin-top: var(--spacing-xs);
  }

  .toggle {
    display: inline-flex;
    flex-shrink: 0;
    cursor: pointer;
  }

  .toggle input {
    position: absolute;
    opacity: 0;
  }

  .toggle span {
    position: relative;
    width: 42px;
    height: 24px;
    border-radius: 999px;
    background: var(--bg-tertiary);
    transition: background var(--transition-base);
  }

  .toggle span::after {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--text-secondary);
    transition: transform var(--transition-base);
  }

  .toggle input:checked + span {
    background: var(--color-accent-primary);
  }

  .toggle input:checked + span::after {
    transform: translateX(18px);
    background: var(--bg-dark);
  }

  .close-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    padding: 0;
    background: transparent;
    color: var(--text-secondary);
  }

  .data-actions {
    padding-top: var(--spacing-md);
  }
  .data-actions p {
    font-size: var(--font-size-sm);
    margin-top: var(--spacing-xs);
  }
  .backup-buttons,
  footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-sm);
  }
  .transfer-dialog footer {
    justify-content: center;
  }
  .transfer-dialog footer button {
    flex: 1;
    padding-inline: var(--spacing-sm);
  }
  .backup-buttons button,
  .file-picker {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    color: var(--text-primary);
    background: var(--bg-tertiary);
    padding: var(--spacing-sm);
  }
  .transfer-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1100;
    background: rgba(0, 0, 0, 0.6);
    display: grid;
    place-items: center;
    padding: var(--spacing-md);
  }
  .transfer-dialog {
    position: relative;
    inset: auto;
    margin: 0;
    box-sizing: border-box;
    width: min(500px, 100%);
    max-height: calc(100vh - 2 * var(--spacing-md));
    overflow-y: auto;
    padding: var(--spacing-lg);
    border: 1px solid var(--color-accent-primary);
    border-radius: var(--radius-lg);
    background: var(--bg-dark);
    color: var(--text-primary);
    box-shadow: var(--shadow-lg);
  }
  .transfer-dialog header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .transfer-dialog h2 {
    margin: 0;
  }
  .transfer-dialog > p {
    color: var(--text-secondary);
  }
  .transfer-dialog button:not(.accept):not(.danger) {
    color: var(--text-primary);
  }
  .data-choice {
    display: flex;
    gap: var(--spacing-sm);
    align-items: flex-start;
    padding: var(--spacing-sm) 0;
    cursor: pointer;
  }
  .data-choice input {
    margin-top: 0.25rem;
  }
  .data-choice span {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .data-choice small {
    color: var(--text-secondary);
  }
  .file-input {
    display: none;
  }
  .file-picker {
    width: 100%;
    justify-content: center;
    border: 1px dashed var(--color-accent-primary);
  }
  .import-warning {
    margin-top: var(--spacing-md);
    padding: var(--spacing-sm);
    border-left: 3px solid var(--color-gold);
    background: rgba(255, 178, 90, 0.08);
  }
  .import-warning p {
    margin: var(--spacing-xs) 0;
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }

  @media (max-width: 640px) {
    .settings-label {
      display: none;
    }
  }
</style>
