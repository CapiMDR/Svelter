<script>
  // @ts-nocheck
  import { fade, fly } from "svelte/transition";
  import NumberInput from "./NumberInput.svelte";
  import { workoutStore } from "../lib/stores/workoutStore.js";
  import { toastStore } from "../lib/stores/toastStore.js";
  import { fromBase, toBase, UNITS } from "../lib/units.js";

  $effect(() => {
    workoutForm = workoutToEdit ? { ...workoutToEdit } : { ...defaultWorkoutForm };
  });

  // Form fields for adding a workout
  const defaultWorkoutForm = {
    name: "",
    reps: 15,
    sets: 3,
    unit: "none",
    value: 0,
  };

  let { days, viewedDay, selectedDays = $bindable(), workoutToEdit, toggleDaySelection, startRoutine, closeWorkoutForm } = $props();
  let workoutForm = $state({ ...defaultWorkoutForm });
  const displayAmount = $derived(fromBase(workoutForm.value ?? 0, workoutForm.unit));

  async function handleSubmit() {
    if (!isValidWorkout()) {
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
        name: workoutForm.name,
        reps: workoutForm.reps,
        sets: workoutForm.sets,
        unit: workoutForm.unit,
        value: workoutForm.value,
      },
      selectedDays,
      viewedDay,
    );
    toastStore.success("Workout added");
  }

  function isValidWorkout() {
    if (workoutForm.name == "") return false;
    if (workoutForm.sets == null || workoutForm.reps == null) return false;
    if (selectedDays.length == 0) return false;
    return true;
  }

  async function editWorkout() {
    toastStore.success("Workout updated");
    const newData = {
      name: workoutForm.name,
      reps: workoutForm.reps,
      sets: workoutForm.sets,
      unit: workoutForm.unit,
      value: workoutForm.value,
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
    if (!workoutToEdit) {
      return Object.entries(UNITS);
    }

    const dimension = UNITS[workoutToEdit.unit].dimension;

    return Object.entries(UNITS).filter(([_, unit]) => unit.dimension === dimension);
  });

  function handleUnitChange(newUnit) {
    workoutForm.unit = newUnit;
  }

  function updateDisplayAmount(amount) {
    workoutForm.value = toBase(amount, workoutForm.unit);
  }
</script>

<div class="panel" transition:fly={{ y: -20, duration: 250 }}>
  <div class="form-grid">
    <h2>{workoutToEdit ? "Editing Workout" : "Adding Workout"}</h2>
    <div class="form-group">
      <label for="workout-name">Workout name</label> <input id="workout-name" bind:value={workoutForm.name} placeholder="e.g. Bench Press" />
    </div>
    {#if !workoutToEdit}
      <div class="form-group"><label for="workout-name">Select days</label></div>
      <div class="day-selector">
        {#each days.filter((d) => d !== "All") as day}
          <label> <input type="checkbox" checked={selectedDays.includes(day)} onchange={() => toggleDaySelection(day)} /> {day} </label>
        {/each}
      </div>
    {/if}
    <div class="form-group"><NumberInput label="# Reps" bind:value={workoutForm.reps} integerOnly={true} /></div>
    <div class="form-group"><NumberInput label="# Sets" bind:value={workoutForm.sets} integerOnly={true} /></div>
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
      <NumberInput label="Amount" value={displayAmount} onchange={updateDisplayAmount} />
    {/if}
  </div>
  <div class="button-row" transition:fly={{ y: -20, duration: 250 }}>
    <button class="btn-primary" onclick={handleSubmit}>
      <span class="material-icons"> {workoutToEdit ? "edit" : "add"} </span>
      {workoutToEdit ? "Save Changes" : "Add Workout"}
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
