<script>
  // @ts-nocheck
  import { db } from "./lib/db.js";
  import WorkoutCard from "./components/WorkoutCard.svelte";
  import NavBar from "./components/NavBar.svelte";
  import Timer from "./components/Timer.svelte";

  const date = new Date();
  const today = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
  let workoutName = "";
  let selectedDay = today;
  let workoutReps = 15;
  let workoutSets = 3;

  let workouts = [];
  let timer;

  async function loadWorkouts() {
    if (selectedDay === "All") {
      workouts = await db.workouts.toArray();
    } else {
      workouts = await db.workouts.where("day").equals(selectedDay).toArray();
      workouts.sort((a, b) => a.position - b.position);
    }
  }

  async function addWorkout() {
    if (!workoutName.trim()) return;

    await db.workouts.add({
      name: workoutName,
      reps: workoutReps,
      sets: workoutSets,
      day: selectedDay,
      position: workouts.length,
      createdAt: Date.now(),
    });

    workoutName = "";
    workoutReps = 15;
    workoutSets = 3;

    await loadWorkouts();
  }

  function clearList() {
    db.workouts.clear();
    workouts = [];
  }

  loadWorkouts(today);

  async function deleteWorkout(deletedWorkout) {
    const deletedWorkoutID = deletedWorkout.id;
    if (!deletedWorkout) return;

    const workoutsToShift = workouts.filter((workout) => workout.position > deletedWorkout.position);

    workoutsToShift.forEach((workout) => {
      workout.position--;
    });

    await db.transaction("rw", db.workouts, async () => {
      await db.workouts.delete(deletedWorkoutID);

      await db.workouts.bulkPut(workoutsToShift);
    });

    workouts = workouts.filter((workout) => workout.id !== deletedWorkoutID).sort((a, b) => a.position - b.position);
  }

  async function swapWorkouts(movedWorkout, direction) {
    const oldPosition = movedWorkout.position;
    const newPosition = movedWorkout.position + direction;

    if (oldPosition < 0 || oldPosition >= workouts.length || newPosition < 0 || newPosition >= workouts.length) {
      return;
    }

    const otherWorkout = workouts[newPosition];
    [workouts[oldPosition], workouts[newPosition]] = [workouts[newPosition], workouts[oldPosition]];
    movedWorkout.position = newPosition;
    otherWorkout.position = oldPosition;

    await db.workouts.update(movedWorkout.id, {
      position: newPosition,
    });
    await db.workouts.update(otherWorkout.id, {
      position: oldPosition,
    });
  }

  let timerState = "stopped";

  function handleTimerButton() {
    if (timerState === "stopped") {
      timer.start();
      timerState = "running";
    } else if (timerState === "running") {
      timer.pause();
      timerState = "paused";
    } else {
      timer.play();
      timerState = "running";
    }
  }
</script>

<NavBar />

<main class="app-container">
  <div class="controls-panel">
    <div class="section-header">
      <h2>Routine for <span class="day-highlight">{selectedDay}</span></h2>
      <div class="timer-section">
        <Timer bind:this={timer} />
      </div>
    </div>

    <div class="form-grid">
      <div class="form-group">
        <label for="days">Choose a day</label>
        <select id="days" bind:value={selectedDay} onchange={() => loadWorkouts()}>
          <option value="Monday">Monday</option>
          <option value="Tuesday">Tuesday</option>
          <option value="Wednesday">Wednesday</option>
          <option value="Thursday">Thursday</option>
          <option value="Friday">Friday</option>
          <option value="Saturday">Saturday</option>
          <option value="Sunday">Sunday</option>
          <option value="All">All</option>
        </select>
      </div>

      <div class="form-group">
        <label for="workout-name">Workout name</label>
        <input id="workout-name" bind:value={workoutName} placeholder="e.g., Bench Press" />
      </div>

      <div class="form-group">
        <label for="reps">Reps</label>
        <input id="reps" bind:value={workoutReps} type="number" min="1" max="100" step="1" />
      </div>

      <div class="form-group">
        <label for="sets">Sets</label>
        <input id="sets" bind:value={workoutSets} type="number" min="1" max="100" step="1" />
      </div>
    </div>

    <div class="button-row">
      <button class="btn-primary" onclick={() => addWorkout()}>
        <span class="material-icons">add</span>
        Add Workout
      </button>
      <button onclick={handleTimerButton} class="btn-timer" title="Start/Pause Timer">
        <span class="material-icons">
          {timerState === "running" ? "pause" : "play_arrow"}
        </span>
        {timerState === "stopped" ? "Start" : timerState === "running" ? "Pause" : "Resume"}
      </button>
      <button class="btn-danger secondary" onclick={() => clearList()}>
        <span class="material-icons">delete_sweep</span>
        Clear All
      </button>
    </div>
  </div>

  <div class="divider"></div>

  <div class="workouts-section">
    {#if workouts.length === 0}
      <div class="empty-state">
        <span class="empty-icon">🏋️</span>
        <h3>No workouts yet</h3>
        <p>Add a workout to get started!</p>
      </div>
    {:else}
      <div class="workouts-container">
        {#each workouts as workout (workout.id)}
          <WorkoutCard {workout} {deleteWorkout} changePosition={swapWorkouts} />
        {/each}
      </div>
    {/if}
  </div>
</main>

<style>
  :global(body) {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }

  .app-container {
    flex: 1;
    overflow-y: auto;
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

  .timer-section {
    background: rgba(0, 212, 255, 0.05);
    padding: var(--spacing-md) var(--spacing-lg);
    border-radius: var(--radius-md);
    border: 1px solid rgba(0, 212, 255, 0.2);
    min-width: 120px;
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

    .timer-section {
      width: 100%;
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
    .btn-danger {
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
