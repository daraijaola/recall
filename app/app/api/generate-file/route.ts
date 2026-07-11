import { NextResponse } from "next/server";
import { ensureDbReady } from "@/lib/db";
import { generateProjectFile } from "@/lib/file-generators";
import type { GeneratedFileKind } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const KINDS = new Set<GeneratedFileKind>(["claude_md", "cursorrules", "agents_md"]);

/** GET /api/generate-file?kind=claude_md|cursorrules|agents_md */
export async function GET(req: Request) {
  ensureDbReady();
  const { searchParams } = new URL(req.url);
  const kind = (searchParams.get("kind") ?? "claude_md") as GeneratedFileKind;
  if (!KINDS.has(kind)) {
    return NextResponse.json({ error: "invalid kind" }, { status: 400 });
  }
  return NextResponse.json(generateProjectFile(kind));
}
