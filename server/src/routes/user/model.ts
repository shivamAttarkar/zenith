import { t, type UnwrapSchema } from "elysia";
import { db } from "../../db/model";

const userResponse = t.Intersect([
  t.Pick(t.Object(db.select.user), ["id", "name", "email", "image"]),
  t.Object({
    publicKey: t.Union([db.select.userPublicKey.publicKey, t.Null()]),
  }),
]);

export const UserModel = {
  userQueryParams: t.Pick(t.Partial(t.Object(db.insert.user)), [
    "email",
    "name",
  ]),
  userResponse,
  userListResponse: t.Array(userResponse),
  userErrorResponse: t.Object({ message: t.String() }),
};

export type UserModel = {
  [k in keyof typeof UserModel]: UnwrapSchema<(typeof UserModel)[k]>;
};
