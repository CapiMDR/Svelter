<script>
  // @ts-nocheck
  function updateClock() {
    const now = new Date();
    timeString = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  // Update clock every second
  let timeString;
  setInterval(updateClock, 1000);
  updateClock(); // Initialize clock immediately
</script>

<div class="clock">
  <span class="clock-icon">📅</span>
  <span class="clock-text">{timeString}</span>
</div>

<style>
  .clock {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }

  .clock-icon {
    font-size: var(--font-size-base);
  }

  .clock-text {
    font-weight: 500;
  }

  @media (max-width: 640px) {
    .clock {
      font-size: var(--font-size-xs);
    }

    .clock-icon {
      font-size: var(--font-size-sm);
    }
  }
</style>
