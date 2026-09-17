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
      const nextPosition = Math.max(-1, ...dayWorkouts.map((workout) => workout.position)) + 1;

      await db.workouts.add({
        ...workoutData,
        day,
        createdAt: Date.now(),
        position: nextPosition,
        originalUnit: workoutData.unit,
        originalValue: workoutData.value,
        originalReps: workoutData.reps,
        originalSets: workoutData.sets,
      });
    }
  });
}

export async function deleteWorkoutById(workout) {
  await db.transaction("rw", db.workouts, async () => {
    const persistedWorkout = await db.workouts.get(workout.id);
    if (!persistedWorkout) return;

    const workoutsToShift = await db.workouts
      .where("day")
      .equals(persistedWorkout.day)
      .filter((currentWorkout) => currentWorkout.position > persistedWorkout.position)
      .toArray();

    workoutsToShift.forEach((currentWorkout) => {
      currentWorkout.position--;
    });

    await db.workouts.delete(persistedWorkout.id);
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

/**
 * Moves one workout by one place, using the persisted list as the source of
 * truth so rapid clicks cannot swap against a stale position.
 */
export async function moveWorkoutPosition(workoutId, day, direction) {
  await db.transaction("rw", db.workouts, async () => {
    const dayWorkouts = (await getWorkoutsByDay(day)).sort((first, second) => first.position - second.position);
    const currentIndex = dayWorkouts.findIndex((workout) => workout.id === workoutId);
    const targetIndex = currentIndex + direction;

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= dayWorkouts.length) return;

    const movedWorkout = dayWorkouts[currentIndex];
    const targetWorkout = dayWorkouts[targetIndex];
    const movedPosition = movedWorkout.position;

    movedWorkout.position = targetWorkout.position;
    targetWorkout.position = movedPosition;

    await db.workouts.bulkPut([movedWorkout, targetWorkout]);
  });
}

/**
 * Exchanges the complete schedules and aliases for two days while retaining
 * the order of workouts within each schedule. This also works when either day
 * is empty or has no alias.
 */
export async function swapWorkoutsBetweenDays(firstDay, secondDay) {
  if (firstDay === secondDay) return;

  await db.transaction("rw", db.workouts, db.settings, async () => {
    const [firstDayWorkouts, secondDayWorkouts] = await Promise.all([
      getWorkoutsByDay(firstDay),
      getWorkoutsByDay(secondDay),
    ]);

    await db.workouts.bulkPut([
      ...firstDayWorkouts.map((workout) => ({ ...workout, day: secondDay })),
      ...secondDayWorkouts.map((workout) => ({ ...workout, day: firstDay })),
    ]);

    const aliasSetting = await db.settings.get("dayAliases");
    const aliases = { ...(aliasSetting?.value ?? {}) };
    const hasFirstAlias = Object.hasOwn(aliases, firstDay);
    const hasSecondAlias = Object.hasOwn(aliases, secondDay);

    if (hasFirstAlias || hasSecondAlias) {
      const firstAlias = aliases[firstDay];
      const secondAlias = aliases[secondDay];

      if (hasSecondAlias) aliases[firstDay] = secondAlias;
      else delete aliases[firstDay];

      if (hasFirstAlias) aliases[secondDay] = firstAlias;
      else delete aliases[secondDay];

      await db.settings.put({ key: "dayAliases", value: aliases });
    }
  });
}

export async function editWorkout(workout, newData) {
  await db.workouts.update(workout.id, {
    ...newData,
    lastUpdated: Date.now(),
  });
}
