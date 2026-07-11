import type { Source } from "../types";
import { isChatGptExport, parseChatGptExport } from "./chatgpt";
import { isClaudeExport, parseClaudeExport } from "./claude";
import type { ParsedConversation } from "./types";

export function detectSourceFromFile(fileName: string, hint?: Source | null): Source | null {
  if (hint) return hint;
  const lower = fileName.toLowerCase();
  if (lower.includes("claude") && lower.endsWith(".jsonl")) return "claude_code";
  if (lower.endsWith(".jsonl")) return "claude_code";
  if (lower.includes("cursor")) return "cursor";
  if (lower.includes("grok")) return "grok";
  if (lower.includes("claude")) return "claude";
  if (lower.includes("chatgpt") || lower.includes("conversations")) return null; // sniff content
  if (lower.endsWith(".md") || lower.endsWith(".txt")) return "generic";
  return null;
}

/** Parse export text into normalized conversations. */
export function parseExport(
  raw: string,
  fileName: string,
  sourceHint?: Source | null,
): { conversations: ParsedConversation[]; source: Source } {
  const trimmed = raw.trim();
  const lower = fileName.toLowerCase();

  // JSONL (Claude Code) — one JSON object per line
  if (lower.endsWith(".jsonl") || trimmed.includes("\n{")) {
    const lines = trimmed.split("\n").filter((l) => l.trim());
    const messages = lines
      .map((line) => {
        try {
          return JSON.parse(line) as Record<string, unknown>;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as Record<string, unknown>[];

    const textMessages = messages
      .map((m) => {
        const roleRaw = String(m.role || m.type || "").toLowerCase();
        const content =
          typeof m.message === "string"
            ? m.message
            : typeof m.content === "string"
              ? m.content
              : Array.isArray(m.content)
                ? m.content
                    .map((c) =>
                      typeof c === "string"
                        ? c
                        : c && typeof c === "object" && "text" in c
                          ? String((c as { text: string }).text)
                          : "",
                    )
                    .join("\n")
                : "";
        if (!content.trim()) return null;
        const role =
          roleRaw.includes("user") || roleRaw === "human"
            ? ("user" as const)
            : roleRaw.includes("assistant")
              ? ("assistant" as const)
              : ("other" as const);
        return { role, content: content.trim() };
      })
      .filter(Boolean) as ParsedConversation["messages"];

    if (textMessages.length > 0) {
      return {
        source: sourceHint || "claude_code",
        conversations: [
          {
            id: `jsonl_${Date.now()}`,
            title: fileName,
            source: sourceHint || "claude_code",
            messages: textMessages,
          },
        ],
      };
    }
  }

  // Plain text / markdown
  if (lower.endsWith(".md") || lower.endsWith(".txt") || !trimmed.startsWith("[") && !trimmed.startsWith("{")) {
    if (!trimmed.startsWith("[") && !trimmed.startsWith("{")) {
      return {
        source: sourceHint || "generic",
        conversations: [
          {
            id: `gen_${Date.now()}`,
            title: fileName,
            source: sourceHint || "generic",
            messages: [{ role: "user", content: trimmed.slice(0, 50_000) }],
          },
        ],
      };
    }
  }

  let data: unknown;
  try {
    data = JSON.parse(trimmed);
  } catch {
    throw new Error("Could not parse file as JSON. Use ChatGPT/Claude conversations.json export.");
  }

  // Content sniff
  if (isChatGptExport(data) || sourceHint === "chatgpt") {
    const conversations = parseChatGptExport(trimmed).map((c) => ({
      ...c,
      source: "chatgpt" as const,
    }));
    return { source: "chatgpt", conversations };
  }

  if (isClaudeExport(data) || sourceHint === "claude") {
    const conversations = parseClaudeExport(trimmed).map((c) => ({
      ...c,
      source: "claude" as const,
    }));
    return { source: "claude", conversations };
  }

  // Grok / generic JSON array of messages
  if (Array.isArray(data)) {
    const conversations: ParsedConversation[] = [];
    for (const item of data as Record<string, unknown>[]) {
      if (item.mapping) {
        // late chatgpt detect
        const parsed = parseChatGptExport(trimmed);
        return { source: "chatgpt", conversations: parsed };
      }
      if (item.chat_messages) {
        const parsed = parseClaudeExport(trimmed);
        return { source: "claude", conversations: parsed };
      }
    }
  }

  throw new Error(
    "Unrecognized export format. Supported: ChatGPT conversations.json, Claude conversations.json, .jsonl, .md/.txt",
  );
}
