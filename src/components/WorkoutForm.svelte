<script>
  // @ts-nocheck
  import { fade, fly } from "svelte/transition";
  import NumberInput from "./NumberInput.svelte";
  import { workoutStore } from "../lib/stores/workoutStore.js";
  import { toastStore } from "../lib/stores/toastStore.js";
  import { fromBase, toBase, UNITS } from "../lib/units.js";

  $effect(() => {
    workoutForm = workoutToEdit ? { ...defaultWorkoutForm, ...workoutToEdit } : { ...defaultWorkoutForm };
    elementType = workoutToEdit?.type ?? "workout";
  });

  // Form fields for adding a workout
  const defaultWorkoutForm = {
    name: "",
    reps: 15,
    sets: 3,
    unit: "none",
    value: 1,
    notes: "",
  };

  let { days, viewedDay, selectedDays = $bindable(), workoutToEdit, startRoutine, closeWorkoutForm } = $props();
  let workoutForm = $state({ ...defaultWorkoutForm });
  let elementType = $state("workout");
  const displayAmount = $derived(fromBase(workoutForm.value ?? 0, workoutForm.unit));

  async function handleSubmit() {
    if (!isValidElement()) {
      toastStore.info("Name and day required");
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
    if (elementType === "workout" && workoutForm.name == "") return false;
    if (elementType === "workout" && (workoutForm.sets == null || workoutForm.reps == null)) return false;
    if (elementType === "break" && (!workoutForm.value || workoutForm.value <= 0)) return false;
    if (selectedDays.length == 0) return false;
    return true;
  }

  async function editWorkout() {
    toastStore.success("Workout updated");
    const newData = {
      name: elementType === "break" ? "Break" : workoutForm.name,
      reps: workoutForm.reps,
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
</script>

<div class="panel" transition:fly={{ y: -20, duration: 250 }}>
  <div class="form-grid">
    <h2>{workoutToEdit ? `Editing ${elementType === "break" ? "Break" : "Workout"}` : "Adding Element"}</h2>
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
      <div class="form-group"><label for="workout-name">Select days</label></div>
      <div class="day-selector">
        {#each days.filter((d) => d !== "All") as day}
          <label> <input type="checkbox" checked={selectedDays.includes(day)} onchange={() => toggleDaySelection(day)} /> {day} </label>
        {/each}
      </div>
    {/if}
    {#if elementType === "workout"}
      <div class="form-group"><NumberInput label="# Reps" bind:value={workoutForm.reps} integerOnly={true} /></div>
      <div class="form-group"><NumberInput label="# Sets" bind:value={workoutForm.sets} integerOnly={true} /></div>
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
      {workoutToEdit ? "Save Changes" : `Add ${elementType === "break" ? "Break" : "Workout"}`}
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
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
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
  }
</style>
