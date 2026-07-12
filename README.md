# RECALL

**Your AI memory shouldn’t die when you switch AIs.**

Import ChatGPT / Claude history → store it on **your machine** with [Supermemory Local](https://supermemory.ai/docs/self-hosting/quickstart) → inject it into every AI (paste packs, project files, or MCP).

---

## Start in 30 seconds

**→ [START_HERE.md](./START_HERE.md)** — simplest path (live demo or 3-step local setup)

| Link | What |
|------|------|
| https://recall-eight-sage.vercel.app/ | Live (Vercel) |
| https://recall-eight-sage.vercel.app/app | App |
| https://agentr.online/sites/recall/ | Backup landing |
| https://github.com/daraijaola/recall | Source |

**License:** [MIT](./LICENSE)
---

## Local setup (3 commands)

```bash
# Terminal 1 — memory engine
npx supermemory local
# copy the sm_... API key it prints

# Terminal 2 — app
git clone https://github.com/daraijaola/recall.git
cd recall/app
cp .env.example .env.local
# put RECALL_SM_API_KEY=sm_... in .env.local
npm install && npm run dev
```

Open: **http://localhost:3020/sites/recall/app/**  
(Yes, include `/sites/recall/app` — same path as production.)

---

## What you get

| Feature | Where |
|---------|--------|
| Import ChatGPT / Claude exports | **Import** |
| Live memory graph | **Home** |
| Cross-app conflicts (e.g. Python vs TypeScript) | **Conflicts** |
| Hybrid search | **Search** |
| Context pack for ChatGPT / Grok / Gemini | **Connect** |
| CLAUDE.md · .cursorrules · AGENTS.md | **Connect** |
| MCP tools for coding agents | **Connect** + `packages/recall-mcp` |

### MCP tools

`recall_search` · `recall_context` · `recall_remember` · `recall_forget`

### Sample demo files

- `app/fixtures/sample-chatgpt.json`  
- `app/fixtures/sample-claude.json`  

Import **both** → open **Conflicts**.

---

## How platforms connect

| You use… | Do this |
|----------|---------|
| **ChatGPT / Grok / Gemini** | Connect → copy **compact pack** → paste into custom instructions |
| **Claude Desktop** | Paste MCP JSON into `claude_desktop_config.json` |
| **Claude Code** | Paste into `.mcp.json` (`type: "stdio"` included) |
| **Cursor** | Paste into `.cursor/mcp.json` |
| **Windsurf** | Paste into `~/.codeium/windsurf/mcp_config.json` |

Details + config paths: [START_HERE.md](./START_HERE.md)

---

## How it uses Supermemory Local

- **SM Local** = storage, embeddings, hybrid search (`localhost:6767`)  
- **RECALL** = importers, typed graph (SQLite), UI, context packs, MCP server  
- Your data stays on the machine running Supermemory Local  

---

## Repo layout

```
app/                  Next.js dashboard + API
packages/recall-mcp/  MCP server (stdio)
landing/              Marketing page
docs/                 Backend plan
scripts/              Deploy + full-regression.sh
```

---

## Demo & submit

- **Video script:** [DEMO.md](./DEMO.md) (≤ 3 min)  
- **Forms + Discord:** [SUBMISSION.md](./SUBMISSION.md)  

```bash
bash scripts/full-regression.sh   # optional self-check
```

---

## Hackathon

[Supermemory Local Hackathon](https://discord.com/invite/WtkvM62fHK) · July 9–13, 2026 · `localhost:6767`
