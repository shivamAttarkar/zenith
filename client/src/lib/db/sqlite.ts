import Database from '@tauri-apps/plugin-sql';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import * as schema from './schema';
import { config } from '../config';

const db = await Database.load(config.dbName);

function isSelectQuery(sql: string): boolean {
  const selectRegex = /^\s*SELECT\b/i;
  return selectRegex.test(sql);
}

export const sqlite = drizzle<typeof schema>(
  async (sql, params, method) => {
    let rows: any = [];
    let results = [];

    if (isSelectQuery(sql)) {
      rows = await db.select(sql, params).catch((e) => {
        console.error('SQL Error:', e);
        return [];
      });
    } else {
      rows = await db.execute(sql, params).catch((e) => {
        console.error('SQL Error:', e);
        return [];
      });
      return { rows: [] };
    }

    rows = rows.map((row: any) => {
      return Object.values(row);
    });

    results = method === 'all' ? rows : rows[0];
    return { rows: results };
  },
  { schema: schema, logger: true }
);
