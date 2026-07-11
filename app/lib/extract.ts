/**
 * Typed memory structuring layer (BE-PR3).
 * Full AI generateObject path when OPENAI_* is set; falls back to heuristic (PR2).
 *
 * Used by future re-extract jobs; import pipeline already stores heuristic drafts.
 */

import type { MemoryType } from "./types";
import type { ExtractedMemoryDraft, ParsedConversation } from "./importers/types";
import { extractMemoriesHeuristic } from "./importers/extract-heuristic";

export type ExtractOptions = {
  /** Prefer LLM when gateway keys exist */
  useLlm?: boolean;
};

/**
 * Structure conversations into typed memory drafts.
 * LLM path is optional for hackathon speed — enable when gateway is warm.
 */
export async function extractMemories(
  conversations: ParsedConversation[],
  opts: ExtractOptions = {},
): Promise<ExtractedMemoryDraft[]> {
  const wantLlm = opts.useLlm !== false && Boolean(process.env.OPENAI_API_KEY);

  if (wantLlm) {
    try {
      const llm = await extractWithGateway(conversations);
      if (llm.length > 0) return llm;
    } catch (e) {
      console.warn("[extract] LLM path failed, using heuristic:", e);
    }
  }

  return extractMemoriesHeuristic(conversations);
}

/** Minimal OpenAI-compatible chat completion → JSON array of memories (no heavy SDK). */
async function extractWithGateway(
  conversations: ParsedConversation[],
): Promise<ExtractedMemoryDraft[]> {
  const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.OPENAI_MODEL || "gpt-5.4";
  const key = process.env.OPENAI_API_KEY;
  if (!key) return [];

  // Cap payload
  const sample = conversations.slice(0, 8).map((c) => ({
    id: c.id,
    title: c.title,
    source: c.source,
    messages: c.messages.slice(0, 12).map((m) => ({
      role: m.role,
      content: m.content.slice(0, 500),
    })),
  }));

  const system = `You extract durable personal memories from AI chat exports for RECALL.
Return ONLY a JSON array (no markdown). Each item:
{"type":"preference|decision|fact|goal|constraint|project_state|skill|correction|opinion|workflow","content":"short claim","confidence":0.0-1.0,"conversationId":"...","conversationTitle":"...","validFrom":"YYYY-MM-DD"}
Max 20 items. Prefer user statements over assistant. Skip greetings.`;

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(sample) },
      ],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    throw new Error(`gateway ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content ?? "[]";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  const parsed = JSON.parse(jsonMatch[0]) as Array<Record<string, unknown>>;
  const types = new Set<MemoryType>([
    "preference",
    "decision",
    "fact",
    "goal",
    "constraint",
    "project_state",
    "skill",
    "correction",
    "opinion",
    "workflow",
  ]);

  return parsed
    .filter((p) => typeof p.content === "string" && p.content.trim())
    .map((p) => {
      const type = types.has(p.type as MemoryType) ? (p.type as MemoryType) : "fact";
      return {
        type,
        content: String(p.content).slice(0, 280),
        confidence: typeof p.confidence === "number" ? p.confidence : 0.7,
        validFrom: String(p.validFrom || new Date().toISOString().slice(0, 10)).slice(0, 10),
        validUntil: null,
        conversationId: String(p.conversationId || "unknown"),
        conversationTitle: String(p.conversationTitle || "chat"),
      } satisfies ExtractedMemoryDraft;
    });
}
