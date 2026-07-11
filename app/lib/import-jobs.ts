/**
 * In-memory import job progress + async pipeline runner.
 * FE polls GET /api/import/:id/progress every ~400ms.
 */

import { randomUUID } from "node:crypto";
import type { ImportProgress, ImportRecord, Source } from "./types";
import { parseExport } from "./importers/detect";
import { extractMemoriesHeuristic } from "./importers/extract-heuristic";
import { addDocument } from "./supermemory";
import {
  ensureDbReady,
  insertImport,
  insertMemory,
  insertRelation,
  listImports,
  updateImport,
} from "./db";

type JobState = ImportProgress & {
  errorDetail?: string;
};

const jobs = new Map<string, JobState>();

function setJob(id: string, patch: Partial<JobState> & Pick<JobState, "importId" | "stage" | "percent" | "message" | "fileName" | "source">) {
  const prev = jobs.get(id);
  const next: JobState = {
    importId: patch.importId,
    stage: patch.stage,
    percent: patch.percent,
    message: patch.message,
    fileName: patch.fileName,
    source: patch.source,
    convCount: patch.convCount ?? prev?.convCount,
    memoryCount: patch.memoryCount ?? prev?.memoryCount,
    errorDetail: patch.errorDetail ?? prev?.errorDetail,
  };
  jobs.set(id, next);
  return next;
}

export function getImportProgress(importId: string): ImportProgress | null {
  const j = jobs.get(importId);
  if (!j) return null;
  const { errorDetail: _, ...rest } = j;
  return rest;
}

export function getImportHistory(): ImportRecord[] {
  ensureDbReady();
  return listImports().map((r) => ({
    id: r.id,
    source: r.source as Source,
    fileName: r.fileName,
    convCount: r.convCount,
    memoryCount: r.memoryCount,
    status: r.status === "failed" ? ("failed" as const) : ("completed" as const),
    createdAt: r.createdAt,
  }));
}

export async function startImportJob(input: {
  fileName: string;
  raw: string;
  sourceHint?: Source | null;
}): Promise<{ importId: string }> {
  ensureDbReady();
  const importId = `imp_${randomUUID().slice(0, 8)}_${Date.now().toString(36)}`;
  const sourceGuess = input.sourceHint || "chatgpt";

  setJob(importId, {
    importId,
    stage: "parsing",
    percent: 5,
    message: "Reading conversations from your export…",
    fileName: input.fileName,
    source: sourceGuess,
  });

  insertImport({
    id: importId,
    source: sourceGuess,
    fileName: input.fileName,
    convCount: 0,
    memoryCount: 0,
    status: "running",
    createdAt: new Date().toISOString(),
  });

  // Fire-and-forget pipeline
  void runPipeline(importId, input.fileName, input.raw, input.sourceHint);

  return { importId };
}

