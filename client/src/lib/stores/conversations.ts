import { derived } from "svelte/store";
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

export const conversationsStore = derived(
  dbEvents,
  ($event, set) => {
    if (
      $event &&
      $event.table !== "conversations" &&
      $event.table !== "messages"
    ) {
      return;
    }

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
  },
  [] as ConversationWithContact[],
);
