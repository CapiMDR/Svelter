export const BODY_GROUPS = ["Chest", "Back", "Shoulders", "Arms", "Legs", "Core", "Cardio & Recovery", "Custom"];

export const BUILT_IN_TEMPLATES = [
  ["Chest", "Barbell Bench Press", 3, 8, "kg", 60000], ["Chest", "Incline Dumbbell Press", 3, 10, "kg", 20000],
  ["Back", "Lat Pulldown", 3, 10, "kg", 45000], ["Back", "Seated Cable Row", 3, 10, "kg", 40000],
  ["Shoulders", "Dumbbell Shoulder Press", 3, 10, "kg", 15000], ["Arms", "Dumbbell Curl", 3, 12, "kg", 10000],
  ["Legs", "Barbell Squat", 3, 8, "kg", 60000], ["Legs", "Romanian Deadlift", 3, 10, "kg", 50000],
  ["Core", "Plank", 3, 1, "seconds", 45], ["Cardio & Recovery", "Rest", 1, 1, "minutes", 1, "break"],
].map(([bodyGroup, name, sets, reps, unit, value, type = "workout"]) => ({ bodyGroup, name, sets, reps, unit, value, type, builtIn: true }));
