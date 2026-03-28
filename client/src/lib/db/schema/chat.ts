import { relations } from 'drizzle-orm';
import { text, integer, sqliteTable, index } from 'drizzle-orm/sqlite-core';
import { user } from './user';

export const userPublicKey = sqliteTable('user_public_key', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  publicKey: text('public_key').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$onUpdate(() => new Date())
    .notNull()
});

export const userPublicKeyRelations = relations(userPublicKey, ({ one }) => ({
  user: one(user, {
    fields: [userPublicKey.userId],
    references: [user.id]
  })
}));

export const friendRequest = sqliteTable(
  'friend_request',
  {
    id: text('id').primaryKey(),
    senderId: text('sender_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    receiverId: text('receiver_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    challenge: text('challenge').notNull(),
    status: text('status', { enum: ['pending', 'accepted', 'rejected'] })
      .notNull()
      .default('pending'),
    verifiedBySender: integer('verified_by_sender', { mode: 'boolean' }).notNull().default(false),
    verifiedByReceiver: integer('verified_by_receiver', { mode: 'boolean' })
      .notNull()
      .default(false)
  },
  (table) => [
    index('friend_request_fromUserId_idx').on(table.senderId),
    index('friend_request_toUserId_idx').on(table.receiverId)
  ]
);

export const friendRequestRelations = relations(friendRequest, ({ one }) => ({
  sender: one(user, {
    fields: [friendRequest.senderId],
    references: [user.id]
  }),
  receiver: one(user, {
    fields: [friendRequest.receiverId],
    references: [user.id]
  })
}));

export const message = sqliteTable(
  'message',
  {
    id: text('id').primaryKey(),
    senderId: text('sender_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    receiverId: text('receiver_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    format: text('format', { enum: ['string', 'binary'] }).notNull(),
    mimeType: text('mime_type'),
    payload: text('payload').notNull(),
    ts: integer('ts').notNull()
  },
  (table) => [
    index('message_sender_idx').on(table.senderId),
    index('message_receiver_idx').on(table.receiverId),
    index('message_ts_idx').on(table.ts)
  ]
);

export const messagesRelations = relations(message, ({ one }) => ({
  sender: one(user, {
    fields: [message.senderId],
    references: [user.id]
  }),
  receiver: one(user, {
    fields: [message.receiverId],
    references: [user.id]
  })
}));
