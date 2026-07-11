import { NextResponse } from "next/server";
import { ensureDbReady } from "@/lib/db";
import { buildStats } from "@/lib/graph/queries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/stats */
export async function GET() {
  ensureDbReady();
  return NextResponse.json(buildStats());
}
