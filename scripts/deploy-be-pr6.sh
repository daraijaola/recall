#!/bin/bash
set -euo pipefail
echo "=== BE-PR6 MCP (additive — does not rebuild app unless needed) ==="

# 1) Health of existing app FIRST — must stay green
BASE="http://127.0.0.1:3020/sites/recall/app"
H=$(curl -sS "$BASE/api/health")
echo "pre-app-health: $H"
echo "$H" | grep -q '"smConnected":true' || { echo "APP HEALTH FAIL before MCP work"; exit 1; }

# 2) Build MCP package only
cd ~/recall/packages/recall-mcp
npm install 2>&1 | tail -20
npm run build 2>&1

# 3) Unit-ish smoke of SM helpers (no stdio MCP session needed)
export RECALL_SM_URL=http://localhost:6767
export RECALL_SM_API_KEY=$(sed -n 's/^RECALL_SM_API_KEY=//p' ~/recall-app/.env.local)
export RECALL_CONTAINER=recall_user
export RECALL_APP_URL=http://127.0.0.1:3020/sites/recall/app

node <<'NODE'
import { smSearch, buildContext, smAdd, loadConfig } from './dist/sm.js';

const cfg = loadConfig();
console.log('cfg', { url: cfg.url, container: cfg.container, key: !!cfg.apiKey });

const hits = await smSearch('TypeScript backend', 5);
console.log('search hits', hits.length);
if (hits.length < 1) throw new Error('expected search hits from imported memory');
console.log('top:', hits[0].text.slice(0, 80));

const ctx = await buildContext('what am I working on');
console.log('context chars', ctx.length);
console.log(ctx.slice(0, 280));
if (ctx.length < 20) throw new Error('empty context');

const mem = await smAdd('RECALL MCP smoke: prefer local-first memory for personal context.', 'recall_mcp_smoke');
console.log('remember', mem);

console.log('MCP_LOGIC_OK');
NODE

# 4) npm link for local `recall-mcp` binary (optional convenience)
npm link 2>&1 | tail -5 || true
which recall-mcp || true
recall-mcp --help 2>/dev/null || echo "(bin starts stdio — no --help expected)"

# 5) App still healthy after (we did not touch it)
H2=$(curl -sS "$BASE/api/health")
echo "post-app-health: $H2"
echo "$H2" | grep -q '"smConnected":true' || { echo "APP BROKEN after MCP"; exit 1; }

# quick regression on pack + graph
curl -sS -o /dev/null -w "pack:%{http_code}\n" "$BASE/api/context-pack?variant=compact"
curl -sS -o /dev/null -w "graph:%{http_code}\n" "$BASE/api/graph"
curl -sS -o /dev/null -w "search:%{http_code}\n" "$BASE/api/search?q=TypeScript"

echo "=== PASS BE-PR6 (app intact) ==="
