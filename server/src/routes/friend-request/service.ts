import {
  type AuthenticatorTransportFuture,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { and, eq, inArray, or } from "drizzle-orm";
import { status } from "elysia";
import { pg } from "../../db/pg";
import { friendRequest, passkey, user, userPublicKey } from "../../db/schema";
import {
  deriveChallenge,
  derivefriendRequestOptions,
  sendWSMessageToUser,
} from "../../lib/tools";
import type { FriendRequestModel } from "./model";

const rpID = Bun.env.RP_ID;
const expectedOrigin = Bun.env.ORIGIN;

export const FriendRequestService = {
  get: async ({
    id,
    userId,
  }: Pick<FriendRequestModel["friendRequestParameters"], "id" | "userId">) => {
    const [res] = await pg
      .select()
      .from(friendRequest)
      .where(eq(friendRequest.id, id));
    if (!res) {
      return status(404, { message: "Friend request not found." });
    }
    if (res.senderId !== userId && res.receiverId !== userId) {
      return status(403, {
        message: "Not authorized to view this friend request.",
      });
    }
    return res;
  },
  create: async ({
    senderId,
    receiverId,
  }: Pick<
    FriendRequestModel["friendRequestResponse"],
    "senderId" | "receiverId"
  >) => {
    if (senderId === receiverId) {
      return status(400, {
        message: "You cannot send a friend request to yourself.",
      });
    }

    const [receiverUser] = await pg
      .select()
      .from(user)
      .where(eq(user.id, receiverId));

    if (!receiverUser) {
      return status(404, { message: "Receiver User not found." });
    }

    const rows = await pg
      .select()
      .from(passkey)
      .innerJoin(userPublicKey, eq(passkey.userId, userPublicKey.userId))
      .where(inArray(passkey.userId, [senderId, receiverId]));

    const senderRow = rows.find((r) => r.passkey.userId === senderId);
    const receiverRow = rows.find((r) => r.passkey.userId === receiverId);

    if (!senderRow) {
      return status(422, {
        message: "You don't have a passkey or public key registered.",
      });
    }
    if (!receiverRow) {
      return status(422, {
        message: "Receiver doesn't have a passkey or public key registered.",
      });
    }

    const existing = await pg
      .select()
      .from(friendRequest)
      .where(
        and(
          or(
            and(
              eq(friendRequest.senderId, senderId),
              eq(friendRequest.receiverId, receiverId),
            ),
            and(
              eq(friendRequest.senderId, receiverId),
              eq(friendRequest.receiverId, senderId),
            ),
          ),
          inArray(friendRequest.status, ["pending", "accepted"]),
        ),
      );

    if (existing?.[0]) {
      return status(409, {
        message:
          existing[0].status === "accepted"
            ? "You are already friends with this user."
            : "A friend request already exists between you and this user.",
      });
    }

    const senderKey = senderRow.user_public_key;
    const receiverKey = receiverRow.user_public_key;

    const friendRequestId = crypto.randomUUID();

    const challenge = await deriveChallenge(
      senderKey.publicKey,
      receiverKey.publicKey,
      friendRequestId,
    );

    const [createdReq] = await pg
      .insert(friendRequest)
      .values({ id: friendRequestId, challenge, senderId, receiverId })
      .returning();

    if (!createdReq) {
      return status(500, { message: "Failed to create friend request." });
    }

    return createdReq;
  },
  getAuthOptions: async ({
    id,
    userId,
  }: Pick<FriendRequestModel["friendRequestParameters"], "id" | "userId">) => {
    const [req] = await pg
      .select()
      .from(friendRequest)
      .where(eq(friendRequest.id, id));

    if (!req) {
      return status(404, { message: "Friend request not found." });
    }
    if (req.senderId !== userId && req.receiverId !== userId) {
      return status(403, {
        message: "Not authorized to access this friend request.",
      });
    }
    if (req.status !== "pending") {
      return status(400, { message: "Friend request is no longer pending." });
    }

    return derivefriendRequestOptions({ challenge: req.challenge, userId });
  },
  find: async ({
    userId,
  }: Pick<FriendRequestModel["friendRequestParameters"], "userId">) => {
    const res = await pg
      .select()
      .from(friendRequest)
      .where(
        or(
          eq(friendRequest.senderId, userId),
          eq(friendRequest.receiverId, userId),
        ),
      );

    return res;
  },
  verify: async ({
    id,
    userId,
    authenticationResponse,
  }: FriendRequestModel["friendRequestParameters"]) => {
    const [req] = await pg
      .select()
      .from(friendRequest)
      .where(eq(friendRequest.id, id));

    if (!req) {
      return status(404, { message: "Friend request not found." });
    }
    if (req.status !== "pending") {
      return status(400, { message: "Friend request is no longer pending." });
    }

    const isSender = req.senderId === userId;
    const isReceiver = req.receiverId === userId;

    if (!isSender && !isReceiver) {
      return status(403, {
        message: "Not authorized to verify this friend request.",
      });
    }

    if (isSender && req.verifiedBySender) {
      return status(400, {
        message: "You have already verified this friend request.",
      });
    }
    if (isReceiver && req.verifiedByReceiver) {
      return status(400, {
        message: "You have already verified this friend request.",
      });
    }

    const [userPasskey] = await pg
      .select()
      .from(passkey)
      .where(
        and(
          eq(passkey.userId, userId),
          eq(passkey.credentialID, authenticationResponse.id),
        ),
      );

    if (!userPasskey) {
      return status(422, { message: "User passkey not found." });
    }

    const verification = await verifyAuthenticationResponse({
      response: authenticationResponse,
      expectedChallenge: req.challenge,
      expectedOrigin,
      expectedRPID: rpID,
      credential: {
        id: userPasskey.credentialID,
        publicKey: Buffer.from(userPasskey.publicKey, "base64"),
        counter: userPasskey.counter,
        transports: (userPasskey.transports?.split(",") ??
          []) as AuthenticatorTransportFuture[],
      },
    });

    if (!verification.verified) {
      return status(400, { message: "Authentication verification failed." });
    }

    await pg
      .update(passkey)
      .set({ counter: verification.authenticationInfo.newCounter })
      .where(eq(passkey.id, userPasskey.id));

    const updateData = isSender
      ? { verifiedBySender: true }
      : { verifiedByReceiver: true };

    const [updated] = await pg
      .update(friendRequest)
      .set(updateData)
      .where(eq(friendRequest.id, id))
      .returning();

    if (!updated) {
      return status(500, { message: "Failed to update friend request." });
    }

    if (updated.verifiedBySender && updated.verifiedByReceiver) {
      await pg
        .update(friendRequest)
        .set({ status: "accepted" })
        .where(eq(friendRequest.id, id));

      await Promise.all([
        sendWSMessageToUser({
          userId: req.senderId,
          msg: { type: "friend-request-accepted", friendRequestId: id },
        }),
        sendWSMessageToUser({
          userId: req.receiverId,
          msg: { type: "friend-request-accepted", friendRequestId: id },
        }),
      ]);
    } else if (isSender && updated.verifiedBySender) {
      await sendWSMessageToUser({
        userId: req.receiverId,
        msg: { type: "friend-request", senderId: userId, friendRequestId: id },
      });
    }

    return updated;
  },
  reject: async ({
    id,
    userId,
  }: Pick<FriendRequestModel["friendRequestParameters"], "id" | "userId">) => {
    const [req] = await pg
      .select()
      .from(friendRequest)
      .where(eq(friendRequest.id, id));

    if (!req) {
      return status(404, { message: "Friend request not found." });
    }
    if (req.receiverId !== userId) {
      return status(403, {
        message: "Only the receiver can reject a friend request.",
      });
    }
    if (req.status !== "pending") {
      return status(400, { message: "Friend request is no longer pending." });
    }

    const [updatedReq] = await pg
      .update(friendRequest)
      .set({ status: "rejected" })
      .where(eq(friendRequest.id, id))
      .returning();

    if (!updatedReq) {
      return status(500, { message: "Failed to reject friend request." });
    }

    await sendWSMessageToUser({
      userId: req.senderId,
      msg: { type: "friend-request-rejected", friendRequestId: id },
    });

    return updatedReq;
  },
  delete: async ({
    id,
    userId,
  }: Pick<FriendRequestModel["friendRequestParameters"], "id" | "userId">) => {
    const [req] = await pg
      .select()
      .from(friendRequest)
      .where(eq(friendRequest.id, id));

    if (!req) {
      return status(404, { message: "Friend request not found." });
    }
    if (req.senderId !== userId) {
      return status(403, {
        message: "Only the sender can delete a friend request.",
      });
    }
    if (req.status !== "pending") {
      return status(400, { message: "Friend request is no longer pending." });
    }

    const [deletedReq] = await pg
      .delete(friendRequest)
      .where(eq(friendRequest.id, id))
      .returning();

    if (!deletedReq) {
      return status(500, { message: "Failed to delete friend request." });
    }

    await sendWSMessageToUser({
      userId: req.receiverId,
      msg: { type: "friend-request-deleted", friendRequestId: id },
    });

    return deletedReq;
  },
};
