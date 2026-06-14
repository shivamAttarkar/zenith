import type { App } from "../../../server/src/index";
import { treaty } from "@elysia/eden";
import { config } from "./config";

// @ts-expect-error - server and client resolve elysia from separate node_modules, causing incompatible types
const apiClient = treaty<App>(config.serverUrl, {
  fetch: { credentials: "include" },
});

export { apiClient };
