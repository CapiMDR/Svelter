<script>
  // @ts-nocheck
  import { fade, fly } from "svelte/transition";
  import NumberInput from "./NumberInput.svelte";
  import { workoutStore } from "../lib/stores/workoutStore.js";
  import { toastStore } from "../lib/stores/toastStore.js";

  // Form fields for adding a workout
  const defaultWorkoutForm = {
    name: "",
    reps: 15,
    sets: 3,
    unit: "None",
    unitAmount: 60,
  };

  let { days, units, viewedDay, selectedDays = $bindable(), workoutToEdit, toggleDaySelection, startRoutine, closeWorkoutForm } = $props();
  let workoutForm = $state({ ...defaultWorkoutForm });

  $effect(() => {
    workoutForm = workoutToEdit ? { ...workoutToEdit } : { ...defaultWorkoutForm };
  });

  async function handleSubmit() {
    if (workoutToEdit) {
      editWorkout();
    } else {
      addWorkout();
    }
    resetFormData();
  }

  async function addWorkout() {
    if (!isValidWorkout()) {
      toastStore.info("Name and day required");
      return;
    }
    await workoutStore.add(
      { name: workoutForm.name, reps: workoutForm.reps, sets: workoutForm.sets, unit: workoutForm.unit, unitAmount: workoutForm.unitAmount },
      selectedDays,
      viewedDay,
    );
    toastStore.success("Workout added");
    closeWorkoutForm();
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
      unitAmount: workoutForm.unitAmount,
    };
    await workoutStore.edit(workoutToEdit, newData, viewedDay);
    resetFormData();
    closeWorkoutForm();
  }

  function handleCancel() {
    resetFormData();
    closeWorkoutForm();
  }

  function resetFormData() {
    workoutForm = { ...defaultWorkoutForm };
    selectedDays = [];
    workoutToEdit = null;
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
    <div class="form-group"><NumberInput label="# Reps" bind:value={workoutForm.reps} /></div>
    <div class="form-group"><NumberInput label="# Sets" bind:value={workoutForm.sets} /></div>
    <div class="form-group">
      <label for="units">Unit</label>
      <select id="units" bind:value={workoutForm.unit}>
        {#each units as unit}
          <option value={unit}>{unit}</option>
        {/each}
      </select>
      {#if workoutForm.unit != "None"}
        <NumberInput label="Amount" bind:value={workoutForm.unitAmount} />
      {/if}
    </div>
  </div>
  <div class="button-row" transition:fly={{ y: -20, duration: 250 }}>
    <button class="btn-primary" onclick={handleSubmit}>
      <span class="material-icons"> {workoutToEdit ? "edit" : "add"} </span>
      {workoutToEdit ? "Save Changes" : "Add Workout"}
    </button> <button class="btn-danger secondary" onclick={handleCancel}> <span class="material-icons">close</span> Cancel </button>
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
