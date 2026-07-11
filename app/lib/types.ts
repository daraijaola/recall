export type MemoryType =
  | "preference"
  | "decision"
  | "fact"
  | "goal"
  | "constraint"
  | "project_state"
  | "skill"
  | "correction"
  | "opinion"
  | "workflow";

export type Source =
  | "chatgpt"
  | "claude"
  | "grok"
  | "claude_code"
  | "cursor"
  | "generic";

export type AppLogoId = Source | "windsurf" | "gemini" | "supermemory";

export type RelationKind = "updates" | "contradicts" | "supports" | "extends";

export interface MemoryNode {
  id: string;
  smDocId: string;
  type: MemoryType;
  source: Source;
  contentPreview: string;
  confidence: number;
  validFrom: string;
  validUntil: string | null;
  supersededBy: string | null;
  version: number;
  createdAt: string;
}

export interface RelationEdge {
  id: string;
  from: string;
  to: string;
  kind: RelationKind;
}

export type ConflictResolution = "keep_new" | "keep_old" | "keep_both";

export interface ContradictionCard {
  id: string;
  newMemory: MemoryNode;
  oldMemory: MemoryNode;
  explanation: string;
  status: "open" | "resolved";
  resolution?: ConflictResolution;
  resolvedAt?: string;
}

export interface HealthResponse {
  smConnected: boolean;
  dbReady: boolean;
  memoryCount: number;
}

export interface StatsResponse {
  bySource: Record<Source, number>;
  byType: Record<MemoryType, number>;
  total: number;
  superseded: number;
  expired: number;
  contradictions: number;
}

export interface GraphResponse {
  nodes: MemoryNode[];
  edges: RelationEdge[];
}

export interface MemoryDetailResponse {
  memory: MemoryNode;
  versionChain: MemoryNode[];
  relations: RelationEdge[];
  sourceConversation: {
    title: string;
    source: Source;
    date: string;
  };
}

export type ImportStage = "parsing" | "extracting" | "relating" | "done" | "error";

export interface ImportProgress {
  importId: string;
  stage: ImportStage;
  percent: number;
  message: string;
  fileName: string;
  source: Source;
  convCount?: number;
  memoryCount?: number;
}

export interface ImportRecord {
  id: string;
  source: Source;
  fileName: string;
  convCount: number;
  memoryCount: number;
  status: "completed" | "failed";
  createdAt: string;
}

export type ContextPackVariant = "compact" | "full";

export interface ContextPackResponse {
  variant: ContextPackVariant;
  content: string;
  charCount: number;
  limit?: number;
}

export type McpTargetId = "claude_desktop" | "claude_code" | "cursor" | "windsurf";

export interface McpConfigResponse {
  target: McpTargetId;
  config: string;
}

export type GeneratedFileKind = "claude_md" | "cursorrules" | "agents_md";

export interface GeneratedFileResponse {
  kind: GeneratedFileKind;
  filename: string;
  content: string;
}

export interface SearchFilters {
  source?: Source | "all";
  type?: MemoryType | "all";
}

export interface SearchHit {
  memory: MemoryNode;
  score: number;
  snippet: string;
  /** Present when score came from Supermemory hybrid search */
  via?: "supermemory-hybrid" | "local";
}

export interface SearchResponse {
  query: string;
  hits: SearchHit[];
  total: number;
  tookMs: number;
  /** Which engine produced primary hits */
  engine?: "supermemory-hybrid" | "local" | "mixed";
  smHitCount?: number;
}

/** Supermemory Local /v4/profile — the engine's own intelligence layer */
export interface ProfileResponse {
  static: string[];
  dynamic: string[];
  container: string;
  smConnected: boolean;
}

export interface SetupStatusResponse {
  connected: boolean;
  url: string;
  container: string;
  databasePath: string;
  apiKey: string;
  apiKeyMasked: string;
  version: string;
  embeddingModel: string;
  memoryCount: number;
  uptime: string;
}

export interface SetupTestResponse {
  ok: boolean;
  message: string;
  latencyMs: number;
}