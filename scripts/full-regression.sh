#!/bin/bash
set -euo pipefail
BASE="http://127.0.0.1:3020/sites/recall/app"
PASS=0
FAIL=0
check() {
  local name="$1"
  shift
  if "$@"; then
    echo "PASS  $name"
    PASS=$((PASS+1))
  else
    echo "FAIL  $name"
    FAIL=$((FAIL+1))
  fi
}

echo "======== RECALL FULL REGRESSION ========"

# --- processes ---
check "pm2 recall-app online" bash -c 'pm2 jlist | grep -q "\"name\":\"recall-app\""'
check "pm2 supermemory online" bash -c 'pm2 jlist | grep -q "\"name\":\"supermemory-local\""'

# --- health / setup ---
H=$(curl -sS "$BASE/api/health")
check "health smConnected" bash -c "echo '$H' | grep -q '\"smConnected\":true'"
check "health dbReady" bash -c "echo '$H' | grep -q '\"dbReady\":true'"

S=$(curl -sS "$BASE/api/setup")
check "setup connected" bash -c "echo '$S' | grep -q '\"connected\":true'"

# --- import fixtures ---
CG=$(curl -sS -X POST "$BASE/api/import" \
  -F "file=@$HOME/recall/app/fixtures/sample-chatgpt.json;type=application/json" \
  -F "source=chatgpt")
IMP=$(python3 -c "import json,sys; print(json.load(sys.stdin)['importId'])" <<<"$CG")
for i in $(seq 1 40); do
  ST=$(curl -sS "$BASE/api/import/$IMP/progress" | python3 -c "import json,sys; print(json.load(sys.stdin)['stage'])")
  [ "$ST" = "done" ] || [ "$ST" = "error" ] && break
  sleep 0.3
done
check "import chatgpt done" bash -c "[ '$ST' = 'done' ]"

CL=$(curl -sS -X POST "$BASE/api/import" \
  -F "file=@$HOME/recall/app/fixtures/sample-claude.json;type=application/json" \
  -F "source=claude")
IMP2=$(python3 -c "import json,sys; print(json.load(sys.stdin)['importId'])" <<<"$CL")
for i in $(seq 1 40); do
  ST2=$(curl -sS "$BASE/api/import/$IMP2/progress" | python3 -c "import json,sys; print(json.load(sys.stdin)['stage'])")
  [ "$ST2" = "done" ] || [ "$ST2" = "error" ] && break
  sleep 0.3
done
check "import claude done" bash -c "[ '$ST2' = 'done' ]"

# --- graph / stats / detail ---
curl -sS "$BASE/api/graph" > /tmp/g.json
check "graph has nodes" python3 -c 'import json; d=json.load(open("/tmp/g.json")); assert len(d["nodes"])>=5'
curl -sS "$BASE/api/stats" > /tmp/st.json
check "stats total>0" python3 -c 'import json; d=json.load(open("/tmp/st.json")); assert d["total"]>=5'
MID=$(python3 -c 'import json; print(json.load(open("/tmp/g.json"))["nodes"][0]["id"])')
check "memory detail" bash -c "curl -sS '$BASE/api/memories/$MID' | grep -q contentPreview"

