import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const hymns = sqliteTable('hymns', {
  id: integer('id').notNull(),
  name: text('name').notNull(),
  verses: text('verses', { mode: 'json' }).notNull().$type<
    {
      id: number;
      text: string;
    }[]
  >(),
  category: text('category').notNull(),
  category_id: integer('category_id').notNull(),
  favorite: integer('favorite').notNull().default(0),
  views: integer('views').notNull().default(0),
});

export const categories = sqliteTable('categories', {
  id: integer('number').notNull(),
  name: text('name').notNull(),
});

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey().notNull(),
  font_size: integer('font_size').notNull().default(16),
  line_height: integer('line_height').notNull().default(1.5),
  font_family: text('font_family').notNull().default('System'),
});
