import { Elysia } from "elysia";
import { publicKeyRoutes } from "./public-key";
import { friendRequestRoutes } from "./friend-request";
import { userRoutes } from "./user";

export const routes = new Elysia({ prefix: "/api" })
  .use(publicKeyRoutes)
  .use(friendRequestRoutes)
  .use(userRoutes);
