/**
 * Search is Supermemory Local hybrid first — RECALL maps results into the UI.
 * Local graph is fallback only when SM is unreachable.
 */

import { listAllMemories } from "./db";
import { rowToNode } from "./graph/queries";
import { searchMemoriesSm } from "./supermemory";
import type {
  MemoryNode,
  MemoryType,
  SearchFilters,
  SearchHit,
  SearchResponse,
  Source,
} from "./types";

type SmHit = {
  id?: string;
  memory?: string;
  chunk?: string;
  similarity?: number;
  score?: number;
  metadata?: Record<string, unknown>;
  documents?: Array<{ id?: string; title?: string }>;
};

const SOURCES: Source[] = [
  "chatgpt",
  "claude",
  "grok",
  "claude_code",
  "cursor",
  "generic",
];
const TYPES: MemoryType[] = [
  "preference",
  "decision",
  "fact",
  "goal",
  "constraint",
  "project_state",
  "skill",
  "correction",
  "opinion",
  "workflow",
];

function clipSnippet(text: string, query: string, max = 140): string {
  const lower = text.toLowerCase();
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 2);
  let idx = -1;
  for (const t of terms) {
    const i = lower.indexOf(t);
    if (i >= 0 && (idx < 0 || i < idx)) idx = i;
  }
  if (idx < 0) {
    return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
  }
  const start = Math.max(0, idx - 24);
  const end = Math.min(text.length, idx + max - 24);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";
  return `${prefix}${text.slice(start, end)}${suffix}`;
}

function asSource(s: unknown): Source {
  return typeof s === "string" && SOURCES.includes(s as Source) ? (s as Source) : "generic";
}

function asType(t: unknown): MemoryType {
  return typeof t === "string" && TYPES.includes(t as MemoryType) ? (t as MemoryType) : "fact";
}

function smHitToMemory(r: SmHit, i: number): MemoryNode {
  const meta = r.metadata || {};
  const text = String(r.memory || r.chunk || "").trim();
  const id =
    (typeof meta.recallMemoryId === "string" && meta.recallMemoryId) ||
    r.id ||
    `sm_hit_${i}`;
  return {
    id,
    smDocId: r.id || id,
    type: asType(meta.type),
    source: asSource(meta.source),
    contentPreview: text.slice(0, 280),
    confidence: typeof r.similarity === "number" ? r.similarity : 0.7,
    validFrom: String(meta.validFrom || new Date().toISOString().slice(0, 10)).slice(0, 10),
    validUntil: null,
    supersededBy: null,
    version: 1,
    createdAt: new Date().toISOString(),
  };
}

function localSearch(query: string, filters: SearchFilters): SearchHit[] {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
  if (terms.length === 0) return [];

  const source = filters.source ?? "all";
  const type = filters.type ?? "all";
  const hits: SearchHit[] = [];

  for (const row of listAllMemories()) {
    if (source !== "all" && row.source !== source) continue;
    if (type !== "all" && row.type !== type) continue;
    if (row.supersededBy) continue;

    const hay = row.contentPreview.toLowerCase();
    let matched = 0;
    for (const t of terms) {
      if (hay.includes(t)) matched += 1;
    }
    if (matched === 0) continue;

    hits.push({
      memory: rowToNode(row),
      score: Math.min(0.99, matched / terms.length + row.confidence * 0.12),
      snippet: clipSnippet(row.contentPreview, query),
      via: "local",
    });
  }

  hits.sort((a, b) => b.score - a.score);
  return hits;
}

function mapSmResults(
  smResults: SmHit[],
  filters: SearchFilters,
  query: string,
): SearchHit[] {
  const all = listAllMemories();
  const byId = new Map(all.map((m) => [m.id, m]));
  const bySm = new Map(all.map((m) => [m.smDocId, m]));
  const source = filters.source ?? "all";
  const type = filters.type ?? "all";
  const hits: SearchHit[] = [];
  const seen = new Set<string>();

  smResults.forEach((r, i) => {
    const meta = r.metadata || {};
    const recallId = typeof meta.recallMemoryId === "string" ? meta.recallMemoryId : null;
    const text = (r.memory || r.chunk || "").trim();
    if (!text) return;
    const score = typeof r.similarity === "number" ? r.similarity : r.score ?? 0.5;

    let row = recallId ? byId.get(recallId) : undefined;
    if (!row && r.id) row = bySm.get(r.id);
    if (!row) {
      const lower = text.toLowerCase().slice(0, 60);
      row = all.find((m) => {
        const p = m.contentPreview.toLowerCase();
        return p.includes(lower.slice(0, 36)) || lower.includes(p.slice(0, 36));
      });
    }

    // Always surface SM intelligence — synthetic node if not in graph
    const memory = row ? rowToNode(row) : smHitToMemory(r, i);
    if (source !== "all" && memory.source !== source) return;
    if (type !== "all" && memory.type !== type && row) return;
    if (row?.supersededBy) return;
    if (seen.has(memory.id)) return;
    seen.add(memory.id);

    hits.push({
      memory,
      score: Math.min(0.99, Math.max(0.05, score)),
      snippet: clipSnippet(memory.contentPreview || text, query),
      via: "supermemory-hybrid",
    });
  });

  hits.sort((a, b) => b.score - a.score);
  return hits;
}

export async function searchMemoriesUnified(
  query: string,
  filters: SearchFilters = {},
): Promise<SearchResponse> {
  const started = Date.now();
  const q = query.trim();
  if (q.length < 2) {
    return { query: q, hits: [], total: 0, tookMs: 0, engine: "local", smHitCount: 0 };
  }

  let smHits: SearchHit[] = [];
  let smCount = 0;

  try {
    const raw = (await searchMemoriesSm({ q, limit: 20 })) as {
      results?: SmHit[];
    };
    const results = raw.results ?? [];
    smCount = results.length;
    smHits = mapSmResults(results, filters, q);
  } catch (e) {
    console.warn("[search] Supermemory hybrid failed:", e);
  }

  if (smHits.length > 0) {
    return {
      query: q,
      hits: smHits.slice(0, 40),
      total: smHits.length,
      tookMs: Date.now() - started,
      engine: "supermemory-hybrid",
      smHitCount: smCount,
    };
  }

  const local = localSearch(q, filters);
  return {
    query: q,
    hits: local.slice(0, 40),
    total: local.length,
    tookMs: Date.now() - started,
    engine: "local",
    smHitCount: 0,
  };
}
