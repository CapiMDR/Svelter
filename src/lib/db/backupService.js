// @ts-nocheck
import { db } from "./db.js";

export async function createBackup({ routines, statistics }) {
  const backup = {
    format: "svelter-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
  };

  if (routines) {
    const [workouts, aliases] = await Promise.all([db.workouts.toArray(), db.settings.get("dayAliases")]);
    backup.routines = { workouts, dayAliases: aliases?.value ?? {} };
  }

  if (statistics) backup.statistics = { sessions: await db.sessions.toArray() };
  return backup;
}

export async function importBackup(backup, { routines, statistics, mode }) {
  validateBackup(backup, { routines, statistics });

  await db.transaction("rw", db.workouts, db.settings, db.sessions, async () => {
    if (routines) await importRoutines(backup.routines, mode);
    if (statistics) await importSessions(backup.statistics.sessions, mode);
  });
}

async function importRoutines(routines, mode) {
  if (mode === "replace") await db.workouts.clear();

  const importedWorkouts = routines.workouts.map(({ id, ...workout }) => workout);
  if (mode === "merge") {
    const existing = await db.workouts.toArray();
    const byDay = new Map();
    for (const workout of existing) byDay.set(workout.day, Math.max(byDay.get(workout.day) ?? -1, workout.position ?? -1));
    for (const workout of importedWorkouts) {
      const position = (byDay.get(workout.day) ?? -1) + 1;
      byDay.set(workout.day, position);
      workout.position = position;
    }
  }
  await db.workouts.bulkAdd(importedWorkouts);

  const existingAliases = mode === "merge" ? (await db.settings.get("dayAliases"))?.value ?? {} : {};
  await db.settings.put({ key: "dayAliases", value: { ...existingAliases, ...routines.dayAliases } });
}

async function importSessions(sessions, mode) {
  if (mode === "replace") {
    await db.sessions.clear();
    await db.sessions.bulkPut(sessions);
    return;
  }

  const existingIds = new Set(await db.sessions.toCollection().primaryKeys());
  const newSessions = sessions.filter((session) => !existingIds.has(session.id));
  await db.sessions.bulkAdd(newSessions);
}

function validateBackup(backup, selection) {
  if (!backup || backup.format !== "svelter-backup" || backup.version !== 1) {
    throw new Error("This is not a supported Svelter backup file.");
  }
  if (selection.routines && (!backup.routines || !Array.isArray(backup.routines.workouts) || typeof backup.routines.dayAliases !== "object")) {
    throw new Error("This backup does not contain valid routine data.");
  }
  if (selection.statistics && (!backup.statistics || !Array.isArray(backup.statistics.sessions))) {
    throw new Error("This backup does not contain valid statistics data.");
  }
}
