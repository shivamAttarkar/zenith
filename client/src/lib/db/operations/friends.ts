import { sqlite as db } from "$lib/db/sqlite";
import { friendRequests, users } from "$lib/db/schema";
import { eq } from "drizzle-orm";
import { notifyChange } from "$lib/db/dbEvents";
import { upsertUserById } from "./users";
import { upsertConversationByContactId } from "./conversations";
import type { FriendRequestModel } from "$server/routes/friend-request/model";
import { appMachineRef } from "$lib/machines";

type ServerFriendRequest =
  FriendRequestModel["friendRequestListResponse"][number];

export async function getAcceptedContactIds(): Promise<string[]> {
  const rows = await db
    .select({ senderId: friendRequests.senderId, receiverId: friendRequests.receiverId })
    .from(friendRequests)
    .where(eq(friendRequests.status, "accepted"));
  return rows.flatMap(({ senderId, receiverId }) => [senderId, receiverId]);
}

export async function upsertFriendRequest(data: ServerFriendRequest) {
  await Promise.all([
    db
      .insert(friendRequests)
      .values({
        id: data.id,
        senderId: data.senderId,
        receiverId: data.receiverId,
        status: data.status,
        verifiedBySender: data.verifiedBySender,
        verifiedByReceiver: data.verifiedByReceiver,
        expiresAt: new Date(data.expiresAt).getTime(),
        createdAt: new Date(data.createdAt).getTime(),
        syncedAt: Date.now(),
      })
      .onConflictDoUpdate({
        target: friendRequests.id,
        set: {
          status: data.status,
          verifiedBySender: data.verifiedBySender,
          verifiedByReceiver: data.verifiedByReceiver,
          syncedAt: Date.now(),
        },
      }),
    upsertUserById(
      data.senderId === appMachineRef.getSnapshot().context.user?.id
        ? data.receiverId
        : data.senderId,
    ),
  ]);
  notifyChange("friend_requests", "upsert", { id: data.id });

  if (data.status === "accepted") {
    const currentUserId = appMachineRef.getSnapshot().context.user?.id;
    const contactId =
      data.senderId === currentUserId ? data.receiverId : data.senderId;
    await upsertConversationByContactId(contactId);
  }
}
