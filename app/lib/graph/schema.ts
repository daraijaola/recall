/**
 * RECALL graph index schema (PDF §4.3).
 * SM owns storage/embeddings/search; SQLite is the thin structure layer.
 */

export const GRAPH_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  sm_doc_id TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  source TEXT NOT NULL,
  content_preview TEXT NOT NULL,
  confidence REAL NOT NULL DEFAULT 0.5,
  valid_from TEXT NOT NULL,
  valid_until TEXT,
  superseded_by TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_memories_source ON memories(source);
CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
CREATE INDEX IF NOT EXISTS idx_memories_sm_doc_id ON memories(sm_doc_id);

CREATE TABLE IF NOT EXISTS relations (
  id TEXT PRIMARY KEY,
  from_memory TEXT NOT NULL,
  to_memory TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('updates', 'contradicts', 'supports', 'extends')),
  FOREIGN KEY (from_memory) REFERENCES memories(id),
  FOREIGN KEY (to_memory) REFERENCES memories(id)
);

CREATE INDEX IF NOT EXISTS idx_relations_from ON relations(from_memory);
CREATE INDEX IF NOT EXISTS idx_relations_to ON relations(to_memory);
CREATE INDEX IF NOT EXISTS idx_relations_kind ON relations(kind);

CREATE TABLE IF NOT EXISTS imports (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  file_name TEXT NOT NULL,
  conv_count INTEGER NOT NULL DEFAULT 0,
  memory_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('completed', 'failed', 'running')),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_imports_created ON imports(created_at);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Contradiction cards (hero demo: cross-platform disagree)
CREATE TABLE IF NOT EXISTS contradictions (
  id TEXT PRIMARY KEY,
  relation_id TEXT NOT NULL,
  new_memory_id TEXT NOT NULL,
  old_memory_id TEXT NOT NULL,
  explanation TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'resolved')),
  resolution TEXT,
  resolved_at TEXT,
  FOREIGN KEY (new_memory_id) REFERENCES memories(id),
  FOREIGN KEY (old_memory_id) REFERENCES memories(id)
);

CREATE INDEX IF NOT EXISTS idx_contradictions_status ON contradictions(status);
`;
