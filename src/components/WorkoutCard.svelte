<script>
  import Stat from "./Stat.svelte";
  import WorkoutProgressStat from "./WorkoutProgressStat.svelte";
  import ProgressBar from "./ProgressBar.svelte";
  import { fade } from "svelte/transition";

  let { cardState, workout, deleteWorkout, editWorkout, changePosition, updateWorkoutCompletion, totalWorkouts } = $props();
  let completedSets = $state(0);
  let createdDate = $state("");
  let updatedDate = $state("");

  $effect(() => {
    createdDate = new Date(workout.createdAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    if (workout.lastUpdated != null) {
      updatedDate = new Date(workout.lastUpdated).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  });

  const CardState = {
    STOPPED: "stopped",
    RUNNING: "running",
    PAUSED: "paused",
    COMPLETED: "completed",
  };

  function completeSet() {
    if (completedSets >= workout.sets) return;
    completedSets++;
    if (completedSets >= workout.sets) updateWorkoutCompletion(1);
  }

  function uncompleteSet() {
    if (completedSets <= 0) return;
    if (completedSets >= workout.sets) updateWorkoutCompletion(-1);
    completedSets--;
  }

  $effect(() => {
    if (cardState === CardState.STOPPED) {
      completedSets = 0;
    }
  });
</script>

<div class="workout-card" class:completed={completedSets === workout.sets} transition:fade={{ duration: 250 }}>
  <div class="card-content">
    <div class="card-header">
      <div class="card-title">
        <span class="position-badge">{workout.position + 1}</span>
        <h3>{workout.name}</h3>
      </div>
    </div>

    <div class="card-body">
      <div class="stats-row" class:has-unit={workout.unit !== "None"}>
        <Stat type={"Reps"} stat={workout.reps} />
        <Stat type={"Set"} stat={workout.sets} />
        {#if workout.unit !== "None"}
          <Stat type={workout.unit} stat={workout.unitAmount} />
        {/if}
        {#if cardState !== CardState.STOPPED}
          <WorkoutProgressStat type={"Done"} completed={completedSets} total={workout.sets} />
        {/if}
      </div>
      {#if cardState !== CardState.STOPPED}
        <ProgressBar progress={completedSets} total={workout.sets} />
        <div class="button-group">
          <button class="btn-adjust" onclick={() => uncompleteSet()} disabled={completedSets === 0 || cardState === CardState.PAUSED}>
            <span class="material-icons">remove</span>
          </button>
          <button class="btn-adjust" onclick={() => completeSet()} disabled={completedSets >= workout.sets || cardState === CardState.PAUSED}>
            <span class="material-icons">add</span>
          </button>
        </div>
      {/if}
      <div class="card-footer">
        <span class="created-date">
          {"Added: " + createdDate}
        </span>
        {#if updatedDate != ""}
          <span class="created-date">
            {"Last edited: " + updatedDate}
          </span>
        {/if}
      </div>
    </div>
  </div>

  {#if cardState === CardState.STOPPED}
    <div class="card-actions">
      <button class="btn-edit" onclick={() => editWorkout(workout)} title="Edit workout">
        <span class="material-symbols-outlined">edit</span>
      </button>
      <div class="right-actions">
        <button class="btn-delete" onclick={() => deleteWorkout(workout)} title="Delete workout">
          <span class="material-icons">delete</span>
        </button>

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

  .workout-card:hover {
    border-color: rgba(66, 255, 255, 0.4);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.18);
    transform: translateY(-2px);
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

  .btn-delete {
    background: rgba(255, 255, 255, 0.05);
    color: var(--color-danger);
    border: 1px solid rgba(255, 90, 125, 0.22);
    padding: 7px;
    width: 34px;
    height: 34px;
    border-radius: var(--radius-sm);
  }

  .btn-delete:hover {
    background: rgba(255, 0, 110, 0.1);
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
    border: 1px solid rgba(178, 75, 255, 0.22);
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

  .btn-edit {
    background: rgba(255, 255, 255, 0.05);
    color: var(--color-orange);
    border: 1px solid rgba(255, 178, 90, 0.22);
    padding: 7px;
    width: 34px;
    height: 34px;
    border-radius: var(--radius-sm);
  }

  .btn-edit:hover {
    background: rgba(255, 177, 75, 0.1);
  }

  .card-footer {
    display: flex;
    flex-direction: column;
  }

  .created-date {
    font-size: 0.75rem;
    color: var(--text-secondary);
    opacity: 0.7;
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

    .btn-delete,
    .btn-edit,
    .btn-move {
      width: 40px;
      height: 40px;
    }
  }
</style>
