import fs from 'fs';
import path from 'path';

import Database from 'better-sqlite3';

const DB_PATH = path.join(__dirname, '..', 'assets', 'hymnal.db');
const CATEGORIES_JSON_PATH = path.join(__dirname, 'categories.json');
const HYMNS_JSON_PATH = path.join(__dirname, 'hymns.json');

function seed_database() {
  console.log('Starting database seeding...');

  // Remove existing database if it exists
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }

  const db = new Database(DB_PATH);

  try {
    // Enable foreign key support
    db.pragma('foreign_keys = ON');

    // Create tables
    db.exec(`
      CREATE TABLE categories (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL
      );

      CREATE TABLE hymns (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        verses TEXT NOT NULL,
        category TEXT NOT NULL,
        category_id INTEGER NOT NULL,
        favorite INTEGER NOT NULL DEFAULT 0,
        views INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (category_id) REFERENCES categories (id)
      );

      CREATE TABLE settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        font_size INTEGER NOT NULL DEFAULT 16,
        line_height REAL NOT NULL DEFAULT 1.5,
        font_family TEXT NOT NULL DEFAULT 'System'
      );
    `);

    // Create indexes
    db.exec(`
      CREATE INDEX idx_hymns_name ON hymns(name);
      CREATE INDEX idx_hymns_category_id ON hymns(category_id);
      CREATE INDEX idx_hymns_favorite ON hymns(favorite);
      CREATE INDEX idx_hymns_views ON hymns(views);
      CREATE INDEX idx_categories_name ON categories(name);
    `);

    // Insert categories
    const categories = JSON.parse(
      fs.readFileSync(CATEGORIES_JSON_PATH, 'utf-8'),
    );
    const insert_category = db.prepare(
      'INSERT INTO categories (id, name) VALUES (?, ?)',
    );

    console.log('Inserting categories...');
    for (const category of categories) {
      insert_category.run(category.id, category.name);
    }

    // Insert hymns
    const hymns = JSON.parse(fs.readFileSync(HYMNS_JSON_PATH, 'utf-8'));
    const insert_hymn = db.prepare(
      'INSERT INTO hymns (id, name, verses, category, category_id) VALUES (?, ?, ?, ?, ?)',
    );

    console.log('Inserting hymns...');
    for (const hymn of hymns) {
      insert_hymn.run(
        hymn.id,
        hymn.name,
        JSON.stringify(hymn.verses),
        hymn.category,
        hymn.category_id,
      );
    }

    // Insert default settings
    db.exec(`
      INSERT INTO settings (id, font_size, line_height, font_family)
      VALUES (1, 16, 1.5, 'System')
    `);

    console.log('Database seeding completed successfully.');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    db.close();
  }
}

seed_database();
