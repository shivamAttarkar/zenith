import { drizzle } from "drizzle-orm/bun-sql";

const pg = drizzle({ connection: { url: process.env.DATABASE_URL! } });

export { pg };
