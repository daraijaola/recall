import { NextResponse } from "next/server";
import { getImportHistory } from "@/lib/import-jobs";
import type { ImportRecord } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/imports — recent import history from SQLite. */
export async function GET() {
  const rows = getImportHistory();
  const imports: ImportRecord[] = rows
    .filter((r) => r.status === "completed" || r.status === "failed")
    .map((r) => ({
      id: r.id,
      source: r.source as ImportRecord["source"],
      fileName: r.fileName,
      convCount: r.convCount,
      memoryCount: r.memoryCount,
      status: r.status === "failed" ? "failed" : "completed",
      createdAt: r.createdAt,
    }));

  return NextResponse.json({ imports });
}
