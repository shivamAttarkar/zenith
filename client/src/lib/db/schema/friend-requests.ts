import { integer, sqliteTable, text, index } from "drizzle-orm/sqlite-core";

export const friendRequests = sqliteTable(
  "friend_requests",
  {
    id: text("id").primaryKey(),
    senderId: text("sender_id").notNull(),
    receiverId: text("receiver_id").notNull(),
    status: text("status", {
      enum: ["pending", "accepted", "rejected"],
    }).notNull(),
    verifiedBySender: integer("verified_by_sender", { mode: "boolean" })
      .notNull()
      .default(false),
    verifiedByReceiver: integer("verified_by_receiver", { mode: "boolean" })
      .notNull()
      .default(false),
    expiresAt: integer("expires_at").notNull(),
    createdAt: integer("created_at").notNull(),
    syncedAt: integer("synced_at").notNull(),
  },
  (table) => [
    index("friend_requests_sender_idx").on(table.senderId),
    index("friend_requests_receiver_idx").on(table.receiverId),
    index("friend_requests_status_idx").on(table.status),
  ],
);

export type FriendRequest = typeof friendRequests.$inferSelect;
export type NewFriendRequest = typeof friendRequests.$inferInsert;
