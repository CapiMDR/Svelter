<script>
  // @ts-nocheck
  import { fly } from "svelte/transition";

  let { stickHigher, scrollToTop } = $props();
  let visible = $state(false);

  function handleScroll() {
    visible = window.scrollY > 300;
  }
</script>

<svelte:window on:scroll={handleScroll} />
{#if visible}
  <button class="btn-scroll" class:stick-higher={stickHigher} onclick={() => scrollToTop()} transition:fly={{ y: -20, duration: 100 }}>
    <span class="material-symbols-outlined"> keyboard_double_arrow_up </span>
  </button>
{/if}

<style>
  .btn-scroll {
    background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--color-primary) 100%);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    margin-bottom: var(--spacing-sm);
    box-shadow: var(--shadow-md);
    gap: var(--spacing-lg);
    color: var(--text-tertiary);
    position: sticky;
    width: 100%;
    top: 200px;
    z-index: 100;
  }

  .btn-scroll.stick-higher {
    top: 100px;
  }
</style>
