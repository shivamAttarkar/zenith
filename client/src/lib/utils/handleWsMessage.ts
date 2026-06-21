import { eq } from "drizzle-orm";
import { sqlite as db } from "$lib/db/sqlite";
import { users, friendRequests } from "$lib/db/schema";
import { notifyChange } from "$lib/db/dbEvents";
import { apiClient } from "$lib/utils/api";
import type { WsServerMessage } from "$server/ws/types";
import { upsertFriendRequest } from "$lib/db/operations/friends";
import { appMachineRef } from "$lib/machines";
import { crypto } from "$lib/utils/crypto";
import { getContactPublicKey } from "$lib/utils/getContactPublicKey";

export async function handleWsMessage(msg: WsServerMessage) {
  switch (msg.type) {
    case "public-key-updated": {
      const { userId, publicKey } = msg as {
        userId: string;
        publicKey: string;
      };
      await db
        .update(users)
        .set({ publicKey, cachedAt: Date.now() })
        .where(eq(users.id, userId));
      notifyChange("users", "update", { id: userId });
      break;
    }

    case "friend-request": {
      const { friendRequestId } = msg as { friendRequestId: string };
      const { data, error } = await apiClient.api.v1["friend-request"]({
        id: friendRequestId,
      }).get();
      if (!error && data) {
        await upsertFriendRequest(data);
      }
      break;
    }

    case "friend-request-accepted": {
      const { friendRequestId } = msg as { friendRequestId: string };
      const { data, error } = await apiClient.api.v1["friend-request"]({
        id: friendRequestId,
      }).get();
      if (!error && data) {
        await upsertFriendRequest(data);
        if (data.verifiedBySender && data.verifiedByReceiver) {
          const currentUserId = appMachineRef.getSnapshot().context.user?.id;
          if (currentUserId) {
            const friendId =
              data.senderId === currentUserId ? data.receiverId : data.senderId;
            const publicKey = await getContactPublicKey(friendId);
            await crypto.deriveSharedSecret(publicKey, friendId);
          }
        }
      }
      break;
    }

    case "friend-request-rejected": {
      const { friendRequestId } = msg as { friendRequestId: string };
      const { data, error } = await apiClient.api.v1["friend-request"]({
        id: friendRequestId,
      }).get();
      if (!error && data) {
        await upsertFriendRequest(data);
      }
      break;
    }

    case "friend-request-deleted": {
      const { friendRequestId } = msg as { friendRequestId: string };
      await db
        .delete(friendRequests)
        .where(eq(friendRequests.id, friendRequestId));
      notifyChange("friend_requests", "delete", { id: friendRequestId });
      break;
    }
  }
}
