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
    get_total_views: db
      .select({ count: sql<number>`SUM(${schema.hymns.views})` })
      .from(schema.hymns)
      .prepare(),
  };
  return { db, sqlite, prepared };
}
