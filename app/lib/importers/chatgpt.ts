/**
 * ChatGPT official export: conversations.json
 * Tree-structured mapping nodes → flatten via parent chain from current_node.
 */

import type { ParsedConversation, ParsedMessage } from "./types";

type MappingNode = {
  id?: string;
  parent?: string | null;
  message?: {
    id?: string;
    author?: { role?: string };
    content?: { content_type?: string; parts?: unknown[] };
    create_time?: number | null;
  } | null;
};

type ChatGptConversation = {
  id?: string;
  conversation_id?: string;
  title?: string;
  create_time?: number;
  update_time?: number;
  current_node?: string;
  mapping?: Record<string, MappingNode>;
};

function roleOf(raw?: string): ParsedMessage["role"] {
  if (raw === "user") return "user";
  if (raw === "assistant") return "assistant";
  if (raw === "system" || raw === "tool") return "system";
  return "other";
}

function partsToText(parts: unknown[] | undefined): string {
  if (!parts?.length) return "";
  return parts
    .map((p) => {
      if (typeof p === "string") return p;
      if (p && typeof p === "object" && "text" in p) {
        return String((p as { text?: string }).text ?? "");
      }
      return "";
    })
    .filter(Boolean)
    .join("\n")
    .trim();
}

function flattenConversation(conv: ChatGptConversation): ParsedMessage[] {
  const mapping = conv.mapping ?? {};
  const messages: ParsedMessage[] = [];
  let nodeId: string | null | undefined = conv.current_node;

  // Walk parent chain from leaf → root, then reverse
  const chain: ParsedMessage[] = [];
  const seen = new Set<string>();
  while (nodeId && !seen.has(nodeId)) {
    seen.add(nodeId);
    const node: MappingNode | undefined = mapping[nodeId];
    if (!node) break;
    const msg = node.message;
    if (msg?.content?.parts) {
      const text = partsToText(msg.content.parts);
      if (text) {
        chain.push({
          role: roleOf(msg.author?.role),
          content: text,
          createdAt: msg.create_time
            ? new Date(msg.create_time * 1000).toISOString()
            : undefined,
        });
      }
    }
    nodeId = node.parent ?? null;
  }
  chain.reverse();
  return chain;
}

export function isChatGptExport(data: unknown): boolean {
  if (!Array.isArray(data) || data.length === 0) return false;
  const first = data[0] as ChatGptConversation;
  return Boolean(first && typeof first === "object" && first.mapping);
}

export function parseChatGptExport(raw: string): ParsedConversation[] {
  const data = JSON.parse(raw) as unknown;
  if (!Array.isArray(data)) {
    throw new Error("ChatGPT export must be a JSON array of conversations");
  }

  const out: ParsedConversation[] = [];
  for (const item of data as ChatGptConversation[]) {
    const id = item.id || item.conversation_id || cryptoRandomId();
    const messages = flattenConversation(item);
    if (messages.length === 0) continue;
    out.push({
      id: String(id),
      title: (item.title || "Untitled chat").trim() || "Untitled chat",
      source: "chatgpt",
      messages,
      createdAt: item.create_time
        ? new Date(item.create_time * 1000).toISOString()
        : undefined,
    });
  }
  return out;
}

function cryptoRandomId(): string {
  return `cg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
