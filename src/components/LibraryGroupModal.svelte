<script>
  import { BODY_GROUPS } from "../lib/libraryTemplates.js";

  let { workout = null, onSave = () => {}, onClose = () => {} } = $props();
  let group = $state("Custom");

  $effect(() => {
    if (workout) group = "Custom";
  });
</script>

{#if workout}
  <div class="backdrop" role="presentation" onclick={onClose}>
    <dialog open class="dialog" aria-labelledby="library-group-title" onclick={(event) => event.stopPropagation()}>
      <h2 id="library-group-title">Save to library</h2>
      <p>Choose the body group for <strong>{workout.name}</strong>.</p>
      <label>
        Body group
        <select bind:value={group}>
          {#each BODY_GROUPS as option}<option value={option}>{option}</option>{/each}
        </select>
      </label>
      <footer>
        <button class="button" onclick={() => onSave(group)}>Save workout</button>
        <button class="button danger" onclick={onClose}>Cancel</button>
      </footer>
    </dialog>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 1200;
    display: grid;
    place-items: center;
    padding: var(--spacing-md);
    background: rgba(0, 0, 0, 0.5);
  }

  .dialog {
    position: relative;
    inset: auto;
    margin: 0;
    box-sizing: border-box;
    width: min(100%, 420px);
    max-height: calc(100vh - 2 * var(--spacing-md));
    overflow-y: auto;
    padding: var(--spacing-lg);
    background: var(--bg-dark);
    border: 2px solid var(--color-secondary);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
  }

  h2,
  p {
    margin-top: 0;
  }
  h2 {
    color: var(--text-primary);
  }
  p {
    color: var(--text-secondary);
  }
  label {
    display: grid;
    gap: var(--spacing-xs);
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }
  select {
    width: 100%;
  }
  footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-lg);
  }
</style>
