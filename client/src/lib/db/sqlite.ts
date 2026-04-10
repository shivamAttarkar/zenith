/* eslint-disable @typescript-eslint/no-explicit-any */
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
    if (!isSelectQuery(sql)) {
      await db.execute(sql, params).catch((e) => console.error('SQL Error:', e));
      return { rows: [] };
    }

    const rows = (await db.select(sql, params).catch((e) => {
      console.error('SQL Error:', e);
      return [];
    })) as any[];

    const mapped = rows.map((row: any) => Object.values(row));
    const results = method === 'all' ? mapped : mapped[0];
    return { rows: results };
  },
  { schema: schema }
);
