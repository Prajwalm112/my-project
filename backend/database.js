// database.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import fs from "fs";
import path from "path";

export async function initDB() {
  // ✅ Always use /tmp for writable DB on Render
  const dbDir = "/tmp";
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const dbPath = path.join(dbDir, "database.sqlite");

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      plan_type TEXT,
      allowed_queries INTEGER,
      results_per_query INTEGER,
      queries_used INTEGER
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS scraped_queries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      query TEXT,
      result_count INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  return db;
}
