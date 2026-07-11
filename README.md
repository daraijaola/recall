# RECALL

**Portable AI memory on [Supermemory Local](https://supermemory.ai/docs/self-hosting/quickstart).**

Import ChatGPT / Claude history → structure it → store it on **your machine** (`localhost:6767`) → inject it into every AI you use (paste packs, project files, or MCP tools).

> One-line pitch: *Your AI memory shouldn’t die when you switch AIs.*

---

## Architecture (load-bearing pieces)

| Layer | Role |
|-------|------|
| **Supermemory Local** | Storage, embeddings, hybrid search (`:6767`) |
| **RECALL Next.js app** | Import pipeline, graph index (SQLite), dashboard, Connect |
| **SQLite `recall.db`** | Thin graph: types, relations, supersession, imports |
| **`packages/recall-mcp`** | MCP tools for Claude Code / Cursor / Windsurf / Desktop |

Structured memory concepts (typed claims, contradictions, version chains) are implemented **fresh on Supermemory Local** — not a rebadge of another product.

---

## Prerequisites

- Node.js 18+
- Ability to run [Supermemory Local](https://supermemory.ai/docs/self-hosting/quickstart)
- An OpenAI-compatible LLM key for SM extraction (gateway / OpenAI / Ollama, etc.)

---

## Quick start (local)

### 1. Start Supermemory Local

```bash
npx supermemory local
# → http://localhost:6767
# → copy the printed API key (sm_...)
```

Save the key. Point SM at your LLM if the wizard asks (or use `~/.supermemory/env`).

### 2. Configure the app

```bash
cd app
cp .env.example .env.local   # or create:
```

```env
RECALL_SM_URL=http://localhost:6767
RECALL_SM_API_KEY=sm_your_key_here
RECALL_CONTAINER=recall_user
OPENAI_API_KEY=...
OPENAI_BASE_URL=...          # optional gateway
OPENAI_MODEL=gpt-5.4         # or your model
```

### 3. Run the dashboard

```bash
cd app
npm install
npm run dev
# default: http://localhost:3020
# this deploy uses basePath: /sites/recall/app
```

### 4. (Optional) MCP server for coding agents

```bash
cd packages/recall-mcp
npm install
npm run build

export RECALL_SM_URL=http://localhost:6767
export RECALL_SM_API_KEY=sm_your_key_here
export RECALL_CONTAINER=recall_user
export RECALL_APP_URL=http://127.0.0.1:3020/sites/recall/app   # optional

node dist/index.js   # stdio MCP — leave running via your IDE
```

---

## How each platform works

### A. Chat paste surfaces (no MCP)

| App | How RECALL plugs in |
|-----|---------------------|
| **ChatGPT** | Connect → **Copy compact pack** (~1500 chars) → paste into Custom Instructions or first message |
| **Grok** | Same compact/full pack paste |
| **Gemini** | Same pack paste |
| **Claude (web)** | Same pack paste *or* Desktop/Code MCP below |

Active memories only, ranked: constraints → preferences/decisions → project → goals → workflow.

### B. MCP coding agents (stdio)

All use a `mcpServers` JSON block. Copy from **Connect** in the app, or use the examples below.

#### Claude Desktop

- **Config file:**  
  - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`  
  - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Restart Claude Desktop after save.

```json
{
  "mcpServers": {
    "recall": {
      "command": "node",
      "args": ["/absolute/path/to/recall/packages/recall-mcp/dist/index.js"],
      "env": {
        "RECALL_SM_URL": "http://localhost:6767",
        "RECALL_SM_API_KEY": "sm_...",
        "RECALL_CONTAINER": "recall_user"
      }
    }
  }
}
```

#### Claude Code

- **Project:** `.mcp.json` in the repo root (checked in for the team)  
- **User:** `~/.claude.json`  
- CLI: `claude mcp list` to verify  
- Newer format supports `"type": "stdio"`.

```json
{
  "mcpServers": {
    "recall": {
      "type": "stdio",
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

Try: *“What am I working on?”* → tool `recall_context`.

#### Cursor

- **Project:** `.cursor/mcp.json`  
- **Global:** `~/.cursor/mcp.json`  
- Or: **Cursor Settings → Tools & MCP → New MCP Server**

Same `mcpServers.recall` shape as Claude Desktop (command / args / env).

#### Windsurf (Cascade)

- **Config:** `~/.codeium/windsurf/mcp_config.json`  
  (Windows: `%USERPROFILE%\.codeium\windsurf\mcp_config.json`)  
- Or Cascade panel → MCP Servers → Configure  

Same `mcpServers` object.

### C. Project files

From **Connect → Project files**:

| File | Use |
|------|-----|
| `CLAUDE.md` | Drop in repo for Claude Code project context |
| `.cursorrules` | Cursor rules from live memory |
| `AGENTS.md` | Generic agent instructions |

---

## MCP tools

| Tool | Purpose |
|------|---------|
| `recall_search` | Hybrid search over your memory |
| `recall_context` | Packed brief (prefs, decisions, project) |
| `recall_remember` | Store a durable fact |
| `recall_forget` | Delete by Supermemory document id |

---

## App routes (dashboard)

| Page | What it does |
|------|----------------|
| **Home** | Live graph + list from SQLite |
| **Import** | ChatGPT / Claude export → SM + graph |
| **Conflicts** | Cross-platform contradictions (e.g. Python vs TypeScript) |
| **Search** | SM hybrid + local fallback |
| **Connect** | Context packs, MCP configs, file downloads |
| **Setup** | SM Local health + API key |

### Import formats

| Source | Format |
|--------|--------|
| ChatGPT | Official `conversations.json` (tree `mapping`) |
| Claude | Official `conversations.json` (`chat_messages`) |
| Claude Code | `.jsonl` session files (best-effort) |
| Generic | `.md` / `.txt` |

Sample fixtures: `app/fixtures/sample-chatgpt.json`, `sample-claude.json`.

---

## Repo layout

```
recall/
  app/                 Next.js App Router (port 3020, basePath /sites/recall/app)
  packages/recall-mcp/ MCP stdio server
  landing/             Marketing site
  docs/BACKEND-PLAN.md Phased backend plan
  scripts/             Deploy + regression helpers
```

SQLite graph index: `app/data/recall.db` (or `RECALL_DB_PATH`).

---

## API surface (real)

| Method | Path |
|--------|------|
| GET | `/api/health` |
| GET/POST | `/api/setup` |
| POST | `/api/import` (multipart) |
| GET | `/api/import/:id/progress` |
| GET | `/api/imports` |
| GET | `/api/graph` · `/api/stats` · `/api/memories/:id` |
| GET | `/api/contradictions` |
| POST | `/api/contradictions/:id/resolve` |
| GET | `/api/search?q=` |
| GET | `/api/context-pack` · `/api/generate-file` · `/api/mcp-config` |

Frontend calls these via `app/lib/mock-api.ts` (name is historical — live routes are wired).

---

## Demo checklist (≤3 min)

1. Setup → **Connected** to Supermemory Local  
2. Import ChatGPT sample → progress Parse → Extract → Link  
3. Import Claude sample → **Conflicts** shows Python vs TypeScript  
4. Resolve “Use Claude’s version” → graph updates  
5. Connect → copy compact pack → paste into another chat  
6. MCP: *“What am I working on?”* → `recall_context`

---

## Regression

```bash
# on the host that runs the app + SM
bash scripts/full-regression.sh
```

---

## Hackathon

Built for **Supermemory Local Hackathon** (`localhost:6767`) · July 9–13, 2026  
Discord: https://discord.com/invite/WtkvM62fHK  

### Submission

- Public GitHub (this repo)  
- Demo video ≤ 3 minutes  
- Forms + `#project-showcase` post (see event announcements)

---

## License

MIT (unless noted otherwise in subpackages).
