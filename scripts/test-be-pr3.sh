#!/bin/bash
set -euo pipefail
BASE="http://127.0.0.1:3020/sites/recall/app"

echo "=== graph ==="
G=$(curl -sS "$BASE/api/graph")
python3 - <<PY
import json
d=json.loads('''$G'''.replace("'''","'"))
PY
# safer via file
curl -sS "$BASE/api/graph" > /tmp/graph.json
python3 -c '
import json
d=json.load(open("/tmp/graph.json"))
print(len(d["nodes"]), "nodes", len(d["edges"]), "edges")
assert len(d["nodes"]) >= 5, "expected real memories"
for n in d["nodes"][:3]:
    print("-", n["source"], n["type"], n["contentPreview"][:50])
print("GRAPH_OK")
'

echo "=== stats ==="
curl -sS "$BASE/api/stats" > /tmp/stats.json
python3 -c '
import json
d=json.load(open("/tmp/stats.json"))
print(d)
assert d["total"] >= 5
assert d["bySource"].get("chatgpt",0) >= 1
assert d["bySource"].get("claude",0) >= 1
print("STATS_OK")
'

echo "=== memory detail ==="
MID=$(python3 -c 'import json; print(json.load(open("/tmp/graph.json"))["nodes"][0]["id"])')
curl -sS "$BASE/api/memories/$MID" > /tmp/detail.json
python3 -c '
import json
d=json.load(open("/tmp/detail.json"))
assert "memory" in d and d["memory"]["id"]
assert "relations" in d
print("detail", d["memory"]["type"], d["memory"]["contentPreview"][:60])
print("DETAIL_OK")
'

echo "=== PASS BE-PR3 ==="
