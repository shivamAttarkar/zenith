declare module "bun" {
  interface Env {
    PORT: number;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    PGUSER: string;
    PGPASSWORD: string;
    PGDATABASE: string;
    PGHOST: string;
    PGPORT: string;
    DATABASE_URL: string;
    REDIS_PORT: string;
    REDIS_URL: string;
    RP_ID: string;
    RP_NAME: string;
    ORIGIN: string;
  }
}
