// @ts-nocheck

import { db } from "./db.js";

export async function saveDayAlias(day, alias) {
  const existing = await db.settings.get("dayAliases");

  const aliases = existing?.value ?? {};

  aliases[day] = alias;

  await db.settings.put({
    key: "dayAliases",
    value: aliases,
  });

  return aliases;
}
