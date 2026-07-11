import { NextResponse } from "next/server";
import { ensureDbReady } from "@/lib/db";
import { searchMemoriesUnified } from "@/lib/search";
import type { MemoryType, Source } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SOURCES = new Set<Source>([
  "chatgpt",
  "claude",
  "grok",
  "claude_code",
  "cursor",
  "generic",
]);

const TYPES = new Set<MemoryType>([
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
]);

/** GET /api/search?q=&type=&source= */
export async function GET(req: Request) {
  ensureDbReady();
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? searchParams.get("query") ?? "").trim();
  const sourceRaw = searchParams.get("source") ?? "all";
  const typeRaw = searchParams.get("type") ?? "all";

  const source =
    sourceRaw === "all" || SOURCES.has(sourceRaw as Source)
      ? (sourceRaw as Source | "all")
      : "all";
  const type =
    typeRaw === "all" || TYPES.has(typeRaw as MemoryType)
      ? (typeRaw as MemoryType | "all")
      : "all";

  const result = await searchMemoriesUnified(q, { source, type });
  return NextResponse.json(result);
}
