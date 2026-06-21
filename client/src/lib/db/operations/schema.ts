import { db } from "$lib/db/sqlite";

export async function dropAllTables(): Promise<void> {
  const tables = await db.select<{ name: string }[]>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
  );
  for (const { name } of tables) {
    await db.execute(`DROP TABLE IF EXISTS "${name}"`);
  }
}
