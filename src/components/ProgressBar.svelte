<script>
  let { progress = 0, total = 100 } = $props();

  const percentage = $derived(total > 0 ? Math.min(100, Math.max(0, (progress / total) * 100)) : 0);
</script>

<div class="progress-bar">
  <div class="progress-fill" style={`width: ${percentage}%`}></div>
</div>

<style>
  .progress-bar {
    width: 100%;
    height: 6px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 999px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-accent-primary), var(--color-success));
    transition: width var(--transition-base);
    box-shadow: inset 0 0 8px rgba(0, 212, 255, 0.25);
  }
</style>
