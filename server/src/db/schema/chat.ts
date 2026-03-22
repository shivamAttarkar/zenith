import { relations, sql } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const userPublicKey = pgTable("user_public_key", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  publicKey: text("public_key").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userPublicKeyRelations = relations(userPublicKey, ({ one }) => ({
  user: one(user, {
    fields: [userPublicKey.userId],
    references: [user.id],
  }),
}));

export const friendRequest = pgTable(
  "friend_request",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    senderId: text("senderId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    receiverId: text("receiverId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    challenge: text("challenge").notNull(),
    status: text("status", { enum: ["pending", "accepted", "rejected"] })
      .notNull()
      .default("pending"),
    verifiedBySender: boolean("verified_by_sender").notNull().default(false),
    verifiedByReceiver: boolean("verified_by_receiver")
      .notNull()
      .default(false),
    expiresAt: timestamp("expires_at")
      .notNull()
      .default(sql`now() + interval '1 month'`),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("friend_request_fromUserId_idx").on(table.senderId),
    index("friend_request_toUserId_idx").on(table.receiverId),
  ],
);

export const friendRequestRelations = relations(friendRequest, ({ one }) => ({
  sender: one(user, {
    fields: [friendRequest.senderId],
    references: [user.id],
  }),
  receiver: one(user, {
    fields: [friendRequest.receiverId],
    references: [user.id],
  }),
}));
