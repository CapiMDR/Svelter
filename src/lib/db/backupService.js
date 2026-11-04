// @ts-nocheck
import { db } from "./db.js";

export async function clearAllData() {
  await db.transaction("rw", db.workouts, db.settings, db.sessions, db.templates, async () => {
    await Promise.all([db.workouts.clear(), db.settings.clear(), db.sessions.clear(), db.templates.clear()]);
  });
}

export async function createBackup({ routines, statistics, library }) {
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
  if (library) {
    const [templates, hiddenBuiltIns] = await Promise.all([
      db.templates.toArray(),
      db.settings.get("hiddenLibraryBuiltIns"),
    ]);
    backup.library = { templates, hiddenBuiltInTemplateNames: hiddenBuiltIns?.value ?? [] };
  }
  return backup;
}

export async function importBackup(backup, { routines, statistics, library, mode }) {
  validateBackup(backup, { routines, statistics, library });

  await db.transaction("rw", db.workouts, db.settings, db.sessions, db.templates, async () => {
    if (routines) await importRoutines(backup.routines, mode);
    if (statistics) await importSessions(backup.statistics.sessions, mode);
    if (library) await importLibrary(backup.library, mode);
  });
}

async function importLibrary(library, mode) {
  const { templates, hiddenBuiltInTemplateNames = [] } = library;
  if (mode === "replace") await db.templates.clear();
  const incoming = templates.map(({ id, ...template }) => template);
  if (mode === "merge") {
    const existing = new Set((await db.templates.toArray()).map((template) => `${template.name}:${template.bodyGroup}`));
    await db.templates.bulkAdd(incoming.filter((template) => !existing.has(`${template.name}:${template.bodyGroup}`)));
  } else await db.templates.bulkAdd(incoming);

  const hiddenKey = "hiddenLibraryBuiltIns";
  const existingHiddenNames = mode === "merge" ? (await db.settings.get(hiddenKey))?.value ?? [] : [];
  await db.settings.put({
    key: hiddenKey,
    value: [...new Set([...existingHiddenNames, ...hiddenBuiltInTemplateNames])],
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
  if (selection.library && (!backup.library || !Array.isArray(backup.library.templates))) throw new Error("This backup does not contain valid library data.");
}
