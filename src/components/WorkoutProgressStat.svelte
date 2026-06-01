<script>
  let { type, completed, total } = $props();
</script>

<div class="stat progress-stat">
  <span class="stat-label">{type}</span>
  <span class="stat-value accent">{completed}/{total}</span>
</div>

<style>
  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 4px 0;
  }

  .stat-label {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: var(--spacing-xs);
  }

  .stat-value {
    font-size: var(--font-size-lg);
    font-weight: 700;
    color: var(--text-primary);
  }

  .stat-value.accent {
    color: var(--color-accent-primary);
  }

  .progress-stat {
    background: rgba(0, 212, 255, 0.05);
    padding: var(--spacing-sm);
    border-radius: var(--radius-md);
    border: 1px solid rgba(0, 212, 255, 0.2);
  }
</style>
