import Dexie from "dexie";

export const db = new Dexie("MyApp");

db.version(2).stores({
  workouts: "++id, day, position",
  settings: "key",
});
