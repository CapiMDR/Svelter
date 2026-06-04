// @ts-nocheck
import { writable } from "svelte/store";

const RoutineState = {
  STOPPED: "stopped",
  RUNNING: "running",
  PAUSED: "paused",
  COMPLETED: "completed",
};

function createRoutineStore() {
  const { subscribe, update, set } = writable({
    state: RoutineState.STOPPED,
    completedWorkouts: 0,
  });

  return {
    subscribe,

    start() {
      update((routine) => ({
        ...routine,
        state: RoutineState.RUNNING,
      }));
    },

    togglePause() {
      update((routine) => ({
        ...routine,
        state: routine.state === RoutineState.PAUSED ? RoutineState.RUNNING : RoutineState.PAUSED,
      }));
    },

    reset() {
      set({
        state: RoutineState.STOPPED,
        completedWorkouts: 0,
      });
    },

    complete() {
      update((routine) => ({
        ...routine,
        state: RoutineState.COMPLETED,
      }));
    },

    updateProgress(delta, totalWorkouts) {
      update((routine) => {
        const completed = Math.max(0, Math.min(totalWorkouts, routine.completedWorkouts + delta));

        return {
          completedWorkouts: completed,
          state: completed === totalWorkouts ? RoutineState.COMPLETED : RoutineState.RUNNING,
        };
      });
    },
  };
}

export const routineStore = createRoutineStore();
export { RoutineState };
