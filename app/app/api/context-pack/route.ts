import { NextResponse } from "next/server";
import { ensureDbReady } from "@/lib/db";
import { buildContextPack } from "@/lib/context-pack";
import type { ContextPackVariant } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/context-pack?variant=compact|full */
export async function GET(req: Request) {
  ensureDbReady();
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("variant") ?? "compact";
  const variant: ContextPackVariant = raw === "full" ? "full" : "compact";
  return NextResponse.json(buildContextPack(variant));
}
