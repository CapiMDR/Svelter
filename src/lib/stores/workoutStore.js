// @ts-nocheck
import { writable } from "svelte/store";

import { getAllWorkouts, getWorkoutsByDay, addWorkoutToDays, deleteWorkoutById, swapWorkoutPositions, editWorkout } from "../workoutService.js";

const DAY_ORDER = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
  Sunday: 6,
};

function createWorkoutStore() {
  const { subscribe, update } = writable({
    workouts: [],
    groupedWorkouts: [],
    totalWorkouts: 0,
  });

  async function load(day) {
    if (day === "All") {
      return loadAllDays();
    }

    return loadDay(day);
  }

  async function loadAllDays() {
    const workouts = sortWorkoutsByDay(await getAllWorkouts());

    update(() => ({
      workouts,
      groupedWorkouts: groupWorkoutsByDay(workouts),
      totalWorkouts: workouts.length,
    }));
  }

  async function loadDay(day) {
    const workouts = sortWorkouts(await getWorkoutsByDay(day));

    update(() => ({
      workouts,
      groupedWorkouts: [],
      totalWorkouts: workouts.length,
    }));
  }

  function sortWorkouts(workouts) {
    return workouts.sort((a, b) => a.position - b.position);
  }

  function sortWorkoutsByDay(workouts) {
    return workouts.sort((a, b) => {
      const dayDiff = DAY_ORDER[a.day] - DAY_ORDER[b.day];

      if (dayDiff !== 0) return dayDiff;

      return a.position - b.position;
    });
  }

  function groupWorkoutsByDay(workouts) {
    const groups = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    };

    workouts.forEach((workout) => {
      groups[workout.day].push(workout);
    });

    return Object.entries(groups);
  }

  async function add(workoutData, days, currentViewDay) {
    await addWorkoutToDays(workoutData, days);

    await load(currentViewDay);
  }

  async function remove(workout, currentViewDay) {
    await deleteWorkoutById(workout);

    await load(currentViewDay);
  }

  async function swap(movedWorkout, otherWorkout, currentViewDay) {
    await swapWorkoutPositions(movedWorkout, otherWorkout);

    await load(currentViewDay);
  }

  async function edit(workout, newData, currentViewDay) {
    await editWorkout(workout, newData);

    await load(currentViewDay);
  }

  return {
    subscribe,
    load,
    add,
    remove,
    swap,
    edit,
  };
}

export const workoutStore = createWorkoutStore();
