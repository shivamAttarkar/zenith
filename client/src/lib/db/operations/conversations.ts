import { sqlite as db } from "$lib/db/sqlite";
import { conversations } from "$lib/db/schema";
import { notifyChange } from "$lib/db/dbEvents";
import { appMachineRef } from "$lib/machines";

export async function upsertConversationByContactId(contactId: string) {
  const currentUserId = appMachineRef.getSnapshot().context.user?.id;
  if (!currentUserId) return;
  const id = [currentUserId, contactId].sort().join(":");
  await db
    .insert(conversations)
    .values({ id, contactId, createdAt: Date.now() })
    .onConflictDoNothing();
  notifyChange("conversations", "upsert", { id });
}
