/**
 * Relation helpers for graph edges.
 * Full SM-search + LLM classify lands deeper in PR3/PR4; import already writes supports/contradicts.
 */

import { listRelations, type RelationRow } from "./db";
import type { RelationKind } from "./types";

export function relationsForMemory(memoryId: string): RelationRow[] {
  return listRelations({ memoryId });
}

export function contradictPairs(): Array<{ from: string; to: string; id: string }> {
  return listRelations()
    .filter((r) => r.kind === "contradicts")
    .map((r) => ({ id: r.id, from: r.from, to: r.to }));
}

export function isRelationKind(k: string): k is RelationKind {
  return k === "updates" || k === "contradicts" || k === "supports" || k === "extends";
}
