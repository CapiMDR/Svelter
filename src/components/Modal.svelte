<script>
  import { modalStore } from "../lib/stores/modalStore.js";
  import { fly } from "svelte/transition";
</script>

{#if $modalStore.open}
  <div class="backdrop">
    <div class="modal" transition:fly={{ y: -20, duration: 250 }}>
      <header class="header">
        <h2>{$modalStore.title}</h2>
      </header>

      <section class="content">
        {$modalStore.content}
      </section>

      <footer class="actions">
        <button class="button accept" onclick={() => modalStore.accept()}>
          {$modalStore.acceptText}
        </button>

        <button class="button danger" onclick={() => modalStore.close()}>
          {$modalStore.closeText}
        </button>
      </footer>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);

    display: flex;
    align-items: center;
    justify-content: center;

    z-index: 1000;
  }

  .modal {
    width: min(90vw, 500px);

    background: var(--bg-dark);
    border-radius: 12px;

    overflow: hidden;

    border: 2px solid var(--color-secondary);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  }

  .header {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--color-secondary);
  }

  .header h2 {
    margin: 0;
  }

  .content {
    padding: 1.25rem;
  }

  .actions {
    padding: 1rem 1.25rem;

    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }

  button {
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
  }
</style>
