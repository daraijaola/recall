# recall-mcp

MCP server for **RECALL** — four tools over Supermemory Local.

## Tools

| Tool | Purpose |
|------|---------|
| `recall_search` | Search your memory |
| `recall_context` | “What am I working on?” brief |
| `recall_remember` | Save a fact |
| `recall_forget` | Delete by document id |

## Easiest setup

1. Build once:

```bash
cd packages/recall-mcp
npm install && npm run build
```

2. In the RECALL app → **Connect** → copy the config for your tool  
   **or** paste this (fix path + key):

```json
{
  "mcpServers": {
    "recall": {
      "command": "node",
      "args": ["/FULL/PATH/to/recall/packages/recall-mcp/dist/index.js"],
      "env": {
        "RECALL_SM_URL": "http://localhost:6767",
        "RECALL_SM_API_KEY": "sm_your_key",
        "RECALL_CONTAINER": "recall_user"
      }
    }
  }
}
```

3. Put that JSON in:

| App | File |
|-----|------|
| Claude Desktop | `claude_desktop_config.json` |
| Claude Code | `.mcp.json` |
| Cursor | `.cursor/mcp.json` |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` |

4. Restart the app · ask: **What am I working on?**

Requires Supermemory Local (`npx supermemory local`).
