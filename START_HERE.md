# Start here (easiest path)

**Goal:** Supermemory Local running → RECALL app open → import a file → see memories.

---

## Option A — Use the live demo (fastest)

1. Open the site: **https://agentr.online/sites/recall/**
2. Click into the app: **https://agentr.online/sites/recall/app/**
3. Go to **Setup** — should say **Connected**
4. Go to **Import** → drop  
   `app/fixtures/sample-chatgpt.json`  
   (download from the repo if needed)
5. Then import `sample-claude.json`
6. Open **Conflicts** — Python vs TypeScript  
7. Open **Connect** — copy compact pack or MCP config  

That’s the full product path. No install required to *see* it.

---

## Option B — Run on your machine (3 steps)

### 1) Memory engine

```bash
npx supermemory local
```

Leave it running. Copy the **API key** (`sm_...`) from the terminal.

### 2) App config

```bash
git clone https://github.com/daraijaola/recall.git
cd recall/app
cp .env.example .env.local
```

Edit `.env.local` — only these matter:

```env
RECALL_SM_URL=http://localhost:6767
RECALL_SM_API_KEY=sm_paste_your_key_here
RECALL_CONTAINER=recall_user
```

(Optional: set `OPENAI_API_KEY` if Supermemory asks for an LLM key.)

### 3) Start the app

```bash
npm install
npm run dev
```

Open:

**http://localhost:3020/sites/recall/app/**

> The `/sites/recall/app` path is intentional (same as production).  
> Don’t worry — just use that full URL.

---

## What to click (2 minutes)

| Step | Page | Action |
|------|------|--------|
| 1 | **Setup** | Confirm **Connected** |
| 2 | **Import** | Drop ChatGPT export (or sample fixture) |
| 3 | **Import** | Drop Claude export |
| 4 | **Home** | See real memories (not empty) |
| 5 | **Conflicts** | Resolve Python vs TypeScript if shown |
| 6 | **Connect** | Copy **compact pack** → paste into ChatGPT/Grok |
| 7 | **Connect** | Copy MCP config for Cursor / Claude Code |

---

## Coding agents (only if you want MCP)

```bash
cd packages/recall-mcp
npm install && npm run build
```

Then paste config from **Connect** into:

| App | Config file |
|-----|-------------|
| Claude Desktop | `claude_desktop_config.json` |
| Claude Code | `.mcp.json` in project |
| Cursor | `.cursor/mcp.json` |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` |

Ask the agent: **“What am I working on?”**  
It should use `recall_context`.

---

## Sample files (for demos)

In the repo:

- `app/fixtures/sample-chatgpt.json` — Python preference  
- `app/fixtures/sample-claude.json` — TypeScript decision  

Import **both** to show the conflict.

---

## Stuck?

| Problem | Fix |
|---------|-----|
| Setup not connected | Is `npx supermemory local` running? Key correct in `.env.local`? |
| Import fails | Use official `conversations.json` export, or the sample fixtures |
| Blank Home | Import at least one file first |
| Wrong URL | Include `/sites/recall/app` in the path |
| MCP tools missing | Use `node …/packages/recall-mcp/dist/index.js` with absolute path |

More detail: [README.md](./README.md) · Demo script: [DEMO.md](./DEMO.md) · Submit: [SUBMISSION.md](./SUBMISSION.md)
