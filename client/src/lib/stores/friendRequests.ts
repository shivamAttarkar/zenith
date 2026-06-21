import { readable } from "svelte/store";
import { desc, eq, sql } from "drizzle-orm";
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

function queryFriendRequests(set: (value: FriendRequestWithUsers[]) => void) {
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
    senderName: sql<string | null>`"sender"."name"`.as("senderName"),
    senderImage: sql<string | null>`"sender"."image"`.as("senderImage"),
    receiverName: sql<string | null>`"receiver"."name"`.as("receiverName"),
    receiverImage: sql<string | null>`"receiver"."image"`.as("receiverImage"),
  })
    .from(friendRequests)
    .leftJoin(sender, eq(friendRequests.senderId, sender.id))
    .leftJoin(receiver, eq(friendRequests.receiverId, receiver.id))
    .orderBy(desc(friendRequests.createdAt))
    .then(set);
}

export const friendRequestsStore = readable<FriendRequestWithUsers[]>([], (set) => {
  queryFriendRequests(set);
  return dbEvents.subscribe(($event) => {
    if ($event?.table === "friend_requests") {
      queryFriendRequests(set);
    }
  });
});
