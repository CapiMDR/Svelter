<script>
  // @ts-nocheck
  let elapsedTime = 0;
  let timeString = convertSeconds(elapsedTime);

  let interval;
  let paused = false;

  function convertSeconds(s) {
    const minu = Math.floor(s / 60);
    const sec = s % 60;
    return String(minu).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
  }

  export function start() {
    if (interval) return;
    interval = setInterval(() => {
      if (paused) return;
      elapsedTime++;
      timeString = convertSeconds(elapsedTime);
    }, 1000);
  }

  export function pause() {
    paused = true;
  }

  export function play() {
    paused = false;
  }

  export function stop() {
    clearInterval(interval);
    interval = null;
  }
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
