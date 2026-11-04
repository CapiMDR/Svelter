<script>
  import Stat from "./Stat.svelte";
  import WorkoutProgressStat from "./WorkoutProgressStat.svelte";
  import ProgressBar from "./ProgressBar.svelte";
  import Countdown from "./Countdown.svelte";
  import { fade } from "svelte/transition";
  import { fromBase, getDisplayValue, UNITS } from "../lib/units.js";
  import { routineStore, RoutineState } from "../lib/stores/routineStore.js";

  let {
    workout,
    deleteWorkout,
    editWorkout,
    requestSaveToLibrary = () => {},
    changePosition,
    updateWorkoutCompletion,
    updateBreakDuration,
    totalWorkouts,
  } = $props();

  let completedSets = $state(0);
  let createdDateString = $state("");
  let updatedDateString = $state("");
  let menuOpen = $state(false);
  const isBreak = $derived(workout.type === "break");
  const hasTimeUnit = $derived(Object.entries(UNITS).some(([id, unit]) => id === workout.unit && unit.dimension === "time"));

  const unitDifference = $derived.by(() => {
    if (workout.originalValue == null || workout.originalUnit == null) {
      return null;
    }

    // Both values are already stored in base units
    return workout.value - workout.originalValue;
  });

  const unitDiffString = $derived.by(() => {
    if (unitDifference == null || unitDifference === 0) {
      return null;
    }

    const sign = unitDifference > 0 ? "+" : "-";
    const convertedValue = fromBase(Math.abs(unitDifference), workout.unit);
    const value = Number.isInteger(convertedValue) ? convertedValue : convertedValue.toFixed(2);
    return `${sign}${value} ${UNITS[workout.unit]?.compact ?? workout.unit}`;
  });

  const repDiff = $derived(workout.reps - workout.originalReps);
  const repDiffString = $derived(repDiff > 0 ? "+" + repDiff : repDiff < 0 ? "" + repDiff : undefined);

  const setDiff = $derived(workout.sets - workout.originalSets);
  const setDiffString = $derived(setDiff > 0 ? "+" + setDiff : setDiff < 0 ? "" + setDiff : undefined);

  $effect(() => {
    createdDateString = new Date(workout.createdAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    if (workout.lastUpdated != null) {
      updatedDateString = new Date(workout.lastUpdated).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  });

  function completeSet() {
    if (completedSets >= workout.sets) return;
    completedSets++;
    updateWorkoutCompletion(workout.id, completedSets, completedSets === workout.sets ? 1 : 0);
  }

  function uncompleteSet() {
    if (completedSets <= 0) return;
    completedSets--;
    updateWorkoutCompletion(workout.id, completedSets, completedSets === workout.sets - 1 ? -1 : 0);
  }

  function closeMenu() {
    menuOpen = false;
  }

  function beginLibrarySave() {
    closeMenu();
    requestSaveToLibrary(workout);
  }

  function handleWindowClick(event) {
    if (menuOpen && !event.target.closest(".workout-menu")) {
      closeMenu();
    }
  }

  $effect(() => {
    if ($routineStore.state == RoutineState.STOPPED) {
      completedSets = 0;
    }
  });
</script>

<svelte:window onclick={handleWindowClick} />

<div
  class="workout-card"
  class:break-card={isBreak}
  class:rest-preview={isBreak && $routineStore.state === RoutineState.STOPPED}
  class:completed={completedSets === workout.sets}
  transition:fade={{ duration: 250 }}
>
  <div class="card-content">
    {#if isBreak && $routineStore.state === RoutineState.STOPPED}
      <div class="rest-summary">
        <span class="position-badge">{workout.position + 1}</span>
        <div class="rest-details">
          <div class="rest-heading">
            <span class="rest-icon material-icons">timer</span>
            <span class="element-type">Rest break</span>
          </div>
          <strong>{getDisplayValue(workout)} {UNITS[workout.unit]?.compact ?? workout.unit}</strong>
        </div>
      </div>
    {:else}
      <div class="card-header">
        <div class="card-title">
          <span class="position-badge">{workout.position + 1}</span>
          {#if !isBreak}
            <h3>{workout.name}</h3>
          {/if}
          {#if isBreak}
            <div class="break-title">
              <span class="rest-icon material-icons">timer</span>
              <span class="element-type">Rest break</span>
            </div>
          {/if}
        </div>
      </div>

      <div class="card-body">
        {#if !isBreak || $routineStore.state === RoutineState.STOPPED}
          <div class="stats-row" class:has-unit={workout.unit !== "none"}>
            <Stat label={"Reps"} value={workout.reps} delta={$routineStore.state != RoutineState.STOPPED ? undefined : repDiffString} />
            <Stat label={"Sets"} value={workout.sets} delta={$routineStore.state != RoutineState.STOPPED ? undefined : setDiffString} />
            {#if workout.unit !== "none"}
              <Stat
                label={workout.unit}
                value={getDisplayValue(workout)}
                delta={$routineStore.state != RoutineState.STOPPED ? undefined : unitDiffString}
              />
            {/if}
            {#if $routineStore.state != RoutineState.STOPPED}
              <WorkoutProgressStat type={"Done"} completed={completedSets} total={workout.sets} />
            {/if}
          </div>
        {/if}
        {#if $routineStore.state != RoutineState.STOPPED}
          {#if hasTimeUnit}
            <Countdown
              duration={workout.value}
              timerState={$routineStore.state}
              completed={completedSets >= workout.sets}
              onElapsedChange={(seconds) => updateBreakDuration?.(workout.id, seconds)}
            />
          {:else}
            <ProgressBar progress={completedSets} total={workout.sets} />
          {/if}
          <div class="button-group">
            <button class="btn-adjust" onclick={() => uncompleteSet()} disabled={completedSets === 0 || $routineStore.state == RoutineState.PAUSED}>
              <span class="material-icons">remove</span>
            </button>
            <button
              class="btn-adjust"
              onclick={() => completeSet()}
              disabled={completedSets >= workout.sets || $routineStore.state == RoutineState.PAUSED}
            >
              <span class="material-icons">add</span>
            </button>
          </div>
          {#if workout.notes?.trim()}
            <div class="workout-notes">
              <span class="material-icons">notes</span>
              <span>{workout.notes}</span>
            </div>
          {/if}
        {/if}
      </div>
    {/if}
  </div>

  {#if $routineStore.state == RoutineState.STOPPED}
    <div class="card-actions">
      <div class="right-actions">
        <div class="workout-menu">
          <button class="btn-menu" onclick={() => (menuOpen = !menuOpen)} aria-label="Workout options" aria-expanded={menuOpen}
            ><span class="material-icons">more_vert</span></button
          >
          {#if menuOpen}
            <div class="menu-popover">
              <button
                onclick={() => {
                  closeMenu();
                  editWorkout(workout);
                }}><span class="material-icons">edit</span> Edit</button
              >
              <button onclick={beginLibrarySave}><span class="material-icons">bookmark_add</span> Save to library</button>
              <button
                class="delete-option"
                onclick={() => {
                  closeMenu();
                  deleteWorkout(workout);
                }}><span class="material-icons">delete</span> Delete</button
              >
              <div class="menu-dates">
                <span>Added: {createdDateString}</span>
                {#if updatedDateString != ""}<span>Last edited: {updatedDateString}</span>{/if}
              </div>
            </div>
          {/if}
        </div>
        <button class="btn-move" class:hidden={workout.position <= 0} onclick={() => changePosition(workout, -1)} title="Move up">
          <span class="material-symbols-outlined">arrow_drop_up</span>
        </button>

        <button class="btn-move" class:hidden={workout.position >= totalWorkouts - 1} onclick={() => changePosition(workout, 1)} title="Move down">
          <span class="material-symbols-outlined">arrow_drop_down</span>
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .hidden {
    visibility: hidden;
    pointer-events: none;
  }
  .workout-card {
    background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-dark) 100%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: calc(var(--radius-lg) - 2px);
    padding: calc(var(--spacing-sm) + 2px);
    margin-bottom: calc(var(--spacing-sm) + 2px);
    transition:
      transform var(--transition-base),
      box-shadow var(--transition-base),
      border-color var(--transition-base);
    box-shadow: 0 18px 35px rgba(0, 0, 0, 0.12);
    display: flex;
    gap: var(--spacing-sm);
    position: relative;
    min-height: 140px;
    display: flex;
    gap: var(--spacing-sm);
    align-items: stretch;
  }

  .workout-card.completed {
    border-color: rgba(0, 255, 136, 0.3);
    background: linear-gradient(135deg, rgba(0, 255, 136, 0.08) 0%, rgba(0, 212, 255, 0.06) 100%);
    box-shadow: 0 0 24px rgba(0, 255, 136, 0.16);
  }

  .workout-card.break-card {
    border-color: rgba(0, 212, 255, 0.35);
  }

  .workout-card.rest-preview {
    min-height: 0;
    padding: var(--spacing-md);
    background: rgba(29, 50, 84, 0.48);
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: none;
  }

  .rest-summary {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-sm);
    min-height: 54px;
  }

  .rest-details {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    padding-top: 2px;
  }

  .rest-heading {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .break-title {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .rest-summary strong {
    color: var(--text-primary);
    font-size: var(--font-size-base);
  }

  .rest-icon {
    color: var(--color-accent-primary);
    font-size: 1rem;
  }

  .element-type {
    color: var(--color-accent-primary);
    font-size: var(--font-size-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .workout-card:hover {
    border-color: rgba(66, 255, 255, 0.4);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.18);
    transform: translateY(-2px);
  }

  .workout-card.rest-preview:hover {
    border-color: rgba(0, 212, 255, 0.22);
    box-shadow: none;
    transform: none;
  }

  .card-content {
    flex: 1;
    min-width: 0;
  }

  .right-actions {
    display: flex;
    gap: var(--spacing-xs);
    flex-direction: column;
  }

  .card-actions {
    display: flex;
    gap: var(--spacing-xs);
    flex-shrink: 0;
    align-self: stretch;
  }
  .workout-menu {
    position: relative;
  }

  .btn-menu {
    width: 34px;
    height: 34px;
    padding: 0;
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
  }

  .menu-popover {
    position: absolute;
    top: 0;
    right: calc(100% + var(--spacing-xs));
    z-index: 20;
    min-width: 175px;
    padding: var(--spacing-xs);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
  }

  .menu-popover button {
    width: 100%;
    justify-content: flex-start;
    padding: var(--spacing-xs) var(--spacing-sm);
    background: transparent;
    color: var(--text-primary);
    text-transform: none;
    letter-spacing: 0;
  }

  .menu-popover button:hover {
    box-shadow: none;
    background: var(--bg-hover);
    transform: none;
  }

  .menu-popover .delete-option {
    color: var(--color-danger);
  }

  .menu-dates {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-xs) var(--spacing-xs);
    border-top: 1px solid var(--border-color);
    color: var(--text-secondary);
    font-size: 0.7rem;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .card-title {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .card-title h3 {
    margin: 0;
    font-size: var(--font-size-lg);
  }

  .position-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    background: linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary));
    color: var(--bg-dark);
    border-radius: var(--radius-md);
    font-weight: 700;
    font-size: var(--font-size-xs);
    flex-shrink: 0;
  }

  .card-body {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .stats-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--spacing-xs);
  }

  .stats-row.has-unit {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .button-group {
    display: inline-flex;
    gap: var(--spacing-xs);
    width: 100%;
  }

  .workout-notes {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm);
    border-radius: var(--radius-sm);
    background: rgba(0, 212, 255, 0.06);
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    white-space: pre-wrap;
  }

  .workout-notes .material-icons {
    color: var(--color-accent-primary);
    font-size: 1.1rem;
  }

  .btn-adjust {
    flex: 1;
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--text-primary);
    border: 1px solid rgba(255, 255, 255, 0.12);
    padding: 10px 0;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-base);
  }

  .btn-adjust:hover:not(:disabled) {
    border-color: var(--color-accent-primary);
    color: var(--color-accent-primary);
    box-shadow: var(--shadow-glow-cyan);
  }

  .btn-move {
    background: rgba(255, 255, 255, 0.06);
    color: var(--color-accent-secondary);
    border: 2px solid rgba(178, 75, 255, 0.22);
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-transform: none;
    width: 38px;
    height: 38px;
    flex-shrink: 0;
    border-radius: var(--radius-sm);
  }

  .btn-move:hover {
    background: rgba(178, 75, 255, 0.1);
  }

  @media (max-width: 640px) {
    .workout-card {
      flex-direction: row;
      padding: var(--spacing-md);
      margin-bottom: var(--spacing-md);
    }

    .stats-row {
      gap: var(--spacing-sm);
    }

    .card-header {
      margin-bottom: 0;
    }

    .position-badge {
      width: 28px;
      height: 28px;
      font-size: var(--font-size-xs);
    }

    .card-title h3 {
      font-size: var(--font-size-base);
    }

    .btn-menu,
    .btn-move {
      width: 40px;
      height: 40px;
    }
  }
</style>
