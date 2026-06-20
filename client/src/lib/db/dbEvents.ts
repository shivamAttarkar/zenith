import { writable } from "svelte/store";

export type DbTable =
  | "messages"
  | "conversations"
  | "friend_requests"
  | "users";
export type DbOperation = "insert" | "update" | "delete" | "upsert";

export type DbEvent = {
  table: DbTable;
  operation: DbOperation;
  filter?: {
    conversationId?: string;
    id?: string;
  };
};

export const dbEvents = writable<DbEvent | null>(null);

export function notifyChange(
  table: DbTable,
  operation: DbOperation,
  filter?: DbEvent["filter"],
) {
  dbEvents.set({ table, operation, filter });
}
