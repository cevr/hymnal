import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { importDatabaseFromAssetAsync, openDatabaseAsync } from 'expo-sqlite';

import * as schema from './schema';

export async function initDatabase() {
  await importDatabaseFromAssetAsync('hymnal.db', {
    assetId: require('../../assets/hymnal.db'),
  });
  let sqlite = await openDatabaseAsync('hymnal.db');
  let db = drizzle(sqlite);

  await sqlite.execAsync(`CREATE TABLE IF NOT EXISTS hymns (
    id INTEGER PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    verses TEXT NOT NULL,
    category TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    favorite INTEGER NOT NULL DEFAULT 0,
    views INTEGER NOT NULL DEFAULT 0
  )`);
  await sqlite.execAsync(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY NOT NULL,
    name TEXT NOT NULL
  )`);
  await sqlite.execAsync(`CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY NOT NULL,
    font_size INTEGER NOT NULL DEFAULT 16,
    line_height REAL NOT NULL DEFAULT 1.5,
    font_family TEXT NOT NULL DEFAULT 'System'
  )`);

  // Create indexes
  await sqlite.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_hymns_name ON hymns(name)',
  );
  await sqlite.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_hymns_category_id ON hymns(category_id)',
  );
  await sqlite.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_hymns_favorite ON hymns(favorite)',
  );
  await sqlite.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_hymns_views ON hymns(views)',
  );
  await sqlite.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name)',
  );

  // Insert default settings if not exist
  await sqlite.execAsync(`
        INSERT OR IGNORE INTO settings (id, font_size, line_height, font_family)
        VALUES (1, 16, 1.5, 'System')
      `);

  const prepared = {
    get_all_hymns: db.select().from(schema.hymns).prepare(),
    get_hymn_by_id: db
      .select()
      .from(schema.hymns)
      .where(eq(schema.hymns.id, sql.placeholder('id')))
      .prepare(),
    update_hymn_views: db
      .update(schema.hymns)
      .set({ views: sql`${schema.hymns.views} + 1` })
      .where(eq(schema.hymns.id, sql.placeholder('id')))
      .prepare(),
    toggle_hymn_favorite: db
      .update(schema.hymns)
      .set({
        favorite: sql`CASE WHEN ${schema.hymns.favorite} = 0 THEN 1 ELSE 0 END`,
      })
      .where(eq(schema.hymns.id, sql.placeholder('id')))
      .prepare(),
    get_all_categories: db.select().from(schema.categories).prepare(),
    get_settings: db
      .select()
      .from(schema.settings)
      .where(eq(schema.settings.id, 1))
      .prepare(),
    update_settings: db
      .update(schema.settings)
      .set({
        font_size: sql.placeholder('font_size') as any,
        line_height: sql.placeholder('line_height') as any,
        font_family: sql.placeholder('font_family') as any,
      })
      .where(eq(schema.settings.id, 1))
      .prepare(),
  };
  return { db, sqlite, prepared };
}
