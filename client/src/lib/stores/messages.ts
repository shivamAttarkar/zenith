import { derived, writable } from "svelte/store";
import { eq, asc } from "drizzle-orm";
import { dbEvents } from "$lib/db/dbEvents";
import { sqlite as db } from "$lib/db/sqlite";
import { messages } from "$lib/db/schema";
import type { Message } from "$lib/db/schema";

export const activeConversationId = writable<string | null>(null);

let prevConvId: string | null = null;

export const messagesStore = derived(
  [dbEvents, activeConversationId],
  ([$event, $convId], set) => {
    if (!$convId) {
      prevConvId = null;
      set([]);
      return;
    }
    const convIdChanged = $convId !== prevConvId;
    prevConvId = $convId;
    if (
      !convIdChanged &&
      $event &&
      ($event.table !== "messages" || $event.filter?.conversationId !== $convId)
    ) {
      return;
    }

    db.select()
      .from(messages)
      .where(eq(messages.conversationId, $convId))
      .orderBy(asc(messages.timestamp))
      .then(set);
  },
  [] as Message[],
);
