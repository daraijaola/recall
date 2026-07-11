import type {
  ConflictResolution,
  ContextPackResponse,
  ContextPackVariant,
  ContradictionCard,
  GeneratedFileKind,
  GeneratedFileResponse,
  GraphResponse,
  HealthResponse,
  ImportProgress,
  ImportRecord,
  McpConfigResponse,
  McpTargetId,
  MemoryDetailResponse,
  MemoryNode,
  RelationEdge,
  SearchFilters,
  SearchHit,
  SearchResponse,
  SetupStatusResponse,
  SetupTestResponse,
  Source,
  StatsResponse,
} from "./types";

import { APP_BASE } from "./constants";

// Use the subpath base for API calls (app is served under /sites/recall/app)
const API = (p: string) => `${APP_BASE}${p.startsWith("/") ? p : "/" + p}`;

const nodes: MemoryNode[] = [
  {
    id: "m1",
    smDocId: "sm_001",
    type: "preference",
    source: "chatgpt",
    contentPreview: "Prefer Python for backend work",
    confidence: 0.82,
    validFrom: "2026-03-14",
    validUntil: null,
    supersededBy: "m2",
    version: 1,
    createdAt: "2026-03-14T10:00:00Z",
  },
  {
    id: "m2",
    smDocId: "sm_002",
    type: "decision",
    source: "claude",
    contentPreview: "All-in on TypeScript for the backend",
    confidence: 0.91,
    validFrom: "2026-06-12",
    validUntil: null,
    supersededBy: null,
    version: 2,
    createdAt: "2026-06-12T15:30:00Z",
  },
  {
    id: "m3",
    smDocId: "sm_003",
    type: "constraint",
    source: "claude",
    contentPreview: "API ship deadline: Friday",
    confidence: 0.88,
    validFrom: "2026-06-12",
    validUntil: "2026-06-20",
    supersededBy: null,
    version: 1,
    createdAt: "2026-06-12T15:31:00Z",
  },
  {
    id: "m4",
    smDocId: "sm_004",
    type: "preference",
    source: "claude_code",
    contentPreview: "Strict mode enabled for TypeScript",
    confidence: 0.86,
    validFrom: "2026-05-02",
    validUntil: null,
    supersededBy: null,
    version: 1,
    createdAt: "2026-05-02T09:00:00Z",
  },
  {
    id: "m5",
    smDocId: "sm_005",
    type: "project_state",
    source: "cursor",
    contentPreview: "Building RECALL for Supermemory hackathon",
    confidence: 0.93,
    validFrom: "2026-07-09",
    validUntil: null,
    supersededBy: null,
    version: 1,
    createdAt: "2026-07-09T12:00:00Z",
  },
  {
    id: "m6",
    smDocId: "sm_006",
    type: "goal",
    source: "grok",
    contentPreview: "Ship demo video by July 13",
    confidence: 0.79,
    validFrom: "2026-07-10",
    validUntil: null,
    supersededBy: null,
    version: 1,
    createdAt: "2026-07-10T08:00:00Z",
  },
  {
    id: "m7",
    smDocId: "sm_007",
    type: "skill",
    source: "chatgpt",
    contentPreview: "Experienced with Next.js App Router",
    confidence: 0.84,
    validFrom: "2026-02-01",
    validUntil: null,
    supersededBy: null,
    version: 1,
    createdAt: "2026-02-01T11:00:00Z",
  },
  {
    id: "m8",
    smDocId: "sm_008",
    type: "workflow",
    source: "claude_code",
    contentPreview: "Run typecheck before every commit",
    confidence: 0.77,
    validFrom: "2026-04-18",
    validUntil: null,
    supersededBy: null,
    version: 1,
    createdAt: "2026-04-18T16:00:00Z",
  },
  {
    id: "m9",
    smDocId: "sm_009",
    type: "correction",
    source: "cursor",
    contentPreview: "Webhook path is /api/v2/events not /webhook",
    confidence: 0.9,
    validFrom: "2026-06-01",
    validUntil: null,
    supersededBy: null,
    version: 1,
    createdAt: "2026-06-01T14:00:00Z",
  },
  {
    id: "m10",
    smDocId: "sm_010",
    type: "opinion",
    source: "grok",
    contentPreview: "Local-first beats cloud for personal memory",
    confidence: 0.72,
    validFrom: "2026-07-08",
    validUntil: null,
    supersededBy: null,
    version: 1,
    createdAt: "2026-07-08T20:00:00Z",
  },
];

