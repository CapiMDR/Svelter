// @ts-nocheck
import { UNITS, fromBase } from "./units.js";

export function targetLabel(exercise) {
  const target = exercise.repTarget;
  if (target?.mode === "range") return `${target.min}–${target.max}`;
  return String(target?.fixed ?? exercise.reps ?? 0);
}

export function defaultReps(exercise) {
  return exercise.repTarget?.mode === "range" ? exercise.repTarget.max : (exercise.repTarget?.fixed ?? exercise.reps ?? 0);
}

export function performanceFor(exercise) {
  const performed = (exercise.performedSets ?? []).filter((set) => set.completed);
  const legacy = !exercise.performedSets;
  const sets = legacy
    ? Array.from({ length: exercise.completedSets ?? 0 }, (_, index) => ({
        setNumber: index + 1,
        completed: true,
        actualReps: exercise.reps ?? 0,
        actualAmount: exercise.amount ?? 0,
        rir: null,
        estimated: true,
      }))
    : performed;
  const unit = exercise.unit ?? "none";
  const dimension = UNITS[unit]?.dimension ?? "none";
  const actualReps = sets.reduce((total, set) => total + (Number(set.actualReps) || 0), 0);
  const actualDuration = dimension === "time" ? sets.reduce((total, set) => total + (Number(set.actualAmount) || 0), 0) : 0;
  const volumeLoad =
    dimension === "weight"
      ? sets.reduce((total, set) => total + ((Number(set.actualReps) || 0) * (Number(set.actualAmount) || 0) * (UNITS[unit]?.factor ?? 1)) / 1000, 0)
      : 0;
  return { sets, completedSets: sets.length, actualReps, actualDuration, volumeLoad, dimension, estimated: legacy };
}

export function displayAmount(amount, unit) {
  if (amount == null || unit === "none") return "";
  const value = Number(amount);
  return `${Number.isInteger(value) ? value : value.toFixed(2)} ${UNITS[unit]?.compact ?? unit}`;
}

export function plannedAmount(workout) {
  return workout.unit === "none" ? 0 : fromBase(workout.value ?? 0, workout.unit);
}
