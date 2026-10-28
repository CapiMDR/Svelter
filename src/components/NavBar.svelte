<script>
  import { onMount } from "svelte";
  import Clock from "./Clock.svelte";
  import SettingsMenu from "./SettingsMenu.svelte";

  let { activeView = "workouts", onViewChange = () => {}, onDataImported = () => {}, routineActive = false } = $props();
  let navbar = $state();

  onMount(() => {
    const updateHeight = () => document.documentElement.style.setProperty("--navbar-height", `${navbar?.offsetHeight ?? 0}px`);
    const observer = new ResizeObserver(updateHeight);
    observer.observe(navbar);
    updateHeight();
    return () => observer.disconnect();
  });
</script>

<nav class="navbar" bind:this={navbar}>
  <div class="navbar-content">
    <div class="navbar-row brand-row">
      <div class="navbar-brand">
        <span class="icon">💪</span>
        <h1 class="title">Svelter</h1>
      </div>
      <div class="version">v3.0.1</div>
    </div>

    <div class="navbar-row utility-row">
      <div class="navbar-time"><Clock /></div>
      <SettingsMenu {onDataImported} {routineActive} />
    </div>

    <div class="view-navigation" aria-label="Main navigation">
      <button class:active={activeView === "workouts"} onclick={() => onViewChange("workouts")}>Workouts</button>
      <button class:active={activeView === "statistics"} onclick={() => onViewChange("statistics")} disabled={routineActive}>Statistics</button>
    </div>
  </div>
</nav>

<style>
  .navbar {
    width: 100%;
    background: linear-gradient(135deg, var(--bg-primary) 0%, var(--color-primary) 100%);
    border-bottom: 2px solid var(--color-accent-primary);
    padding: var(--spacing-md) 0;
    box-shadow: var(--shadow-md);
    position: sticky;
    top: 0;
    z-index: 300;
  }

  .navbar-content {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-sm);
    padding: 0 var(--spacing-md);
    max-width: 1200px;
    margin: 0 auto;
  }

  .navbar-row {
    width: 100%;
  }
  .brand-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--spacing-md);
  }
  .utility-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--spacing-md);
  }
  .navbar-brand {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }
  .icon {
    font-size: var(--font-size-xl);
  }
  .title {
    font-size: var(--font-size-xl);
    margin: 0;
    background: linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .version {
    font-size: 0.65rem;
    color: var(--text-secondary);
    opacity: 0.75;
    padding: 2px 6px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  .navbar-time {
    justify-self: start;
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }
  .utility-row :global(.settings-menu) {
    justify-self: end;
  }
  .view-navigation {
    width: 100%;
    display: flex;
    justify-content: center;
    gap: var(--spacing-xs);
  }
  .view-navigation button {
    background: transparent;
    color: var(--text-secondary);
    padding: var(--spacing-xs) var(--spacing-sm);
    border: 1px solid transparent;
  }
  .view-navigation button.active {
    color: var(--color-accent-primary);
    border-color: var(--color-accent-primary);
  }

  @media (max-width: 640px) {
    .title {
      font-size: var(--font-size-lg);
    }
    .icon {
      font-size: var(--font-size-lg);
    }
  }
</style>