const edges: RelationEdge[] = [
  { id: "e1", from: "m1", to: "m2", kind: "contradicts" },
  { id: "e2", from: "m2", to: "m3", kind: "supports" },
  { id: "e3", from: "m2", to: "m4", kind: "extends" },
  { id: "e4", from: "m5", to: "m6", kind: "supports" },
  { id: "e5", from: "m7", to: "m5", kind: "supports" },
];

const contradictions: ContradictionCard[] = [
  {
    id: "c1",
    newMemory: nodes[1],
    oldMemory: nodes[0],
    explanation: "ChatGPT said Python; Claude said TypeScript for backend.",
    status: "open",
  },
  {
    id: "c2",
    newMemory: nodes[8],
    oldMemory: nodes[9],
    explanation: "Grok said cloud-first; Cursor logged a local-first preference.",
    status: "resolved",
    resolution: "keep_new",
    resolvedAt: "2026-07-08T18:00:00Z",
  },
];

export async function fetchHealth(): Promise<HealthResponse> {
  try {
    const res = await fetch(API("/api/health"), { cache: "no-store" });
    if (!res.ok) throw new Error("health fetch failed");
    return (await res.json()) as HealthResponse;
  } catch (e) {
    // graceful fallback so UI doesn't break while SM is booting
    return { smConnected: false, dbReady: false, memoryCount: 0 };
  }
}

export async function fetchStats(): Promise<StatsResponse> {
  try {
    const res = await fetch(API("/api/stats"), { cache: "no-store" });
    if (!res.ok) throw new Error("stats failed");
    return (await res.json()) as StatsResponse;
  } catch {
    return {
      total: 0,
      superseded: 0,
      expired: 0,
      contradictions: 0,
      bySource: {
        chatgpt: 0,
        claude: 0,
        grok: 0,
        claude_code: 0,
        cursor: 0,
        generic: 0,
      },
      byType: {
        preference: 0,
        decision: 0,
        fact: 0,
        goal: 0,
        constraint: 0,
        project_state: 0,
        skill: 0,
        correction: 0,
        opinion: 0,
        workflow: 0,
      },
    };
  }
}

export async function fetchGraph(): Promise<GraphResponse> {
  try {
    const res = await fetch(API("/api/graph"), { cache: "no-store" });
    if (!res.ok) throw new Error("graph failed");
    return (await res.json()) as GraphResponse;
  } catch {
    return { nodes: [], edges: [] };
  }
}

export async function fetchContradictions(): Promise<ContradictionCard[]> {
  try {
    const res = await fetch(API("/api/contradictions?status=open"), { cache: "no-store" });
    if (!res.ok) throw new Error("contradictions failed");
    const data = (await res.json()) as ContradictionCard[];
    return Array.isArray(data) ? data.filter((c) => c.status === "open") : [];
  } catch {
    return [];
  }
}

