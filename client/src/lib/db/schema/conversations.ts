import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./users";

// id is derived: [myUserId, contactId].sort().join(':')
export const conversations = sqliteTable("conversations", {
  id: text("id").primaryKey(),
  contactId: text("contact_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  lastMessageId: text("last_message_id"),
  lastMessageAt: integer("last_message_at"),
  unreadCount: integer("unread_count").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
