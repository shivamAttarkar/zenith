import { derived } from "svelte/store";
import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { dbEvents } from "$lib/db/dbEvents";
import { sqlite as db } from "$lib/db/sqlite";
import { friendRequests, users } from "$lib/db/schema";

const sender = alias(users, "sender");
const receiver = alias(users, "receiver");

export type FriendRequestWithUsers = {
  id: string;
  senderId: string;
  receiverId: string;
  status: "pending" | "accepted" | "rejected";
  verifiedBySender: boolean;
  verifiedByReceiver: boolean;
  expiresAt: number;
  createdAt: number;
  syncedAt: number;
  senderName: string | null;
  senderImage: string | null;
  receiverName: string | null;
  receiverImage: string | null;
};

export const friendRequestsStore = derived(
  dbEvents,
  ($event, set) => {
    if ($event && $event.table !== "friend_requests") {
      return;
    }

    db.select({
      id: friendRequests.id,
      senderId: friendRequests.senderId,
      receiverId: friendRequests.receiverId,
      status: friendRequests.status,
      verifiedBySender: friendRequests.verifiedBySender,
      verifiedByReceiver: friendRequests.verifiedByReceiver,
      expiresAt: friendRequests.expiresAt,
      createdAt: friendRequests.createdAt,
      syncedAt: friendRequests.syncedAt,
      senderName: sender.name,
      senderImage: sender.image,
      receiverName: receiver.name,
      receiverImage: receiver.image,
    })
      .from(friendRequests)
      .leftJoin(sender, eq(friendRequests.senderId, sender.id))
      .leftJoin(receiver, eq(friendRequests.receiverId, receiver.id))
      .orderBy(desc(friendRequests.createdAt))
      .then(set);
  },
  [] as FriendRequestWithUsers[],
);
