<script>
  // @ts-nocheck
  import { onMount } from "svelte";
  import { fly, fade } from "svelte/transition";

  import { workoutStore } from "../lib/stores/workoutStore.js";
  import { modalStore } from "../lib/stores/modalStore.js";
  import { toastStore } from "../lib/stores/toastStore.js";

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
  let selectedDays = [today];

  onMount(() => {
    workoutStore.load(viewedDay);
  });

  // Data states
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "All"];
  const units = ["Kg", "lb", "Seconds", "Minutes", "None"];

  // Form fields for adding a workout
  let workoutName = "";
  let workoutReps = 15;
  let workoutSets = 3;
  let selectedUnit = units[units.length - 1];
  let unitAmount = 60;

  let showAddWorkoutPanel = false; // Whether the form for adding a workout is open or not

  let completedWorkouts = 0;

  function toggleDaySelection(day) {
    if (selectedDays.includes(day)) {
      selectedDays = selectedDays.filter((d) => d !== day);
    } else {
      selectedDays = [...selectedDays, day];
    }
  }

  async function addWorkout() {
    if (!isValidWorkout()) {
      toastStore.info("Name and day required");
      return;
    }

    await workoutStore.add(
      {
        name: workoutName,
        reps: workoutReps,
        sets: workoutSets,
        unit: selectedUnit,
        unitAmount,
        createdAt: Date.now(),
      },
      selectedDays,
      viewedDay,
    );

    toastStore.success("Workout added");
    workoutName = "";
    showAddWorkoutPanel = false;
  }

  function isValidWorkout() {
    if (workoutName == "") return false;
    if (workoutSets == null || workoutReps == null) return false;
    if (selectedDays.length == 0) return false;
    return true;
  }

  async function requestDeleteWorkout(workout) {
    if (!workout) return;
    modalStore.show({
      title: "Deleting " + workout.name,
      content: `Do you want to delete ${workout.name} from ${workout.day}?`,
      closeText: "Cancel",
      acceptText: "Confirm",

      onAccept: async () => {
        deleteWorkout(workout);
      },

      onClose: () => {
        console.log("Deletion cancelled");
      },
    });
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

  // State of the entire routine, not just individual workouts
  const RoutineState = {
    STOPPED: "stopped",
    RUNNING: "running",
    PAUSED: "paused",
    COMPLETED: "completed",
  };

  let routineState = RoutineState.STOPPED;

  function startRoutine() {
    routineState = RoutineState.RUNNING;
    showAddWorkoutPanel = false;
  }

  function pauseRoutine() {
    if (routineState == RoutineState.PAUSED) {
      routineState = RoutineState.RUNNING;
    } else {
      routineState = RoutineState.PAUSED;
    }
  }

  function updateWorkoutCompletion(delta) {
    completedWorkouts = Math.max(0, Math.min($workoutStore.totalWorkouts, completedWorkouts + delta));
    if (completedWorkouts == $workoutStore.totalWorkouts) {
      routineState = RoutineState.COMPLETED;
    } else {
      routineState = RoutineState.RUNNING;
    }
  }

  function requestEndRoutine() {
    modalStore.show({
      title: "Complete routine",
      content: `Are you ready to complete the routine?`,
      closeText: "Cancel",
      acceptText: "Confirm",

      onAccept: () => {
        endRoutine();
      },

      onClose: () => {
        console.log("Cancelled end routine");
      },
    });
  }

  function endRoutine() {
    routineState = RoutineState.STOPPED;
    completedWorkouts = 0;
    scrollToTop();
    toastStore.success("Routine completed and stored!");
    console.log("Routine ended");
  }

  function requestCancelRoutine() {
    modalStore.show({
      title: "Cancel routine",
      content: `Do you want to cancel the active routine? Your progress won't be saved.`,
      closeText: "Cancel",
      acceptText: "Confirm",

      onAccept: () => {
        cancelRoutine();
      },

      onClose: () => {
        console.log("Cancelled cancel routine");
      },
    });
  }

  function cancelRoutine() {
    routineState = RoutineState.STOPPED;
    completedWorkouts = 0;
    scrollToTop();
    console.log("Routine cancelled");
  }

  function openAddWorkout(dayChosen) {
    showAddWorkoutPanel = true;

    selectedDays = dayChosen === "All" ? days.filter((d) => d !== "All") : [dayChosen];

    scrollToTop();
  }

  function cancelAddWorkout() {
    workoutName = "";
    workoutReps = 15;
    workoutSets = 3;
    unitAmount = 60;
    selectedDays = [];
    selectedUnit = units[units.length - 1];
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
  {#if routineState !== RoutineState.STOPPED}
    <div class="running-timer-section" class:completed={completedWorkouts == $workoutStore.totalWorkouts} transition:fade={{ y: -20, duration: 100 }}>
      <Timer timerState={routineState} />

      <div class="progress-section" transition:fade={{ y: -20, duration: 100 }}>
        <div class="progress-label">
          {completedWorkouts} / {$workoutStore.totalWorkouts} completed
        </div>

        <ProgressBar progress={completedWorkouts} total={$workoutStore.totalWorkouts} />
      </div>

      <button
        onclick={pauseRoutine}
        class="btn-pause"
        class:paused={routineState === RoutineState.PAUSED || routineState === RoutineState.COMPLETED}
        disabled={routineState === RoutineState.COMPLETED}
      >
        <span class="material-icons">
          {routineState !== RoutineState.PAUSED ? "pause" : "play_arrow"}
        </span>
      </button>
    </div>
  {/if}
  {#if showScrollButton}
    <button
      class="btn-scroll"
      class:stick-higher={routineState === RoutineState.STOPPED}
      onclick={() => scrollToTop()}
      transition:fly={{ y: -20, duration: 100 }}
    >
      <span class="material-symbols-outlined"> keyboard_double_arrow_up </span>
    </button>
  {/if}
  {#if routineState === RoutineState.PAUSED}
    <div class="pause-indicator" transition:fly={{ y: -20, duration: 250 }}>Paused</div>
  {/if}
  <div class="divider"></div>

  {#if routineState === RoutineState.STOPPED}
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
          <div class="form-group" transition:fly={{ y: -20, duration: 250 }}>
            <label for="workout-name">Workout name</label>
            <input id="workout-name" bind:value={workoutName} placeholder="e.g. Bench Press" />
          </div>
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
          <div class="form-group" transition:fly={{ y: -20, duration: 250 }}>
            <NumberInput label="# Reps" bind:value={workoutReps} />
          </div>

          <div class="form-group" transition:fly={{ y: -20, duration: 250 }}>
            <NumberInput label="# Sets" bind:value={workoutSets} />
          </div>

          <div class="form-group" transition:fly={{ y: -20, duration: 250 }}>
            <label for="units">Unit</label>
            <select id="units" bind:value={selectedUnit}>
              {#each units as unit}
                <option value={unit}>{unit}</option>
              {/each}
            </select>
            {#if selectedUnit != "None"}
              <NumberInput label="Amount" bind:value={unitAmount} />
            {/if}
          </div>
        {/if}
      </div>

      {#if showAddWorkoutPanel}
        <div class="button-row" transition:fly={{ y: -20, duration: 250 }}>
          <button class="btn-primary" onclick={addWorkout}>
            <span class="material-icons">add</span>
            Add Workout
          </button>
          <button class="btn-danger secondary" onclick={cancelAddWorkout}>
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
    {#if routineState === RoutineState.STOPPED && showAddWorkoutPanel === false}
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
                  cardState={routineState}
                  {workout}
                  deleteWorkout={requestDeleteWorkout}
                  changePosition={swapWorkouts}
                  {updateWorkoutCompletion}
                  totalWorkouts={dayWorkouts.length}
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
            cardState={routineState}
            {workout}
            deleteWorkout={requestDeleteWorkout}
            changePosition={swapWorkouts}
            {updateWorkoutCompletion}
            totalWorkouts={$workoutStore.totalWorkouts}
          />
        {/each}
      </div>
    {/if}
  </div>

  {#if routineState !== RoutineState.STOPPED}
    <div class="footer-container" transition:fade={{ y: -20, duration: 100 }}>
      <button onclick={requestEndRoutine} disabled={completedWorkouts < $workoutStore.totalWorkouts} class="btn-stop">
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
