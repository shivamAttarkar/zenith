import { eq, sql } from "drizzle-orm";
import { sqlite as db } from "$lib/db/sqlite";
import { conversations, messages } from "$lib/db/schema";
import { notifyChange } from "$lib/db/dbEvents";
import { appMachineRef } from "$lib/machines";
import { upsertConversationByContactId } from "./conversations";
import { crypto } from "$lib/utils/crypto";
import type { WsServerMessage } from "$server/ws/types";

type ChatMessage = Extract<WsServerMessage, { type: "chat" }>;

export async function upsertMessage(msg: ChatMessage) {
  const currentUserId = appMachineRef.getSnapshot().context.user?.id;
  if (!currentUserId) {
    return;
  }

  const contactId =
    msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
  const conversationId = [currentUserId, contactId].sort().join(":");
  const isIncoming = msg.senderId !== currentUserId;

  await upsertConversationByContactId(contactId);

  let payload = msg.payload.msg;
  if (isIncoming) {
    try {
      payload = await crypto.decryptFrom(msg.senderId, msg.payload.msg);
    } catch (e) {
      console.error("Failed to decrypt message from", msg.senderId, e);
    }
  }

  await db
    .insert(messages)
    .values({
      id: msg.id,
      conversationId,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      payload,
      format: msg.payload.format,
      timestamp: msg.ts,
      status: isIncoming ? "delivered" : "sent",
      createdAt: Date.now(),
    })
    .onConflictDoNothing();

  await db
    .update(conversations)
    .set({
      lastMessageId: msg.id,
      lastMessageAt: msg.ts,
      ...(isIncoming && { unreadCount: sql`${conversations.unreadCount} + 1` }),
    })
    .where(eq(conversations.id, conversationId));

  notifyChange("messages", "insert", { id: msg.id, conversationId });
}
