import Database from '@tauri-apps/plugin-sql';
import { config } from '../config';

const migrationFiles = import.meta.glob('./migrations/*.sql', {
  eager: false,
  query: '?raw',
  import: 'default'
});

export async function migrate() {
  const db = await Database.load(config.dbName);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL
    )
  `);

  const sorted = Object.entries(migrationFiles).sort(([a], [b]) => a.localeCompare(b));

  for (const [filePath, loadFile] of sorted) {
    const hash = filePath.split('/').pop()!.replace('.sql', '');
    const applied = (await db.select(`SELECT id FROM "__drizzle_migrations" WHERE hash = $1`, [
      hash
    ])) as any[];

    if (applied.length === 0) {
      const sql = await (loadFile as () => Promise<string>)();
      await db.execute(sql);
      await db.execute(`INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES ($1, $2)`, [
        hash,
        Date.now()
      ]);
    }
  }
}
