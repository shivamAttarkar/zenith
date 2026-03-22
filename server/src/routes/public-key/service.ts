import { eq } from "drizzle-orm";
import { status } from "elysia";
import { pg } from "../../db/pg";
import { userPublicKey } from "../../db/schema";
import type { PublicKeyModel } from "./model";

export const PublicKeyService = {
  get: async ({
    userId,
  }: Pick<PublicKeyModel["publicKeyParameters"], "userId">) => {
    const [key] = await pg
      .select()
      .from(userPublicKey)
      .where(eq(userPublicKey.userId, userId));
    if (!key) {
      return status(404, { message: "No public key registered" });
    }
    return key;
  },
  create: async ({
    userId,
    publicKey,
  }: PublicKeyModel["publicKeyParameters"]) => {
    const existing = await pg
      .select()
      .from(userPublicKey)
      .where(eq(userPublicKey.userId, userId));
    if (existing.length > 0) {
      return status(409, {
        message: "Public key already exists, use PUT method to update",
      });
    }
    const [key] = await pg
      .insert(userPublicKey)
      .values({ userId, publicKey })
      .returning();

    if (!key) {
      return status(500, { message: "Failed to create public key" });
    }
    return key;
  },
  update: async ({
    userId,
    publicKey,
  }: PublicKeyModel["publicKeyParameters"]) => {
    const [key] = await pg
      .update(userPublicKey)
      .set({ publicKey, updatedAt: new Date() })
      .where(eq(userPublicKey.userId, userId))
      .returning();
    if (!key) {
      return status(404, { message: "No public key registered" });
    }
    return key;
  },
  delete: async ({
    userId,
  }: Pick<PublicKeyModel["publicKeyParameters"], "userId">) => {
    const [key] = await pg
      .delete(userPublicKey)
      .where(eq(userPublicKey.userId, userId))
      .returning();
    if (!key) {
      return status(404, { message: "No public key registered" });
    }
    return key;
  },
};
