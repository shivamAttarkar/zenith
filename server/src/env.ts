const required = [
  "PORT",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "NODE_ENV",
  "PGUSER",
  "PGPASSWORD",
  "PGDATABASE",
  "PGHOST",
  "PGPORT",
  "DATABASE_URL",
  "REDIS_PORT",
  "REDIS_URL",
] as const;

for (const key of required) {
  if (!Bun.env[key])
    throw new Error(`Missing required environment variable: ${key}`);
}

const validNodeEnvs = ["development", "production"];
if (!validNodeEnvs.includes(Bun.env.NODE_ENV!)) {
  throw new Error(`Invalid NODE_ENV: ${Bun.env.NODE_ENV}`);
}

export {};
