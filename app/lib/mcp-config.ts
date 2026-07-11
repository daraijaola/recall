/**
 * MCP config snippets for Claude Desktop / Code, Cursor, Windsurf.
 * Points at local recall-mcp (BE-PR6 package) + Supermemory Local env.
 */

import type { McpConfigResponse, McpTargetId } from "./types";

function envBlock() {
  return {
    RECALL_SM_URL: process.env.RECALL_SM_URL || "http://localhost:6767",
    RECALL_CONTAINER: process.env.RECALL_CONTAINER || "recall_user",
    ...(process.env.RECALL_SM_API_KEY
      ? { RECALL_SM_API_KEY: process.env.RECALL_SM_API_KEY }
      : {}),
  };
}

function serverEntry() {
  return {
    command: "npx",
    args: ["-y", "recall-mcp"],
    env: envBlock(),
  };
}

export function buildMcpConfig(target: McpTargetId): McpConfigResponse {
  // All targets currently use the same stdio shape wrapped as mcpServers.recall
  const config = JSON.stringify({ mcpServers: { recall: serverEntry() } }, null, 2);
  return { target, config };
}
