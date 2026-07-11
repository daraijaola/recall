import { NextResponse } from "next/server";
import { startImportJob } from "@/lib/import-jobs";
import type { Source } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const SOURCES = new Set<Source>([
  "chatgpt",
  "claude",
  "grok",
  "claude_code",
  "cursor",
  "generic",
]);

function parseSource(v: FormDataEntryValue | null): Source | null {
  if (typeof v !== "string" || !v) return null;
  return SOURCES.has(v as Source) ? (v as Source) : null;
}

/** POST /api/import — multipart file + optional source → { importId } */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }

    const sourceHint = parseSource(form.get("source"));
    const fileName = file.name || "export.json";
    const raw = await file.text();

    if (!raw.trim()) {
      return NextResponse.json({ error: "empty file" }, { status: 400 });
    }

    // Soft cap ~25MB text for hackathon VM
    if (raw.length > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large (max ~25MB). Try a smaller export or recent slice." },
        { status: 413 },
      );
    }

    const { importId } = await startImportJob({
      fileName,
      raw,
      sourceHint,
    });

    return NextResponse.json({ importId });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "import failed" },
      { status: 500 },
    );
  }
}
