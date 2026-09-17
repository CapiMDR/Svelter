<script>
  // @ts-nocheck
  import ProgressBar from "./ProgressBar.svelte";
  import { settingsStore } from "../lib/stores/settingsStore.js";

  let { duration, timerState } = $props();

  let elapsed = $state(0);
  let interval = null;
  let isRunning = $state(false);

  const remaining = $derived(Math.max(0, duration - elapsed));
  const timeString = $derived(formatTime(remaining));
  const isComplete = $derived(remaining === 0);

  const TimerState = {
    STOPPED: "stopped",
    RUNNING: "running",
    PAUSED: "paused",
    COMPLETED: "completed",
  };

  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function start() {
    if (timerState !== TimerState.RUNNING || interval || elapsed >= duration) return;

    interval = setInterval(() => {
      elapsed = Math.min(duration, elapsed + 1);

      if (elapsed >= duration) {
        pause();

        if ($settingsStore.vibrateOnCountdownFinish && navigator.vibrate) {
          navigator.vibrate([150, 100, 150]);
        }
      }
    }, 1000);
    isRunning = true;
  }

  function pause() {
    clearInterval(interval);
    interval = null;
    isRunning = false;
  }

  function reset() {
    pause();
    elapsed = 0;
  }

  $effect(() => {
    if (timerState === TimerState.STOPPED) {
      reset();
    } else if (timerState === TimerState.PAUSED || timerState === TimerState.COMPLETED) {
      pause();
    }

    return pause;
  });
</script>

<div class="countdown" class:completed={isComplete}>
  <div class="countdown-header">
    <span class="countdown-label">Time remaining</span>
    <div class="countdown-controls">
      <span class="countdown-value">{timeString}</span>
      {#if isRunning}
        <button class="countdown-button" onclick={pause} title="Pause timer" aria-label="Pause timer">
          <span class="material-icons">pause</span>
        </button>
      {:else}
        <button
          class="countdown-button"
          onclick={start}
          disabled={timerState !== TimerState.RUNNING || isComplete}
          title={isComplete ? "Reset timer to start again" : "Start timer"}
          aria-label="Start timer"
        >
          <span class="material-icons">play_arrow</span>
        </button>
      {/if}
      <button class="countdown-button" onclick={reset} disabled={timerState !== TimerState.RUNNING} title="Reset timer" aria-label="Reset timer">
        <span class="material-icons">restart_alt</span>
      </button>
    </div>
  </div>
  <ProgressBar progress={elapsed} total={duration} />
</div>

<style>
  .countdown {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .countdown-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-sm);
  }

  .countdown-label {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .countdown-value {
    color: var(--color-accent-primary);
    font-family: "Courier New", monospace;
    font-weight: 700;
  }

  .countdown-controls {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .countdown-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 1px solid rgba(0, 212, 255, 0.4);
    border-radius: 50%;
    background: rgba(0, 212, 255, 0.08);
    color: var(--color-accent-primary);
  }

  .countdown-button:hover:not(:disabled) {
    background: rgba(0, 212, 255, 0.18);
  }

  .countdown.completed .countdown-value {
    color: var(--color-gold);
  }
</style>
