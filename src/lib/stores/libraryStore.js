import { writable } from "svelte/store";
import {
  deleteLibraryTemplate,
  getHiddenBuiltInTemplateNames,
  getLibraryTemplates,
  saveHiddenBuiltInTemplateNames,
  saveLibraryTemplate,
} from "../db/libraryService.js";

function createLibraryStore() {
  const { subscribe, set, update } = writable({ templates: [], hiddenBuiltInTemplateNames: [], loading: false });
  async function load() {
    set({ templates: [], hiddenBuiltInTemplateNames: [], loading: true });
    const [templates, hiddenBuiltInTemplateNames] = await Promise.all([getLibraryTemplates(), getHiddenBuiltInTemplateNames()]);
    set({ templates, hiddenBuiltInTemplateNames, loading: false });
  }
  async function save(template) { await saveLibraryTemplate(template); await load(); }
  async function remove(id) { await deleteLibraryTemplate(id); await load(); }
  async function hideBuiltIn(name) {
    let names;
    update((state) => {
      names = [...new Set([...state.hiddenBuiltInTemplateNames, name])];
      return { ...state, hiddenBuiltInTemplateNames: names };
    });
    await saveHiddenBuiltInTemplateNames(names);
  }
  return { subscribe, load, save, remove, hideBuiltIn };
}
export const libraryStore = createLibraryStore();
