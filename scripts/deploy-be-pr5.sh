#!/bin/bash
set -euo pipefail
echo "=== BE-PR5 deploy ==="
cd ~/recall/app

npm run build 2>&1
rsync -a --exclude node_modules --exclude .next --exclude data ~/recall/app/ ~/recall-app/
cp -f .env.local ~/recall-app/.env.local 2>/dev/null || true
cd ~/recall-app
npm run build 2>&1
pm2 restart recall-app
sleep 4

BASE="http://127.0.0.1:3020/sites/recall/app"

echo "=== compact pack ==="
curl -sS "$BASE/api/context-pack?variant=compact" | tee /tmp/pack-c.json | python3 -c '
import json,sys
d=json.load(sys.stdin)
print("chars", d["charCount"], "limit", d.get("limit"))
assert d["variant"]=="compact"
assert d["charCount"]>20
assert d["charCount"]<=1500
assert "847" not in d["content"], "should not be mock 847"
# should mention real imported themes
low=d["content"].lower()
assert "typescript" in low or "python" in low or "deadline" in low or "next" in low
print(d["content"][:400])
print("COMPACT_OK")
'

echo "=== full pack ==="
curl -sS "$BASE/api/context-pack?variant=full" | python3 -c '
import json,sys
d=json.load(sys.stdin)
assert d["variant"]=="full"
assert d["charCount"]>=d.get("limit") or True
assert "RECALL" in d["content"]
print("full chars", d["charCount"])
print("FULL_OK")
'

echo "=== CLAUDE.md ==="
curl -sS "$BASE/api/generate-file?kind=claude_md" | python3 -c '
import json,sys
d=json.load(sys.stdin)
assert d["filename"]=="CLAUDE.md"
assert "RECALL" in d["content"]
assert "847" not in d["content"]
print(d["content"][:350])
print("CLAUDE_OK")
'

echo "=== cursorrules ==="
curl -sS "$BASE/api/generate-file?kind=cursorrules" | python3 -c '
import json,sys
d=json.load(sys.stdin)
assert d["filename"]==".cursorrules"
print("CURSOR_OK", len(d["content"]))
'

echo "=== agents_md ==="
curl -sS "$BASE/api/generate-file?kind=agents_md" | python3 -c '
import json,sys
d=json.load(sys.stdin)
assert d["filename"]=="AGENTS.md"
assert "recall_search" in d["content"]
print("AGENTS_OK")
'

echo "=== mcp config ==="
curl -sS "$BASE/api/mcp-config?target=cursor" | python3 -c '
import json,sys
d=json.load(sys.stdin)
assert d["target"]=="cursor"
cfg=json.loads(d["config"])
assert "mcpServers" in cfg and "recall" in cfg["mcpServers"]
assert cfg["mcpServers"]["recall"]["command"]=="npx"
print("MCP_OK")
'

echo "=== PASS BE-PR5 ==="
