<script>
  // @ts-nocheck
  import { onMount } from "svelte";
  import { fly, fade } from "svelte/transition";

  import { workoutStore } from "../lib/stores/workoutStore.js";
  import { modalStore } from "../lib/stores/modalStore.js";
  import { toastStore } from "../lib/stores/toastStore.js";
  import { routineStore, RoutineState } from "../lib/stores/routineStore.js";

  import WorkoutCard from "../components/WorkoutCard.svelte";
  import NavBar from "../components/NavBar.svelte";
  import Timer from "../components/Timer.svelte";
  import ProgressBar from "../components/ProgressBar.svelte";
  import NumberInput from "../components/NumberInput.svelte";
  import WorkoutStat from "../components/WorkoutStat.svelte";
  import Modal from "../components/Modal.svelte";
  import ToastContainer from "../components/ToastContainer.svelte";

  const today = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());
  let viewedDay = today; // Day that is being viewed by the user, defaults to current day
  let workoutToEdit = null; // null = adding, object = editing
  let selectedDays = [today];

  // Data states
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "All"];
  const units = ["Kg", "lb", "Seconds", "Minutes", "None"];

  // Form fields for adding a workout
  const defaultWorkoutForm = {
    name: "",
    reps: 15,
    sets: 3,
    unit: "None",
    unitAmount: 60,
  };

  onMount(() => {
    workoutStore.load(viewedDay);
  });

  let workoutForm = { ...defaultWorkoutForm };

  let showAddWorkoutPanel = false; // Whether the form for adding a workout is open or not

  function toggleDaySelection(day) {
    if (selectedDays.includes(day)) {
      selectedDays = selectedDays.filter((d) => d !== day);
    } else {
      selectedDays = [...selectedDays, day];
    }
  }

  async function handleWorkoutSubmit() {
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
    showAddWorkoutPanel = false;
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
  }

  function isValidWorkout() {
    if (workoutForm.name == "") return false;
    if (workoutForm.sets == null || workoutForm.reps == null) return false;
    if (selectedDays.length == 0) return false;
    return true;
  }

  async function requestDeleteWorkout(workout) {
    if (!workout) return;
    confirm("Deleting " + workout.name, `Do you want to delete ${workout.name} from ${workout.day}?`, () => deleteWorkout(workout));
  }
  async function deleteWorkout(workout) {
    await workoutStore.remove(workout, viewedDay);
    toastStore.success("Workout deleted");
  }

  async function swapWorkouts(movedWorkout, direction) {
    const dayWorkouts = $workoutStore.workouts.filter((w) => w.day === movedWorkout.day);

    const newPosition = movedWorkout.position + direction;

    if (newPosition < 0 || newPosition >= dayWorkouts.length) {
      return;
    }

    const otherWorkout = dayWorkouts.find((w) => w.position === newPosition);

    if (!otherWorkout) return;

    const oldPosition = movedWorkout.position;

    movedWorkout.position = newPosition;
    otherWorkout.position = oldPosition;

    await workoutStore.swap(movedWorkout, otherWorkout, viewedDay);
  }

  function handleEditClick(workout) {
    showAddWorkoutPanel = true;
    workoutToEdit = workout;

    workoutForm.name = workout.name;
    workoutForm.reps = workout.reps;
    workoutForm.sets = workout.sets;
    workoutForm.unit = workout.unit;
    workoutForm.unitAmount = workout.unitAmount;
    selectedDays = [workout.day];
    scrollToTop();
  }

  function confirm(title, content, onAccept = null, acceptText = "Confirm", closeText = "Cancel", onClose = null) {
    modalStore.show({
      title,
      content,
      closeText: "Cancel",
      acceptText: "Confirm",
      onAccept,
    });
  }

  function startRoutine() {
    routineStore.start();
    showAddWorkoutPanel = false;
  }

  function pauseRoutine() {
    routineStore.togglePause();
  }

  function updateWorkoutCompletion(delta) {
    routineStore.updateProgress(delta, $workoutStore.totalWorkouts);
  }

  function requestEndRoutine() {
    confirm("Complete routine", "Are you ready to complete the routine?", () => endRoutine());
  }

  function endRoutine() {
    routineStore.reset();

    scrollToTop();
    toastStore.success("Routine completed and saved!");
  }

  function requestCancelRoutine() {
    confirm("Cancel routine", "Do you want to cancel the active routine? Your progress won't be saved.", () => cancelRoutine());
  }

  function cancelRoutine() {
    routineStore.reset();
    scrollToTop();
  }

  function openAddWorkout(dayChosen) {
    showAddWorkoutPanel = true;

    selectedDays = dayChosen === "All" ? days.filter((d) => d !== "All") : [dayChosen];

    scrollToTop();
  }

  function resetFormData() {
    workoutForm = { ...defaultWorkoutForm };
    selectedDays = [];
    workoutToEdit = null;
    showAddWorkoutPanel = false;
  }

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  let showScrollButton = false;

  function handleScroll() {
    showScrollButton = window.scrollY > 300;
  }
