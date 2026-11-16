// @ts-nocheck
import { writable } from "svelte/store";
import { deleteBodyProgressEntry, getBodyProgressEntries, saveBodyProgressEntry } from "../db/bodyProgressService.js";

function createBodyProgressStore() {
  const { subscribe, set } = writable({ entries: [], loading: false });
  async function load() {
    set({ entries: [], loading: true });
    set({ entries: await getBodyProgressEntries(), loading: false });
  }
  async function save(entry, photos) {
    await saveBodyProgressEntry(entry, photos);
    await load();
  }
  async function remove(id) {
    await deleteBodyProgressEntry(id);
    await load();
  }
  return { subscribe, load, save, remove };
}
export const bodyProgressStore = createBodyProgressStore();
