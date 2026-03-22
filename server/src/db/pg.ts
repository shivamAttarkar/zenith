import { drizzle } from "drizzle-orm/bun-sql";

const pg = drizzle({ connection: { url: Bun.env.DATABASE_URL } });

export { pg };
