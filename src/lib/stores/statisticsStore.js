// @ts-nocheck
import { writable } from "svelte/store";
import { deleteSession, getAllSessions } from "../db/sessionService.js";

function createStatisticsStore() {
  const { subscribe, set } = writable({ sessions: [], loading: false });

  async function load() {
    set({ sessions: [], loading: true });
    const sessions = await getAllSessions();
    set({ sessions, loading: false });
  }

  async function remove(id) {
    await deleteSession(id);
    await load();
  }

  return { subscribe, load, remove };
}

export const statisticsStore = createStatisticsStore();
