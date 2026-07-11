import { NextResponse } from "next/server";
import { listContradictionCards } from "@/lib/contradictions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/contradictions?status=open|resolved|all */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status") ?? "all";
  const status =
    statusParam === "open" || statusParam === "resolved" || statusParam === "all"
      ? statusParam
      : "all";

  const cards = listContradictionCards({ status });
  // FE expects a bare array (fetchAllContradictions / fetchContradictions)
  return NextResponse.json(cards);
}
