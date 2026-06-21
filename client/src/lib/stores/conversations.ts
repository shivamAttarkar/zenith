import { readable } from "svelte/store";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { dbEvents } from "$lib/db/dbEvents";
import { sqlite as db } from "$lib/db/sqlite";
import { conversations, users, messages, friendRequests } from "$lib/db/schema";

export type ConversationWithContact = {
  id: string;
  contactId: string;
  contactName: string;
  contactImage: string | null;
  contactPublicKey: string | null;
  lastMessageId: string | null;
  lastMessageAt: number | null;
  lastMessagePayload: string | null;
  lastMessageSenderId: string | null;
  unreadCount: number;
  createdAt: number;
  friendRequestStatus: "accepted" | "needs_reverification" | null;
};

function queryConversations(set: (value: ConversationWithContact[]) => void) {
  db.select({
    id: conversations.id,
    contactId: conversations.contactId,
    contactName: users.name,
    contactImage: users.image,
    contactPublicKey: users.publicKey,
    lastMessageId: conversations.lastMessageId,
    lastMessageAt: conversations.lastMessageAt,
    lastMessagePayload: messages.payload,
    lastMessageSenderId: messages.senderId,
    unreadCount: conversations.unreadCount,
    createdAt: conversations.createdAt,
    friendRequestStatus: friendRequests.status,
  })
    .from(conversations)
    .leftJoin(users, eq(conversations.contactId, users.id))
    .leftJoin(messages, eq(conversations.lastMessageId, messages.id))
    .leftJoin(
      friendRequests,
      and(
        or(
          eq(friendRequests.senderId, conversations.contactId),
          eq(friendRequests.receiverId, conversations.contactId),
        ),
        inArray(friendRequests.status, ["accepted", "needs_reverification"]),
      ),
    )
    .orderBy(desc(conversations.lastMessageAt))
    .then((rows) =>
      set(
        rows.map((r) => ({
          ...r,
          contactName: r.contactName ?? r.contactId,
          friendRequestStatus: (r.friendRequestStatus ?? null) as
            | "accepted"
            | "needs_reverification"
            | null,
        })),
      ),
    );
}

export const conversationsStore = readable<ConversationWithContact[]>([], (set) => {
  queryConversations(set);
  return dbEvents.subscribe(($event) => {
    if (
      $event?.table === "conversations" ||
      $event?.table === "messages" ||
      $event?.table === "friend_requests" ||
      $event?.table === "users"
    ) {
      queryConversations(set);
    }
  });
});
