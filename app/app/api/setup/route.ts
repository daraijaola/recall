import { NextResponse } from "next/server";
import { ensureDbReady, getDbPath } from "@/lib/db";
import {
  getSmConfig,
  maskApiKey,
  persistSmApiKey,
  probeSm,
} from "@/lib/supermemory";
import type { SetupStatusResponse } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function formatUptime(ms: number): string {
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  const rem = min % 60;
  return rem ? `${hr}h ${rem}m` : `${hr}h`;
}

function buildSetupStatus(
  smConnected: boolean,
  memoryCount: number,
): SetupStatusResponse {
  const config = getSmConfig();
  const dbReady = ensureDbReady();
  void dbReady;

  return {
    connected: smConnected,
    url: config.url,
    container: config.container,
    databasePath: getDbPath(),
    apiKey: config.apiKey,
    apiKeyMasked: maskApiKey(config.apiKey),
    version: "local",
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
    memoryCount,
    uptime: smConnected ? formatUptime(process.uptime() * 1000) : "—",
  };
}

/** GET /api/setup — live SM + SQLite status for Setup page. */
export async function GET() {
  const sm = await probeSm();
  const body = buildSetupStatus(sm.smConnected, sm.memoryCount);
  return NextResponse.json(body);
}

/** POST /api/setup — persist API key `{ apiKey }` → `{ ok }`. */
export async function POST(req: Request) {
  try {
    const json = (await req.json()) as { apiKey?: string };
    const apiKey = (json.apiKey ?? "").trim();
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "apiKey required" }, { status: 400 });
    }

    // Ensure DB exists before writing settings
    ensureDbReady();
    persistSmApiKey(apiKey);

    // Optional: also reflect in process env for this worker
    process.env.RECALL_SM_API_KEY = apiKey;

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "setup failed" },
      { status: 500 },
    );
  }
}
