<script>
  // @ts-nocheck
  let elapsedTime = $state(0);

  const timeString = $derived(convertSeconds(elapsedTime));
  let { timerState } = $props();

  let interval;
  let paused = false;

  function convertSeconds(s) {
    const minu = Math.floor(s / 60);
    const sec = s % 60;
    return String(minu).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
  }

  function start() {
    if (interval) return;

    interval = setInterval(() => {
      elapsedTime++;
    }, 1000);
  }

  function pause() {
    clearInterval(interval);
    interval = null;
  }

  function stop() {
    clearInterval(interval);
    interval = null;
    elapsedTime = 0;
  }

  $effect(() => {
    if (timerState === "running") {
      start();
    } else if (timerState === "paused") {
      pause();
    } else if (timerState === "stopped") {
      stop();
    }
  });
</script>

<div class="timer-display">
  <span class="timer-label">Time</span>
  <span class="timer-value">{timeString}</span>
</div>

<style>
  .timer-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
  }

  .timer-label {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .timer-value {
    font-size: var(--font-size-lg);
    font-weight: 700;
    font-family: "Courier New", monospace;
    color: var(--color-accent-primary);
    letter-spacing: 2px;
  }

  @media (max-width: 640px) {
    .timer-value {
      font-size: var(--font-size-base);
    }
  }
</style>
