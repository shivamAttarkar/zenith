import { Elysia } from "elysia";
import { auth, authPlugin } from "./lib/auth";
import { pg } from "./db/pg";
import { redisPub } from "./db/redis";
import cors from "@elysiajs/cors";
import openapi from "@elysiajs/openapi";
import { authOpenAPI } from "./lib/auth";
import { routes } from "./routes";
import { webSocketPlugin } from "./ws";
import "./env";

const app = new Elysia();

app
  .use(cors())
  .use(authPlugin)
  .use(webSocketPlugin)
  .use(routes)
  .use(
    openapi({
      documentation: {
        components: await authOpenAPI.components,
        paths: await authOpenAPI.getPaths(),
      },
      enabled: Bun.env.NODE_ENV === "development",
    }),
  )
  .get("/", () => "Hello from Elysia!")
  .get("/health", async () => {
    const [betterAuth, pgStatus, redisStatus] = await Promise.allSettled([
      auth.api.ok(),
      pg.execute("SELECT 1"),
      redisPub.ping(),
    ]);

    return {
      betterAuth:
        betterAuth.status === "fulfilled" && betterAuth.value.ok
          ? "ok"
          : "error",
      pg: pgStatus.status === "fulfilled" ? "ok" : "error",
      redis: redisStatus.status === "fulfilled" ? "ok" : "error",
    };
  });

app.listen({
  port: Bun.env.PORT,
  reusePort: true,
});

if (Bun.env.NODE_ENV === "development") {
  console.log(
    `Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
  );
  console.log(`OpenAPI Docs are available at http://localhost:3000/openapi`);
}

if (Bun.env.NODE_ENV && Bun.env.NODE_ENV === "production") {
  console.log(`Worker ${process.pid} is online.`);
}
