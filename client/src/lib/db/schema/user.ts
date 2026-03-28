import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  image: text('image'),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$onUpdate(() => new Date())
    .notNull()
});
