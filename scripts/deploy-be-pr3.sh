#!/bin/bash
set -euo pipefail
echo "=== BE-PR3 deploy ==="
cd ~/recall/app
mkdir -p app/api/graph app/api/stats "app/api/memories/[id]" lib/graph data

npm run build 2>&1

rsync -a --exclude node_modules --exclude .next --exclude data \
  ~/recall/app/ ~/recall-app/
cp ~/recall/app/.env.local ~/recall-app/.env.local 2>/dev/null || true

cd ~/recall-app
mkdir -p data
npm run build 2>&1
pm2 restart recall-app
sleep 4

BASE="http://127.0.0.1:3020/sites/recall/app"
echo "=== retest import after FK fix ==="
bash ~/recall/scripts/test-be-pr2.sh

echo "=== graph ==="
curl -sS "$BASE/api/graph" | python3 -c "import sys,json; d=json.load(sys.stdin); print('nodes',len(d.get('nodes',[])),'edges',len(d.get('edges',[]))); print(d['nodes'][0] if d.get('nodes') else 'empty')"
echo "=== stats ==="
curl -sS "$BASE/api/stats"; echo
echo "=== memory detail ==="
MID=$(curl -sS "$BASE/api/graph" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['nodes'][0]['id'] if d.get('nodes') else '')")
echo "id=$MID"
curl -sS "$BASE/api/memories/$MID"; echo
echo "=== DONE BE-PR3 ==="
