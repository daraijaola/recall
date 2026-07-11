#!/bin/bash
set -euo pipefail

echo "=== BE-PR1 deploy on VM ==="
cd ~/recall/app

# Ensure env present in dev tree
if [ ! -f .env.local ] && [ -f ~/recall-app/.env.local ]; then
  cp ~/recall-app/.env.local .env.local
  echo "copied .env.local from recall-app"
fi

mkdir -p data lib/graph app/api/health app/api/setup

echo "=== npm install better-sqlite3 ==="
npm install better-sqlite3@^11.10.0 @types/better-sqlite3@^7.6.13 --save 2>&1 | tail -20

# build tools needed for native module if missing
if ! node -e "require('better-sqlite3')" 2>/dev/null; then
  echo "native module missing — trying rebuild"
  npm rebuild better-sqlite3 2>&1 | tail -30
fi

echo "=== next build ==="
npm run build 2>&1

echo "=== rsync to recall-app ==="
rsync -a --delete \
  --exclude node_modules \
  --exclude .next \
  --exclude data \
  ~/recall/app/ ~/recall-app/

# preserve env
if [ -f ~/recall/app/.env.local ]; then
  cp ~/recall/app/.env.local ~/recall-app/.env.local
fi

cd ~/recall-app
mkdir -p data
npm install better-sqlite3@^11.10.0 @types/better-sqlite3@^7.6.13 --save 2>&1 | tail -15
npm run build 2>&1

echo "=== pm2 restart recall-app ==="
pm2 restart recall-app
sleep 3
pm2 list | head -20

echo "=== smoke tests ==="
BASE="http://127.0.0.1:3020/sites/recall/app"
echo "GET health:"
curl -sS "$BASE/api/health" | tee /tmp/be-pr1-health.json
echo
echo "GET setup:"
curl -sS "$BASE/api/setup" | tee /tmp/be-pr1-setup.json
echo
echo "POST setup (save key from env):"
KEY=$(sed -n 's/^RECALL_SM_API_KEY=//p' .env.local)
curl -sS -X POST "$BASE/api/setup" -H 'content-type: application/json' \
  -d "{\"apiKey\":\"$KEY\"}" | tee /tmp/be-pr1-setup-post.json
echo
echo "GET setup after save:"
curl -sS "$BASE/api/setup"
echo
echo "DB file:"
ls -la data/recall.db 2>/dev/null || ls -la ~/recall-app/data/recall.db 2>/dev/null || echo "db not found yet"
echo "=== DONE ==="
