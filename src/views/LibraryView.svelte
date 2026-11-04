<script>
  import { onMount } from "svelte";
  import { fromBase } from "../lib/units.js";
  import { BODY_GROUPS, BUILT_IN_TEMPLATES } from "../lib/libraryTemplates.js";
  import { libraryStore } from "../lib/stores/libraryStore.js";
  import { modalStore } from "../lib/stores/modalStore.js";

  let { onUseTemplate = () => {} } = $props();
  let group = $state("All");
  let search = $state("");
  const templates = $derived([
    ...BUILT_IN_TEMPLATES.filter((template) => !$libraryStore.hiddenBuiltInTemplateNames.includes(template.name)),
    ...$libraryStore.templates,
  ]);
  const filtered = $derived(
    templates.filter((template) => (group === "All" || template.bodyGroup === group) && template.name.toLowerCase().includes(search.toLowerCase())),
  );
  const totalExerciseCount = $derived(templates.length);

  onMount(() => libraryStore.load());

  function detail(template) {
    if (template.type === "break") return `${fromBase(template.value, template.unit)} ${template.unit}`;
    const amount = template.unit === "none" ? "" : ` · ${fromBase(template.value, template.unit)} ${template.unit}`;
    return `${template.sets} sets × ${template.reps} reps${amount}`;
  }

  function requestDelete(template) {
    modalStore.show({
      title: "Delete library workout?",
      content: `Delete \"${template.name}\" from your library? This cannot be undone.`,
      acceptText: "Delete",
      closeText: "Cancel",
      onAccept: () => (template.builtIn ? libraryStore.hideBuiltIn(template.name) : libraryStore.remove(template.id)),
    });
  }
</script>

<section class="library-view">
  <header>
    <div>
      <h2>Workout library</h2>
      <p>Choose a template to prefill a new routine element.</p>
    </div>
  </header>

  <input type="search" bind:value={search} placeholder="Search exercises…" aria-label="Search library" />

  <div class="groups" role="tablist">
    {#each ["All", ...BODY_GROUPS] as item}
      <button class:active={group === item} onclick={() => (group = item)}>{item}</button>
    {/each}
  </div>

  <p class="exercise-count">{filtered.length} out of {totalExerciseCount} exercises</p>

  {#if $libraryStore.loading}
    <p>Loading library…</p>
  {:else if filtered.length === 0}
    <p class="empty">No templates match this filter.</p>
  {:else}
    <div class="template-list">
      {#each filtered as template (template.builtIn ? `built-in-${template.name}` : template.id)}
        <article class="template">
          <button class="template-use" onclick={() => onUseTemplate(template)}>
            <span>
              <strong>{template.name}</strong>
              <small>{template.bodyGroup} · {detail(template)}{template.builtIn ? "" : " · Custom"}</small>
            </span>
            <span class="material-icons">add</span>
          </button>
          <button class="template-delete" onclick={() => requestDelete(template)} aria-label={`Delete ${template.name} from library`}>
            <span class="material-icons">delete</span>
          </button>
        </article>
      {/each}
    </div>
  {/if}
</section>

<style>
  .library-view {
    max-width: 900px;
    margin: 0 auto;
  }
  h2 {
    margin: 0;
  }
  p {
    margin: var(--spacing-xs) 0 var(--spacing-md);
  }
  input {
    width: 100%;
    margin-bottom: var(--spacing-md);
  }
  .groups {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
    margin-bottom: var(--spacing-md);
  }
  .groups button {
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-xs);
  }
  .groups button.active {
    color: var(--color-accent-primary);
    border-color: var(--color-accent-primary);
  }
  .exercise-count {
    margin: calc(var(--spacing-xs) * -1) 0 var(--spacing-md);
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }
  .template-list {
    display: grid;
    gap: var(--spacing-sm);
  }
  .template {
    display: flex;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
  }
  .template-use {
    display: flex;
    flex: 1;
    justify-content: space-between;
    min-width: 0;
    text-align: left;
    background: transparent;
    color: var(--text-primary);
  }
  .template-use span:first-child {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .template small {
    color: var(--text-secondary);
  }
  .template-use .material-icons {
    color: var(--color-accent-primary);
  }
  .template-delete {
    flex: 0 0 auto;
    align-self: stretch;
    padding: 0 var(--spacing-sm);
    color: var(--color-danger);
    background: transparent;
    border: 0;
    border-left: 1px solid var(--border-color);
  }
  .empty {
    text-align: center;
    padding: var(--spacing-xl);
  }
</style>
