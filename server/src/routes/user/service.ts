import { and, eq, ilike } from "drizzle-orm";
import { status } from "elysia";
import { pg } from "../../db/pg";
import { user, userPublicKey } from "../../db/schema";
import type { UserModel } from "./model";

export const UserService = {
  get: async ({ id }: Pick<UserModel["userResponse"], "id">) => {
    const [userData] = await pg
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        publicKey: userPublicKey.publicKey,
      })
      .from(user)
      .leftJoin(userPublicKey, eq(userPublicKey.userId, user.id))
      .where(eq(user.id, id));

    if (!userData) {
      return status(404, { message: "User not found." });
    }
    return userData;
  },
  search: async ({ email, name }: UserModel["userQueryParams"]) => {
    if (!email && !name) {
      return status(400, {
        message: "At least one query param (email or name) is required",
      });
    }
    const conditions = [];
    if (email) {
      conditions.push(ilike(user.email, `%${email}%`));
    }
    if (name) {
      conditions.push(ilike(user.name, `%${name}%`));
    }

    return pg
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        publicKey: userPublicKey.publicKey,
      })
      .from(user)
      .leftJoin(userPublicKey, eq(userPublicKey.userId, user.id))
      .where(and(...conditions))
      .limit(5);
  },
};
