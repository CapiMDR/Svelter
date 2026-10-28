// @ts-nocheck
import { db } from "./db.js";

export async function getAllSessions() {
  return db.sessions.orderBy("finishedAt").reverse().toArray();
}

export async function saveSession(session) {
  await db.sessions.put(session);
  return session;
}

export async function deleteSession(id) {
  await db.sessions.delete(id);
}

export async function getHiddenExerciseNames() {
  return (await db.settings.get("hiddenExerciseNames"))?.value ?? [];
}

export async function saveHiddenExerciseNames(names) {
  await db.settings.put({ key: "hiddenExerciseNames", value: names });
}
