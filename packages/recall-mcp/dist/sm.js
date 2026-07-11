/**
 * Minimal Supermemory Local HTTP client for the MCP process.
 * Isolated from the Next.js app — only talks to localhost:6767 (or RECALL_SM_URL).
 */
export function loadConfig() {
    return {
        url: (process.env.RECALL_SM_URL || process.env.SUPERMEMORY_BASE_URL || "http://localhost:6767").replace(/\/$/, ""),
        apiKey: process.env.RECALL_SM_API_KEY ||
            process.env.RECALL_API_KEY ||
            process.env.SUPERMEMORY_API_KEY ||
            "",
        container: process.env.RECALL_CONTAINER || "recall_user",
    };
}
async function smFetch(path, init = {}) {
    const cfg = loadConfig();
    const headers = new Headers(init.headers);
    if (cfg.apiKey)
        headers.set("Authorization", `Bearer ${cfg.apiKey}`);
    if (init.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }
    return fetch(`${cfg.url}${path.startsWith("/") ? path : `/${path}`}`, {
        ...init,
        headers,
    });
}
export async function smSearch(query, limit = 8) {
    const cfg = loadConfig();
    const res = await smFetch("/v4/search", {
        method: "POST",
        body: JSON.stringify({
            q: query,
            limit,
            containerTag: cfg.container,
            searchMode: "hybrid",
        }),
    });
    if (!res.ok) {
        throw new Error(`SM search failed ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }
    const data = (await res.json());
    const results = data.results ?? [];
    return results.map((r) => {
        const meta = (r.metadata || {});
        const text = String(r.memory || r.chunk || r.content || "").trim();
        return {
            id: typeof r.id === "string" ? r.id : undefined,
            text,
            score: typeof r.similarity === "number" ? r.similarity : Number(r.score) || 0,
            source: typeof meta.source === "string" ? meta.source : undefined,
            type: typeof meta.type === "string" ? meta.type : undefined,
            recallMemoryId: typeof meta.recallMemoryId === "string" ? meta.recallMemoryId : undefined,
        };
    });
}
export async function smAdd(content, customId) {
    const cfg = loadConfig();
    const res = await smFetch("/v3/documents", {
        method: "POST",
        body: JSON.stringify({
            content,
            customId,
            containerTag: cfg.container,
            metadata: {
                source: "mcp",
                type: "fact",
                via: "recall_remember",
            },
        }),
    });
    if (!res.ok) {
        throw new Error(`SM add failed ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }
    return (await res.json());
}
export async function smDelete(id) {
    const res = await smFetch(`/v3/documents/${encodeURIComponent(id)}`, {
        method: "DELETE",
    });
    if (!res.ok && res.status !== 204) {
        throw new Error(`SM delete failed ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }
}
export async function smList(limit = 20) {
    const cfg = loadConfig();
    const res = await smFetch("/v3/documents/list", {
        method: "POST",
        body: JSON.stringify({
            containerTags: [cfg.container],
            limit,
            page: 1,
        }),
    });
    if (!res.ok) {
        throw new Error(`SM list failed ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }
    const data = (await res.json());
    return data.memories ?? [];
}
/** Prefer app context-pack when RECALL_APP_URL is set; else synthesize from SM. */
export async function buildContext(query) {
    const appBase = (process.env.RECALL_APP_URL || "").replace(/\/$/, "");
    if (appBase && !query) {
        try {
            const res = await fetch(`${appBase}/api/context-pack?variant=compact`, {
                cache: "no-store",
            });
            if (res.ok) {
                const data = (await res.json());
                if (data.content)
                    return data.content;
            }
        }
        catch {
            /* fall through */
        }
    }
    const q = (query || "current project preferences decisions constraints goals").trim();
    const hits = await smSearch(q, 12);
    if (hits.length === 0) {
        const listed = await smList(10);
        if (listed.length === 0) {
            return "RECALL has no memories yet. Import history in the app or use recall_remember.";
        }
        return [
            "## RECALL context",
            ...listed.map((m) => `- ${m.title || m.summary || m.id}`),
        ].join("\n");
    }
    return [
        "## RECALL context",
        query ? `(query: ${query})` : "",
        ...hits.map((h) => {
            const tag = [h.source, h.type].filter(Boolean).join("/");
            return `- ${h.text}${tag ? ` (${tag})` : ""}`;
        }),
    ]
        .filter(Boolean)
        .join("\n");
}
