import { status } from "elysia";
import { pg } from "../../db/pg";
import { userPublicKey } from "../../db/schema";
import { eq } from "drizzle-orm";
import type { PublicKeyModel } from "./model";

export abstract class PublicKeyService {
  static async get({
    userId,
  }: Pick<PublicKeyModel["publicKeyParameters"], "userId">) {
    const [key] = await pg
      .select()
      .from(userPublicKey)
      .where(eq(userPublicKey.userId, userId));
    if (!key) {
      throw status(404, { message: "No public key registered" });
    }
    return key;
  }

  static async create({
    userId,
    publicKey,
  }: PublicKeyModel["publicKeyParameters"]) {
    const existing = await pg
      .select()
      .from(userPublicKey)
      .where(eq(userPublicKey.userId, userId));
    if (existing.length > 0) {
      throw status(409, {
        message: "Public key already exists, use PUT method to update",
      });
    }
    const [key] = await pg
      .insert(userPublicKey)
      .values({ userId, publicKey })
      .returning();

    if (!key) {
      throw status(500, { message: "Failed to create public key" });
    }
    return key;
  }

  static async update({
    userId,
    publicKey,
  }: PublicKeyModel["publicKeyParameters"]) {
    const [key] = await pg
      .update(userPublicKey)
      .set({ publicKey, updatedAt: new Date() })
      .where(eq(userPublicKey.userId, userId))
      .returning();
    if (!key) {
      throw status(404, { message: "No public key registered" });
    }
    return key;
  }

  static async delete({
    userId,
  }: Pick<PublicKeyModel["publicKeyParameters"], "userId">) {
    const [key] = await pg
      .delete(userPublicKey)
      .where(eq(userPublicKey.userId, userId))
      .returning();
    if (!key) {
      throw status(404, { message: "No public key registered" });
    }
    return key;
  }
}
