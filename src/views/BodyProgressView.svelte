<script>
  import { onMount } from "svelte";
  import { bodyProgressStore } from "../lib/stores/bodyProgressStore.js";
  import { modalStore } from "../lib/stores/modalStore.js";
  import { toastStore } from "../lib/stores/toastStore.js";
  import BodyProgressPhoto from "../components/BodyProgressPhoto.svelte";

  const fields = [
    ["weight", "Body weight", "kg"],
    ["waist", "Waist", "cm"],
    ["chest", "Chest", "cm"],
    ["upperArm", "Upper arm", "cm"],
    ["shoulders", "Shoulders", "cm"],
    ["hips", "Hips", "cm"],
    ["thigh", "Thigh", "cm"],
  ];
  let editing = $state(null);
  let form = $state(blankForm());
  let photoFiles = $state([]);
  let photoInput = $state();
  let expandedEntryId = $state(null);
  let selectedMetric = $state("weight");
  let chartRange = $state("all");
  const chartEntries = $derived(
    [...$bodyProgressStore.entries].filter((entry) => entry[selectedMetric] != null && isInChartRange(entry.recordedAt)).reverse(),
  );
  const chartPoints = $derived(points(chartEntries, selectedMetric));

  onMount(() => bodyProgressStore.load());
  function blankForm() {
    return {
      recordedAt: new Date().toISOString().slice(0, 10),
      weight: null,
      waist: null,
      chest: null,
      upperArm: null,
      shoulders: null,
      hips: null,
      thigh: null,
      notes: "",
    };
  }
  function edit(entry = null) {
    editing = entry?.id ?? "new";
    form = entry ? { ...entry, recordedAt: entry.recordedAt.slice(0, 10) } : blankForm();
    photoFiles = [];
  }
  function addSelectedPhotos(files) {
    photoFiles = [...photoFiles, ...files];
    if (photoInput) photoInput.value = "";
  }
  function removeSelectedPhoto(index) {
    photoFiles = photoFiles.filter((_, currentIndex) => currentIndex !== index);
  }
  function toggleEntry(id) {
    expandedEntryId = expandedEntryId === id ? null : id;
  }
  async function save() {
    const measurements = Object.fromEntries(fields.map(([key]) => [key, form[key] === "" || form[key] == null ? null : Number(form[key])]));
    if (!Object.values(measurements).some((value) => value != null) && !form.notes?.trim() && !photoFiles.length)
      return toastStore.info("Add a measurement, note, or photo first");
    try {
      await bodyProgressStore.save(
        { ...form, ...measurements, id: editing === "new" ? undefined : editing, recordedAt: new Date(form.recordedAt).toISOString() },
        photoFiles,
      );
      editing = null;
      toastStore.success("Body progress saved");
    } catch (error) {
      toastStore.error(error.message ?? "Could not save body progress");
    }
  }
  function requestDelete(entry) {
    modalStore.show({
      title: "Delete body entry?",
      content: "This also deletes its locally stored photo.",
      acceptText: "Delete",
      closeText: "Cancel",
      onAccept: async () => {
        await bodyProgressStore.remove(entry.id);
        toastStore.success("Body progress entry deleted");
      },
    });
  }
  function isInChartRange(recordedAt) {
    if (chartRange === "all") return true;
    const days = Number(chartRange);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));
    return new Date(recordedAt) >= start;
  }
  function points(entries, metric) {
    if (!entries.length) return "";
    const values = entries.map((entry) => Number(entry[metric]));
    const min = Math.min(...values);
    const range = Math.max(...values) - min || 1;
    return values
      .map((value, index) => `${entries.length === 1 ? 50 : (index / (entries.length - 1)) * 100},${90 - ((value - min) / range) * 80}`)
      .join(" ");
  }
  function label(entry) {
    return new Date(entry.recordedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }
</script>

<section class="body-progress">
  <header>
    <div>
      <h2>Body Progress</h2>
      <p>Measurements and photos stay only on this device unless you export them.</p>
    </div>
    <button onclick={() => edit()}><span class="material-icons">add</span> Add entry</button>
  </header>
  {#if editing}
    <section class="entry-form">
      <h3>{editing === "new" ? "New entry" : "Edit entry"}</h3>
      <label>Date<input type="date" bind:value={form.recordedAt} /></label>
      <div class="fields">
        {#each fields as [key, name, unit]}<label>{name} ({unit})<input type="number" min="0" step="0.1" bind:value={form[key]} /></label>{/each}
      </div>
      <label>Notes<textarea bind:value={form.notes} placeholder="Optional check-in notes"></textarea></label>
      <div class="photo-field">
        <span>Photo check-ins</span><small>Stored locally and resized before saving. You can choose more than one.</small><input
          hidden
          class="photo-input"
          bind:this={photoInput}
          type="file"
          accept="image/*"
          multiple
          onchange={(event) => addSelectedPhotos(event.currentTarget.files ?? [])}
        />
        <div class="photo-actions">
          <button type="button" class="photo-picker" onclick={() => photoInput?.click()}
            ><span class="material-icons">photo_camera</span>Add photos</button
          >
        </div>
        {#if photoFiles.length}<div class="selected-photos">
            {#each photoFiles as photo, index}<span
                >{photo.name}<button type="button" onclick={() => removeSelectedPhoto(index)} aria-label={`Remove ${photo.name}`}
                  ><span class="material-icons">close</span></button
                ></span
              >{/each}
          </div>{/if}
      </div>
      <div class="actions">
        <button class="button danger" onclick={() => (editing = null)}>Cancel</button><button class="button accept" onclick={save}>Save entry</button>
      </div>
    </section>
  {/if}
  <section class="trend">
    <div class="trend-header">
      <h3>Measurement trend</h3>
      <div class="trend-filters">
        <select bind:value={selectedMetric} aria-label="Measurement">
          {#each fields as [key, name, unit]}<option value={key}>{name} ({unit})</option>{/each}
        </select>
        <select bind:value={chartRange} aria-label="Date range">
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
          <option value="all">All time</option>
        </select>
      </div>
    </div>
    {#if chartPoints}<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Measurement trend"
        ><polyline points={chartPoints} />{#each chartEntries as entry, index}{@const [x, y] = chartPoints.split(" ")[index].split(",")}<circle
            cx={x}
            cy={y}
            r="2"><title>{label(entry)}: {entry[selectedMetric]}</title></circle
          >{/each}</svg
      >{:else}<p>No {selectedMetric} entries in this period.</p>{/if}
  </section>
  {#if $bodyProgressStore.loading}
    <p>Loading entries…</p>
  {:else if !$bodyProgressStore.entries.length}
    <div class="empty">
      <span class="material-icons">monitor_weight</span>
      <h3>No body progress yet</h3>
      <p>Add a weight, measurements, a note, or a local photo check-in.</p>
    </div>
  {:else}
    <div class="history">
      {#each $bodyProgressStore.entries as entry (entry.id)}
        <article class:expanded={expandedEntryId === entry.id}>
          <div class="entry-summary">
            <button class="entry-toggle" onclick={() => toggleEntry(entry.id)} aria-expanded={expandedEntryId === entry.id}>
              <span
                ><strong>{label(entry)}</strong><small
                  >{fields.filter(([key]) => entry[key] != null).length} measurements{entry.notes ? " · note" : ""}</small
                ></span
              >
              <span class="material-icons">{expandedEntryId === entry.id ? "expand_less" : "expand_more"}</span>
            </button>
            {#if entry.photoCount > 0}<span class="photo-tag"
                ><span class="material-icons">photo</span>{entry.photoCount} {entry.photoCount === 1 ? "photo" : "photos"}</span
              >{/if}
            <div class="entry-actions">
              <button onclick={() => edit(entry)} aria-label="Edit entry"><span class="material-icons">edit</span></button>
              <button class="delete" onclick={() => requestDelete(entry)} aria-label="Delete entry"><span class="material-icons">delete</span></button
              >
            </div>
          </div>
          {#if expandedEntryId === entry.id}
            <div class="entry-content">
              <div>
                <div class="measurement-summary">
                  {#each fields.filter(([key]) => entry[key] != null) as [key, name, unit]}<span>{name}: {entry[key]} {unit}</span>{/each}
                </div>
                {#if entry.notes}<p>{entry.notes}</p>{/if}
              </div>
              <BodyProgressPhoto entryId={entry.id} />
            </div>
          {/if}
        </article>
      {/each}
    </div>
  {/if}
</section>

<style>
  .body-progress {
    max-width: 900px;
    margin: 0 auto;
  }
  header,
  .trend-header,
  .entry-content {
    display: flex;
    justify-content: space-between;
    gap: var(--spacing-md);
    align-items: flex-start;
  }
  h2,
  h3,
  p {
    margin-top: 0;
  }
  header p,
  .trend p,
  small {
    color: var(--text-secondary);
  }
  .entry-form,
  .trend,
  article {
    margin-top: var(--spacing-lg);
    padding: var(--spacing-md);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
  }
  .entry-form {
    display: grid;
    gap: var(--spacing-sm);
  }
  .entry-form label {
    display: grid;
    gap: 4px;
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }
  .fields {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--spacing-sm);
  }
  textarea {
    min-height: 76px;
  }
  .actions,
  .entry-actions {
    display: flex;
    gap: var(--spacing-sm);
    justify-content: flex-end;
  }
  .photo-field {
    display: grid;
    gap: 4px;
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }
  .photo-input {
    display: none;
  }
  .photo-actions {
    display: flex;
    gap: var(--spacing-sm);
  }
  .photo-picker {
    flex: 1;
    min-width: 0;
    color: var(--text-primary);
    background: var(--bg-tertiary);
    border: 1px dashed var(--color-accent-primary);
    text-transform: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .remove-photo {
    color: var(--color-danger);
    background: transparent;
    border: 1px solid var(--color-danger);
    padding-inline: var(--spacing-sm);
    text-transform: none;
  }
  .trend svg {
    width: 100%;
    height: 180px;
    overflow: visible;
  }
  polyline {
    fill: none;
    stroke: var(--color-accent-primary);
    stroke-width: 1.5;
    vector-effect: non-scaling-stroke;
  }
  circle {
    fill: var(--color-success);
  }
  .history {
    display: grid;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-lg);
  }
  article {
    margin: 0;
    padding: 0;
    overflow: hidden;
  }
  .entry-summary {
    display: flex;
    align-items: stretch;
  }
  .entry-toggle {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-align: left;
    color: var(--text-primary);
    background: transparent;
    padding: var(--spacing-md);
    text-transform: none;
  }
  .entry-toggle > span:first-child {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .photo-tag {
    align-self: center;
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 3px 6px;
    border-radius: 999px;
    color: var(--color-accent-primary);
    background: rgba(0, 212, 255, 0.1);
    font-size: var(--font-size-xs);
    white-space: nowrap;
  }
  .photo-tag .material-icons {
    font-size: 0.9rem;
  }
  .entry-actions {
    align-items: center;
    padding-right: var(--spacing-sm);
  }
  .entry-actions button {
    padding: var(--spacing-xs);
    background: transparent;
    color: var(--text-secondary);
  }
  .entry-actions .delete {
    color: var(--color-danger);
  }
  .entry-content {
    min-width: 0;
    padding: 0 var(--spacing-md) var(--spacing-md);
    border-top: 1px solid var(--border-color);
    padding-top: var(--spacing-md);
  }
  .measurement-summary {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
  }
  .measurement-summary span {
    font-size: var(--font-size-xs);
    padding: 3px 6px;
    background: var(--bg-tertiary);
    border-radius: 999px;
  }
  .empty {
    min-height: 260px;
    display: grid;
    place-content: center;
    text-align: center;
    color: var(--text-secondary);
  }
  .empty .material-icons {
    font-size: 3rem;
    color: var(--color-accent-primary);
  }
  @media (max-width: 560px) {
    header,
    .trend-header {
      flex-direction: column;
    }
    header button {
      width: 100%;
    }
    .fields {
      grid-template-columns: 1fr;
    }
    .entry-content {
      flex-direction: column;
    }
    .photo-actions {
      flex-direction: column;
    }
  }
  .selected-photos {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
  }
  .selected-photos > span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    max-width: 100%;
    padding: 4px 6px;
    border-radius: var(--radius-sm);
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    font-size: var(--font-size-xs);
  }
  .selected-photos button {
    width: 22px;
    height: 22px;
    padding: 0;
    color: var(--color-danger);
    background: transparent;
  }
  .trend-filters {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
  }
  .trend-filters select {
    min-width: 130px;
  }
  @media (max-width: 560px) {
    .trend-filters {
      width: 100%;
    }
    .trend-filters select {
      flex: 1;
      min-width: 0;
    }
  }
</style>
