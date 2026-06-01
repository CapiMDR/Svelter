<script>
  let { workout, deleteWorkout, changePosition } = $props();
  let completedSets = $state(0);

  function completeSet() {
    if (completedSets >= workout.sets) return;
    completedSets++;
  }

  function uncompleteSet() {
    if (completedSets <= 0) return;
    completedSets--;
  }

  const progress = (completedSets / workout.sets) * 100;
</script>

<div class="workout-card">
  <div class="card-header">
    <div class="card-title">
      <span class="position-badge">{workout.position + 1}</span>
      <h3>{workout.name}</h3>
    </div>
    <button class="btn-delete" onclick={() => deleteWorkout(workout)} title="Delete workout">
      <span class="material-icons">close</span>
    </button>
  </div>

  <div class="card-body">
    <div class="stats-row">
      <div class="stat">
        <span class="stat-label">Reps</span>
        <span class="stat-value">{workout.reps}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Sets</span>
        <span class="stat-value">{workout.sets}</span>
      </div>
      <div class="stat progress-stat">
        <span class="stat-label">Completed</span>
        <span class="stat-value accent">{completedSets}/{workout.sets}</span>
      </div>
    </div>

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
  </div>

  <div class="card-footer">
    <button class="btn-move" onclick={() => changePosition(workout, -1)} title="Move up">
      <span class="material-icons">arrow_upward</span>
    </button>
    <button class="btn-move" onclick={() => changePosition(workout, 1)} title="Move down">
      <span class="material-icons">arrow_downward</span>
    </button>
  </div>
</div>

<style>
  .workout-card {
    background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--color-primary) 100%);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
    transition: all var(--transition-base);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }

  .workout-card:hover {
    border-color: var(--color-accent-primary);
    box-shadow: var(--shadow-glow-cyan);
    transform: translateY(-2px);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-lg);
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
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary));
    color: var(--bg-dark);
    border-radius: var(--radius-md);
    font-weight: 700;
    font-size: var(--font-size-sm);
    flex-shrink: 0;
  }

  .btn-delete {
    background: transparent;
    color: var(--color-danger);
    border: 1px solid var(--color-danger);
    padding: var(--spacing-sm);
    width: 36px;
    height: 36px;
  }

  .btn-delete:hover {
    background: rgba(255, 0, 110, 0.1);
  }

  .card-body {
    margin-bottom: var(--spacing-lg);
  }

  .stats-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .stat-label {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: var(--spacing-xs);
  }

  .stat-value {
    font-size: var(--font-size-lg);
    font-weight: 700;
    color: var(--text-primary);
  }

  .stat-value.accent {
    color: var(--color-accent-primary);
  }

  .progress-stat {
    background: rgba(0, 212, 255, 0.05);
    padding: var(--spacing-sm);
    border-radius: var(--radius-md);
    border: 1px solid rgba(0, 212, 255, 0.2);
  }

  .progress-bar {
    width: 100%;
    height: 8px;
    background: var(--bg-tertiary);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: var(--spacing-lg);
    border: 1px solid var(--border-light);
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-accent-primary), var(--color-success));
    transition: width var(--transition-base);
    box-shadow: 0 0 8px rgba(0, 212, 255, 0.5);
  }

  .button-group {
    display: flex;
    gap: var(--spacing-sm);
  }

  .btn-adjust {
    flex: 1;
    background-color: var(--bg-tertiary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    padding: var(--spacing-md);
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

  .card-footer {
    display: flex;
    gap: var(--spacing-sm);
    padding-top: var(--spacing-lg);
    border-top: 1px solid var(--border-light);
  }

  .btn-move {
    flex: 1;
    background: transparent;
    color: var(--color-accent-secondary);
    border: 1px solid var(--color-accent-secondary);
    padding: var(--spacing-md);
    display: flex;
    align-items: center;
    justify-content: center;
    text-transform: none;
  }

  .btn-move:hover {
    background: rgba(178, 75, 255, 0.1);
  }

  @media (max-width: 640px) {
    .workout-card {
      padding: var(--spacing-md);
      margin-bottom: var(--spacing-md);
    }

    .stats-row {
      gap: var(--spacing-sm);
    }

    .card-header {
      margin-bottom: var(--spacing-md);
    }

    .position-badge {
      width: 28px;
      height: 28px;
      font-size: var(--font-size-xs);
    }

    .card-title h3 {
      font-size: var(--font-size-base);
    }
  }
</style>
