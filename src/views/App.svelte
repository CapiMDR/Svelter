<script>
  // @ts-nocheck
  import { onMount } from "svelte";
  import { derived } from "svelte/store";
  import { fly, fade } from "svelte/transition";

  import { workoutStore } from "../lib/stores/workoutStore.js";
  import { modalStore } from "../lib/stores/modalStore.js";
  import { toastStore } from "../lib/stores/toastStore.js";
  import { routineStore, RoutineState } from "../lib/stores/routineStore.js";
  import { dayAliasStore } from "../lib/stores/dayAliasStore.js";
  import { settingsStore } from "../lib/stores/settingsStore.js";
  import { sessionStore } from "../lib/stores/sessionStore.js";
  import { libraryStore } from "../lib/stores/libraryStore.js";

  import WorkoutCard from "../components/WorkoutCard.svelte";
  import NavBar from "../components/NavBar.svelte";
  import Modal from "../components/Modal.svelte";
  import ToastContainer from "../components/ToastContainer.svelte";
  import RoutineHeader from "../components/RoutineHeader.svelte";
  import ScrollTopButton from "../components/ScrollTopButton.svelte";
  import WorkoutForm from "../components/WorkoutForm.svelte";
  import LibraryGroupModal from "../components/LibraryGroupModal.svelte";
  import StatisticsView from "./StatisticsView.svelte";
  import LibraryView from "./LibraryView.svelte";

  const today = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());
  let viewedDay = today; // Day that is being viewed by the user, defaults to current day
  let workoutToEdit = null; // null = adding, workout object = editing that workout
  let selectedDays = [today];
  let activeView = "workouts";
  let libraryTemplate = null;
  let libraryWorkoutToSave = null;

  // Data states
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "All"];
  const workoutDays = days.filter((day) => day !== "All");

  onMount(() => {
    workoutStore.load(viewedDay);
    dayAliasStore.load();
    settingsStore.load();

    const unsubscribe = derived(
      [routineStore, settingsStore],
      ([$routine, $settings]) => ($routine.state === RoutineState.RUNNING || $routine.state === RoutineState.PAUSED) && $settings.wakeLockEnabled,
    ).subscribe((shouldKeepScreenAwake) => {
      if (shouldKeepScreenAwake) requestWakeLock();
      else releaseWakeLock();
    });

    return () => {
      unsubscribe();
      releaseWakeLock();
    };
  });

  let showWorkoutForm = false; // Whether the form for adding a workout is open or not
  let editingDay = null; // which day is currently being edited for alias
  let aliasInput = "";
  let swappingDay = null;
  let swapTargetDay = null;
  let wakeLock = null;

  async function requestWakeLock() {
    if (wakeLock || !navigator.wakeLock) return;

    try {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => {
        wakeLock = null;
      });
    } catch {
      wakeLock = null;
    }
  }

  async function releaseWakeLock() {
    if (!wakeLock) return;

    await wakeLock.release();
    wakeLock = null;
  }

  async function requestDeleteWorkout(workout) {
    if (!workout) return;
    confirmModal("Deleting " + workout.name, `Do you want to delete ${workout.name} from ${workout.day}?`, () => deleteWorkout(workout));
  }

  async function deleteWorkout(workout) {
    await workoutStore.remove(workout, viewedDay);
    toastStore.success("Workout deleted");
  }

  async function saveWorkoutToLibrary(workout, bodyGroup) {
    const { id, day, position, createdAt, lastUpdated, originalValue, originalUnit, originalReps, originalSets, ...template } = workout;
    await libraryStore.save({ ...template, bodyGroup });
    toastStore.success(`${workout.name} saved to the library`);
  }

  function requestSaveToLibrary(workout) {
    libraryWorkoutToSave = workout;
  }

  async function confirmSaveToLibrary(bodyGroup) {
    if (!libraryWorkoutToSave) return;
    await saveWorkoutToLibrary(libraryWorkoutToSave, bodyGroup);
    libraryWorkoutToSave = null;
  }

  async function swapWorkouts(movedWorkout, direction) {
    await workoutStore.swap(movedWorkout, direction, viewedDay);
  }

  function handleViewedDayChange() {
    workoutStore.load(viewedDay);
  }

  function openDaySwap(day) {
    swappingDay = day;
    swapTargetDay = workoutDays.find((otherDay) => otherDay !== day);
  }

  function cancelDaySwap() {
    swappingDay = null;
    swapTargetDay = null;
  }

  function requestDaySwap(day) {
    if (!swapTargetDay || swapTargetDay === day) return;

    confirmModal(
      `Swap ${day} and ${swapTargetDay}`,
      `Move the schedule for ${day} to ${swapTargetDay}, and the schedule for ${swapTargetDay} to ${day}?`,
      () => swapDayWorkouts(day, swapTargetDay),
      "Swap",
    );
  }

  async function swapDayWorkouts(firstDay, secondDay) {
    await workoutStore.swapDays(firstDay, secondDay, viewedDay);
    await dayAliasStore.load();
    cancelDaySwap();
    toastStore.success(`Workouts for ${firstDay} and ${secondDay} swapped`);
  }

  function handleEditClick(workout) {
    showWorkoutForm = true;
    workoutToEdit = workout;
    scrollToTop();
  }

  function confirmModal(title, content, onAccept = null, acceptText = "Confirm", closeText = "Cancel", onClose = null) {
    modalStore.show({
      title,
      content,
      closeText,
      acceptText,
      onAccept,
      onClose,
    });
  }

  function startRoutine() {
    sessionStore.start({
      workouts: $workoutStore.workouts,
      scheduledDay: viewedDay,
      routineName: $dayAliasStore[viewedDay] ?? viewedDay,
    });
    routineStore.start();
    showWorkoutForm = false;
    scrollToTop();
  }

  async function startRoutineForDay(day) {
    viewedDay = day;
    await workoutStore.load(day);
    startRoutine();
  }

  function pauseRoutine() {
    routineStore.togglePause();
  }

  function updateWorkoutCompletion(workoutId, completedSets, delta) {
    sessionStore.updateCompletedSets(workoutId, completedSets);
    routineStore.updateProgress(delta, $workoutStore.totalWorkouts);
  }

  function updateBreakDuration(workoutId, seconds) {
    sessionStore.updateBreakDuration(workoutId, seconds);
  }

  function requestEndRoutine() {
    const isComplete = $routineStore.completedWorkouts === $workoutStore.totalWorkouts;
    const title = isComplete ? "Complete routine" : "Save partial routine";
    const content = isComplete
      ? "Are you ready to complete and save the routine?"
      : "Save your current progress as a partial routine? Skipped exercises will be included in the session history.";
    confirmModal(title, content, () => endRoutine(), isComplete ? "Complete" : "Save progress");
  }

  async function endRoutine() {
    const status = $routineStore.completedWorkouts === $workoutStore.totalWorkouts ? "completed" : "partial";
    await sessionStore.finish(status);
    routineStore.reset();

    scrollToTop();
    toastStore.success("Routine completed and saved!");
  }

  function requestCancelRoutine() {
    confirmModal("Cancel routine", "Do you want to cancel the active routine? Your progress won't be saved.", () => cancelRoutine());
  }

  function cancelRoutine() {
    sessionStore.cancel();
    routineStore.reset();
    scrollToTop();
  }

  function openWorkoutForm(dayChosen) {
    libraryTemplate = null;
    showWorkoutForm = true;
    selectedDays = dayChosen === "All" ? days.filter((d) => d !== "All") : [dayChosen];
    scrollToTop();
  }

  function useLibraryTemplate(template) {
    libraryTemplate = template;
    selectedDays = viewedDay === "All" ? days.filter((day) => day !== "All") : [viewedDay];
    showWorkoutForm = true;
    activeView = "workouts";
    scrollToTop();
  }

  function openAliasEditor(day) {
    editingDay = day;
    aliasInput = $dayAliasStore[day] ?? "";
  }

  async function saveAlias(day) {
    await dayAliasStore.save(day, aliasInput);
    toastStore.success("Alias saved");
    editingDay = null;
    aliasInput = "";
  }

  function cancelAlias() {
    editingDay = null;
    aliasInput = "";
  }

  function closeWorkoutForm() {
    showWorkoutForm = false;
    workoutToEdit = null;
    libraryTemplate = null;
    scrollToTop();
  }

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function changeView(view) {
    if ($routineStore.state !== RoutineState.STOPPED) return;
    activeView = view;
    scrollToTop();
  }

  async function refreshImportedData() {
    await Promise.all([workoutStore.load(viewedDay), dayAliasStore.load(), libraryStore.load()]);
  }
