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

/**
 * Upsert by sm_doc_id so re-imports don't DELETE rows (FK would fail on relations).
 * Returns the stable memory id (existing or new).
 */
export function upsertMemory(row: MemoryRow): string {
  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM memories WHERE sm_doc_id = ?")
    .get(row.smDocId) as { id: string } | undefined;

  if (existing) {
    db.prepare(
      `UPDATE memories SET
         type = @type,
         source = @source,
         content_preview = @contentPreview,
         confidence = @confidence,
         valid_from = @validFrom,
         valid_until = @validUntil,
         superseded_by = @supersededBy,
         version = @version
       WHERE sm_doc_id = @smDocId`,
    ).run({
      smDocId: row.smDocId,
      type: row.type,
      source: row.source,
      contentPreview: row.contentPreview,
      confidence: row.confidence,
      validFrom: row.validFrom,
      validUntil: row.validUntil,
      supersededBy: row.supersededBy,
      version: row.version,
    });
    return existing.id;
  }

  db.prepare(
    `INSERT INTO memories
     (id, sm_doc_id, type, source, content_preview, confidence,
      valid_from, valid_until, superseded_by, version, created_at)
     VALUES (@id, @smDocId, @type, @source, @contentPreview, @confidence,
      @validFrom, @validUntil, @supersededBy, @version, @createdAt)`,
  ).run({
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
  return row.id;
}

/** @deprecated use upsertMemory — kept for call sites that ignore return id */
export function insertMemory(row: MemoryRow): void {
  upsertMemory(row);
}

export function insertRelation(row: RelationRow): void {
  getDb()
    .prepare(
      `INSERT INTO relations (id, from_memory, to_memory, kind)
       VALUES (@id, @from, @to, @kind)
       ON CONFLICT(id) DO UPDATE SET
         from_memory = excluded.from_memory,
         to_memory = excluded.to_memory,
         kind = excluded.kind`,
    )
    .run(row);
}

export function listAllMemories(): MemoryRow[] {
  return getDb()
    .prepare(
      `SELECT id, sm_doc_id as smDocId, type, source,
              content_preview as contentPreview, confidence,
              valid_from as validFrom, valid_until as validUntil,
              superseded_by as supersededBy, version,
              created_at as createdAt
       FROM memories
       ORDER BY created_at DESC`,
    )
    .all() as MemoryRow[];
}

export function getMemoryById(id: string): MemoryRow | null {
  const row = getDb()
    .prepare(
      `SELECT id, sm_doc_id as smDocId, type, source,
              content_preview as contentPreview, confidence,
              valid_from as validFrom, valid_until as validUntil,
              superseded_by as supersededBy, version,
              created_at as createdAt
       FROM memories WHERE id = ?`,
    )
    .get(id) as MemoryRow | undefined;
  return row ?? null;
}

export function listRelations(opts?: { memoryId?: string }): RelationRow[] {
  if (opts?.memoryId) {
    return getDb()
      .prepare(
        `SELECT id, from_memory as "from", to_memory as "to", kind
         FROM relations
         WHERE from_memory = ? OR to_memory = ?`,
      )
      .all(opts.memoryId, opts.memoryId) as RelationRow[];
  }
  return getDb()
    .prepare(
      `SELECT id, from_memory as "from", to_memory as "to", kind FROM relations`,
    )
    .all() as RelationRow[];
}

export function getStatsFromDb(): {
  total: number;
  superseded: number;
  expired: number;
  contradictions: number;
  bySource: Record<string, number>;
  byType: Record<string, number>;
} {
  const db = getDb();
  const total = (db.prepare("SELECT COUNT(*) as c FROM memories").get() as { c: number }).c;
  const superseded = (
    db.prepare("SELECT COUNT(*) as c FROM memories WHERE superseded_by IS NOT NULL").get() as {
      c: number;
    }
  ).c;
  const today = new Date().toISOString().slice(0, 10);
  const expired = (
    db
      .prepare(
        "SELECT COUNT(*) as c FROM memories WHERE valid_until IS NOT NULL AND valid_until < ?",
      )
      .get(today) as { c: number }
  ).c;
  const contradictions = (
    db.prepare("SELECT COUNT(*) as c FROM relations WHERE kind = 'contradicts'").get() as {
      c: number;
    }
  ).c;
  const bySourceRows = db
    .prepare("SELECT source, COUNT(*) as c FROM memories GROUP BY source")
    .all() as Array<{ source: string; c: number }>;
  const byTypeRows = db
    .prepare("SELECT type, COUNT(*) as c FROM memories GROUP BY type")
    .all() as Array<{ type: string; c: number }>;

  const bySource: Record<string, number> = {};
  for (const r of bySourceRows) bySource[r.source] = r.c;
  const byType: Record<string, number> = {};
  for (const r of byTypeRows) byType[r.type] = r.c;

  return { total, superseded, expired, contradictions, bySource, byType };
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
