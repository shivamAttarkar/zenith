import { integer, sqliteTable, text, index } from "drizzle-orm/sqlite-core";
import { conversations } from "./conversations";

export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: text("sender_id").notNull(),
    receiverId: text("receiver_id").notNull(),
    payload: text("payload").notNull(),
    format: text("format", { enum: ["string", "binary"] })
      .notNull()
      .default("string"),
    timestamp: integer("timestamp").notNull(),
    status: text("status", { enum: ["sending", "sent", "delivered", "read"] })
      .notNull()
      .default("sending"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    index("messages_conversation_timestamp_idx").on(
      table.conversationId,
      table.timestamp,
    ),
  ],
);

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
