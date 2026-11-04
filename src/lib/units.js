// @ts-nocheck

export const UNITS = {
  none: {
    label: "None",
    compact: "",
    dimension: "none",
    factor: 1,
  },

  seconds: {
    label: "Seconds",
    compact: "sec",
    dimension: "time",
    factor: 1,
  },

  minutes: {
    label: "Minutes",
    compact: "min",
    dimension: "time",
    factor: 60,
  },

  g: {
    label: "Grams (g)",
    compact: "g",
    dimension: "weight",
    factor: 1,
  },

  kg: {
    label: "Kilograms (Kg)",
    compact: "kg",
    dimension: "weight",
    factor: 1000,
  },

  lb: {
    label: "Pounds (lb)",
    compact: "lb",
    dimension: "weight",
    factor: 453.59237,
  },

  meters: {
    label: "Meters (m)",
    compact: "m",
    dimension: "length",
    factor: 1,
  },

  kilometers: {
    label: "Kilometers (Km)",
    compact: "km",
    dimension: "length",
    factor: 1000,
  },

  miles: {
    label: "Miles (mi)",
    compact: "mi",
    dimension: "length",
    factor: 1609.344,
  },
};

export function getDisplayValue(workout) {
  const convertedValue = fromBase(workout.value, workout.unit);
  return Number.isInteger(convertedValue) ? convertedValue : convertedValue.toFixed(2);
}

export function toBase(value, unit) {
  return value * UNITS[unit].factor;
}

export function fromBase(value, unit) {
  return value / UNITS[unit].factor;
}

export function formatDifference(diff, unit) {
  const sign = diff > 0 ? "+" : diff < 0 ? "-" : "";

  const convertedValue = fromBase(Math.abs(diff), unit);

  const value = Number.isInteger(convertedValue) ? convertedValue : convertedValue.toFixed(2);

  return `${sign}${value} ${UNITS[unit].label}`;
}
