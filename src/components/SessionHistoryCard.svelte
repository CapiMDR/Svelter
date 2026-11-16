<script>
  import { performanceFor, targetLabel } from "../lib/performanceStats.js";

  let { session, onDelete = () => {} } = $props();
  let expanded = $state(false);

  const completedExercises = $derived(session.exercises.filter((exercise) => exercise.completedSets >= exercise.sets).length);
  const completionRate = $derived(session.exercises.length ? Math.round((completedExercises / session.exercises.length) * 100) : 0);
  const duration = $derived(Math.max(0, new Date(session.finishedAt) - new Date(session.startedAt)));
  const date = $derived(new Date(session.finishedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }));
  const durationLabel = $derived(`${Math.floor(duration / 60000)}m ${Math.floor((duration % 60000) / 1000)}s`);

  function displayAmount(exercise) {
    if (exercise.type === "break") return `${exercise.actualDuration ?? 0}s rested`;
    return exercise.unit === "none" ? "" : `${exercise.amount} ${exercise.unit}`;
  }
</script>

<article class="session-card" class:partial={session.status === "partial"}>
  <div class="session-header">
    <button class="session-summary" onclick={() => (expanded = !expanded)} aria-expanded={expanded}>
      <div>
        <div class="session-title-row">
          <h3>{session.routineName}</h3>
          <span class="status">{session.status === "completed" ? "Completed" : "Partial"}</span>
          <span class="completion">{completionRate}%</span>
        </div>
        <p>{date} · {durationLabel}</p>
      </div>
      <span class="material-icons session-chevron" aria-hidden="true">{expanded ? "expand_less" : "expand_more"}</span>
    </button>
    <button class="session-delete" onclick={() => onDelete(session)} aria-label={`Delete ${session.routineName} session`} title="Delete session">
      <span class="material-icons">delete</span>
    </button>
  </div>

  {#if expanded}
    <div class="exercise-list">
      {#each session.exercises as exercise (exercise.exerciseId)}
        {@const performance = performanceFor(exercise)}
        <div class="exercise-row" class:break={exercise.type === "break"}>
          <div>
            <strong>{exercise.name}</strong>
            {#if exercise.type !== "break" && exercise.repTarget?.mode === "range"}<span>Target: {targetLabel(exercise)} reps</span>{/if}
            {#if exercise.type !== "break" && performance.completedSets > 0}
              <span
                >Actual: {performance.actualReps} reps{performance.dimension === "weight"
                  ? ` · ${performance.volumeLoad.toFixed(1)} kg volume`
                  : performance.dimension === "time"
                    ? ` · ${performance.actualDuration}s`
                    : ""}{performance.estimated ? " (estimated)" : ""}</span
              >
            {/if}
            <span>{exercise.type === "break" ? "Break" : `${exercise.sets} × ${exercise.reps} ${displayAmount(exercise)}`}</span>
          </div>
          <span>{exercise.completedSets}/{exercise.sets} sets{exercise.type === "break" ? ` · ${displayAmount(exercise)}` : ""}</span>
        </div>
      {/each}
    </div>
  {/if}
</article>

<style>
  .session-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
  .session-card.partial {
    border-color: rgba(255, 178, 90, 0.45);
  }
  .session-header {
    display: flex;
    align-items: stretch;
  }
  .session-summary {
    width: 100%;
    padding: var(--spacing-md);
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-align: left;
    background: transparent;
    color: var(--text-primary);
  }
  .session-delete {
    flex: 0 0 auto;
    padding: var(--spacing-sm);
    border-radius: 0;
    color: var(--color-danger);
    background: transparent;
  }
  .session-delete:hover {
    box-shadow: none;
    background: rgba(255, 0, 110, 0.1);
  }
  .session-chevron {
    flex: 0 0 auto;
    margin-left: var(--spacing-sm);
    color: var(--text-secondary);
  }
  .session-title-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--spacing-xs);
  }
  .session-title-row h3 {
    font-size: var(--font-size-base);
  }
  h3,
  p {
    margin: 0;
  }
  p,
  .exercise-row span {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }
  .status {
    color: var(--bg-dark);
    background: var(--color-success);
    border-radius: 999px;
    font-size: 0.65rem;
    font-weight: 700;
    padding: 2px 6px;
  }
  .partial .status {
    background: var(--color-gold);
  }
  .completion {
    color: var(--color-accent-primary);
    font-size: var(--font-size-sm);
    font-weight: 700;
  }
  .exercise-list {
    border-top: 1px solid var(--border-color);
  }
  .exercise-row {
    padding: var(--spacing-sm) var(--spacing-md);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--spacing-md);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  .exercise-row:last-child {
    border-bottom: 0;
  }
  .exercise-row div {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .exercise-row strong {
    color: var(--text-primary);
    font-size: var(--font-size-base);
  }
  .exercise-row div > span:last-child {
    order: -1;
    color: var(--text-primary);
    font-weight: 600;
  }
  .exercise-row:not(.break) div > span:last-child::before {
    content: "Planned: ";
    color: var(--text-secondary);
    font-weight: 400;
  }
  .exercise-row > span {
    flex: 0 0 auto;
    padding: 2px 6px;
    border-radius: 999px;
    color: var(--color-accent-primary);
    background: rgba(0, 212, 255, 0.1);
    font-size: var(--font-size-xs);
    white-space: nowrap;
  }
</style>
