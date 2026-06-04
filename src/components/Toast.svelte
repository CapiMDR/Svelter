<script>
  import { fly } from "svelte/transition";
  let { toast, onClose } = $props();
</script>

<div class="toast {toast.type}" transition:fly={{ y: -20, duration: 250 }}>
  <span>{toast.message}</span>

  <button class="close" onclick={() => onClose(toast.id)}> ✕ </button>
</div>

<style>
  .toast {
    min-width: 300px;

    border-radius: 0.75rem;

    display: flex;
    justify-content: space-between;
    align-items: center;

    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    color: var(--bg-dark);
    padding: var(--spacing-md) var(--spacing-lg);
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: black;
    letter-spacing: 0.5px;
  }

  .success {
    background: linear-gradient(135deg, var(--color-success), var(--color-accent-primary));
    color: var(--bg-dark);
  }

  .error {
    background: linear-gradient(135deg, var(--color-danger), var(--color-warning));
  }

  .warning {
    background: linear-gradient(135deg, var(--color-danger), var(--color-warning));
  }

  .info {
    background: var(--text-secondary);
  }

  .close {
    background: none;
    border: none;
    cursor: pointer;
  }
</style>