async function runPipeline(
  importId: string,
  fileName: string,
  raw: string,
  sourceHint?: Source | null,
): Promise<void> {
  try {
    setJob(importId, {
      importId,
      stage: "parsing",
      percent: 15,
      message: "Parsing export format…",
      fileName,
      source: sourceHint || "chatgpt",
    });

    const { conversations, source } = parseExport(raw, fileName, sourceHint);

    setJob(importId, {
      importId,
      stage: "parsing",
      percent: 30,
      message: `Found ${conversations.length} conversations…`,
      fileName,
      source,
      convCount: conversations.length,
    });

    // —— Extract ——
    setJob(importId, {
      importId,
      stage: "extracting",
      percent: 40,
      message: "Extracting preferences, decisions, and facts…",
      fileName,
      source,
      convCount: conversations.length,
    });

    const drafts = extractMemoriesHeuristic(conversations);

    setJob(importId, {
      importId,
      stage: "extracting",
      percent: 55,
      message: `Extracted ${drafts.length} candidate memories…`,
      fileName,
      source,
      convCount: conversations.length,
      memoryCount: drafts.length,
    });

    // —— Store to SM + graph ——
    const memoryIds: string[] = [];
    let stored = 0;
    const total = Math.max(drafts.length, 1);

    for (let i = 0; i < drafts.length; i++) {
      const d = drafts[i];
      const memId = `m_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
      const customId = `recall_${source}_${d.conversationId}_${i}`;

      let smDocId = customId;
      try {
        const sm = await addDocument({
          content: d.content,
          customId,
          metadata: {
            type: d.type,
            source,
            validFrom: d.validFrom,
            confidence: d.confidence,
            convTitle: d.conversationTitle.slice(0, 80),
            recallMemoryId: memId,
          },
        });
        smDocId = sm.id || customId;
      } catch (e) {
        // Continue graph write even if SM flaky for one doc
        console.error("[import] SM add failed", e);
      }

      insertMemory({
        id: memId,
        smDocId,
        type: d.type,
        source,
        contentPreview: d.content,
        confidence: d.confidence,
        validFrom: d.validFrom,
        validUntil: d.validUntil,
        supersededBy: null,
        version: 1,
        createdAt: new Date().toISOString(),
      });
      memoryIds.push(memId);
      stored += 1;

      if (i % 3 === 0 || i === drafts.length - 1) {
        const pct = 55 + Math.floor(((i + 1) / total) * 20);
        setJob(importId, {
          importId,
          stage: "extracting",
          percent: Math.min(74, pct),
          message: `Storing memories… ${stored}/${drafts.length}`,
          fileName,
          source,
          convCount: conversations.length,
          memoryCount: stored,
        });
      }
    }

    // Also index raw conversations (dedup by customId) for full-text SM search later
    const convCap = conversations.slice(0, 20);
    for (const conv of convCap) {
      const body = conv.messages
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n\n")
        .slice(0, 12_000);
      if (!body.trim()) continue;
      try {
        await addDocument({
          content: `# ${conv.title}\n\n${body}`,
          customId: `recall_conv_${source}_${conv.id}`.slice(0, 100),
          metadata: {
            type: "conversation",
            source,
            convTitle: conv.title.slice(0, 80),
            importedAt: new Date().toISOString().slice(0, 10),
          },
        });
      } catch {
        /* ignore conv store errors */
      }
    }

    // —— Relate (light) ——
    setJob(importId, {
      importId,
      stage: "relating",
      percent: 80,
      message: "Linking memories and checking for conflicts…",
      fileName,
      source,
      convCount: conversations.length,
      memoryCount: stored,
    });

    // Chain supports edges within same import for sequential drafts
    for (let i = 1; i < memoryIds.length; i++) {
      if (i > 30) break; // cap edges
      insertRelation({
        id: `e_${randomUUID().slice(0, 10)}`,
        from: memoryIds[i - 1],
        to: memoryIds[i],
        kind: "supports",
      });
    }

    // Simple cross keyword contradiction hint (Python vs TypeScript) for demo prep
    const lower = drafts.map((d, idx) => ({ t: d.content.toLowerCase(), id: memoryIds[idx] }));
    const py = lower.find((x) => /\bpython\b/.test(x.t) && /\b(prefer|use|backend|stack)\b/.test(x.t));
    const ts = lower.find((x) => /\btypescript\b|\bts\b/.test(x.t) && /\b(prefer|use|backend|stack|all-?in)\b/.test(x.t));
    if (py && ts && py.id && ts.id && py.id !== ts.id) {
      insertRelation({
        id: `e_contra_${randomUUID().slice(0, 8)}`,
        from: py.id,
        to: ts.id,
        kind: "contradicts",
      });
    }

    setJob(importId, {
      importId,
      stage: "done",
      percent: 100,
      message: `${stored} new memories added`,
      fileName,
      source,
      convCount: conversations.length,
      memoryCount: stored,
    });

    updateImport(importId, {
      source,
      convCount: conversations.length,
      memoryCount: stored,
      status: "completed",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Import failed";
    setJob(importId, {
      importId,
      stage: "error",
      percent: 100,
      message,
      fileName,
      source: sourceHint || "chatgpt",
      errorDetail: message,
    });
    updateImport(importId, { status: "failed" });
  }
}
