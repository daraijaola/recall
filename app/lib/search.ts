/**
 * Unified search: Supermemory hybrid + local graph index fallback.
 * Returns FE SearchResponse contract exactly.
 */

import { listAllMemories } from "./db";
import { rowToNode } from "./graph/queries";
import { searchMemoriesSm } from "./supermemory";
import type { SearchFilters, SearchHit, SearchResponse } from "./types";

type SmHit = {
  id?: string;
  memory?: string;
  chunk?: string;
  similarity?: number;
  score?: number;
  metadata?: Record<string, unknown>;
  documents?: Array<{ id?: string; title?: string }>;
};

function clipSnippet(text: string, query: string, max = 120): string {
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

function localSearch(
  query: string,
  filters: SearchFilters,
): SearchHit[] {
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
    // Hide superseded by default for cleaner results
    if (row.supersededBy) continue;

    const hay = row.contentPreview.toLowerCase();
    let matched = 0;
    for (const t of terms) {
      if (hay.includes(t)) matched += 1;
    }
    if (matched === 0) continue;

    const score = matched / terms.length + row.confidence * 0.12;
    const memory = rowToNode(row);
    hits.push({
      memory,
      score: Math.min(0.99, score),
      snippet: clipSnippet(row.contentPreview, query),
    });
  }

  hits.sort((a, b) => b.score - a.score);
  return hits;
}

function mapSmToGraph(
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

  for (const r of smResults) {
    const meta = r.metadata || {};
    const recallId = typeof meta.recallMemoryId === "string" ? meta.recallMemoryId : null;
    const text = (r.memory || r.chunk || "").trim();
    const score = typeof r.similarity === "number" ? r.similarity : r.score ?? 0.5;

    let row = recallId ? byId.get(recallId) : undefined;
    if (!row && r.id) row = bySm.get(r.id);
    if (!row && text) {
      // fuzzy: content contains significant overlap
      const lower = text.toLowerCase().slice(0, 80);
      row = all.find((m) => {
        const p = m.contentPreview.toLowerCase();
        return p.includes(lower.slice(0, 40)) || lower.includes(p.slice(0, 40));
      });
    }

    // If SM hit is conversation-level only, try source filter match on text search of graph
    if (!row && text) {
      const terms = text.toLowerCase().split(/\s+/).filter((t) => t.length > 3).slice(0, 4);
      row = all.find((m) => terms.some((t) => m.contentPreview.toLowerCase().includes(t)));
    }

    if (!row) continue;
    if (seen.has(row.id)) continue;
    if (source !== "all" && row.source !== source) continue;
    if (type !== "all" && row.type !== type) continue;
    if (row.supersededBy) continue;

    seen.add(row.id);
    hits.push({
      memory: rowToNode(row),
      score: Math.min(0.99, Math.max(0.05, score)),
      snippet: clipSnippet(row.contentPreview || text, query),
    });
  }

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
    return { query: q, hits: [], total: 0, tookMs: Date.now() - started };
  }

  let hits: SearchHit[] = [];

  // 1) Supermemory hybrid
  try {
    const raw = (await searchMemoriesSm({ q, limit: 20 })) as {
      results?: SmHit[];
      total?: number;
      timing?: number;
    };
    const results = raw.results ?? [];
    hits = mapSmToGraph(results, filters, q);
  } catch (e) {
    console.warn("[search] SM hybrid failed, local only:", e);
  }

  // 2) Local graph fill / fallback
  const local = localSearch(q, filters);
  if (hits.length === 0) {
    hits = local;
  } else {
    const seen = new Set(hits.map((h) => h.memory.id));
    for (const h of local) {
      if (seen.has(h.memory.id)) continue;
      // only add strong local matches
      if (h.score >= 0.45) {
        hits.push(h);
        seen.add(h.memory.id);
      }
    }
    hits.sort((a, b) => b.score - a.score);
  }

  return {
    query: q,
    hits: hits.slice(0, 40),
    total: hits.length,
    tookMs: Date.now() - started,
  };
}

