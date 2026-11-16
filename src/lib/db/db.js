import Dexie from "dexie";

export const db = new Dexie("MyApp");

db.version(2).stores({
  workouts: "++id, day, position",
  settings: "key",
});

// Historical sessions are intentionally stored separately from editable routine
// elements. A session is a snapshot, so later routine edits never rewrite history.
db.version(3).stores({
  workouts: "++id, day, position",
  settings: "key",
  sessions: "id, routineId, scheduledDay, startedAt, finishedAt, status",
});

db.version(4).stores({
  workouts: "++id, day, position",
  settings: "key",
  sessions: "id, routineId, scheduledDay, startedAt, finishedAt, status",
  templates: "++id, name, bodyGroup, createdAt",
});

// Body entries keep measurement metadata separate from photo blobs so routine and
// statistics queries stay fast even when users keep several progress photos.
db.version(5).stores({
  workouts: "++id, day, position",
  settings: "key",
  sessions: "id, routineId, scheduledDay, startedAt, finishedAt, status",
  templates: "++id, name, bodyGroup, createdAt",
  bodyProgress: "id, recordedAt",
  progressPhotos: "id, bodyProgressId",
});
