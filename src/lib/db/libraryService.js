import { db } from "./db.js";

const HIDDEN_BUILT_INS_KEY = "hiddenLibraryBuiltIns";

export function getLibraryTemplates() { return db.templates.toArray(); }
export function saveLibraryTemplate(template) { return db.templates.add({ ...template, createdAt: Date.now() }); }
export function deleteLibraryTemplate(id) { return db.templates.delete(id); }
export async function getHiddenBuiltInTemplateNames() {
  return (await db.settings.get(HIDDEN_BUILT_INS_KEY))?.value ?? [];
}
export function saveHiddenBuiltInTemplateNames(names) {
  return db.settings.put({ key: HIDDEN_BUILT_INS_KEY, value: names });
}
