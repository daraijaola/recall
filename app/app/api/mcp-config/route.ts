import { NextResponse } from "next/server";
import { buildMcpConfig } from "@/lib/mcp-config";
import type { McpTargetId } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TARGETS = new Set<McpTargetId>([
  "claude_desktop",
  "claude_code",
  "cursor",
  "windsurf",
]);

/** GET /api/mcp-config?target=claude_desktop|claude_code|cursor|windsurf */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const target = (searchParams.get("target") ?? "claude_desktop") as McpTargetId;
  if (!TARGETS.has(target)) {
    return NextResponse.json({ error: "invalid target" }, { status: 400 });
  }
  return NextResponse.json(buildMcpConfig(target));
}