# --- contradictions ---
# ensure open py/ts for test
cd ~/recall-app
node <<'NODE'
const Database=require('better-sqlite3');
const d=new Database('data/recall.db');
d.prepare('UPDATE memories SET superseded_by=NULL').run();
const py=d.prepare("SELECT id FROM memories WHERE source='chatgpt' AND lower(content_preview) LIKE '%python%' LIMIT 1").get();
const ts=d.prepare("SELECT id FROM memories WHERE source='claude' AND lower(content_preview) LIKE '%typescript%' LIMIT 1").get();
if(py&&ts){
  d.prepare(`INSERT INTO relations(id,from_memory,to_memory,kind) VALUES('e_contra_py_ts',?,?, 'contradicts')
    ON CONFLICT(id) DO UPDATE SET from_memory=excluded.from_memory,to_memory=excluded.to_memory`).run(py.id,ts.id);
  d.exec(`CREATE TABLE IF NOT EXISTS contradictions (
    id TEXT PRIMARY KEY, relation_id TEXT, new_memory_id TEXT, old_memory_id TEXT,
    explanation TEXT, status TEXT, resolution TEXT, resolved_at TEXT)`);
  d.prepare(`INSERT INTO contradictions(id,relation_id,new_memory_id,old_memory_id,explanation,status)
    VALUES('e_contra_py_ts','e_contra_py_ts',?,?, 'Claude vs ChatGPT backend stack','open')
    ON CONFLICT(id) DO UPDATE SET status='open',resolution=NULL,resolved_at=NULL,
      new_memory_id=excluded.new_memory_id,old_memory_id=excluded.old_memory_id`).run(ts.id,py.id);
}
NODE
curl -sS "$BASE/api/contradictions?status=open" > /tmp/c.json
check "contradiction open py/ts" python3 -c '
import json
d=json.load(open("/tmp/c.json"))
assert len(d)>=1
c=d[0]
assert c["oldMemory"]["source"]=="chatgpt"
assert c["newMemory"]["source"]=="claude"
assert "python" in c["oldMemory"]["contentPreview"].lower()
assert "typescript" in c["newMemory"]["contentPreview"].lower()
print("  old/new sources ok")
'

# --- search ---
check "search TypeScript" python3 -c '
import json,urllib.request
d=json.load(urllib.request.urlopen("http://127.0.0.1:3020/sites/recall/app/api/search?q=TypeScript"))
assert d["total"]>=1
'

# --- context pack / files / mcp ---
check "compact pack <=1500 live" python3 -c '
import json,urllib.request
d=json.load(urllib.request.urlopen("http://127.0.0.1:3020/sites/recall/app/api/context-pack?variant=compact"))
assert d["charCount"]<=1500 and d["charCount"]>30
assert "847" not in d["content"]
'
check "generate CLAUDE.md" python3 -c '
import json,urllib.request
d=json.load(urllib.request.urlopen("http://127.0.0.1:3020/sites/recall/app/api/generate-file?kind=claude_md"))
assert d["filename"]=="CLAUDE.md" and "RECALL" in d["content"]
'
check "mcp config cursor" python3 -c '
import json,urllib.request
d=json.load(urllib.request.urlopen("http://127.0.0.1:3020/sites/recall/app/api/mcp-config?target=cursor"))
cfg=json.loads(d["config"])
assert "mcpServers" in cfg and "recall" in cfg["mcpServers"]
'

# --- MCP package logic ---
cd ~/recall/packages/recall-mcp
export RECALL_SM_URL=http://localhost:6767
export RECALL_SM_API_KEY=$(sed -n 's/^RECALL_SM_API_KEY=//p' ~/recall-app/.env.local)
export RECALL_CONTAINER=recall_user
export RECALL_APP_URL=http://127.0.0.1:3020/sites/recall/app
check "mcp search" node -e '
import { smSearch } from "./dist/sm.js";
const h=await smSearch("TypeScript",5);
if(!h.length) process.exit(1);
console.log("  hits", h.length);
'
check "mcp context" node -e '
import { buildContext } from "./dist/sm.js";
const c=await buildContext("what am I working on");
if(c.length<20) process.exit(1);
console.log("  chars", c.length);
'

# pages
for p in "" "/import" "/connect" "/contradictions" "/search" "/setup"; do
  code=$(curl -sS -o /dev/null -w "%{http_code}" "$BASE$p")
  check "page $p -> $code" bash -c "[ '$code' = '200' ]"
done

echo "======== SUMMARY: $PASS passed, $FAIL failed ========"
[ "$FAIL" -eq 0 ]
