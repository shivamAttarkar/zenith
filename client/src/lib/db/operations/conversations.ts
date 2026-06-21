import { eq } from "drizzle-orm";
import { sqlite as db } from "$lib/db/sqlite";
import { conversations } from "$lib/db/schema";
import { notifyChange } from "$lib/db/dbEvents";
import { appMachineRef } from "$lib/machines";

export async function markConversationRead(conversationId: string) {
  await db
    .update(conversations)
    .set({ unreadCount: 0 })
    .where(eq(conversations.id, conversationId));
  notifyChange("conversations", "update", { id: conversationId });
}

export async function upsertConversationByContactId(contactId: string) {
  const currentUserId = appMachineRef.getSnapshot().context.user?.id;
  if (!currentUserId) {
    return;
  }
  const id = [currentUserId, contactId].sort().join(":");
  await db
    .insert(conversations)
    .values({ id, contactId, createdAt: Date.now() })
    .onConflictDoNothing();
  notifyChange("conversations", "upsert", { id });
}
