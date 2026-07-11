#!/bin/bash
cd ~/recall-app
node <<'NODE'
const Database = require('better-sqlite3');
const d = new Database('data/recall.db');
console.log('=== contradicts ===');
console.log(d.prepare("select * from relations where kind='contradicts'").all());
console.log('=== memories ===');
for (const r of d.prepare('select id,source,type,substr(content_preview,1,90) t, valid_from from memories order by valid_from').all()) {
  console.log(r);
}
NODE
KEY=$(sed -n 's/^RECALL_SM_API_KEY=//p' .env.local)
echo "=== SM search TypeScript ==="
curl -sS -X POST http://localhost:6767/v4/search \
  -H "Authorization: Bearer $KEY" \
  -H 'content-type: application/json' \
  -d '{"q":"TypeScript backend","containerTag":"recall_user","limit":5,"searchMode":"hybrid"}' | head -c 1200
echo
