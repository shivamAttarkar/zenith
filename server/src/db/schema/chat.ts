import { relations, sql } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
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
