// @ts-nocheck
import { writable } from "svelte/store";
import { db } from "../db/db.js";

const SETTINGS_KEY = "appSettings";
const defaults = {
  wakeLockEnabled: false,
  vibrateOnCountdownFinish: false,
};

function createSettingsStore() {
  const { subscribe, set, update } = writable({ ...defaults });

  async function load() {
    const savedSettings = await db.settings.get(SETTINGS_KEY);
    set({ ...defaults, ...(savedSettings?.value ?? {}) });
  }

  async function save(key, value) {
    let nextSettings;

    update((settings) => {
      nextSettings = { ...settings, [key]: value };
      return nextSettings;
    });

    await db.settings.put({ key: SETTINGS_KEY, value: nextSettings });
  }

  return {
    subscribe,
    load,
    save,
  };
}

export const settingsStore = createSettingsStore();
