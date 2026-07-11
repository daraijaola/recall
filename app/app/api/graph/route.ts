import { NextResponse } from "next/server";
import { ensureDbReady } from "@/lib/db";
import { buildGraph } from "@/lib/graph/queries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/graph?type=&source=&includeSuperseded= */
export async function GET(req: Request) {
  ensureDbReady();
  const { searchParams } = new URL(req.url);
  const graph = buildGraph({
    type: searchParams.get("type") ?? undefined,
    source: searchParams.get("source") ?? undefined,
    includeSuperseded: searchParams.get("includeSuperseded") === "true",
  });
  return NextResponse.json(graph);
}
