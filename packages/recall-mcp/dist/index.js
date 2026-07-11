#!/usr/bin/env node
/**
 * RECALL MCP server — stdio transport.
 * Tools: recall_search, recall_context, recall_remember, recall_forget
 *
 * Env:
 *   RECALL_SM_URL          default http://localhost:6767
 *   RECALL_SM_API_KEY      Supermemory Local API key
 *   RECALL_CONTAINER       default recall_user
 *   RECALL_APP_URL         optional Next app base for context-pack
 *                          e.g. http://127.0.0.1:3020/sites/recall/app
 *
 * Does not modify the Next.js app process — safe additive package.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { buildContext, loadConfig, smAdd, smDelete, smSearch } from "./sm.js";
const server = new McpServer({
    name: "recall-mcp",
    version: "0.1.0",
});
function textResult(text) {
    return {
        content: [{ type: "text", text }],
    };
}
function errResult(e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
        content: [{ type: "text", text: `Error: ${msg}` }],
        isError: true,
    };
}
server.tool("recall_search", "Search the user's portable RECALL memory (Supermemory Local hybrid search). Use before answering questions about the user's preferences, projects, or past decisions.", {
    query: z.string().describe("Natural language search query"),
    limit: z.number().int().min(1).max(30).optional().describe("Max hits (default 8)"),
}, async ({ query, limit }) => {
    try {
        const hits = await smSearch(query, limit ?? 8);
        if (hits.length === 0) {
            return textResult(`No memories matched “${query}”.`);
        }
        const lines = hits.map((h, i) => {
            const meta = [h.source, h.type, h.score ? `score=${h.score.toFixed(2)}` : ""]
                .filter(Boolean)
                .join(" · ");
            return `${i + 1}. ${h.text}${meta ? `\n   (${meta})` : ""}${h.id ? `\n   id: ${h.id}` : ""}`;
        });
        return textResult(`RECALL search · ${hits.length} hit(s) for “${query}”\n\n${lines.join("\n\n")}`);
    }
    catch (e) {
        return errResult(e);
    }
});
server.tool("recall_context", "Get a packed context brief from RECALL (active preferences, decisions, constraints, project state). Call this when the user asks what they are working on or what you should know about them.", {
    query: z
        .string()
        .optional()
        .describe("Optional focus query (e.g. 'current project', 'backend stack')"),
}, async ({ query }) => {
    try {
        const ctx = await buildContext(query);
        return textResult(ctx);
    }
    catch (e) {
        return errResult(e);
    }
});
server.tool("recall_remember", "Store a durable fact, preference, or decision into RECALL / Supermemory Local.", {
    content: z.string().describe("The memory text to store"),
    customId: z
        .string()
        .optional()
        .describe("Optional stable id for dedup on re-save"),
}, async ({ content, customId }) => {
    try {
        const text = content.trim();
        if (!text)
            return errResult(new Error("content is empty"));
        const result = await smAdd(text, customId);
        return textResult(`Remembered.\nid: ${result.id}\nstatus: ${result.status}\n\n${text}`);
    }
    catch (e) {
        return errResult(e);
    }
});
server.tool("recall_forget", "Remove a memory from RECALL by Supermemory document id. Prefer an exact id from recall_search results.", {
    id: z.string().describe("Supermemory document id to delete"),
}, async ({ id }) => {
    try {
        const docId = id.trim();
        if (!docId)
            return errResult(new Error("id is empty"));
        await smDelete(docId);
        return textResult(`Forgot document ${docId}.`);
    }
    catch (e) {
        return errResult(e);
    }
});
async function main() {
    const cfg = loadConfig();
    // Log only to stderr so stdio JSON-RPC stays clean
    console.error(`[recall-mcp] starting · sm=${cfg.url} · container=${cfg.container} · key=${cfg.apiKey ? "set" : "MISSING"}`);
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch((e) => {
    console.error("[recall-mcp] fatal", e);
    process.exit(1);
});
