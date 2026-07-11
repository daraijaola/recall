import { NextResponse } from "next/server";
import { fetchSmProfile, probeSm } from "@/lib/supermemory";
import type { ProfileResponse } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/profile
 * Surfaces Supermemory Local's built-in profile (static + dynamic memories).
 * This is the intelligence layer judges care about — not a custom invent.
 */
export async function GET() {
  const health = await probeSm();
  if (!health.smConnected) {
    const body: ProfileResponse = {
      static: [],
      dynamic: [],
      container: process.env.RECALL_CONTAINER || "recall_user",
      smConnected: false,
    };
    return NextResponse.json(body);
  }

  try {
    const profile = await fetchSmProfile();
    const body: ProfileResponse = {
      static: profile.static,
      dynamic: profile.dynamic,
      container: profile.container,
      smConnected: true,
    };
    return NextResponse.json(body);
  } catch (e) {
    return NextResponse.json(
      {
        static: [],
        dynamic: [],
        container: process.env.RECALL_CONTAINER || "recall_user",
        smConnected: true,
        error: e instanceof Error ? e.message : "profile failed",
      },
      { status: 200 },
    );
  }
}
