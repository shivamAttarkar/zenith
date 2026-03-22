import Elysia from "elysia";
import { UserService } from "./service";
import { UserModel } from "./model";

export const userRoutes = new Elysia({ tags: ["user"], prefix: "/user" })
  .get(
    "/:id",
    ({ params }) => {
      return UserService.get({ id: params.id });
    },
    {
      response: {
        200: UserModel["userResponse"],
        404: UserModel["userErrorResponse"],
      },
    },
  )
  .get(
    "/search",
    ({ query }) => {
      return UserService.search({ name: query.name, email: query.email });
    },
    {
      query: UserModel["userQueryParams"],
      response: {
        200: UserModel["userListResponse"],
        400: UserModel["userErrorResponse"],
      },
    },
  );
