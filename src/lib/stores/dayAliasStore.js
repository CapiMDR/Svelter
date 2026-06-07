// @ts-nocheck

import { writable } from "svelte/store";
import { db } from "../db.js";

function createDayAliasStore() {
  const { subscribe, set, update } = writable({});

  async function load() {
    const result = await db.settings.get("dayAliases");
    set(result?.value ?? {});
  }

  async function save(day, alias) {
    const result = await db.settings.get("dayAliases");

    const aliases = result?.value ?? {};

    if (!alias?.trim()) {
      delete aliases[day];
    } else {
      aliases[day] = alias.trim();
    }

    await db.settings.put({
      key: "dayAliases",
      value: aliases,
    });

    set(aliases);
  }

  function getAlias(day, aliases) {
    return aliases?.[day] ?? day;
  }

  return {
    subscribe,
    load,
    save,
    getAlias,
  };
}

export const dayAliasStore = createDayAliasStore();
