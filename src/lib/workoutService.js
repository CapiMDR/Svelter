// @ts-nocheck
import { db } from "./db.js";

export async function getAllWorkouts() {
  return db.workouts.toArray();
}

export async function getWorkoutsByDay(day) {
  return db.workouts.where("day").equals(day).toArray();
}

export async function addWorkoutToDays(workoutData, days) {
  await db.transaction("rw", db.workouts, async () => {
    for (const day of days) {
      const dayWorkouts = await getWorkoutsByDay(day);

      await db.workouts.add({
        ...workoutData,
        day,
        createdAt: Date.now(),
        position: dayWorkouts.length,
        originalUnit: workoutData.unit,
        originalValue: workoutData.value,
        originalReps: workoutData.reps,
        originalSets: workoutData.sets,
      });
    }
  });
}

export async function deleteWorkoutById(workout) {
  const workoutsToShift = await db.workouts
    .where("day")
    .equals(workout.day)
    .filter((w) => w.position > workout.position)
    .toArray();

  workoutsToShift.forEach((w) => {
    w.position--;
  });

  await db.transaction("rw", db.workouts, async () => {
    await db.workouts.delete(workout.id);
    await db.workouts.bulkPut(workoutsToShift);
  });
}

export async function swapWorkoutPositions(workoutA, workoutB) {
  await db.transaction("rw", db.workouts, async () => {
    await db.workouts.update(workoutA.id, {
      position: workoutA.position,
    });

    await db.workouts.update(workoutB.id, {
      position: workoutB.position,
    });
  });
}

export async function editWorkout(workout, newData) {
  await db.workouts.update(workout.id, {
    ...newData,
    lastUpdated: Date.now(),
  });
}
