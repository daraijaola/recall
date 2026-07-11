# recall-mcp

MCP server for **RECALL** — portable AI memory on **Supermemory Local**.

## Tools

| Tool | Purpose |
|------|---------|
| `recall_search` | Hybrid search over imported memory |
| `recall_context` | Packed brief (prefs, decisions, project) |
| `recall_remember` | Store a new durable memory |
| `recall_forget` | Delete by document id |

## Run (local)

```bash
cd packages/recall-mcp
npm install
npm run build
export RECALL_SM_URL=http://localhost:6767
export RECALL_SM_API_KEY=sm_...
export RECALL_CONTAINER=recall_user
# optional — reuse app context-pack:
export RECALL_APP_URL=http://127.0.0.1:3020/sites/recall/app
node dist/index.js
```

## Claude / Cursor config

```json
{
  "mcpServers": {
    "recall": {
      "command": "node",
      "args": ["/absolute/path/to/recall/packages/recall-mcp/dist/index.js"],
      "env": {
        "RECALL_SM_URL": "http://localhost:6767",
        "RECALL_SM_API_KEY": "sm_...",
        "RECALL_CONTAINER": "recall_user",
        "RECALL_APP_URL": "http://127.0.0.1:3020/sites/recall/app"
      }
    }
  }
}
```

Or after `npm link` globally:

```json
{
  "mcpServers": {
    "recall": {
      "command": "recall-mcp",
      "env": {
        "RECALL_SM_URL": "http://localhost:6767",
        "RECALL_SM_API_KEY": "sm_...",
        "RECALL_CONTAINER": "recall_user"
      }
    }
  }
}
```

This package does **not** change the Next.js app; it only talks to Supermemory Local (and optionally the app’s context-pack API).
