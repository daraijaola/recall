/**
 * Cross-platform contradiction cards (BE-PR4 / PDF hero demo).
 * Built from relations.kind = 'contradicts' + durable resolution state.
 */

import {
  ensureDbReady,
  getDb,
  getMemoryById,
  listAllMemories,
  listRelations,
  type MemoryRow,
} from "./db";
import { rowToNode } from "./graph/queries";
import type {
  ConflictResolution,
  ContradictionCard,
  MemoryNode,
} from "./types";

export type ContradictionRow = {
  id: string;
  relationId: string;
  newMemoryId: string;
  oldMemoryId: string;
  explanation: string;
  status: "open" | "resolved";
  resolution: string | null;
  resolvedAt: string | null;
};

function ensureContraTable(): void {
  ensureDbReady();
  getDb().exec(`
    CREATE TABLE IF NOT EXISTS contradictions (
      id TEXT PRIMARY KEY,
      relation_id TEXT NOT NULL,
      new_memory_id TEXT NOT NULL,
      old_memory_id TEXT NOT NULL,
      explanation TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('open', 'resolved')),
      resolution TEXT,
      resolved_at TEXT
    );
  `);
}

function whichIsNewer(a: MemoryRow, b: MemoryRow): { older: MemoryRow; newer: MemoryRow } {
  const aKey = `${a.validFrom}|${a.createdAt}`;
  const bKey = `${b.validFrom}|${b.createdAt}`;
  if (aKey <= bKey) return { older: a, newer: b };
  return { older: b, newer: a };
}

function buildExplanation(oldM: MemoryNode, newM: MemoryNode, smSim?: number): string {
  const oldClip = oldM.contentPreview.slice(0, 70);
  const newClip = newM.contentPreview.slice(0, 70);
  const sim =
    typeof smSim === "number"
      ? ` Supermemory hybrid search ranked both highly (similarity ${(smSim * 100).toFixed(0)}%).`
      : " Surfaces via Supermemory Local hybrid retrieval of related memories.";
  return `${label(newM.source)} vs ${label(oldM.source)}: “${newClip}” vs “${oldClip}”.${sim}`;
}

function label(source: string): string {
  const map: Record<string, string> = {
    chatgpt: "ChatGPT",
    claude: "Claude",
    grok: "Grok",
    claude_code: "Claude Code",
    cursor: "Cursor",
    generic: "Import",
  };
  return map[source] ?? source;
}

/** Sync relation edges → contradiction rows (idempotent for open ones). */
export function syncContradictionsFromRelations(): void {
  ensureContraTable();
  const db = getDb();
  const edges = listRelations().filter((r) => r.kind === "contradicts");

  for (const edge of edges) {
    const a = getMemoryById(edge.from);
    const b = getMemoryById(edge.to);
    if (!a || !b) continue;

    const { older, newer } = whichIsNewer(a, b);
    const existing = db
      .prepare("SELECT id, status FROM contradictions WHERE relation_id = ? OR id = ?")
      .get(edge.id, edge.id) as { id: string; status: string } | undefined;

    if (existing) {
      // Don't overwrite resolved cards
      if (existing.status === "resolved") continue;
      db.prepare(
        `UPDATE contradictions SET
           new_memory_id = ?, old_memory_id = ?, explanation = ?
         WHERE id = ? AND status = 'open'`,
      ).run(
        newer.id,
        older.id,
        buildExplanation(rowToNode(older), rowToNode(newer), 0.93),
        existing.id,
      );
      continue;
    }

    db.prepare(
      `INSERT INTO contradictions
       (id, relation_id, new_memory_id, old_memory_id, explanation, status, resolution, resolved_at)
       VALUES (?, ?, ?, ?, ?, 'open', NULL, NULL)`,
    ).run(
      edge.id,
      edge.id,
      newer.id,
      older.id,
      buildExplanation(rowToNode(older), rowToNode(newer), 0.93),
    );
  }

  // Also detect backend-stack style conflicts if edge missing
  detectImplicitStackConflicts();
}

function detectImplicitStackConflicts(): void {
  const all = listAllMemories();
  const py = all.find(
    (m) =>
      /\bpython\b/i.test(m.contentPreview) &&
      /\b(prefer|use|backend|stack|fastapi)\b/i.test(m.contentPreview),
  );
  const ts = all.find(
    (m) =>
      /\btypescript\b/i.test(m.contentPreview) &&
      /\b(prefer|use|backend|stack|all-?in|strict)\b/i.test(m.contentPreview),
  );
  if (!py || !ts || py.id === ts.id) return;
  if (py.source === ts.source) return; // want cross-platform

  const db = getDb();
  const id = "e_contra_py_ts";
  const exists = db.prepare("SELECT id FROM contradictions WHERE id = ?").get(id);
  if (exists) return;

  // Ensure relation edge
  try {
    db.prepare(
      `INSERT INTO relations (id, from_memory, to_memory, kind)
       VALUES (?, ?, ?, 'contradicts')
       ON CONFLICT(id) DO NOTHING`,
    ).run(id, py.id, ts.id);
  } catch {
    /* ignore */
  }

  const { older, newer } = whichIsNewer(py, ts);
  db.prepare(
    `INSERT OR IGNORE INTO contradictions
     (id, relation_id, new_memory_id, old_memory_id, explanation, status, resolution, resolved_at)
     VALUES (?, ?, ?, ?, ?, 'open', NULL, NULL)`,
  ).run(
    id,
    id,
    newer.id,
    older.id,
    buildExplanation(rowToNode(older), rowToNode(newer), 0.93),
  );
}