</script>

<svelte:window on:scroll={handleScroll} />
<Modal />
<NavBar />
<ToastContainer />

<main class="app-container">
  {#if $routineStore.state !== RoutineState.STOPPED}
    <div
      class="running-timer-section"
      class:completed={$routineStore.completedWorkouts == $workoutStore.totalWorkouts}
      transition:fade={{ y: -20, duration: 100 }}
    >
      <Timer timerState={$routineStore.state} />

      <div class="progress-section" transition:fade={{ y: -20, duration: 100 }}>
        <div class="progress-label">
          {$routineStore.completedWorkouts} / {$workoutStore.totalWorkouts} completed
        </div>

        <ProgressBar progress={$routineStore.completedWorkouts} total={$workoutStore.totalWorkouts} />
      </div>

      <button
        onclick={pauseRoutine}
        class="btn-pause"
        class:paused={$routineStore.state === RoutineState.PAUSED || $routineStore.state === RoutineState.COMPLETED}
        disabled={$routineStore.state === RoutineState.COMPLETED}
      >
        <span class="material-icons">
          {$routineStore.state !== RoutineState.PAUSED ? "pause" : "play_arrow"}
        </span>
      </button>
    </div>
  {/if}
  {#if showScrollButton}
    <button
      class="btn-scroll"
      class:stick-higher={$routineStore.state === RoutineState.STOPPED}
      onclick={() => scrollToTop()}
      transition:fly={{ y: -20, duration: 100 }}
    >
      <span class="material-symbols-outlined"> keyboard_double_arrow_up </span>
    </button>
  {/if}
  {#if $routineStore.state === RoutineState.PAUSED}
    <div class="pause-indicator" transition:fly={{ y: -20, duration: 250 }}>Paused</div>
  {/if}
  <div class="divider"></div>

  {#if $routineStore.state === RoutineState.STOPPED}
    <div class="controls-panel" transition:fade={{ y: -20, duration: 100 }}>
      <div class="form-grid">
        <div class="section-header" transition:fade={{ y: -20, duration: 250 }}>
          <h2>Routine for <span class="day-highlight">{viewedDay}</span></h2>
        </div>

        <div class="form-group" transition:fade={{ y: -20, duration: 250 }}>
          <label for="days">View a day</label>
          <select id="days" bind:value={viewedDay} onchange={() => workoutStore.load(viewedDay)}>
            {#each days as day}
              <option value={day}>{day}</option>
            {/each}
          </select>
        </div>
        {#if !showAddWorkoutPanel}
          <button onclick={startRoutine} class="btn-timer" disabled={$workoutStore.totalWorkouts <= 0} transition:fade={{ y: -20, duration: 100 }}>
            <span class="material-icons">play_arrow</span>
            Start Routine
          </button>
        {/if}
        {#if showAddWorkoutPanel}
          <h2 transition:fly={{ y: -20, duration: 250 }}>{workoutToEdit ? "Editing Workout" : "Adding Workout"}</h2>
          <div class="form-group" transition:fly={{ y: -20, duration: 250 }}>
            <label for="workout-name">Workout name</label>
            <input id="workout-name" bind:value={workoutForm.name} placeholder="e.g. Bench Press" />
          </div>
          {#if !workoutToEdit}
            <div class="form-group" transition:fly={{ y: -20, duration: 250 }}>
              <label for="workout-name">Select days</label>
            </div>

            <div class="day-selector" transition:fly={{ y: -20, duration: 250 }}>
              {#each days.filter((d) => d !== "All") as day}
                <label>
                  <input type="checkbox" checked={selectedDays.includes(day)} onchange={() => toggleDaySelection(day)} />
                  {day}
                </label>
              {/each}
            </div>
          {/if}
          <div class="form-group" transition:fly={{ y: -20, duration: 250 }}>
            <NumberInput label="# Reps" bind:value={workoutForm.reps} />
          </div>

          <div class="form-group" transition:fly={{ y: -20, duration: 250 }}>
            <NumberInput label="# Sets" bind:value={workoutForm.sets} />
          </div>

          <div class="form-group" transition:fly={{ y: -20, duration: 250 }}>
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
        {/if}
      </div>

      {#if showAddWorkoutPanel}
        <div class="button-row" transition:fly={{ y: -20, duration: 250 }}>
          <button class="btn-primary" onclick={handleWorkoutSubmit}>
            <span class="material-icons">
              {workoutToEdit ? "edit" : "add"}
            </span>

            {workoutToEdit ? "Save Changes" : "Add Workout"}
          </button>
          <button class="btn-danger secondary" onclick={resetFormData}>
            <span class="material-icons">close</span>
            Cancel
          </button>
        </div>
      {:else if viewedDay === "All"}
        <div class="day-selection-warning" transition:fade={{ y: -20, duration: 100 }}>
          Viewing all workouts. View a specific day to start its routine.
        </div>
      {/if}
    </div>
    <div class="divider"></div>
  {/if}

  <div class="workouts-section">
    {#if $routineStore.state === RoutineState.STOPPED && showAddWorkoutPanel === false}
      <button class="btn-create" onclick={() => openAddWorkout(viewedDay)}>
        <span class="material-icons">add</span>
        Add workout
      </button>
    {/if}
    {#if $workoutStore.workouts.length === 0}
      <div class="empty-state" transition:fade={{ y: -20, duration: 100 }}>
        <span class="empty-icon">🏋️</span>
        <h3>No workouts yet</h3>
        <p>Add a workout to get started!</p>
      </div>
    {:else if viewedDay === "All"}
      <div class="workouts-container" transition:fade={{ y: -20, duration: 100 }}>
        {#each $workoutStore.groupedWorkouts as [day, dayWorkouts]}
          <div class="day-group">
            <WorkoutStat type={"Day"} stat={day} />

            {#if dayWorkouts.length > 0}
              {#each dayWorkouts as workout (workout.id)}
                <WorkoutCard
                  selectedDay={viewedDay}
                  cardState={$routineStore.state}
                  {workout}
                  deleteWorkout={requestDeleteWorkout}
                  changePosition={swapWorkouts}
                  {updateWorkoutCompletion}
                  totalWorkouts={dayWorkouts.length}
                  editWorkout={handleEditClick}
                />
              {/each}
            {:else}
              <div class="empty-day">No workouts scheduled, have a nice break!</div>
            {/if}
          </div>
        {/each}
      </div>
    {:else}
      <div class="workouts-container" transition:fade={{ y: -20, duration: 100 }}>
        {#each $workoutStore.workouts as workout (workout.id)}
          <WorkoutCard
            selectedDay={viewedDay}
            cardState={$routineStore.state}
            {workout}
            deleteWorkout={requestDeleteWorkout}
            changePosition={swapWorkouts}
            {updateWorkoutCompletion}
            totalWorkouts={$workoutStore.totalWorkouts}
            editWorkout={handleEditClick}
          />
        {/each}
      </div>
    {/if}
  </div>

  {#if $routineStore.state !== RoutineState.STOPPED}
    <div class="footer-container" transition:fade={{ y: -20, duration: 100 }}>
      <button onclick={requestEndRoutine} disabled={$routineStore.completedWorkouts < $workoutStore.totalWorkouts} class="btn-stop">
        <span class="material-symbols-outlined"> trophy </span>
        Complete Routine
      </button>

      <button onclick={requestCancelRoutine} class="button danger">
        <span class="material-icons">cancel</span>
        Cancel Routine
      </button>
    </div>
  {/if}
</main>

<style>
  :global(body) {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }

  .footer-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .app-container {
    flex: 1;
    padding: var(--spacing-lg);
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }

  .controls-panel {
    background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--color-primary) 100%);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: var(--spacing-xl);
    margin-bottom: var(--spacing-xl);
    box-shadow: var(--shadow-md);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-xl);
    gap: var(--spacing-lg);
  }

  .section-header h2 {
    margin: 0;
    font-size: var(--font-size-xl);
  }

  .day-highlight {
    color: var(--color-accent-primary);
    font-weight: 700;
  }

  .running-timer-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--color-primary) 100%);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    margin-bottom: var(--spacing-sm);
    padding: var(--spacing-lg);
    box-shadow: var(--shadow-md);
    gap: var(--spacing-lg);

    position: sticky;
    top: 100px;
    z-index: 100;
  }

  .running-timer-section.completed {
    border-color: var(--color-gold);
    box-shadow: 0 0 24px rgba(255, 166, 0, 0.16);
  }

  .pause-indicator {
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-tertiary) 100%);
    border: 1px solid var(--color-accent-primary);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-xl);
    box-shadow: var(--shadow-md);
    font-size: 1rem;
    font-weight: 700;
    text-align: center;
    position: fixed;
    top: 50%;
    width: 95.4%;
    z-index: 100;
  }

  .running-timer-section.completed {
    border-color: var(--color-gold);
    box-shadow: 0 0 24px rgba(255, 166, 0, 0.16);
  }

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

  .btn-stop {
    background: linear-gradient(135deg, var(--color-gold), var(--color-orange));
    color: var(--bg-dark);
    margin-top: var(--spacing-md);
    margin-bottom: var(--spacing-md);
    padding: var(--spacing-md) var(--spacing-lg);
    box-shadow: 0 0 25px rgba(255, 136, 0, 0.4);
    min-width: 140px;
    min-height: 75px;
  }

  .btn-stop:hover {
    transform: translateY(-2px);
  }

  .btn-pause {
    background: linear-gradient(135deg, var(--color-light-blue), var(--color-medium-blue));
    color: var(--bg-dark);
    padding: var(--spacing-md) var(--spacing-lg);
    max-width: 55px;
  }

  .btn-pause.paused {
    background: linear-gradient(135deg, var(--color-green), var(--color-cyan));
  }

  .btn-pause:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 25px rgba(36, 76, 255, 0.4);
  }

  .btn-pause.paused:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 25px rgba(0, 255, 242, 0.4);
  }
  .day-selector {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-lg);
    margin-bottom: var(--spacing-xl);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .form-group label {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--text-primary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .form-group input,
  .form-group select {
    width: 100%;
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

  .btn-create {
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
    text-align: center;
    color: var(--text-secondary);
    background: var(--bg-secondary);
    border: 1px dashed var(--color-accent-primary);
    border-radius: var(--radius-md);
  }

  .btn-timer {
    background: linear-gradient(135deg, var(--color-success), var(--color-accent-primary));
    color: var(--bg-dark);
    min-width: 120px;
    padding: var(--spacing-md) var(--spacing-lg);
  }

  .btn-timer:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 25px rgba(0, 255, 136, 0.4);
  }

  .divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--color-accent-primary), transparent);
    margin: var(--spacing-xl) 0;
  }

  .progress-section {
    flex: 1;
    min-width: 0;
  }

  .progress-label {
    font-size: 1rem;
    font-weight: 700;
    text-align: center;
  }

  .workouts-section {
    min-height: 200px;
  }

  .workouts-container {
    display: grid;
    gap: var(--spacing-md);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-2xl);
    text-align: center;
    color: var(--text-secondary);
  }

  .empty-icon {
    font-size: var(--font-size-2xl);
    margin-bottom: var(--spacing-md);
    opacity: 0.6;
  }

  .empty-state h3 {
    color: var(--text-primary);
  }

  .empty-state p {
    margin: 0;
  }

  .day-selection-warning {
    padding: var(--spacing-md);
    text-align: center;
    color: var(--text-secondary);
    background: var(--bg-secondary);
    border: 1px dashed var(--color-accent-primary);
    border-radius: var(--radius-md);
  }

  .empty-day {
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-md);
    text-align: center;
    color: var(--text-tertiary);
    border: 2px dashed var(--text-tertiary);
    border-radius: var(--radius-md);
  }

  @media (max-width: 768px) {
    .app-container {
      padding: var(--spacing-md);
    }

    .controls-panel {
      padding: var(--spacing-lg);
      margin-bottom: var(--spacing-lg);
    }

    .section-header {
      flex-direction: column;
      align-items: flex-start;
      margin-bottom: var(--spacing-lg);
    }

    .form-grid {
      grid-template-columns: 1fr;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
    }

    .button-row {
      flex-direction: column;
    }

    .btn-primary,
    .btn-timer,
    .btn-danger,
    .btn-create {
      width: 100%;
      min-width: unset;
    }

    .divider {
      margin: var(--spacing-lg) 0;
    }
  }

  @media (max-width: 480px) {
    .app-container {
      padding: var(--spacing-sm);
    }

    .controls-panel {
      padding: var(--spacing-md);
      margin-bottom: var(--spacing-md);
    }

    .section-header h2 {
      font-size: var(--font-size-lg);
    }
  }
</style>
