/**
 * Graph index queries → API-shaped MemoryNode / RelationEdge.
 */

import {
  getMemoryById,
  listAllMemories,
  listRelations,
  getStatsFromDb,
  type MemoryRow,
} from "../db";
import type {
  GraphResponse,
  MemoryDetailResponse,
  MemoryNode,
  MemoryType,
  RelationEdge,
  RelationKind,
  Source,
  StatsResponse,
} from "../types";

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

function asSource(s: string): Source {
  return (SOURCES.includes(s as Source) ? s : "generic") as Source;
}

function asType(t: string): MemoryType {
  return (TYPES.includes(t as MemoryType) ? t : "fact") as MemoryType;
}

function asKind(k: string): RelationKind {
  if (k === "updates" || k === "contradicts" || k === "supports" || k === "extends") {
    return k;
  }
  return "supports";
}

export function rowToNode(row: MemoryRow): MemoryNode {
  return {
    id: row.id,
    smDocId: row.smDocId,
    type: asType(row.type),
    source: asSource(row.source),
    contentPreview: row.contentPreview,
    confidence: row.confidence,
    validFrom: row.validFrom,
    validUntil: row.validUntil,
    supersededBy: row.supersededBy,
    version: row.version,
    createdAt: row.createdAt,
  };
}

export function buildGraph(filters?: {
  type?: string;
  source?: string;
  includeSuperseded?: boolean;
}): GraphResponse {
  let nodes = listAllMemories().map(rowToNode);
  if (filters?.source && filters.source !== "all") {
    nodes = nodes.filter((n) => n.source === filters.source);
  }
  if (filters?.type && filters.type !== "all") {
    nodes = nodes.filter((n) => n.type === filters.type);
  }
  if (!filters?.includeSuperseded) {
    nodes = nodes.filter((n) => !n.supersededBy);
  }

  const idSet = new Set(nodes.map((n) => n.id));
  const edges: RelationEdge[] = listRelations()
    .filter((e) => idSet.has(e.from) && idSet.has(e.to))
    .map((e) => ({
      id: e.id,
      from: e.from,
      to: e.to,
      kind: asKind(e.kind),
    }));

  return { nodes, edges };
}

export function buildStats(): StatsResponse {
  const raw = getStatsFromDb();
  const bySource = Object.fromEntries(SOURCES.map((s) => [s, raw.bySource[s] ?? 0])) as Record<
    Source,
    number
  >;
  const byType = Object.fromEntries(TYPES.map((t) => [t, raw.byType[t] ?? 0])) as Record<
    MemoryType,
    number
  >;
  return {
    total: raw.total,
    superseded: raw.superseded,
    expired: raw.expired,
    contradictions: raw.contradictions,
    bySource,
    byType,
  };
}

export function buildMemoryDetail(id: string): MemoryDetailResponse | null {
  const row = getMemoryById(id);
  if (!row) return null;
  const memory = rowToNode(row);

  // Version chain: walk superseded_by backwards + self
  const chain: MemoryNode[] = [memory];
  // Find memories that this one supersedes (pointed at by superseded_by)
  const all = listAllMemories().map(rowToNode);
  const predecessors = all.filter((n) => n.supersededBy === memory.id);
  const versionChain = [...predecessors, memory].sort((a, b) => a.version - b.version);

  const relations = listRelations({ memoryId: id }).map((e) => ({
    id: e.id,
    from: e.from,
    to: e.to,
    kind: asKind(e.kind),
  }));

  // Best-effort conversation title from content prefix we stored
  let title = "Imported conversation";
  const topic = memory.contentPreview.match(/^Conversation topic:\s*(.+)$/i);
  if (topic) title = topic[1];
  else if (memory.contentPreview.length < 80) title = memory.contentPreview;

  return {
    memory,
    versionChain: versionChain.length ? versionChain : chain,
    relations,
    sourceConversation: {
      title,
      source: memory.source,
      date: memory.validFrom,
    },
  };
}
