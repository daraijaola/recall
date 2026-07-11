#!/bin/bash
set -euo pipefail
echo "=== BE-PR2 deploy ==="
cd ~/recall/app
mkdir -p data fixtures lib/importers "app/api/import/[id]/progress" app/api/imports

if [ ! -f .env.local ] && [ -f ~/recall-app/.env.local ]; then
  cp ~/recall-app/.env.local .env.local
fi

echo "=== build ~/recall/app ==="
npm run build 2>&1

echo "=== rsync → recall-app ==="
rsync -a \
  --exclude node_modules \
  --exclude .next \
  --exclude data \
  ~/recall/app/ ~/recall-app/

cp ~/recall/app/.env.local ~/recall-app/.env.local 2>/dev/null || true
cd ~/recall-app
mkdir -p data fixtures
npm run build 2>&1

pm2 restart recall-app
sleep 4

BASE="http://127.0.0.1:3020/sites/recall/app"
echo "=== health ==="
curl -sS "$BASE/api/health"; echo

echo "=== import ChatGPT sample ==="
CG=$(curl -sS -X POST "$BASE/api/import" \
  -F "file=@/home/ubuntu/recall/app/fixtures/sample-chatgpt.json;type=application/json" \
  -F "source=chatgpt")
echo "$CG"
IMP1=$(python3 -c "import json,sys; print(json.load(sys.stdin)['importId'])" <<<"$CG")

for i in $(seq 1 40); do
  P=$(curl -sS "$BASE/api/import/$IMP1/progress")
  echo "progress[$i]: $P"
  echo "$P" | grep -q '"stage":"done"' && break
  echo "$P" | grep -q '"stage":"error"' && break
  sleep 1
done

echo "=== import Claude sample ==="
CL=$(curl -sS -X POST "$BASE/api/import" \
  -F "file=@/home/ubuntu/recall/app/fixtures/sample-claude.json;type=application/json" \
  -F "source=claude")
echo "$CL"
IMP2=$(python3 -c "import json,sys; print(json.load(sys.stdin)['importId'])" <<<"$CL")

for i in $(seq 1 40); do
  P=$(curl -sS "$BASE/api/import/$IMP2/progress")
  echo "progress2[$i]: $P"
  echo "$P" | grep -q '"stage":"done"' && break
  echo "$P" | grep -q '"stage":"error"' && break
  sleep 1
done

echo "=== imports history ==="
curl -sS "$BASE/api/imports"; echo
echo "=== health after ==="
curl -sS "$BASE/api/health"; echo
echo "=== db memories ==="
sqlite3 ~/recall-app/data/recall.db "SELECT COUNT(*) FROM memories; SELECT type, source, substr(content_preview,1,60) FROM memories LIMIT 8;" 2>/dev/null || \
  node -e "const Database=require('better-sqlite3'); const d=new Database('/home/ubuntu/recall-app/data/recall.db'); console.log(d.prepare('select count(*) c from memories').get()); console.log(d.prepare('select type,source,substr(content_preview,1,60) t from memories limit 8').all());"
echo "=== DONE ==="
