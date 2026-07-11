/**
 * Supermemory Local adapter — all SM HTTP quirks live here.
 * baseURL defaults to http://localhost:6767 (self-hosted).
 */

import { getSetting, setSetting } from "./db";

export type SmConfig = {
  url: string;
  apiKey: string;
  container: string;
};

export type SmListResult = {
  memories: Array<Record<string, unknown>>;
  pagination: {
    currentPage: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
};

function env(name: string, fallback = ""): string {
  return (process.env[name] ?? fallback).trim();
}

/** Resolve runtime SM config (env + optional setup-persisted API key). */
export function getSmConfig(): SmConfig {
  const storedKey = getSetting("sm_api_key");
  return {
    url: env("RECALL_SM_URL", "http://localhost:6767").replace(/\/$/, ""),
    apiKey: storedKey || env("RECALL_SM_API_KEY") || env("RECALL_API_KEY"),
    container: env("RECALL_CONTAINER", "recall_user"),
  };
}

export function persistSmApiKey(apiKey: string): void {
  setSetting("sm_api_key", apiKey.trim());
}

export function maskApiKey(apiKey: string): string {
  const k = apiKey.trim();
  if (!k) return "";
  if (k.length <= 6) return "••••";
  return `${k.slice(0, 3)}••••••••••••${k.slice(-2)}`;
}

async function smFetch(
  path: string,
  init: RequestInit = {},
  config: SmConfig = getSmConfig(),
): Promise<Response> {
  const url = `${config.url}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init.headers);
  if (config.apiKey) {
    headers.set("Authorization", `Bearer ${config.apiKey}`);
  }
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });
}

/** Lightweight connectivity check — SM root returns HTML when online. */
export async function pingSm(config: SmConfig = getSmConfig()): Promise<{
  ok: boolean;
  latencyMs: number;
  status: number;
}> {
  const started = Date.now();
  try {
    const res = await fetch(config.url, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    return { ok: res.ok || res.status < 500, latencyMs: Date.now() - started, status: res.status };
  } catch {
    return { ok: false, latencyMs: Date.now() - started, status: 0 };
  }
}

/** Count documents in the RECALL container via POST /v3/documents/list. */
export async function countSmMemories(
  config: SmConfig = getSmConfig(),
): Promise<{ ok: boolean; count: number; error?: string }> {
  if (!config.apiKey) {
    return { ok: false, count: 0, error: "missing API key" };
  }
  try {
    const res = await smFetch(
      "/v3/documents/list",
      {
        method: "POST",
        body: JSON.stringify({
          containerTags: [config.container],
          limit: 1,
          page: 1,
        }),
      },
      config,
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, count: 0, error: `list ${res.status}: ${text.slice(0, 120)}` };
    }
    const data = (await res.json()) as SmListResult;
    const total = data?.pagination?.totalItems ?? data?.memories?.length ?? 0;
    return { ok: true, count: Number(total) || 0 };
  } catch (e) {
    return { ok: false, count: 0, error: e instanceof Error ? e.message : "list failed" };
  }
}

/** Full health probe used by /api/health and /api/setup. */
export async function probeSm(): Promise<{
  smConnected: boolean;
  memoryCount: number;
  latencyMs: number;
  error?: string;
}> {
  const config = getSmConfig();
  const ping = await pingSm(config);
  if (!ping.ok) {
    return {
      smConnected: false,
      memoryCount: 0,
      latencyMs: ping.latencyMs,
      error: "Could not reach Supermemory Local",
    };
  }

  const listed = await countSmMemories(config);
  // Reachable root is enough for "connected"; list may fail if key wrong.
  if (!listed.ok) {
    // Auth probe: try authenticated list failure vs pure reachability
    if (listed.error?.includes("401") || listed.error?.includes("Unauthorized")) {
      return {
        smConnected: false,
        memoryCount: 0,
        latencyMs: ping.latencyMs,
        error: "Unauthorized — check API key",
      };
    }
    // Still mark connected if server is up; count 0 on list quirks
    return {
      smConnected: true,
      memoryCount: 0,
      latencyMs: ping.latencyMs,
      error: listed.error,
    };
  }

  return {
    smConnected: true,
    memoryCount: listed.count,
    latencyMs: ping.latencyMs,
  };
}

/** Add a document (used by later PRs; available for smoke tests). */
export async function addDocument(input: {
  content: string;
  customId?: string;
  metadata?: Record<string, string | number | boolean>;
  containerTag?: string;
}): Promise<{ id: string; status: string }> {
  const config = getSmConfig();
  const res = await smFetch("/v3/documents", {
    method: "POST",
    body: JSON.stringify({
      content: input.content,
      customId: input.customId,
      metadata: input.metadata,
      containerTag: input.containerTag ?? config.container,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`SM add failed ${res.status}: ${text.slice(0, 200)}`);
  }
  return (await res.json()) as { id: string; status: string };
}

/** Hybrid search — Supermemory Local intelligence (embeddings + keyword). */
export async function searchMemoriesSm(input: {
  q: string;
  limit?: number;
  containerTag?: string;
}): Promise<unknown> {
  const config = getSmConfig();
  const res = await smFetch("/v4/search", {
    method: "POST",
    body: JSON.stringify({
      q: input.q,
      limit: input.limit ?? 10,
      containerTag: input.containerTag ?? config.container,
      searchMode: "hybrid",
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`SM search failed ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

export type SmProfile = {
  static: string[];
  dynamic: string[];
  container: string;
  raw?: unknown;
};

/** User profile from Supermemory Local (/v4/profile) — static + dynamic memory. */
export async function fetchSmProfile(): Promise<SmProfile> {
  const config = getSmConfig();
  const res = await smFetch("/v4/profile", {
    method: "POST",
    body: JSON.stringify({ containerTag: config.container }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`SM profile failed ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    profile?: { static?: string[]; dynamic?: string[] };
    static?: string[];
    dynamic?: string[];
  };
  const p = data.profile ?? data;
  return {
    static: Array.isArray(p.static) ? p.static : [],
    dynamic: Array.isArray(p.dynamic) ? p.dynamic : [],
    container: config.container,
    raw: data,
  };
}
