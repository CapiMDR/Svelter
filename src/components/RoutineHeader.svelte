<script>
  // @ts-nocheck
  import Timer from "./Timer.svelte";
  import ProgressBar from "./ProgressBar.svelte";
  import { routineStore, RoutineState } from "../lib/stores/routineStore.js";
  import { fly } from "svelte/transition";

  let { completed, total, onPause } = $props();
</script>

<div class="running-timer-section" class:completed={completed === total} transition:fly={{ y: -20, duration: 100 }}>
  <Timer timerState={$routineStore.state} />

  <div class="progress-section">
    <div class="progress-label">
      {completed} / {total} completed
    </div>

    <ProgressBar progress={completed} {total} />
  </div>

  <button
    onclick={onPause}
    class="btn-pause"
    class:paused={$routineStore.state === RoutineState.PAUSED || $routineStore.state === RoutineState.COMPLETED}
    disabled={$routineStore.state === RoutineState.COMPLETED}
  >
    <span class="material-icons">
      {$routineStore.state !== RoutineState.PAUSED ? "pause" : "play_arrow"}
    </span>
  </button>
</div>

<style>
  .running-timer-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--color-primary) 100%);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    margin-bottom: var(--spacing-sm);
    padding: var(--spacing-lg);
    box-shadow: var(--shadow-md);
    gap: var(--spacing-lg);

    position: sticky;
    top: 100px;
    z-index: 100;
  }
  .running-timer-section.completed {
    border-color: var(--color-gold);
    box-shadow: 0 0 24px rgba(255, 166, 0, 0.16);
  }
  .running-timer-section.completed {
    border-color: var(--color-gold);
    box-shadow: 0 0 24px rgba(255, 166, 0, 0.16);
  }
  .btn-pause {
    background: linear-gradient(135deg, var(--color-light-blue), var(--color-medium-blue));
    color: var(--bg-dark);
    padding: var(--spacing-md) var(--spacing-lg);
    max-width: 55px;
  }

  .btn-pause.paused {
    background: linear-gradient(135deg, var(--color-green), var(--color-cyan));
  }

  .btn-pause:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 25px rgba(36, 76, 255, 0.4);
  }

  .btn-pause.paused:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 25px rgba(0, 255, 242, 0.4);
  }
  .progress-section {
    flex: 1;
    min-width: 0;
  }

  .progress-label {
    font-size: 1rem;
    font-weight: 700;
    text-align: center;
  }
</style>
