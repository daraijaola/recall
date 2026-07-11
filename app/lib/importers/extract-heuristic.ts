/**
 * Lightweight memory extraction for BE-PR2.
 * Full AI generateObject extraction lands in BE-PR3 — this gets real data into SM+graph now.
 */

import type { MemoryType } from "../types";
import type { ExtractedMemoryDraft, ParsedConversation } from "./types";

const PATTERNS: Array<{ type: MemoryType; re: RegExp; confidence: number }> = [
  {
    type: "preference",
    re: /\b(i (prefer|like|love|hate|always use|never use|usually)|prefer(s|red)?|my (favorite|preferred))\b/i,
    confidence: 0.78,
  },
  {
    type: "decision",
    re: /\b(we('ll| will)? (go with|use|switch to|migrate)|decided to|decision:|all[- ]in on|choosing)\b/i,
    confidence: 0.82,
  },
  {
    type: "constraint",
    re: /\b(deadline|must|cannot|can't|should not|required to|by friday|ship by|due )\b/i,
    confidence: 0.8,
  },
  {
    type: "goal",
    re: /\b(goal is|i want to|we need to|planning to|aim to|ship .+ by)\b/i,
    confidence: 0.75,
  },
  {
    type: "workflow",
    re: /\b(always run|before every|workflow|checklist|make sure to|remember to)\b/i,
    confidence: 0.74,
  },
  {
    type: "skill",
    re: /\b(i('m| am) (experienced|good|familiar|comfortable) with|expert in|years of)\b/i,
    confidence: 0.72,
  },
  {
    type: "correction",
    re: /\b(actually|not .+ but|correction:|wrong[, ]|it's .+ not|path is)\b/i,
    confidence: 0.76,
  },
  {
    type: "project_state",
    re: /\b(building|working on|currently|project is|we're building|hackathon)\b/i,
    confidence: 0.7,
  },
  {
    type: "opinion",
    re: /\b(i think|in my opinion|imo\b|feels like|better than)\b/i,
    confidence: 0.68,
  },
  {
    type: "fact",
    re: /\b(my name is|i live|i work|email is|timezone|stack is)\b/i,
    confidence: 0.77,
  },
];

function clip(s: string, max = 280): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function classify(text: string): { type: MemoryType; confidence: number } | null {
  for (const p of PATTERNS) {
    if (p.re.test(text)) return { type: p.type, confidence: p.confidence };
  }
  // Keep substantial first-person statements as facts
  if (/\bi\b/i.test(text) && text.length >= 40 && text.length <= 400) {
    return { type: "fact", confidence: 0.55 };
  }
  return null;
}

const MAX_CONVOS = 40;
const MAX_MEMORIES_PER_CONV = 6;
const MAX_TOTAL_MEMORIES = 120;

export function extractMemoriesHeuristic(
  conversations: ParsedConversation[],
): ExtractedMemoryDraft[] {
  const drafts: ExtractedMemoryDraft[] = [];
  const slice = conversations.slice(0, MAX_CONVOS);

  for (const conv of slice) {
    if (drafts.length >= MAX_TOTAL_MEMORIES) break;
    let perConv = 0;
    const validFrom = (conv.createdAt || new Date().toISOString()).slice(0, 10);

    // Title as project_state if meaningful
    if (conv.title && conv.title !== "Untitled chat" && perConv < MAX_MEMORIES_PER_CONV) {
      drafts.push({
        type: "project_state",
        content: `Conversation topic: ${clip(conv.title, 120)}`,
        confidence: 0.6,
        validFrom,
        validUntil: null,
        conversationId: conv.id,
        conversationTitle: conv.title,
      });
      perConv += 1;
    }

    for (const msg of conv.messages) {
      if (drafts.length >= MAX_TOTAL_MEMORIES || perConv >= MAX_MEMORIES_PER_CONV) break;
      if (msg.role !== "user") continue;
      const text = msg.content.trim();
      if (text.length < 24 || text.length > 2000) continue;

      // Split on newlines / bullets for multi-preference dumps
      const chunks = text
        .split(/\n+/)
        .map((c) => c.replace(/^[-*•]\s*/, "").trim())
        .filter((c) => c.length >= 24);

      for (const chunk of chunks.length ? chunks : [text]) {
        if (drafts.length >= MAX_TOTAL_MEMORIES || perConv >= MAX_MEMORIES_PER_CONV) break;
        const hit = classify(chunk);
        if (!hit) continue;
        drafts.push({
          type: hit.type,
          content: clip(chunk),
          confidence: hit.confidence,
          validFrom: (msg.createdAt || validFrom).slice(0, 10),
          validUntil: null,
          conversationId: conv.id,
          conversationTitle: conv.title,
        });
        perConv += 1;
      }
    }
  }

  return drafts;
}
