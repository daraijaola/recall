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

export type MemoryRow = {
  id: string;
  smDocId: string;
  type: string;
  source: string;
  contentPreview: string;
  confidence: number;
  validFrom: string;
  validUntil: string | null;
  supersededBy: string | null;
  version: number;
  createdAt: string;
};

export type RelationRow = {
  id: string;
  from: string;
  to: string;
  kind: string;
};

export type ImportRow = {
  id: string;
  source: string;
  fileName: string;
  convCount: number;
  memoryCount: number;
  status: "completed" | "failed" | "running";
  createdAt: string;
};

export function insertMemory(row: MemoryRow): void {
  getDb()
    .prepare(
      `INSERT OR REPLACE INTO memories
       (id, sm_doc_id, type, source, content_preview, confidence,
        valid_from, valid_until, superseded_by, version, created_at)
       VALUES (@id, @smDocId, @type, @source, @contentPreview, @confidence,
        @validFrom, @validUntil, @supersededBy, @version, @createdAt)`,
    )
    .run({
      id: row.id,
      smDocId: row.smDocId,
      type: row.type,
      source: row.source,
      contentPreview: row.contentPreview,
      confidence: row.confidence,
      validFrom: row.validFrom,
      validUntil: row.validUntil,
      supersededBy: row.supersededBy,
      version: row.version,
      createdAt: row.createdAt,
    });
}

export function insertRelation(row: RelationRow): void {
  getDb()
    .prepare(
      `INSERT OR REPLACE INTO relations (id, from_memory, to_memory, kind)
       VALUES (@id, @from, @to, @kind)`,
    )
    .run(row);
}

export function insertImport(row: ImportRow): void {
  getDb()
    .prepare(
      `INSERT OR REPLACE INTO imports
       (id, source, file_name, conv_count, memory_count, status, created_at)
       VALUES (@id, @source, @fileName, @convCount, @memoryCount, @status, @createdAt)`,
    )
    .run({
      id: row.id,
      source: row.source,
      fileName: row.fileName,
      convCount: row.convCount,
      memoryCount: row.memoryCount,
      status: row.status,
      createdAt: row.createdAt,
    });
}

export function updateImport(
  id: string,
  patch: Partial<Pick<ImportRow, "source" | "convCount" | "memoryCount" | "status">>,
): void {
  const current = getDb()
    .prepare(
      `SELECT id, source, file_name as fileName, conv_count as convCount,
              memory_count as memoryCount, status, created_at as createdAt
       FROM imports WHERE id = ?`,
    )
    .get(id) as ImportRow | undefined;
  if (!current) return;
  insertImport({
    ...current,
    source: patch.source ?? current.source,
    convCount: patch.convCount ?? current.convCount,
    memoryCount: patch.memoryCount ?? current.memoryCount,
    status: patch.status ?? current.status,
  });
}

export function listImports(): ImportRow[] {
  const rows = getDb()
    .prepare(
      `SELECT id, source, file_name as fileName, conv_count as convCount,
              memory_count as memoryCount, status, created_at as createdAt
       FROM imports
       ORDER BY created_at DESC
       LIMIT 50`,
    )
    .all() as ImportRow[];
  return rows;
}
