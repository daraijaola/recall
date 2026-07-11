import { NextResponse } from "next/server";
import { ensureDbReady } from "@/lib/db";
import { probeSm } from "@/lib/supermemory";
import type { HealthResponse } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const dbReady = ensureDbReady();
  const sm = await probeSm();

  const body: HealthResponse = {
    smConnected: sm.smConnected,
    dbReady,
    memoryCount: sm.memoryCount,
  };

  return NextResponse.json(body);
}
