#!/bin/bash
set -euo pipefail
cd ~/recall/app

# Point MCP snippets at local package (better than npx until published)
if ! grep -q RECALL_MCP_ENTRY .env.local 2>/dev/null; then
  echo "RECALL_MCP_ENTRY=/home/ubuntu/recall/packages/recall-mcp/dist/index.js" >> .env.local
fi
if ! grep -q RECALL_APP_URL .env.local 2>/dev/null; then
  echo "RECALL_APP_URL=http://127.0.0.1:3020/sites/recall/app" >> .env.local
fi

npm run build 2>&1 | tail -40
rsync -a --exclude node_modules --exclude .next --exclude data \
  ~/recall/app/ ~/recall-app/
cp -f .env.local ~/recall-app/.env.local
cd ~/recall-app
npm run build 2>&1 | tail -40
pm2 restart recall-app --update-env
sleep 3

BASE=http://127.0.0.1:3020/sites/recall/app
echo "=== platform MCP configs ==="
for t in claude_desktop claude_code cursor windsurf; do
  echo "--- $t ---"
  curl -sS "$BASE/api/mcp-config?target=$t" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d["config"][:280])'
  echo
done

curl -sS "$BASE/api/health"; echo
echo "POLISH_DEPLOY_OK"
