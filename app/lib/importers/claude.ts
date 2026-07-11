/**
 * Claude official export: conversations.json
 * Flat chat_messages[] per conversation (uuid, name, sender, text).
 */

import type { ParsedConversation, ParsedMessage } from "./types";

type ClaudeMessage = {
  uuid?: string;
  sender?: string;
  text?: string;
  content?: Array<{ type?: string; text?: string }>;
  created_at?: string;
  updated_at?: string;
};

type ClaudeConversation = {
  uuid?: string;
  name?: string;
  created_at?: string;
  updated_at?: string;
  chat_messages?: ClaudeMessage[];
};

function roleOf(sender?: string): ParsedMessage["role"] {
  const s = (sender || "").toLowerCase();
  if (s === "human" || s === "user") return "user";
  if (s === "assistant" || s === "claude") return "assistant";
  if (s === "system") return "system";
  return "other";
}

function messageText(m: ClaudeMessage): string {
  if (m.text && m.text.trim()) return m.text.trim();
  if (Array.isArray(m.content)) {
    return m.content
      .map((c) => (typeof c?.text === "string" ? c.text : ""))
      .filter(Boolean)
      .join("\n")
      .trim();
  }
  return "";
}

export function isClaudeExport(data: unknown): boolean {
  if (!Array.isArray(data) || data.length === 0) return false;
  const first = data[0] as ClaudeConversation;
  return Boolean(
    first &&
      typeof first === "object" &&
      (Array.isArray(first.chat_messages) ||
        (typeof first.uuid === "string" && typeof first.name === "string")),
  );
}

export function parseClaudeExport(raw: string): ParsedConversation[] {
  const data = JSON.parse(raw) as unknown;
  if (!Array.isArray(data)) {
    throw new Error("Claude export must be a JSON array of conversations");
  }

  const out: ParsedConversation[] = [];
  for (const item of data as ClaudeConversation[]) {
    const messages: ParsedMessage[] = [];
    for (const m of item.chat_messages ?? []) {
      const content = messageText(m);
      if (!content) continue;
      messages.push({
        role: roleOf(m.sender),
        content,
        createdAt: m.created_at,
      });
    }
    if (messages.length === 0) continue;
    out.push({
      id: String(item.uuid || `cl_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`),
      title: (item.name || "Untitled chat").trim() || "Untitled chat",
      source: "claude",
      messages,
      createdAt: item.created_at,
    });
  }
  return out;
}
