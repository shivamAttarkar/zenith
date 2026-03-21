import { Elysia } from "elysia";
import { publicKeyRoutes } from "./public-key";

export const routes = new Elysia({ prefix: "/api" }).use(publicKeyRoutes);
