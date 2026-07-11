/**
 * Context pack builder — active memories only, type-priority ranking.
 * Compact target ~1500 chars (custom-instructions friendly).
 * No third-party product names in output — RECALL + Supermemory Local only.
 */

import { listAllMemories } from "./db";
import { rowToNode } from "./graph/queries";
import type { ContextPackResponse, ContextPackVariant, MemoryNode, MemoryType } from "./types";

const COMPACT_LIMIT = 1500;

/** PDF priority: constraints > preferences > project_state > facts (+ decisions high) */
const TYPE_PRIORITY: Record<MemoryType, number> = {
  constraint: 100,
  decision: 90,
  preference: 85,
  project_state: 80,
  goal: 75,
  workflow: 70,
  skill: 65,
  correction: 60,
  fact: 55,
  opinion: 40,
};

const SECTION_ORDER: Array<{ key: MemoryType | MemoryType[]; title: string }> = [
  { key: "constraint", title: "Constraints" },
  { key: ["preference", "decision"], title: "Preferences & decisions" },
  { key: "project_state", title: "Project" },
  { key: ["goal"], title: "Goals" },
  { key: ["workflow", "skill"], title: "Skills & workflow" },
  { key: ["fact", "correction", "opinion"], title: "Other" },
];

function activeMemories(): MemoryNode[] {
  return listAllMemories()
    .map(rowToNode)
    .filter((m) => !m.supersededBy)
    .filter((m) => {
      if (!m.validUntil) return true;
      return m.validUntil >= new Date().toISOString().slice(0, 10);
    })
    .sort((a, b) => {
      const p = (TYPE_PRIORITY[b.type] ?? 0) - (TYPE_PRIORITY[a.type] ?? 0);
      if (p !== 0) return p;
      return b.confidence - a.confidence || b.validFrom.localeCompare(a.validFrom);
    });
}

function cleanLine(text: string): string {
  return text
    .replace(/^Conversation topic:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function bullet(text: string, max = 160): string {
  let t = cleanLine(text);
  if (t.length > max) t = `${t.slice(0, max - 1)}…`;
  return `- ${t}`;
}

function buildSections(memories: MemoryNode[], maxChars: number | null): string {
  const used = new Set<string>();
  const parts: string[] = [];

  for (const section of SECTION_ORDER) {
    const keys = Array.isArray(section.key) ? section.key : [section.key];
    const items = memories.filter((m) => keys.includes(m.type) && !used.has(m.id));
    if (items.length === 0) continue;

    const blockLines = [`## ${section.title}`];
    for (const m of items) {
      const line = bullet(m.contentPreview);
      const candidate = [...parts, blockLines.concat(line).join("\n")].join("\n\n");
      if (maxChars && candidate.length > maxChars) {
        // try shorter line
        const short = bullet(m.contentPreview, 100);
        const cand2 = [...parts, blockLines.concat(short).join("\n")].join("\n\n");
        if (maxChars && cand2.length > maxChars) break;
        blockLines.push(short);
        used.add(m.id);
        break;
      }
      blockLines.push(line);
      used.add(m.id);
    }

    if (blockLines.length > 1) {
      parts.push(blockLines.join("\n"));
    }

    if (maxChars && parts.join("\n\n").length >= maxChars - 40) break;
  }

  return parts.join("\n\n").trim();
}

export function buildContextPack(variant: ContextPackVariant = "compact"): ContextPackResponse {
  const memories = activeMemories();
  const isCompact = variant === "compact";
  const body = buildSections(memories, isCompact ? COMPACT_LIMIT - 80 : null);

  let content: string;
  if (!body) {
    content = isCompact
      ? `## RECALL\n- No active memories yet. Import a ChatGPT or Claude export to fill this pack.`
      : `# RECALL — Your portable memory\n\nNo active memories yet.\n\nImport history from Connect → Import, then regenerate this pack.`;
  } else if (isCompact) {
    content = body;
    if (content.length > COMPACT_LIMIT) {
      content = `${content.slice(0, COMPACT_LIMIT - 1)}…`;
    }
  } else {
    content = [
      `# RECALL — Your portable memory`,
      ``,
      body,
      ``,
      `---`,
      `Generated from ${memories.length} active memories · container: ${process.env.RECALL_CONTAINER || "recall_user"} · active only`,
    ].join("\n");
  }

  return {
    variant,
    content,
    charCount: content.length,
    limit: isCompact ? COMPACT_LIMIT : undefined,
  };
}
