import { Elysia } from "elysia";
import { friendRequestRoutes } from "./friend-request";
import { publicKeyRoutes } from "./public-key";
import { userRoutes } from "./user";

export const routes = new Elysia({ prefix: "/api/v1" })
  .use(publicKeyRoutes)
  .use(friendRequestRoutes)
  .use(userRoutes);
