import { defineConfig } from 'drizzle-kit';
import path from 'path';
import { config } from './src/lib/config';

const dbName = config.dbName.replace('sqlite:', '');

export default defineConfig({
  schema: './src/lib/db/schema/index.ts',
  out: './src/lib/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: `file:${path.join(process.env.APPDATA!, 'zenith-client', dbName)}`
  }
});
