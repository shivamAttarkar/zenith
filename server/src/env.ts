const required = [
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "NODE_ENV",
  "DATABASE_URL",
  "REDIS_URL",
  "RP_ID",
  "RP_NAME",
  "ORIGIN",
] as const;

for (const key of required) {
  if (!Bun.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const validNodeEnvs = ["development", "production"];
if (!Bun.env.NODE_ENV || !validNodeEnvs.includes(Bun.env.NODE_ENV)) {
  throw new Error(`Invalid NODE_ENV: ${Bun.env.NODE_ENV}`);
}
