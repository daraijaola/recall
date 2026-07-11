/**
 * SQLite graph index for RECALL (better-sqlite3).
 * Zero-config local file: ./data/recall.db (or RECALL_DB_PATH).
 */

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { GRAPH_SCHEMA_SQL } from "./graph/schema";

export type RecallDatabase = Database.Database;

let dbSingleton: RecallDatabase | null = null;

export function getDbPath(): string {
  if (process.env.RECALL_DB_PATH) {
    return path.resolve(process.env.RECALL_DB_PATH);
  }
  // Prefer app/data under cwd (deployed as ~/recall-app)
  return path.resolve(process.cwd(), "data", "recall.db");
}

export function getDb(): RecallDatabase {
  if (dbSingleton) return dbSingleton;

  const dbPath = getDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(GRAPH_SCHEMA_SQL);

  dbSingleton = db;
  return db;
}

/** Ensure schema is applied; returns true when DB is usable. */
export function ensureDbReady(): boolean {
  try {
    const db = getDb();
    db.prepare("SELECT 1 FROM memories LIMIT 1").get();
    return true;
  } catch {
    try {
      // empty table still counts as ready
      getDb().prepare("SELECT COUNT(*) AS c FROM memories").get();
      return true;
    } catch {
      return false;
    }
  }
}

export function getSetting(key: string): string | null {
  try {
    const row = getDb()
      .prepare("SELECT value FROM settings WHERE key = ?")
      .get(key) as { value: string } | undefined;
    return row?.value ?? null;
  } catch {
    return null;
  }
}

export function setSetting(key: string, value: string): void {
  getDb()
    .prepare(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    )
    .run(key, value);
}

export function countMemoriesInDb(): number {
  try {
    const row = getDb().prepare("SELECT COUNT(*) AS c FROM memories").get() as {
      c: number;
    };
    return row?.c ?? 0;
  } catch {
    return 0;
  }
}
