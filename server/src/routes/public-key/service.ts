import { and, eq, inArray, or } from "drizzle-orm";
import { status } from "elysia";
import { pg } from "../../db/pg";
import { friendRequest, userPublicKey } from "../../db/schema";
import { deriveChallenge, sendWSMessageToUser } from "../../lib/tools";
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

    // Invalidate all existing friend requests so both parties re-do AKE with new keys
    const affected = await pg
      .select()
      .from(friendRequest)
      .where(
        and(
          or(
            eq(friendRequest.senderId, userId),
            eq(friendRequest.receiverId, userId),
          ),
          inArray(friendRequest.status, [
            "pending",
            "accepted",
            "needs_reverification",
          ]),
        ),
      );

    if (affected.length > 0) {
      const otherUserIds = affected.map((req) =>
        req.senderId === userId ? req.receiverId : req.senderId,
      );

      const otherKeys = await pg
        .select()
        .from(userPublicKey)
        .where(inArray(userPublicKey.userId, otherUserIds));

      const keyMap = new Map(otherKeys.map((k) => [k.userId, k.publicKey]));

      await Promise.all(
        affected.map(async (req) => {
          const otherUserId =
            req.senderId === userId ? req.receiverId : req.senderId;
          const otherKey = keyMap.get(otherUserId);
          if (!otherKey) {
            return;
          }
          const senderKey = req.senderId === userId ? publicKey : otherKey;
          const receiverKey = req.receiverId === userId ? publicKey : otherKey;
          const newChallenge = await deriveChallenge(
            senderKey,
            receiverKey,
            req.id,
          );

          await Promise.all([
            pg
              .update(friendRequest)
              .set({
                challenge: newChallenge,
                verifiedBySender: false,
                verifiedByReceiver: false,
                status: "needs_reverification",
              })
              .where(eq(friendRequest.id, req.id)),
            sendWSMessageToUser({
              userId: otherUserId,
              msg: {
                type: "friend-request-needs-reverification",
                friendRequestId: req.id,
              },
            }),
            sendWSMessageToUser({
              userId: otherUserId,
              msg: {
                type: "public-key-updated",
                userId,
                publicKey,
              },
            }),
          ]);
        }),
      );
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
    const activeRequests = await pg
      .select()
      .from(friendRequest)
      .where(
        and(
          or(
            eq(friendRequest.senderId, userId),
            eq(friendRequest.receiverId, userId),
          ),
          inArray(friendRequest.status, [
            "pending",
            "accepted",
            "needs_reverification",
          ]),
        ),
      );

    await Promise.all(
      activeRequests.map((req) => {
        const otherUserId =
          req.senderId === userId ? req.receiverId : req.senderId;
        return sendWSMessageToUser({
          userId: otherUserId,
          msg: { type: "public-key-deleted", userId },
        });
      }),
    );

    return key;
  },
};
