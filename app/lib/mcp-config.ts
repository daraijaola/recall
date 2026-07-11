/**
 * Platform-accurate MCP config snippets for RECALL.
 *
 * Research (July 2026):
 * - Claude Desktop → claude_desktop_config.json · { mcpServers: { name: { command, args, env } } }
 * - Claude Code    → project .mcp.json or ~/.claude.json · same + optional "type":"stdio"
 * - Cursor         → .cursor/mcp.json or ~/.cursor/mcp.json · { mcpServers: { ... } }
 * - Windsurf       → ~/.codeium/windsurf/mcp_config.json · { mcpServers: { ... } }
 *
 * ChatGPT / Grok / Gemini: no local MCP — use context pack paste (Connect page).
 */

import type { McpConfigResponse, McpTargetId } from "./types";

function envBlock(): Record<string, string> {
  const env: Record<string, string> = {
    RECALL_SM_URL: process.env.RECALL_SM_URL || "http://localhost:6767",
    RECALL_CONTAINER: process.env.RECALL_CONTAINER || "recall_user",
  };
  // Prefer placeholder in copyable config so users paste their own key
  // (Connect UI still works if key is present in env for local demos)
  const key = process.env.RECALL_SM_API_KEY;
  env.RECALL_SM_API_KEY = key && key.length > 8 ? key : "sm_YOUR_LOCAL_KEY";
  if (process.env.RECALL_APP_URL) {
    env.RECALL_APP_URL = process.env.RECALL_APP_URL;
  }
  return env;
}

/** How to launch the local package (works before npm publish). */
function launchEntry() {
  // Prefer local absolute path when known (VM / monorepo), else npx
  const localEntry = process.env.RECALL_MCP_ENTRY;
  if (localEntry) {
    return {
      command: "node",
      args: [localEntry],
      env: envBlock(),
    };
  }
  return {
    command: "npx",
    args: ["-y", "recall-mcp"],
    env: envBlock(),
  };
}

/**
 * Per-platform JSON (all currently use mcpServers; Claude Code may include type:stdio).
 * Comments cannot live in JSON — README documents file paths.
 */
export function buildMcpConfig(target: McpTargetId): McpConfigResponse {
  const entry = launchEntry();

  let payload: Record<string, unknown>;

  if (target === "claude_code") {
    // Claude Code .mcp.json supports type: "stdio" | "http"
    payload = {
      mcpServers: {
        recall: {
          type: "stdio",
          command: entry.command,
          args: entry.args,
          env: entry.env,
        },
      },
    };
  } else {
    // Claude Desktop, Cursor, Windsurf: classic mcpServers shape
    payload = {
      mcpServers: {
        recall: {
          command: entry.command,
          args: entry.args,
          env: entry.env,
        },
      },
    };
  }

  return {
    target,
    config: JSON.stringify(payload, null, 2),
  };
}

/** Human hints for Connect UI / docs (not sent as API body). */
export const MCP_CONFIG_PATHS: Record<McpTargetId, { file: string; note: string }> = {
  claude_desktop: {
    file: "claude_desktop_config.json",
    note: "macOS: ~/Library/Application Support/Claude/ · Windows: %APPDATA%\\Claude\\",
  },
  claude_code: {
    file: ".mcp.json (project) or ~/.claude.json",
    note: "Or: claude mcp add · then restart Claude Code",
  },
  cursor: {
    file: ".cursor/mcp.json or ~/.cursor/mcp.json",
    note: "Cursor Settings → Tools & MCP → New MCP Server",
  },
  windsurf: {
    file: "~/.codeium/windsurf/mcp_config.json",
    note: "Cascade → MCP Servers → Configure",
  },
};
