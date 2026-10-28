// @ts-nocheck
import { writable } from "svelte/store";
import { saveSession } from "../db/sessionService.js";
import { fromBase } from "../units.js";

function createSessionStore() {
  const { subscribe, set, update } = writable({ activeSession: null });

  function start({ workouts, scheduledDay, routineName }) {
    const startedAt = new Date().toISOString();
    const session = {
      id: createSessionId(),
      routineId: `day-${scheduledDay.toLowerCase()}`,
      routineName,
      scheduledDay: scheduledDay.toLowerCase(),
      startedAt,
      exercises: workouts.map((workout) => ({
        exerciseId: String(workout.id),
        name: workout.name ?? "Break",
        type: workout.type,
        sets: workout.sets ?? 1,
        reps: workout.reps ?? 1,
        unit: workout.unit ?? "none",
        // This remains the prescribed amount for exercises. Breaks replace it
        // with their actual duration when the session is saved.
        amount: getSnapshotAmount(workout),
        prescribedAmount: getSnapshotAmount(workout),
        completedSets: 0,
        actualDuration: null,
      })),
    };

    set({ activeSession: session });
  }

  function updateCompletedSets(exerciseId, completedSets) {
    update(({ activeSession }) => {
      if (!activeSession) return { activeSession };
      return {
        activeSession: {
          ...activeSession,
          exercises: activeSession.exercises.map((exercise) =>
            exercise.exerciseId === String(exerciseId) ? { ...exercise, completedSets } : exercise,
          ),
        },
      };
    });
  }

  function updateBreakDuration(exerciseId, seconds) {
    update(({ activeSession }) => {
      if (!activeSession) return { activeSession };
      return {
        activeSession: {
          ...activeSession,
          exercises: activeSession.exercises.map((exercise) =>
            exercise.exerciseId === String(exerciseId)
              ? { ...exercise, actualDuration: seconds, amount: seconds }
              : exercise,
          ),
        },
      };
    });
  }

  async function finish(status) {
    let completedSession;
    update(({ activeSession }) => {
      if (!activeSession) return { activeSession: null };

      completedSession = {
        ...activeSession,
        finishedAt: new Date().toISOString(),
        status,
      };
      return { activeSession: null };
    });

    if (completedSession) await saveSession(completedSession);
    return completedSession;
  }

  function cancel() {
    set({ activeSession: null });
  }

  return { subscribe, start, updateCompletedSets, updateBreakDuration, finish, cancel };
}

function createSessionId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getSnapshotAmount(workout) {
  if (workout.value == null || !workout.unit || workout.unit === "none") return workout.value ?? 0;
  return fromBase(workout.value, workout.unit);
}

export const sessionStore = createSessionStore();
