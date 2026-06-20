import { eq } from "drizzle-orm";
import { sqlite as db } from "$lib/db/sqlite";
import { users, friendRequests } from "$lib/db/schema";
import { notifyChange } from "$lib/db/dbEvents";
import { apiClient } from "$lib/utils/api";
import { upsertFriendRequest } from "$lib/machines/friendRequest/machine";

export async function handleWsMessage(msg: Record<string, unknown>) {
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
