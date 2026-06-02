<script>
  // @ts-nocheck
  import { db } from "../lib/db.js";
  import WorkoutCard from "../components/WorkoutCard.svelte";
  import NavBar from "../components/NavBar.svelte";
  import Timer from "../components/Timer.svelte";
  import ProgressBar from "../components/ProgressBar.svelte";
  import NumberInput from "../components/NumberInput.svelte";
  import WorkoutStat from "../components/WorkoutStat.svelte";
  import { onMount } from "svelte";

  onMount(loadWorkouts);

  const date = new Date();
  const today = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
  let workoutName = "";
  let selectedDay = today;

  let workoutReps = 15;
  let workoutSets = 3;
  let unitAmount = 60;
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "All"];
  const units = ["g", "Kg", "Seconds", "Minutes", "None"];
  let selectedUnit = units[units.length - 1];
  let showAddWorkoutPanel = false;

  let completedWorkouts = 0;
  let totalWorkouts = 0;

  let workouts = [];
  let groupedWorkouts = [];
  async function loadWorkouts() {
    if (selectedDay === "All") {
      workouts = await db.workouts.toArray();

      const dayOrder = {
        Monday: 0,
        Tuesday: 1,
        Wednesday: 2,
        Thursday: 3,
        Friday: 4,
        Saturday: 5,
        Sunday: 6,
      };

      workouts.sort((a, b) => {
        const dayDiff = dayOrder[a.day] - dayOrder[b.day];

        if (dayDiff !== 0) return dayDiff;

        return a.position - b.position;
      });

      groupedWorkouts = Object.entries(
        workouts.reduce((groups, workout) => {
          (groups[workout.day] ??= []).push(workout);
          return groups;
        }, {}),
      );
    } else {
      workouts = await db.workouts.where("day").equals(selectedDay).toArray();
      workouts.sort((a, b) => a.position - b.position);
    }

    totalWorkouts = workouts.length;
  }

  async function addWorkout() {
    if (!workoutName.trim()) return;
    if (workoutSets == null || workoutReps == null) return;

    const workoutData = {
      name: workoutName,
      reps: workoutReps,
      sets: workoutSets,
      unit: selectedUnit,
      unitAmount: unitAmount,
      createdAt: Date.now(),
    };

    if (selectedDay === "All") {
      const actualDays = days.filter((day) => day !== "All");

      await db.transaction("rw", db.workouts, async () => {
        for (const day of actualDays) {
          const dayWorkouts = await db.workouts.where("day").equals(day).toArray();

          await db.workouts.add({
            ...workoutData,
            day,
            position: dayWorkouts.length,
          });
        }
      });
    } else {
      await db.workouts.add({
        ...workoutData,
        day: selectedDay,
        position: workouts.length,
      });
    }

    workoutName = "";
    showAddWorkoutPanel = false;

    await loadWorkouts();
  }

  async function deleteWorkout(deletedWorkout) {
    if (!deletedWorkout) return;

    const deletedWorkoutID = deletedWorkout.id;

    const workoutsToShift = workouts.filter((workout) => workout.position > deletedWorkout.position);

    totalWorkouts--;

    workoutsToShift.forEach((workout) => {
      workout.position--;
    });

    await db.transaction("rw", db.workouts, async () => {
      await db.workouts.delete(deletedWorkoutID);
      await db.workouts.bulkPut(workoutsToShift);
    });

    await loadWorkouts();
  }

  async function swapWorkouts(movedWorkout, direction) {
    const oldPosition = movedWorkout.position;
    const newPosition = movedWorkout.position + direction;

    if (oldPosition < 0 || oldPosition >= workouts.length || newPosition < 0 || newPosition >= workouts.length) {
      return;
    }

    const otherWorkout = workouts[newPosition];
    [workouts[oldPosition], workouts[newPosition]] = [workouts[newPosition], workouts[oldPosition]];

    workouts = [...workouts];
    movedWorkout.position = newPosition;
    otherWorkout.position = oldPosition;

    await db.workouts.update(movedWorkout.id, {
      position: newPosition,
    });
    await db.workouts.update(otherWorkout.id, {
      position: oldPosition,
    });
  }

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
    completedWorkouts = Math.max(0, Math.min(totalWorkouts, completedWorkouts + delta));
    if (completedWorkouts == totalWorkouts) {
      routineState = RoutineState.COMPLETED;
    } else {
      routineState = RoutineState.RUNNING;
    }
  }

  function endRoutine() {
    routineState = RoutineState.STOPPED;
    completedWorkouts = 0;
    scrollToTop();
  }

  function openAddWorkout(dayChosen) {
    showAddWorkoutPanel = true;
    selectedDay = dayChosen;
    loadWorkouts();
    scrollToTop();
  }

  function cancelAddWorkout() {
    workoutName = "";
    workoutReps = 15;
    workoutSets = 3;
    unitAmount = 60;
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
<NavBar />

<main class="app-container">
  {#if showScrollButton || routineState != RoutineState.STOPPED}
    <button class="btn-scroll" onclick={() => scrollToTop()}>
      <span class="material-symbols-outlined"> keyboard_double_arrow_up </span>
    </button>
  {/if}
  {#if routineState !== RoutineState.STOPPED}
    <div class="running-timer-section" class:completed={completedWorkouts == totalWorkouts}>
      <Timer timerState={routineState} />

      <div class="progress-section">
        <div class="progress-label">
          {completedWorkouts} / {totalWorkouts} completed
        </div>

        <ProgressBar progress={completedWorkouts} total={totalWorkouts} />
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
    <div class="divider"></div>
  {/if}
  {#if routineState === RoutineState.STOPPED}
    <div class="controls-panel">
      <div class="section-header">
        <h2>Routine for <span class="day-highlight">{selectedDay}</span></h2>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label for="days">Choose a day</label>
          <select id="days" bind:value={selectedDay} onchange={() => loadWorkouts()}>
            {#each days as day}
              <option value={day}>{day}</option>
            {/each}
          </select>
        </div>
        {#if !showAddWorkoutPanel}
          <button onclick={startRoutine} class="btn-timer" title="Start/Pause Timer">
            <span class="material-icons">play_arrow</span>
            Start Routine
          </button>
        {/if}
        {#if showAddWorkoutPanel}
          <div class="form-group">
            <label for="workout-name">Workout name</label>
            <input id="workout-name" bind:value={workoutName} placeholder="e.g. Bench Press" />
          </div>

          <div class="form-group">
            <NumberInput label="# Reps" bind:value={workoutReps} />
          </div>

          <div class="form-group">
            <NumberInput label="# Sets" bind:value={workoutSets} />
          </div>

          <div class="form-group">
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
        <div class="button-row">
          <button class="btn-primary" onclick={addWorkout}>
            <span class="material-icons">add</span>
            Add Workout
          </button>
          <button class="btn-danger secondary" onclick={cancelAddWorkout}>
            <span class="material-icons">close</span>
            Cancel
          </button>
        </div>
      {:else if selectedDay === "All"}
        <div class="day-selection-warning">Viewing all workouts. Filter by day to reorder them.</div>
      {/if}
    </div>
    <div class="divider"></div>
  {/if}

  <div class="workouts-section">
    {#if routineState === RoutineState.STOPPED && showAddWorkoutPanel === false}
      <button class="btn-create" onclick={() => openAddWorkout(selectedDay)}>
        <span class="material-icons">add</span>
        Add workout for {selectedDay}
      </button>
    {/if}
    {#if workouts.length === 0}
      <div class="empty-state">
        <span class="empty-icon">🏋️</span>
        <h3>No workouts yet</h3>
        <p>Add a workout to get started!</p>
      </div>
    {:else if selectedDay === "All"}
      <div class="workouts-container">
        {#each groupedWorkouts as [day, dayWorkouts]}
          <div class="day-group">
            <WorkoutStat type={"Day"} stat={day} />
            {#each dayWorkouts as workout (workout.id)}
              <WorkoutCard
                {selectedDay}
                cardState={routineState}
                {workout}
                {deleteWorkout}
                changePosition={swapWorkouts}
                {updateWorkoutCompletion}
                {totalWorkouts}
              />
            {/each}
            {#if routineState === RoutineState.STOPPED}
              <button class="btn-create" onclick={() => openAddWorkout(day)}>
                <span class="material-icons">add</span>
                Add workout for {day}
              </button>
            {/if}
          </div>
        {/each}
      </div>
    {:else}
      <div class="workouts-container">
        {#each workouts as workout (workout.id)}
          <WorkoutCard
            {selectedDay}
            cardState={routineState}
            {workout}
            {deleteWorkout}
            changePosition={swapWorkouts}
            {updateWorkoutCompletion}
            {totalWorkouts}
          />
        {/each}
      </div>
    {/if}
  </div>

  {#if routineState !== RoutineState.STOPPED}
    <div class="footer-container">
      <button onclick={endRoutine} class="btn-stop">
        <span class="material-icons">stop</span>
        Finish Routine
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
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-xl);
    box-shadow: var(--shadow-md);
    gap: var(--spacing-lg);

    position: sticky;
    top: 150px;
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
    top: 100px;
    z-index: 100;
  }

  .btn-stop {
    background: linear-gradient(135deg, var(--color-gold), var(--color-orange));
    color: var(--bg-dark);
    padding: var(--spacing-md) var(--spacing-lg);
    box-shadow: 0 0 25px rgba(255, 136, 0, 0.4);
    min-width: 140px;
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
