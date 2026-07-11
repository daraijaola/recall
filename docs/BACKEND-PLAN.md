# RECALL Backend Plan (July 12–13, 2026)

Companion to `RECALL-Hackathon-Plan (1).pdf`. Frontend is **done** (mock API). Backend replaces `lib/mock-api.ts` route-by-route — **do not change the API contract** without updating both sides.

## Current state (FE complete)

| Item | Status |
|------|--------|
| Landing | `landing/` — live at agentr.online/sites/recall/ |
| Next.js app | `app/` — all 6 pages, mock data in `app/lib/mock-api.ts` |
| GitHub | https://github.com/daraijaola/recall (8 FE commits on `main`) |
| Real API routes | **None** — all mocks |
| MCP package | **Not started** |
| SQLite graph | **Not started** |

## Keys & env (grab before Day 1 BE)

| Key | Required? | Where to get it | Used for |
|-----|-----------|-----------------|----------|
| **Supermemory Local API key** | Yes | Printed when you run `npx supermemory local` (`sm_…`) | All SM SDK calls (`baseURL: http://localhost:6767`) |
| **OpenAI API key** | Recommended | https://platform.openai.com/api-keys | SM Local extraction + RECALL structuring (`generateObject`) |
| **Anthropic API key** | Optional alt | https://console.anthropic.com/ | Use instead of OpenAI if preferred |
| **Ollama** | Optional alt | Local install, no key | SM Local extraction only (slower) |

### `.env.local` (create in `app/`)

```env
RECALL_SM_URL=http://localhost:6767
RECALL_SM_API_KEY=sm_your_key_from_terminal
RECALL_CONTAINER=recall_user
OPENAI_API_KEY=sk-...          # structuring + SM extraction config
# ANTHROPIC_API_KEY=sk-ant-... # if using Anthropic instead
```

### Verify tonight (5 min)

```bash
npx supermemory local
# Copy: url, api key, container from terminal output

cd app && npm install && npm run dev
# Setup page → Test connection (still mock until BE-PR1)
```

### Sample files to have ready

- ChatGPT `conversations.json` (official export)
- Claude `conversations.json` (official export)
- Optional: one Claude Code `.jsonl` from `~/.claude/projects/`

---

## BE work order (one PR phase at a time)

Rule: **implement API route → swap frontend from mock to `fetch('/api/...')` → user sign-off → next phase.**

### BE-PR1 — Foundation (start here tomorrow)

**Goal:** Real health check + SM connection + SQLite boot.

| Task | Files |
|------|-------|
| SM adapter | `app/lib/supermemory.ts` — single place for all SM quirks |
| SQLite schema | `app/lib/db.ts`, `app/lib/graph/` — memories, relations, imports tables per PDF §4.3 |
| Routes | `GET /api/health`, `POST /api/setup` |
| Wire Setup page | Replace `fetchSetupStatus` / `testSmConnection` mocks |

**Done when:** Setup page shows real connected/disconnected; `recall.db` created; health returns real `memoryCount` from SM.

---

### BE-PR2 — Import pipeline (ChatGPT + Claude first)

**Goal:** Real file upload + parse + progress stream.

| Task | Files |
|------|-------|
| Parsers | `app/lib/importers/chatgpt.ts`, `claude.ts` |
| Routes | `POST /api/import`, `GET /api/import/:id/progress` (SSE), `GET /api/imports` |
| Wire Import page | Live progress bar, real import history |

**Done when:** Drop ChatGPT export → memories appear in SM + graph index; progress streams parsing → extracting → relating.

---

### BE-PR3 — Graph + memories (dashboard goes live)

**Goal:** Home page reads real data.

| Task | Files |
|------|-------|
| Structuring | `app/lib/extract.ts` — AI SDK `generateObject`, typed memories |
| Relation detect | `app/lib/relations.ts` — SM search ~0.75 threshold + LLM classify |
| Routes | `GET /api/graph`, `GET /api/stats`, `GET /api/memories/:id` |
| Wire Home | Swap `fetchGraph`, `fetchStats`, `fetchMemoryDetail` |

**Done when:** Dashboard graph/list shows imported memories; click node → real provenance.

---

### BE-PR4 — Contradictions + search

**Goal:** Hero demo moment works for real.

| Task | Files |
|------|-------|
| Contradiction detect | Cross-platform relation `contradicts` → open cards |
| Routes | `GET /api/contradictions`, `POST /api/contradictions/:id/resolve`, `GET /api/search` |
| Wire Conflicts + Search pages | Real resolve persists; search hits SM hybrid |

**Done when:** Python vs TypeScript conflict appears after importing both exports; resolve updates graph.

---

### BE-PR5 — Injection surfaces (Connect page)

**Goal:** Context pack + file downloads are real.

| Task | Files |
|------|-------|
| Generators | `app/lib/context-pack.ts`, `app/lib/file-generators.ts` |
| Routes | `GET /api/context-pack`, `GET /api/generate-file`, `GET /api/mcp-config` |
| Wire Connect page | Copy/download returns real generated content |

**Done when:** Compact pack ~1500 chars from live memories; CLAUDE.md downloads.

---

### BE-PR6 — MCP server (untouchable per PDF)

**Goal:** `npx recall-mcp` works in Claude Code / Cursor.

| Task | Files |
|------|-------|
| Package | `packages/recall-mcp/` — stdio, 4 tools |
| Tools | `recall_search`, `recall_context`, `recall_remember`, `recall_forget` |
| Publish | Local `npm link` or monorepo workspace |

**Done when:** Claude Code asks "what am I working on?" and gets answer from imported history.

---

### BE-PR7 — Polish + cut-line items (only if time)

- Claude Code JSONL importer
- Grok / Cursor importers (beta badges)
- Mini-benchmark script (20 questions)
- Timeline page (cut from FE — skip unless extra time)

---

## API contract (do not break)

Full spec in PDF Part 5.3. Types live in `app/lib/types.ts`. Mock shapes in `app/lib/mock-api.ts` are the source of truth for responses.

| Priority route | Mock function today |
|----------------|---------------------|
| `GET /api/health` | `fetchHealth` |
| `POST /api/setup` | `saveSetupApiKey` |
| `POST /api/import` | `startImport` |
| `GET /api/import/:id/progress` | `fetchImportProgress` (→ SSE) |
| `GET /api/graph` | `fetchGraph` |
| `GET /api/stats` | `fetchStats` |
| `GET /api/memories/:id` | `fetchMemoryDetail` |
| `GET /api/contradictions` | `fetchAllContradictions` |
| `POST /api/contradictions/:id/resolve` | `resolveContradiction` |
| `GET /api/search` | `searchMemories` |
| `GET /api/context-pack` | `fetchContextPack` |
| `GET /api/generate-file` | `fetchGeneratedFile` |

---

## Submission still needed (July 13)

- [ ] Register: https://forms.gle/A9dxNCfnqq2SVt3N9
- [ ] Submit: https://forms.gle/ARXHNpFY5VNfiNDBA
- [ ] Demo video (max 3 min) — script in PDF Part 8
- [ ] Discord #project-showcase post
- [ ] README update with real `npx supermemory local` → `npm run dev` flow

## Reference links

- SM quickstart: https://supermemory.ai/docs/self-hosting/quickstart
- SM search: https://supermemory.ai/docs/search
- OpenAPI: https://api.supermemory.ai/v3/openapi
- Discord: https://discord.com/invite/WtkvM62fHK