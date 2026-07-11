import { NextResponse } from "next/server";
import { resolveContradictionCard } from "@/lib/contradictions";
import type { ConflictResolution } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const RESOLUTIONS = new Set<ConflictResolution>(["keep_new", "keep_old", "keep_both"]);

/**
 * POST /api/contradictions/:id/resolve
 * Body: { resolution: "keep_new" | "keep_old" | "keep_both" }
 * Also accepts PDF alias { action: "accept_new" | ... } mapped to resolution.
 */
export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  let body: { resolution?: string; action?: string } = {};
  try {
    body = (await req.json()) as { resolution?: string; action?: string };
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  let resolution = body.resolution as ConflictResolution | undefined;
  if (!resolution && body.action) {
    // PDF 5.3 uses action names — map to FE contract
    const map: Record<string, ConflictResolution> = {
      accept_new: "keep_new",
      accept_old: "keep_old",
      keep_both: "keep_both",
      keep_new: "keep_new",
      keep_old: "keep_old",
    };
    resolution = map[body.action];
  }

  if (!resolution || !RESOLUTIONS.has(resolution)) {
    return NextResponse.json(
      { error: "resolution must be keep_new | keep_old | keep_both" },
      { status: 400 },
    );
  }

  const card = resolveContradictionCard(id, resolution);
  if (!card) {
    return NextResponse.json({ error: "not found or already resolved" }, { status: 404 });
  }
  return NextResponse.json(card);
}
