import { NextResponse } from "next/server";
import { ensureDbReady } from "@/lib/db";
import { buildMemoryDetail } from "@/lib/graph/queries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/memories/:id */
export async function GET(_req: Request, ctx: Ctx) {
  ensureDbReady();
  const { id } = await ctx.params;
  const detail = buildMemoryDetail(id);
  if (!detail) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(detail);
}
