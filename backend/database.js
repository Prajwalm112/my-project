import sqlite3 from "sqlite3";
import { open } from "sqlite";

export async function openDB() {
  const dbFile = process.env.DB_FILE || './fetscr.db';
  return open({
    filename: dbFile,
    driver: sqlite3.Database,
  });
}


// Initialize tables
export async function initDB() {
  const db = await openDB();

  // Users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      plan_type TEXT DEFAULT 'free',
      allowed_queries INTEGER DEFAULT 2,
      results_per_query INTEGER DEFAULT 5,
      queries_used INTEGER DEFAULT 0,
      last_reset TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Scraped queries table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS scraped_queries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      query TEXT,
      result_count INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // Check existing columns in users table
  const cols = await db.all("PRAGMA table_info(users)");
  const colNames = cols.map((c) => c.name);

  // Helper for adding missing columns
  const tryAdd = async (colName, definition) => {
    if (!colNames.includes(colName)) {
      try {
        await db.exec(`ALTER TABLE users ADD COLUMN ${colName} ${definition}`);
        console.log(`✅ Added missing column: ${colName}`);
      } catch (err) {
        console.warn(`⚠️ Could not add column ${colName}:`, err.message);
      }
    }
  };

  // Ensure all required columns exist
  await tryAdd("plan_type", "TEXT DEFAULT 'free'");
  await tryAdd("allowed_queries", "INTEGER DEFAULT 2");
  await tryAdd("results_per_query", "INTEGER DEFAULT 5");
  await tryAdd("queries_used", "INTEGER DEFAULT 0");
  await tryAdd("last_reset", "TEXT DEFAULT CURRENT_TIMESTAMP");

  console.log("✅ Database initialized");
  return db;
}
