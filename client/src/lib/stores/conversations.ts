import { readable } from "svelte/store";
import { desc, eq } from "drizzle-orm";
import { dbEvents } from "$lib/db/dbEvents";
import { sqlite as db } from "$lib/db/sqlite";
import { conversations, users } from "$lib/db/schema";

export type ConversationWithContact = {
  id: string;
  contactId: string;
  contactName: string;
  contactImage: string | null;
  lastMessageId: string | null;
  lastMessageAt: number | null;
  unreadCount: number;
  createdAt: number;
};

function queryConversations(set: (value: ConversationWithContact[]) => void) {
  db.select({
    id: conversations.id,
    contactId: conversations.contactId,
    contactName: users.name,
    contactImage: users.image,
    lastMessageId: conversations.lastMessageId,
    lastMessageAt: conversations.lastMessageAt,
    unreadCount: conversations.unreadCount,
    createdAt: conversations.createdAt,
  })
    .from(conversations)
    .leftJoin(users, eq(conversations.contactId, users.id))
    .orderBy(desc(conversations.lastMessageAt))
    .then((rows) =>
      set(
        rows.map((r) => ({
          ...r,
          contactName: r.contactName ?? r.contactId,
        })),
      ),
    );
}

export const conversationsStore = readable<ConversationWithContact[]>([], (set) => {
  queryConversations(set);
  return dbEvents.subscribe(($event) => {
    if ($event?.table === "conversations" || $event?.table === "messages") {
      queryConversations(set);
    }
  });
});
