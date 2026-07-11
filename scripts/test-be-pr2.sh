#!/bin/bash
set -euo pipefail
BASE="http://127.0.0.1:3020/sites/recall/app"

echo "=== 1 health ==="
curl -sS "$BASE/api/health"; echo

echo "=== 2 setup ==="
curl -sS "$BASE/api/setup" | python3 -c "import sys,json; d=json.load(sys.stdin); print({k:d[k] for k in ['connected','memoryCount','container','url']})"

echo "=== 3 chatgpt import ==="
CG=$(curl -sS -X POST "$BASE/api/import" \
  -F "file=@/home/ubuntu/recall/app/fixtures/sample-chatgpt.json;type=application/json" \
  -F "source=chatgpt")
echo "$CG"
IMP=$(python3 -c "import json,sys; print(json.load(sys.stdin)['importId'])" <<<"$CG")
FINAL1=""
for i in $(seq 1 40); do
  P=$(curl -sS "$BASE/api/import/$IMP/progress")
  STAGE=$(python3 -c "import json,sys; print(json.load(sys.stdin)['stage'])" <<<"$P")
  PCT=$(python3 -c "import json,sys; print(json.load(sys.stdin).get('percent'))" <<<"$P")
  echo "  poll $i: $STAGE $PCT"
  if [ "$STAGE" = "done" ] || [ "$STAGE" = "error" ]; then FINAL1="$P"; break; fi
  sleep 0.4
done
echo "FINAL1=$FINAL1"
echo "$FINAL1" | grep -q '"stage":"done"' || { echo "FAIL chatgpt"; exit 1; }

echo "=== 4 claude import ==="
CL=$(curl -sS -X POST "$BASE/api/import" \
  -F "file=@/home/ubuntu/recall/app/fixtures/sample-claude.json;type=application/json" \
  -F "source=claude")
IMP2=$(python3 -c "import json,sys; print(json.load(sys.stdin)['importId'])" <<<"$CL")
FINAL2=""
for i in $(seq 1 40); do
  P=$(curl -sS "$BASE/api/import/$IMP2/progress")
  STAGE=$(python3 -c "import json,sys; print(json.load(sys.stdin)['stage'])" <<<"$P")
  if [ "$STAGE" = "done" ] || [ "$STAGE" = "error" ]; then FINAL2="$P"; break; fi
  sleep 0.4
done
echo "FINAL2=$FINAL2"
echo "$FINAL2" | grep -q '"stage":"done"' || { echo "FAIL claude"; exit 1; }

echo "=== 5 imports history ==="
curl -sS "$BASE/api/imports"; echo

echo "=== 6 db ==="
cd ~/recall-app
node -e "
const Database=require('better-sqlite3');
const d=new Database('/home/ubuntu/recall-app/data/recall.db');
const mc=d.prepare('select count(*) c from memories').get().c;
const rc=d.prepare('select count(*) c from relations').get().c;
const ic=d.prepare('select count(*) c from imports').get().c;
console.log(JSON.stringify({memories:mc,relations:rc,imports:ic},null,2));
console.log('by_source', d.prepare('select source, count(*) c from memories group by source').all());
console.log('contradicts', d.prepare(\"select id,kind,from_memory,to_memory from relations where kind='contradicts'\").all());
if(mc<5){console.error('FAIL: expected memories in db'); process.exit(1)}
console.log('DB_OK');
"

echo "=== 7 health after ==="
H=$(curl -sS "$BASE/api/health")
echo "$H"
echo "$H" | grep -q '"smConnected":true' || { echo "FAIL sm"; exit 1; }
echo "$H" | grep -q '"dbReady":true' || { echo "FAIL db"; exit 1; }

echo "=== PASS BE-PR2 ==="
