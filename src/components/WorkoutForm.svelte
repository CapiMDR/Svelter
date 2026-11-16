<script>
  // @ts-nocheck
  import { fade, fly } from "svelte/transition";
  import NumberInput from "./NumberInput.svelte";
  import { workoutStore } from "../lib/stores/workoutStore.js";
  import { toastStore } from "../lib/stores/toastStore.js";
  import { fromBase, toBase, UNITS } from "../lib/units.js";

  // Form fields for adding a workout
  const defaultWorkoutForm = {
    name: "",
    reps: 15,
    repTarget: { mode: "fixed", fixed: 15 },
    sets: 3,
    unit: "none",
    value: 1,
    notes: "",
  };

  let { days, viewedDay, selectedDays = $bindable(), workoutToEdit, libraryTemplate = null, startRoutine, closeWorkoutForm } = $props();

  function initialForm() {
    const source = workoutToEdit ?? libraryTemplate;
    const form = { ...defaultWorkoutForm, ...(source ?? {}) };
    form.repTarget ??= { mode: "fixed", fixed: form.reps };
    return form;
  }

  function initialElementType() {
    return (workoutToEdit ?? libraryTemplate)?.type ?? "workout";
  }

  let workoutForm = $state(initialForm());
  let elementType = $state(initialElementType());
  const displayAmount = $derived(fromBase(workoutForm.value ?? 0, workoutForm.unit));

  async function handleSubmit() {
    if (!isValidElement()) {
      toastStore.info("Enter a name, select a day, and provide valid sets and rep targets");
      return;
    }
    if (workoutToEdit) {
      editWorkout();
    } else {
      addWorkout();
    }
    handleClose();
  }

  async function addWorkout() {
    await workoutStore.add(
      {
        name: elementType === "break" ? "Break" : workoutForm.name,
        reps: workoutForm.reps,
        repTarget: normalizedRepTarget(),
        sets: workoutForm.sets,
        unit: workoutForm.unit,
        value: workoutForm.value,
        notes: workoutForm.notes,
        type: elementType,
      },
      selectedDays,
      viewedDay,
    );
    toastStore.success(`${elementType === "break" ? "Break" : "Workout"} added`);
  }

  function isValidElement() {
    const repTarget = normalizedRepTarget();
    if (elementType === "workout" && !workoutForm.name.trim()) return false;
    if (elementType === "workout" && (!Number.isFinite(Number(workoutForm.sets)) || Number(workoutForm.sets) < 1)) return false;
    if (elementType === "workout" && repTarget.mode === "fixed" && (!Number.isFinite(repTarget.fixed) || repTarget.fixed < 1)) return false;
    if (elementType === "workout" && repTarget.mode === "range" && (!Number.isFinite(repTarget.min) || !Number.isFinite(repTarget.max) || repTarget.min < 1 || repTarget.max < repTarget.min)) return false;
    if (elementType === "break" && (!workoutForm.value || workoutForm.value <= 0)) return false;
    if (selectedDays.length == 0) return false;
    return true;
  }

  async function editWorkout() {
    toastStore.success("Workout updated");
    const newData = {
      name: elementType === "break" ? "Break" : workoutForm.name,
      reps: workoutForm.reps,
      repTarget: normalizedRepTarget(),
      sets: workoutForm.sets,
      unit: workoutForm.unit,
      value: workoutForm.value,
      notes: workoutForm.notes,
      type: elementType,
    };
    await workoutStore.edit(workoutToEdit, newData, viewedDay);
  }

  function handleClose() {
    resetFormData();
    closeWorkoutForm();
  }

  function resetFormData() {
    workoutForm = { ...defaultWorkoutForm };
    const today = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());
    selectedDays = [today];
    workoutToEdit = null;
  }

  const availableUnits = $derived.by(() => {
    if (elementType === "break") {
      return Object.entries(UNITS).filter(([_, unit]) => unit.dimension === "time");
    }

    if (!workoutToEdit) {
      return Object.entries(UNITS);
    }

    const dimension = UNITS[workoutToEdit.unit].dimension;

    return Object.entries(UNITS).filter(([_, unit]) => unit.dimension === dimension);
  });

  function toggleDaySelection(day) {
    if (selectedDays.includes(day)) {
      selectedDays = selectedDays.filter((d) => d !== day);
    } else {
      selectedDays = [...selectedDays, day];
    }
  }

  function getDayInitial(day) {
    return {
      Monday: "Mo",
      Tuesday: "Tu",
      Wednesday: "We",
      Thursday: "Th",
      Friday: "Fr",
      Saturday: "Sa",
      Sunday: "Su",
    }[day];
  }

  function getSelectedDaysSummary() {
    const routineDays = days.filter((day) => day !== "All");
    const selectedInOrder = routineDays.filter((day) => selectedDays.includes(day));

    if (selectedInOrder.length === routineDays.length) return "Every day";
    if (["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].every((day) => selectedDays.includes(day)) && selectedInOrder.length === 5) {
      return "Weekdays";
    }

    return selectedInOrder.map((day) => day.slice(0, 3)).join(", ") || "None";
  }

  function handleUnitChange(newUnit) {
    workoutForm.unit = newUnit;
  }

  function handleElementTypeChange(newType) {
    elementType = newType;

    if (newType === "break") {
      workoutForm.name = "Break";
      workoutForm.reps = 1;
      workoutForm.sets = 1;
      workoutForm.unit = "minutes";
      workoutForm.value = toBase(1, "minutes");
    } else if (workoutForm.name === "Break") {
      workoutForm.name = "";
    }
  }

  function updateDisplayAmount(amount) {
    workoutForm.value = toBase(amount, workoutForm.unit);
  }

  function normalizedRepTarget() {
    const target = workoutForm.repTarget ?? { mode: "fixed", fixed: workoutForm.reps ?? 1 };
    if (target.mode === "range") return { mode: "range", min: Number(target.min ?? 1), max: Number(target.max ?? target.min ?? 1) };
    return { mode: "fixed", fixed: Number(target.fixed ?? workoutForm.reps ?? 1) };
  }

  function setRepMode(mode) {
    const current = normalizedRepTarget();
    workoutForm.repTarget = mode === "range"
      ? { mode, min: current.fixed ?? current.min ?? 8, max: current.fixed ?? current.max ?? 12 }
      : { mode, fixed: current.max ?? current.fixed ?? 10 };
    workoutForm.reps = workoutForm.repTarget.mode === "range" ? workoutForm.repTarget.max : workoutForm.repTarget.fixed;
  }
</script>

<div class="panel" transition:fly={{ y: -20, duration: 250 }}>
  <div class="form-grid">
    <h2>{workoutToEdit ? `Editing ${elementType === "break" ? "Break" : "Workout"}` : `Add ${elementType === "break" ? "Break" : "Workout"}`}</h2>
    {#if !workoutToEdit}
      <div class="form-group">
        <label for="element-type">Element type</label>
        <select id="element-type" value={elementType} onchange={(event) => handleElementTypeChange(event.target.value)}>
          <option value="workout">Workout</option>
          <option value="break">Break</option>
        </select>
      </div>
    {/if}
    {#if elementType !== "break"}
      <div class="form-group">
        <label for="workout-name">Workout name</label>
        <input id="workout-name" bind:value={workoutForm.name} placeholder="e.g. Bench Press" />
      </div>
    {/if}
    {#if !workoutToEdit}
      <div class="form-group day-selection">
        <span class="field-label">Select days</span>
        <div class="day-selector" aria-label="Select days">
        {#each days.filter((d) => d !== "All") as day}
          <button
            type="button"
            class:active={selectedDays.includes(day)}
            onclick={() => toggleDaySelection(day)}
            aria-pressed={selectedDays.includes(day)}
            title={day}
          >{getDayInitial(day)}</button>
        {/each}
        </div>
        <small>Selected: {getSelectedDaysSummary()}</small>
      </div>
    {/if}
    {#if elementType === "workout"}
      <div class="form-group">
        <span class="field-label">Rep target</span>
        <div class="target-mode" role="group" aria-label="Repetition target type">
          <button type="button" class:active={normalizedRepTarget().mode === "fixed"} onclick={() => setRepMode("fixed")}>Fixed</button>
          <button type="button" class:active={normalizedRepTarget().mode === "range"} onclick={() => setRepMode("range")}>Range</button>
        </div>
      </div>
      <div class="number-fields">
        {#if normalizedRepTarget().mode === "range"}
          <NumberInput label="Min reps" bind:value={workoutForm.repTarget.min} integerOnly={true} fullWidth={true} />
          <NumberInput label="Max reps" bind:value={workoutForm.repTarget.max} integerOnly={true} fullWidth={true} />
        {:else}
          <NumberInput label="Reps" bind:value={workoutForm.repTarget.fixed} integerOnly={true} fullWidth={true} />
        {/if}
        <NumberInput label="Sets" bind:value={workoutForm.sets} integerOnly={true} fullWidth={true} />
      </div>
    {/if}
    <div class="form-group">
      <label for="units">Unit</label>
      <select id="units" bind:value={workoutForm.unit} onchange={(e) => handleUnitChange(e.target.value)}>
        {#each availableUnits as [id, unit]}
          <option value={id}>
            {unit.label}
          </option>
        {/each}
      </select>
    </div>
    {#if workoutForm.unit != "none"}
      <NumberInput label={elementType === "break" ? "Duration" : "Amount"} value={displayAmount} onchange={updateDisplayAmount} />
    {/if}
    <div class="form-group">
      <label for="element-notes">Notes <span class="optional-label">(optional)</span></label>
      <textarea id="element-notes" bind:value={workoutForm.notes} placeholder="Add notes for this element"></textarea>
    </div>
  </div>
  <div class="button-row" transition:fly={{ y: -20, duration: 250 }}>
    <button class="btn-primary" onclick={handleSubmit}>
      <span class="material-icons"> {workoutToEdit ? "edit" : "add"} </span>
      {workoutToEdit ? "Save Changes" : "Add to routine"}
    </button> <button class="btn-danger secondary" onclick={handleClose}> <span class="material-icons">close</span> Cancel </button>
  </div>
</div>

<style>
  :global(body) {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }

  .day-selector {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: var(--spacing-xs);
    width: 100%;
  }

  .field-label {
    color: var(--text-primary);
    font-size: var(--font-size-sm);
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .day-selector button {
    min-width: 0;
    padding: var(--spacing-sm);
    color: var(--text-secondary);
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    font-size: var(--font-size-xs);
  }

  .day-selector button.active {
    color: var(--bg-dark);
    background: var(--color-accent-primary);
    border-color: var(--color-accent-primary);
  }

  .day-selection small {
    color: var(--text-secondary);
    font-size: var(--font-size-xs);
  }

  .number-fields {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--spacing-md);
  }
  .target-mode { display: flex; gap: var(--spacing-xs); }
  .target-mode button { flex: 1; color: var(--text-secondary); background: var(--bg-tertiary); }
  .target-mode button.active { color: var(--bg-dark); background: var(--color-accent-primary); }

  @media (min-width: 769px) {
    .form-grid {
      grid-template-columns: 1fr;
      max-width: 680px;
    }
  }

  .button-row {
    display: flex;
    gap: var(--spacing-md);
    flex-wrap: wrap;
  }

  textarea {
    min-height: 84px;
    resize: vertical;
  }

  .optional-label {
    color: var(--text-tertiary);
    font-weight: 400;
    text-transform: none;
  }

  .btn-primary {
    background: linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary));
    color: var(--bg-dark);
    flex: 1;
    min-width: 150px;
    padding: var(--spacing-md) var(--spacing-lg);
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 25px rgba(0, 212, 255, 0.4);
  }

  @media (max-width: 768px) {
    .form-grid {
      grid-template-columns: 1fr;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
    }

    .button-row {
      flex-direction: column;
    }

    .btn-primary,
    .btn-danger {
      width: 100%;
      min-width: unset;
    }

    .number-fields {
      gap: var(--spacing-sm);
    }
  }
</style>
