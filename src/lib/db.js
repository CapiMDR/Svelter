import Dexie from "dexie";

export const db = new Dexie("MyApp");

db.version(1).stores({
  workouts: "++id, day, position",
});
