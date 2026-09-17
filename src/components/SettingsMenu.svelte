<script>
  import { settingsStore } from "../lib/stores/settingsStore.js";

  let isOpen = $state(false);

  function toggle() {
    isOpen = !isOpen;
  }

  function close() {
    isOpen = false;
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
    border-bottom: 0;
    padding-bottom: 0;
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

  @media (max-width: 640px) {
    .settings-label {
      display: none;
    }
  }
</style>
