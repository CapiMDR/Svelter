<script>
  // @ts-nocheck
  import { fade } from "svelte/transition";

  let { label, value, delta = null } = $props();

  const isPositive = $derived(delta?.startsWith("+"));
  const isNegative = $derived(delta?.startsWith("-"));
</script>

<div class="stat" transition:fade={{ y: -20, duration: 250 }}>
  <span class="stat-label">{label}</span>

  <span class="stat-value">{value}</span>

  {#if delta}
    <span class="stat-delta" class:positive={isPositive} class:negative={isNegative}>
      {delta}
    </span>
  {/if}
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

  .stat-delta {
    margin-top: 2px;
    font-size: var(--font-size-sm);
    font-weight: 600;
  }

  .stat-delta.positive {
    color: var(--color-success);
  }

  .stat-delta.negative {
    color: var(--color-danger);
  }
</style>
