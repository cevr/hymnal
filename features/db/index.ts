import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync, SQLiteDatabase } from 'expo-sqlite';

import { categories, hymns, settings } from './schema';

let db: SQLiteDatabase;

export function getDatabase() {
  if (!db) {
    db = openDatabaseSync('hymnal.db');
  }
  return drizzle(db);
}

export async function initDatabase() {
  await db.execAsync(`CREATE TABLE IF NOT EXISTS hymns (
    id INTEGER PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    verses TEXT NOT NULL,
    category TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    favorite INTEGER NOT NULL DEFAULT 0,
    views INTEGER NOT NULL DEFAULT 0
  )`);
  await db.execAsync(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY NOT NULL,
    name TEXT NOT NULL
  )`);
  await db.execAsync(`CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY NOT NULL,
    font_size INTEGER NOT NULL DEFAULT 16,
    line_height REAL NOT NULL DEFAULT 1.5,
    font_family TEXT NOT NULL DEFAULT 'System'
  )`);

  // Insert default settings if not exist
  await db.execAsync(`INSERT OR IGNORE INTO settings (id) VALUES (1)`);
}

export { hymns, categories, settings };