export async function fetchAllContradictions(): Promise<ContradictionCard[]> {
  try {
    const res = await fetch(API("/api/contradictions?status=all"), { cache: "no-store" });
    if (!res.ok) throw new Error("contradictions failed");
    const data = (await res.json()) as ContradictionCard[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function resolveContradiction(
  id: string,
  resolution: ConflictResolution,
): Promise<ContradictionCard | null> {
  try {
    const res = await fetch(API(`/api/contradictions/${encodeURIComponent(id)}/resolve`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolution }),
    });
    if (!res.ok) return null;
    return (await res.json()) as ContradictionCard;
  } catch {
    return null;
  }
}

export async function fetchMemoryDetail(id: string): Promise<MemoryDetailResponse | null> {
  try {
    const res = await fetch(API(`/api/memories/${encodeURIComponent(id)}`), {
      cache: "no-store",
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("memory detail failed");
    return (await res.json()) as MemoryDetailResponse;
  } catch {
    return null;
  }
}

/** Real import pipeline — multipart upload + polled progress. */
export async function fetchImports(): Promise<ImportRecord[]> {
  try {
    const res = await fetch(API("/api/imports"), { cache: "no-store" });
    if (!res.ok) throw new Error("imports fetch failed");
    const data = (await res.json()) as { imports?: ImportRecord[] } | ImportRecord[];
    if (Array.isArray(data)) return data;
    return data.imports ?? [];
  } catch {
    return [];
  }
}

export async function startImport(
  file: File | string,
  sourceHint?: Source,
): Promise<{ importId: string }> {
  // Back-compat: string filename alone cannot upload content
  if (typeof file === "string") {
    throw new Error("startImport requires a File object (upload content to /api/import)");
  }

  const form = new FormData();
  form.append("file", file, file.name);
  if (sourceHint) form.append("source", sourceHint);

  const res = await fetch(API("/api/import"), {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `import failed (${res.status})`);
  }
  return (await res.json()) as { importId: string };
}

export async function fetchImportProgress(importId: string): Promise<ImportProgress | null> {
  try {
    const res = await fetch(API(`/api/import/${encodeURIComponent(importId)}/progress`), {
      cache: "no-store",
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("progress fetch failed");
    return (await res.json()) as ImportProgress;
  } catch {
    return null;
  }
}

const COMPACT_PACK = `## Constraints
- API ship deadline: Friday (expires Jun 20)

## Preferences
- All-in on TypeScript for the backend (strict mode)
- Experienced with Next.js App Router

## Project
- Building RECALL for Supermemory hackathon — demo due July 13

## Workflow
- Run typecheck before every commit

## Goals
- Ship demo video by July 13`;

const FULL_PACK = `# RECALL — Your portable memory

## Active constraints
- API ship deadline: Friday

## Preferences & decisions
- Backend stack: TypeScript (strict mode) — supersedes earlier Python preference
- Prefer structured memory over raw chat dumps

## Project state
- Building RECALL for Supermemory Local hackathon
- Webhook path is /api/v2/events (not /webhook)

## Skills & workflow
- Experienced with Next.js App Router
- Run typecheck before every commit
- Local-first beats cloud for personal memory

## Goals
- Ship demo video by July 13

---
Generated from 847 memories · container: recall_user · active only`;

const MCP_BASE = {
  command: "npx",
  args: ["-y", "recall-mcp"],
  env: {
    RECALL_SM_URL: "http://localhost:6767",
    RECALL_CONTAINER: "recall_user",
  },
};

function mcpJson(target: McpTargetId): string {
  const wrapped =
    target === "claude_desktop"
      ? { mcpServers: { recall: MCP_BASE } }
      : target === "claude_code"
        ? { mcpServers: { recall: MCP_BASE } }
        : target === "cursor"
          ? { mcpServers: { recall: MCP_BASE } }
          : { mcpServers: { recall: MCP_BASE } };

  return JSON.stringify(wrapped, null, 2);
}

const GENERATED: Record<GeneratedFileKind, GeneratedFileResponse> = {
  claude_md: {
    kind: "claude_md",
    filename: "CLAUDE.md",
    content: `# Project context (from RECALL)

## Stack
- TypeScript backend, strict mode enabled
- Next.js App Router

## Constraints
- API ship deadline: Friday

## Current work
- Building RECALL — portable AI memory on Supermemory Local

## Workflow
- Run typecheck before every commit
`,
  },
  cursorrules: {
    kind: "cursorrules",
    filename: ".cursorrules",
    content: `# RECALL-injected rules

- Prefer TypeScript with strict mode for backend work
- Webhook path is /api/v2/events not /webhook
- Run typecheck before every commit
- Building RECALL for Supermemory hackathon (demo July 13)
`,
  },
  agents_md: {
    kind: "agents_md",
    filename: "AGENTS.md",
    content: `# Agent instructions (RECALL)

You have access to the user's structured memory via RECALL MCP.

## Known preferences
- TypeScript backend, strict mode
- Next.js App Router experience

## Active project
- RECALL hackathon — local-first memory on Supermemory

## Tools
Use recall_search and recall_context before assuming user history.
`,
  },
};

export async function fetchContextPack(
  variant: ContextPackVariant = "compact",
): Promise<ContextPackResponse> {
  try {
    const res = await fetch(API(`/api/context-pack?variant=${variant}`), { cache: "no-store" });
    if (!res.ok) throw new Error("context-pack failed");
    return (await res.json()) as ContextPackResponse;
  } catch {
    return {
      variant,
      content: "## RECALL\n- Could not load context pack. Is the app server running?",
      charCount: 0,
      limit: variant === "compact" ? 1500 : undefined,
    };
  }
}

export async function fetchMcpConfig(target: McpTargetId): Promise<McpConfigResponse> {
  try {
    const res = await fetch(API(`/api/mcp-config?target=${target}`), { cache: "no-store" });
    if (!res.ok) throw new Error("mcp-config failed");
    return (await res.json()) as McpConfigResponse;
  } catch {
    return {
      target,
      config: JSON.stringify(
        {
          mcpServers: {
            recall: {
              command: "npx",
              args: ["-y", "recall-mcp"],
              env: {
                RECALL_SM_URL: "http://localhost:6767",
                RECALL_CONTAINER: "recall_user",
              },
            },
          },
        },
        null,
        2,
      ),
    };
  }
}

export async function fetchGeneratedFile(kind: GeneratedFileKind): Promise<GeneratedFileResponse> {
  try {
    const res = await fetch(API(`/api/generate-file?kind=${kind}`), { cache: "no-store" });
    if (!res.ok) throw new Error("generate-file failed");
    return (await res.json()) as GeneratedFileResponse;
  } catch {
    const names: Record<GeneratedFileKind, string> = {
      claude_md: "CLAUDE.md",
      cursorrules: ".cursorrules",
      agents_md: "AGENTS.md",
    };
    return { kind, filename: names[kind], content: "# RECALL\n\nCould not generate file.\n" };
  }
}

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

function scoreMemory(memory: MemoryNode, terms: string[]): number {
  if (terms.length === 0) return 0;
  const haystack = memory.contentPreview.toLowerCase();
  let hits = 0;
  for (const term of terms) {
    if (haystack.includes(term)) hits += 1;
  }
  if (hits === 0) return 0;
  return hits / terms.length + memory.confidence * 0.15;
}

function buildSnippet(text: string, terms: string[]): string {
  const lower = text.toLowerCase();
  const idx = terms
    .map((t) => lower.indexOf(t))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b)[0];
  if (idx === undefined) return text;
  const start = Math.max(0, idx - 24);
  const end = Math.min(text.length, idx + 64);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";
  return `${prefix}${text.slice(start, end)}${suffix}`;
}

const SETUP_CONFIG = {
  url: "http://localhost:6767",
  container: "recall_user",
  databasePath: "./.supermemory",
  apiKey: "sm_local_demo_key_7f3a9c2e",
  apiKeyMasked: "sm_••••••••••••2e",
  version: "0.4.2",
  embeddingModel: "text-embedding-3-small",
  uptime: "2h 14m",
};

export async function fetchSetupStatus(): Promise<SetupStatusResponse> {
  try {
    const res = await fetch(API("/api/setup"), { cache: "no-store" });
    if (!res.ok) throw new Error("setup status fetch failed");
    return (await res.json()) as SetupStatusResponse;
  } catch (e) {
    const health = await fetchHealth();
    return {
      connected: health.smConnected,
      url: "http://localhost:6767",
      container: "recall_user",
      databasePath: "./recall.db",
      apiKey: "",
      apiKeyMasked: "",
      version: "local",
      embeddingModel: "text-embedding-3-small",
      memoryCount: health.memoryCount,
      uptime: "up",
    };
  }
}

export async function saveSetupApiKey(apiKey: string): Promise<{ ok: boolean }> {
  try {
    const res = await fetch(API("/api/setup"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
    });
    if (!res.ok) return { ok: false };
    const data = await res.json();
    return { ok: !!data.ok };
  } catch {
    return { ok: false };
  }
}

export async function testSmConnection(): Promise<SetupTestResponse> {
  const started = Date.now();
  try {
    const res = await fetch(API("/api/setup"), { cache: "no-store" });
    const data = await res.json();
    const latencyMs = Date.now() - started;
    if (!data.connected) {
      return {
        ok: false,
        message: "Could not reach Supermemory Local at localhost:6767",
        latencyMs,
      };
    }
    return {
      ok: true,
      message: `Connected · ${data.memoryCount?.toLocaleString?.() ?? 0} memories in ${data.container || "recall_user"}`,
      latencyMs,
    };
  } catch {
    const latencyMs = Date.now() - started;
    return {
      ok: false,
      message: "Could not reach Supermemory Local at localhost:6767",
      latencyMs,
    };
  }
}

export function buildSetupEnv(): string {
  return [
    `RECALL_SM_URL=${SETUP_CONFIG.url}`,
    `RECALL_CONTAINER=${SETUP_CONFIG.container}`,
    `RECALL_API_KEY=${SETUP_CONFIG.apiKey}`,
  ].join("\n");
}

export async function searchMemories(
  query: string,
  filters: SearchFilters = {},
): Promise<SearchResponse> {
  try {
    const params = new URLSearchParams();
    params.set("q", query);
    if (filters.source && filters.source !== "all") params.set("source", filters.source);
    if (filters.type && filters.type !== "all") params.set("type", filters.type);
    const res = await fetch(API(`/api/search?${params.toString()}`), { cache: "no-store" });
    if (!res.ok) throw new Error("search failed");
    return (await res.json()) as SearchResponse;
  } catch {
    return { query, hits: [], total: 0, tookMs: 0 };
  }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}