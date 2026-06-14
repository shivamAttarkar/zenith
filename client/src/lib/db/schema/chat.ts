import { relations } from 'drizzle-orm';
import { text, integer, sqliteTable, index } from 'drizzle-orm/sqlite-core';
import { user } from './user';

export const userPublicKey = sqliteTable('user_public_key', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  publicKey: text('public_key').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$default(() => new Date())
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
      .default(false),
    expiresAt: integer('expires_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .$default(() => new Date())
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .$default(() => new Date())
      .$onUpdate(() => new Date())
      .notNull()
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

// Stores one row per DM pair. user1Id/user2Id are always stored sorted
// (user1Id < user2Id) so there is exactly one row per pair.
export const conversation = sqliteTable(
  'conversation',
  {
    id: text('id').primaryKey(),
    user1Id: text('user1_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    user2Id: text('user2_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .$default(() => new Date())
      .notNull()
  },
  (table) => [
    index('conversation_pair_idx').on(table.user1Id, table.user2Id),
    index('conversation_user2_idx').on(table.user2Id)
  ]
);

export const conversationRelations = relations(conversation, ({ one, many }) => ({
  user1: one(user, { fields: [conversation.user1Id], references: [user.id] }),
  user2: one(user, { fields: [conversation.user2Id], references: [user.id] }),
  messages: many(message)
}));

export const message = sqliteTable(
  'message',
  {
    id: text('id').primaryKey(),
    conversationId: text('conversation_id')
      .notNull()
      .references(() => conversation.id, { onDelete: 'cascade' }),
    senderId: text('sender_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    format: text('format', { enum: ['string', 'binary'] }).notNull(),
    mimeType: text('mime_type'),
    payload: text('payload').notNull(),
    status: text('status', { enum: ['sent', 'delivered', 'read'] })
      .notNull()
      .default('sent'),
    ts: integer('ts').notNull()
  },
  (table) => [
    index('message_conversation_ts_idx').on(table.conversationId, table.ts),
    index('message_sender_idx').on(table.senderId)
  ]
);

export const messagesRelations = relations(message, ({ one }) => ({
  conversation: one(conversation, {
    fields: [message.conversationId],
    references: [conversation.id]
  }),
  sender: one(user, {
    fields: [message.senderId],
    references: [user.id]
  })
}));
