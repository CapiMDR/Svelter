<script>
  // @ts-nocheck
  import { fade } from "svelte/transition";
  let { type, stat } = $props();
</script>

<div class="stat" transition:fade={{ y: -20, duration: 250 }}>
  <span class="stat-label">{type}</span>
  <span class="stat-value">{stat}</span>
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
</style>
