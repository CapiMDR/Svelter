<script>
  import WorkoutStat from "./WorkoutStat.svelte";
  import WorkoutProgressStat from "./WorkoutProgressStat.svelte";

  let { selectedDay, cardState, workout, deleteWorkout, changePosition } = $props();
  let completedSets = $state(0);

  function completeSet() {
    if (completedSets >= workout.sets) return;
    completedSets++;
  }

  function uncompleteSet() {
    if (completedSets <= 0) return;
    completedSets--;
  }

  $effect(() => {
    if (cardState === "stopped") {
      completedSets = 0;
    }
  });

  const progress = $derived((completedSets / workout.sets) * 100);
</script>

<div class="workout-card" class:completed={completedSets === workout.sets}>
  <div class="card-content">
    <div class="card-header">
      <div class="card-title">
        <span class="position-badge">{workout.position + 1}</span>
        <h3>{workout.name}</h3>
      </div>
      {#if cardState === "stopped"}
        <button class="btn-delete" onclick={() => deleteWorkout(workout)} title="Delete workout">
          <span class="material-icons">close</span>
        </button>
      {/if}
    </div>

    <div class="card-body">
      <div class="stats-row">
        <WorkoutStat type={"Reps"} stat={workout.reps} />
        <WorkoutStat type={"Set"} stat={workout.sets} />
        {#if cardState === "stopped" && selectedDay == "All"}
          <WorkoutStat type={"Day"} stat={workout.day} />
        {/if}
        {#if cardState !== "stopped"}
          <WorkoutProgressStat type={"Completed"} completed={completedSets} total={workout.sets} />
        {/if}
      </div>
      {#if cardState !== "stopped"}
        <div class="progress-bar">
          <div class="progress-fill" style={`width: ${progress}%`}></div>
        </div>
        <div class="button-group">
          <button class="btn-adjust" onclick={() => uncompleteSet()} disabled={completedSets === 0}>
            <span class="material-icons">remove</span>
          </button>
          <button class="btn-adjust" onclick={() => completeSet()} disabled={completedSets >= workout.sets}>
            <span class="material-icons">add</span>
          </button>
        </div>
      {/if}
    </div>
  </div>

  {#if cardState === "stopped" && selectedDay !== "All"}
    <div class="card-side-buttons">
      <button class="btn-move" onclick={() => changePosition(workout, -1)} title="Move up">
        <span class="material-icons">arrow_upward</span>
      </button>
      <button class="btn-move" onclick={() => changePosition(workout, 1)} title="Move down">
        <span class="material-icons">arrow_downward</span>
      </button>
    </div>
  {/if}
</div>

<style>
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
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
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

  .progress-bar {
    width: 100%;
    height: 6px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 999px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-accent-primary), var(--color-success));
    transition: width var(--transition-base);
    box-shadow: inset 0 0 8px rgba(0, 212, 255, 0.25);
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

  .card-side-buttons {
    top: 60%;
    right: 4%;
    position: absolute;
    display: flex;
    gap: var(--spacing-xs);
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

    .btn-move {
      width: 40px;
      height: 40px;
    }

    .btn-delete {
      width: 40px;
      height: 40px;
    }
  }
</style>
