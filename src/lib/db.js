import Dexie from "dexie";

export const db = new Dexie("MyApp");

db.version(1).stores({
  notes: "++id,title",
});
