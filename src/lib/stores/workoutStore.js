// @ts-nocheck
import { writable } from "svelte/store";

import { getAllWorkouts, getWorkoutsByDay, addWorkoutToDays, deleteWorkoutById, swapWorkoutPositions, editWorkout } from "../db/workoutService.js";

// Used to sort workouts by day when viewing all workouts.
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
  // Store state
  const { subscribe, update } = writable({
    workouts: [],
    groupedWorkouts: [],
    totalWorkouts: 0,
  });

  /**
   * Loads workouts for a specific day or all days.
   */
  async function load(day) {
    if (day === "All") {
      return loadAllDays();
    }

    return loadDay(day);
  }

  /**
   * Loads every workout, sorts them by day and position,
   * then groups them for display.
   */
  async function loadAllDays() {
    const workouts = sortWorkoutsByDay(await getAllWorkouts());

    update(() => ({
      workouts,
      groupedWorkouts: groupWorkoutsByDay(workouts),
      totalWorkouts: workouts.length,
    }));
  }

  /**
   * Loads workouts for a single day and sorts them by position.
   */
  async function loadDay(day) {
    const workouts = sortWorkouts(await getWorkoutsByDay(day));

    update(() => ({
      workouts,
      groupedWorkouts: [],
      totalWorkouts: workouts.length,
    }));
  }

  /**
   * Sort workouts within a day by their position.
   */
  function sortWorkouts(workouts) {
    return workouts.sort((a, b) => a.position - b.position);
  }

  /**
   * Sort workouts first by day of the week,
   * then by position within that day.
   */
  function sortWorkoutsByDay(workouts) {
    return workouts.sort((a, b) => {
      const dayDiff = DAY_ORDER[a.day] - DAY_ORDER[b.day];

      if (dayDiff !== 0) return dayDiff;

      return a.position - b.position;
    });
  }

  /**
   * Groups workouts into arrays keyed by day.
   * Returns an array of [day, workouts] entries.
   */
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

  /**
   * Adds a workout to one or more days
   * and reloads the current view.
   */
  async function add(workoutData, days, currentViewDay) {
    await addWorkoutToDays(workoutData, days);

    await load(currentViewDay);
  }

  /**
   * Removes a workout and reloads the current view.
   */
  async function remove(workout, currentViewDay) {
    await deleteWorkoutById(workout);

    await load(currentViewDay);
  }

  /**
   * Moves a workout up or down within its day.
   * Swaps positions with the adjacent workout.
   *
   * direction:
   *  -1 = move up
   *   1 = move down
   */
  async function swap(movedWorkout, direction, currentViewDay) {
    const dayWorkouts = sortWorkouts(await getWorkoutsByDay(movedWorkout.day));

    const newPosition = movedWorkout.position + direction;

    // Prevent moving beyond list bounds.
    if (newPosition < 0 || newPosition >= dayWorkouts.length) {
      return;
    }

    const otherWorkout = dayWorkouts.find((w) => w.position === newPosition);

    if (!otherWorkout) return;

    const oldPosition = movedWorkout.position;

    movedWorkout.position = newPosition;
    otherWorkout.position = oldPosition;

    await swapWorkoutPositions(movedWorkout, otherWorkout);

    await load(currentViewDay);
  }

  /**
   * Updates an existing workout and reloads the current view.
   */
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

// Singleton workout store used throughout the app.
export const workoutStore = createWorkoutStore();
