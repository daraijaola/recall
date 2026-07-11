import { NextResponse } from "next/server";
import { getImportProgress } from "@/lib/import-jobs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/import/:id/progress — polled by Import page (JSON; SSE later if needed). */
export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const progress = getImportProgress(id);
  if (!progress) {
    return NextResponse.json({ error: "import not found" }, { status: 404 });
  }
  return NextResponse.json(progress);
}