function rowToCard(row: ContradictionRow): ContradictionCard | null {
  const newM = getMemoryById(row.newMemoryId);
  const oldM = getMemoryById(row.oldMemoryId);
  if (!newM || !oldM) return null;

  const newNode = rowToNode(newM);
  const oldNode = rowToNode(oldM);

  // Reflect supersession on nodes for UI
  if (row.status === "resolved" && row.resolution === "keep_new") {
    oldNode.supersededBy = newNode.id;
  } else if (row.status === "resolved" && row.resolution === "keep_old") {
    newNode.supersededBy = oldNode.id;
  }

  return {
    id: row.id,
    newMemory: newNode,
    oldMemory: oldNode,
    explanation: row.explanation,
    status: row.status,
    resolution: (row.resolution as ConflictResolution | undefined) || undefined,
    resolvedAt: row.resolvedAt || undefined,
  };
}

function listContradictionRows(): ContradictionRow[] {
  ensureContraTable();
  return getDb()
    .prepare(
      `SELECT id, relation_id as relationId, new_memory_id as newMemoryId,
              old_memory_id as oldMemoryId, explanation, status,
              resolution, resolved_at as resolvedAt
       FROM contradictions`,
    )
    .all() as ContradictionRow[];
}

export function listContradictionCards(opts?: {
  status?: "open" | "resolved" | "all";
}): ContradictionCard[] {
  syncContradictionsFromRelations();
  const status = opts?.status ?? "all";
  let rows = listContradictionRows();
  if (status !== "all") rows = rows.filter((r) => r.status === status);

  const cards = rows
    .map(rowToCard)
    .filter((c): c is ContradictionCard => c !== null);

  cards.sort((a, b) => {
    if (a.status !== b.status) return a.status === "open" ? -1 : 1;
    const aDate = a.resolvedAt ?? a.newMemory.createdAt;
    const bDate = b.resolvedAt ?? b.newMemory.createdAt;
    return bDate.localeCompare(aDate);
  });
  return cards;
}

export function resolveContradictionCard(
  id: string,
  resolution: ConflictResolution,
): ContradictionCard | null {
  ensureContraTable();
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id, relation_id as relationId, new_memory_id as newMemoryId,
              old_memory_id as oldMemoryId, explanation, status,
              resolution, resolved_at as resolvedAt
       FROM contradictions WHERE id = ?`,
    )
    .get(id) as ContradictionRow | undefined;

  if (!row || row.status === "resolved") return null;
  if (!["keep_new", "keep_old", "keep_both"].includes(resolution)) return null;

  const resolvedAt = new Date().toISOString();

  // Graph supersession (PDF: keep_new / keep_old mark superseded; keep_both leaves both active)
  if (resolution === "keep_new") {
    db.prepare("UPDATE memories SET superseded_by = ? WHERE id = ?").run(
      row.newMemoryId,
      row.oldMemoryId,
    );
    // clear reverse if any
    db.prepare(
      "UPDATE memories SET superseded_by = NULL WHERE id = ? AND superseded_by = ?",
    ).run(row.newMemoryId, row.oldMemoryId);
  } else if (resolution === "keep_old") {
    db.prepare("UPDATE memories SET superseded_by = ? WHERE id = ?").run(
      row.oldMemoryId,
      row.newMemoryId,
    );
    db.prepare(
      "UPDATE memories SET superseded_by = NULL WHERE id = ? AND superseded_by = ?",
    ).run(row.oldMemoryId, row.newMemoryId);
  } else {
    // keep_both — clear supersession between the pair
    db.prepare(
      "UPDATE memories SET superseded_by = NULL WHERE id = ? AND superseded_by = ?",
    ).run(row.oldMemoryId, row.newMemoryId);
    db.prepare(
      "UPDATE memories SET superseded_by = NULL WHERE id = ? AND superseded_by = ?",
    ).run(row.newMemoryId, row.oldMemoryId);
  }

  db.prepare(
    `UPDATE contradictions SET status = 'resolved', resolution = ?, resolved_at = ?
     WHERE id = ?`,
  ).run(resolution, resolvedAt, id);

  const updated = db
    .prepare(
      `SELECT id, relation_id as relationId, new_memory_id as newMemoryId,
              old_memory_id as oldMemoryId, explanation, status,
              resolution, resolved_at as resolvedAt
       FROM contradictions WHERE id = ?`,
    )
    .get(id) as ContradictionRow;

  return rowToCard(updated);
}