</script>

<Modal />
<LibraryGroupModal workout={libraryWorkoutToSave} onSave={confirmSaveToLibrary} onClose={() => (libraryWorkoutToSave = null)} />
<NavBar {activeView} onViewChange={changeView} onDataImported={refreshImportedData} routineActive={$routineStore.state !== RoutineState.STOPPED} />
<ToastContainer />
<main class="app-container">
  {#if activeView === "statistics"}
    <StatisticsView />
  {:else if activeView === "library"}
    <LibraryView onUseTemplate={useLibraryTemplate} />
  {:else}
    <div class="workouts-view" transition:fade={{ duration: 250 }}>
      {#if $routineStore.state !== RoutineState.STOPPED}
        <RoutineHeader completed={$routineStore.completedWorkouts} total={$workoutStore.totalWorkouts} onPause={pauseRoutine} />
      {/if}
      <ScrollTopButton stickHigher={$routineStore.state === RoutineState.STOPPED} {scrollToTop} />
      {#if $routineStore.state === RoutineState.PAUSED}
        <div class="pause-indicator" transition:fly={{ y: -20, duration: 250 }}>Paused</div>
      {/if}
      <div class="divider"></div>
      {#if $routineStore.state === RoutineState.STOPPED}
        <div class="routine-selector" transition:fade={{ y: -20, duration: 250 }}>
          <div class="routine-controls">
            <div class="day-switcher">
              <label for="days">Viewing routines for</label>
              <select id="days" bind:value={viewedDay} onchange={handleViewedDayChange}>
                {#each days as day}
                  <option value={day}>{day === "All" ? "All days" : day}</option>
                {/each}
              </select>
            </div>
            {#if !showWorkoutForm}
              {#if viewedDay !== "All"}
                <button
                  onclick={startRoutine}
                  class="btn-timer"
                  disabled={$workoutStore.totalWorkouts <= 0}
                  transition:fade={{ y: -20, duration: 250 }}
                >
                  <span class="material-icons">play_arrow</span>
                  {$dayAliasStore[viewedDay] == undefined ? "Start Routine" : "Start " + $dayAliasStore[viewedDay]}
                </button>
              {/if}
            {/if}
          </div>
        </div>
      {/if}
      {#if $routineStore.state === RoutineState.STOPPED && showWorkoutForm}
        <WorkoutForm {days} {viewedDay} bind:selectedDays {workoutToEdit} {libraryTemplate} {startRoutine} {closeWorkoutForm} />
      {/if}
      <div class="workouts-section" transition:fade={{ y: -20, duration: 250 }}>
        {#if $routineStore.state === RoutineState.STOPPED && showWorkoutForm === false}
          <div class="form-group">
            <button class="btn-create" onclick={() => openWorkoutForm(viewedDay)}> <span class="material-icons">add</span> Add element </button>
          </div>
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
                <div class="day-header">
                  <div class="day-header-row">
                    <div class="day-title">
                      <span class="day-label">{day}</span>
                      <strong class="day-routine-name">{$dayAliasStore[day]}</strong>
                    </div>
                    <div class="day-actions">
                      {#if $routineStore.state != RoutineState.RUNNING}
                        {#if editingDay !== day}
                          <button class="btn-edit" onclick={() => openAliasEditor(day)}> ✏️ </button>
                        {/if}
                        {#if swappingDay !== day}
                          <button
                            class="btn-edit"
                            onclick={() => openDaySwap(day)}
                            title={`Swap ${day}'s workouts`}
                            aria-label={`Swap ${day}'s workouts`}
                          >
                            <span class="material-icons">swap_horiz</span>
                          </button>
                        {/if}
                      {/if}
                    </div>
                  </div>

                  {#if editingDay === day}
                    <div class="alias-editor" transition:fade={{ y: -20, duration: 250 }}>
                      <input
                        class="alias-input"
                        placeholder="Add a day alias. E.g. Leg day"
                        bind:value={aliasInput}
                        onkeydown={(e) => e.key === "Enter" && saveAlias(day)}
                      />
                      <button class="button accept" onclick={() => saveAlias(day)}> Save </button>
                      <button class="button danger" onclick={cancelAlias}> Cancel </button>
                    </div>
                  {/if}

                  {#if swappingDay === day}
                    <div class="day-swap-controls" transition:fade={{ y: -20, duration: 250 }}>
                      <label for={`swap-day-${day}`}>Swap all workouts with</label>
                      <select id={`swap-day-${day}`} bind:value={swapTargetDay}>
                        {#each workoutDays.filter((otherDay) => otherDay !== day) as otherDay}
                          <option value={otherDay}>{otherDay}</option>
                        {/each}
                      </select>
                      <button class="button accept" onclick={() => requestDaySwap(day)}> Swap workouts </button>
                      <button class="button danger" onclick={cancelDaySwap}> Cancel </button>
                    </div>
                  {/if}

                  <button
                    class="btn-start-day"
                    onclick={() => startRoutineForDay(day)}
                    disabled={dayWorkouts.length === 0}
                    title={`Start ${day}'s routine`}
                  >
                    <span class="material-icons">play_arrow</span>
                    Start Routine
                  </button>
                </div>

                {#if dayWorkouts.length > 0}
                  {#each dayWorkouts as workout (workout.id)}
                    <WorkoutCard
                      selectedDay={viewedDay}
                      {workout}
                      deleteWorkout={requestDeleteWorkout}
                      changePosition={swapWorkouts}
                      {updateWorkoutCompletion}
                      {updateBreakDuration}
                      totalWorkouts={dayWorkouts.length}
                      editWorkout={handleEditClick}
                      {requestSaveToLibrary}
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
                {workout}
                deleteWorkout={requestDeleteWorkout}
                changePosition={swapWorkouts}
                {updateWorkoutCompletion}
                {updateBreakDuration}
                totalWorkouts={$workoutStore.totalWorkouts}
                editWorkout={handleEditClick}
                {requestSaveToLibrary}
              />
            {/each}
          </div>
        {/if}
      </div>
      {#if $routineStore.state !== RoutineState.STOPPED}
        <div class="footer-container" transition:fade={{ y: -20, duration: 250 }}>
          <button onclick={requestEndRoutine} class="btn-stop">
            <span class="material-symbols-outlined"> trophy </span>
            {#if $routineStore.completedWorkouts === $workoutStore.totalWorkouts}
              {$dayAliasStore[viewedDay] == undefined ? " Complete Routine" : "Complete " + $dayAliasStore[viewedDay]}
            {:else}
              Save Partial Routine
            {/if}
          </button> <button onclick={requestCancelRoutine} class="button danger"> <span class="material-icons">cancel</span> Cancel Routine </button>
        </div>
      {/if}
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

  .routine-controls {
    display: grid;
    gap: var(--spacing-md);
  }

  .routine-selector {
    margin-bottom: var(--spacing-lg);
  }

  .day-switcher {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-md);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
  }

  .day-switcher label {
    margin: 0;
    color: var(--text-primary);
    font-size: var(--font-size-base);
    font-weight: 700;
    text-transform: none;
  }

  .day-switcher select {
    width: auto;
    min-width: 9rem;
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-sm);
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
    margin-top: var(--spacing-sm);
  }

  .day-header {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-md);
  }

  .day-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .day-title {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }

  .day-label {
    color: var(--text-secondary);
    font-size: var(--font-size-xs);
    text-transform: uppercase;
  }

  .day-routine-name {
    color: var(--text-primary);
    font-size: var(--font-size-lg);
  }

  .day-actions {
    display: flex;
    gap: var(--spacing-xs);
  }

  .btn-start-day {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-sm);
    color: var(--bg-dark);
    background: linear-gradient(135deg, var(--color-success), var(--color-accent-primary));
    font-size: var(--font-size-sm);
    width: 100%;
  }

  .btn-edit {
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 50%;
    color: var(--text-secondary);
    background: var(--bg-secondary);
    font-size: 0.8rem;
    flex: 0 0 2rem;
    width: 2rem;
    height: 2rem;
    min-width: 0;
    padding: 0;
  }

  .alias-editor {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
  }

  @media (max-width: 480px) {
    .day-header {
      gap: 6px;
    }

    .alias-editor {
      flex-direction: column;
      align-items: stretch;
      width: 80%;
    }

    .alias-input {
      width: 100%;
      min-width: 0;
    }
  }

  .alias-input {
    padding: 6px 8px;
    border-radius: 6px;
    border: 1px solid var(--text-tertiary);
    min-width: 160px;
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

  .day-swap-controls {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--spacing-sm);
    align-items: center;
    margin-bottom: var(--spacing-md);
    flex-direction: column;
    align-items: stretch;
    width: 80%;
  }

  .day-swap-controls label {
    width: 100%;
    text-align: center;
  }

  /*.day-selection-warning {
    padding: var(--spacing-md);
    text-align: center;
    color: var(--text-secondary);
    background: var(--bg-secondary);
    border: 1px dashed var(--color-accent-primary);
    border-radius: var(--radius-md);
    margin-top: var(--spacing-sm);
  }*/

  @media (max-width: 768px) {
    .app-container {
      padding: var(--spacing-md);
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
  }
</style>
