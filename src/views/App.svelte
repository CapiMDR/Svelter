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
  import Stat from "../components/Stat.svelte";
  import Modal from "../components/Modal.svelte";
  import ToastContainer from "../components/ToastContainer.svelte";
  import RoutineHeader from "../components/RoutineHeader.svelte";
  import ScrollTopButton from "../components/ScrollTopButton.svelte";
  import WorkoutForm from "../components/WorkoutForm.svelte";
  import { editWorkout } from "../lib/workoutService.js";

  const today = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());
  let viewedDay = today; // Day that is being viewed by the user, defaults to current day
  let workoutToEdit = null; // null = adding, workout object = editing that workout
  let selectedDays = [today];

  // Data states
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "All"];
  const units = ["Kg", "lb", "Seconds", "Minutes", "None"];

  onMount(() => {
    workoutStore.load(viewedDay);
  });

  let showWorkoutForm = false; // Whether the form for adding a workout is open or not

  function toggleDaySelection(day) {
    if (selectedDays.includes(day)) {
      selectedDays = selectedDays.filter((d) => d !== day);
    } else {
      selectedDays = [...selectedDays, day];
    }
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
    showWorkoutForm = true;
    workoutToEdit = workout;
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
    showWorkoutForm = false;
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

  function openWorkoutForm(dayChosen) {
    showWorkoutForm = true;
    selectedDays = dayChosen === "All" ? days.filter((d) => d !== "All") : [dayChosen];
    scrollToTop();
  }

  function closeWorkoutForm() {
    showWorkoutForm = false;
    workoutToEdit = null;
    scrollToTop();
  }

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
</script>

<Modal />
<NavBar />
<ToastContainer />
<main class="app-container">
  {#if $routineStore.state !== RoutineState.STOPPED}
    <RoutineHeader
      routineState={$routineStore.state}
      completed={$routineStore.completedWorkouts}
      total={$workoutStore.totalWorkouts}
      onPause={pauseRoutine}
    />
  {/if}
  <ScrollTopButton stickHigher={$routineStore.state === RoutineState.STOPPED} {scrollToTop} />
  {#if $routineStore.state === RoutineState.PAUSED}
    <div class="pause-indicator" transition:fly={{ y: -20, duration: 250 }}>Paused</div>
  {/if}
  <div class="divider"></div>
  {#if $routineStore.state === RoutineState.STOPPED}
    <div class="panel" transition:fade={{ y: -20, duration: 250 }}>
      <div class="section-header">
        <h2>Routine for <span class="day-highlight">{viewedDay}</span></h2>
      </div>
      <div class="form-group">
        <label for="days">View a day</label>
        <select id="days" bind:value={viewedDay} onchange={() => workoutStore.load(viewedDay)}>
          {#each days as day}
            <option value={day}>{day}</option>
          {/each}
        </select>
        {#if !showWorkoutForm}
          <button onclick={startRoutine} class="btn-timer" disabled={$workoutStore.totalWorkouts <= 0}>
            <span class="material-icons">play_arrow</span> Start Routine
          </button>
          {#if viewedDay === "All"}
            <div class="day-selection-warning" transition:fade={{ y: -20, duration: 250 }}>
              Viewing all workouts. View a specific day to start its routine.
            </div>
          {/if}
        {/if}
      </div>
    </div>
  {/if}

  {#if $routineStore.state === RoutineState.STOPPED && showWorkoutForm}
    <WorkoutForm {days} {units} {viewedDay} bind:selectedDays {workoutToEdit} {toggleDaySelection} {startRoutine} {closeWorkoutForm} />
  {/if}
  <div class="workouts-section" transition:fade={{ y: -20, duration: 250 }}>
    {#if $routineStore.state === RoutineState.STOPPED && showWorkoutForm === false}
      <button class="btn-create" onclick={() => openWorkoutForm(viewedDay)}> <span class="material-icons">add</span> Add workout </button>
    {/if}
    {#if $workoutStore.workouts.length === 0}
      <div class="empty-state" transition:fade={{ y: -20, duration: 250 }}>
        <span class="empty-icon">🏋️</span>
        <h3>No workouts yet</h3>
        <p>Add a workout to get started!</p>
      </div>
    {:else if viewedDay === "All"}
      <div class="workouts-container" transition:fade={{ y: -20, duration: 250 }}>
        {#each $workoutStore.groupedWorkouts as [day, dayWorkouts]}
          <div class="day-group">
            <Stat type={"Day"} stat={day} />
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
      <div class="workouts-container" transition:fade={{ y: -20, duration: 250 }}>
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
        <span class="material-symbols-outlined"> trophy </span> Complete Routine
      </button> <button onclick={requestCancelRoutine} class="button danger"> <span class="material-icons">cancel</span> Cancel Routine </button>
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

  .btn-create {
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
    text-align: center;
    color: var(--text-secondary);
    background: var(--bg-secondary);
    border: 1px dashed var(--color-accent-primary);
    border-radius: var(--radius-md);
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

  .empty-day {
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-md);
    text-align: center;
    color: var(--text-tertiary);
    border: 2px dashed var(--text-tertiary);
    border-radius: var(--radius-md);
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

  .btn-timer {
    background: linear-gradient(135deg, var(--color-success), var(--color-accent-primary));
    color: var(--bg-dark);
    min-width: 120px;
    margin-top: var(--spacing-sm);
    margin-bottom: var(--spacing-sm);
    padding: var(--spacing-md) var(--spacing-lg);
  }

  .btn-timer:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 25px rgba(0, 255, 136, 0.4);
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
    .section-header {
      flex-direction: column;
      align-items: flex-start;
      margin-bottom: var(--spacing-lg);
    }

    .btn-timer {
      width: 100%;
      min-width: unset;
    }
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

    .section-header h2 {
      font-size: var(--font-size-lg);
    }
  }
</style>
