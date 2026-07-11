"use client";

import useSWR from "swr";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { fetchHealth, fetchMemoryDetail, searchMemories } from "@/lib/mock-api";
import type { MemoryType, Source } from "@/lib/types";
import { SEARCH_SUGGESTIONS, SEARCH_TYPE_FILTERS, TYPE_LABELS } from "@/lib/constants";
import { SOURCE_FILTERS } from "@/components/dashboard/MemoryList";
import { AppShell } from "@/components/shell/AppShell";
import { PageIntro } from "@/components/shell/PageIntro";
import { SourceLogo } from "@/components/ui/SourceLogo";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightText({ text, query }: { text: string; query: string }) {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);

  if (terms.length === 0) return <>{text}</>;

  const pattern = new RegExp(`(${terms.map(escapeRegex).join("|")})`, "gi");
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, i) =>
        terms.some((t) => part.toLowerCase() === t) ? (
          <mark key={i} className="search-hit-mark">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export function SearchClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<Source | "all">("all");
  const [typeFilter, setTypeFilter] = useState<MemoryType | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: health } = useSWR("health", fetchHealth);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 280);
    return () => window.clearTimeout(timer);
  }, [query]);

  const canSearch = debouncedQuery.length >= 2;
  const swrKey = canSearch
    ? `search-${debouncedQuery}-${sourceFilter}-${typeFilter}`
    : null;

  const { data: results, isLoading } = useSWR(swrKey, () =>
    searchMemories(debouncedQuery, { source: sourceFilter, type: typeFilter }),
  );

  const { data: detail, isLoading: detailLoading } = useSWR(
    selectedId ? `search-detail-${selectedId}` : null,
    () => (selectedId ? fetchMemoryDetail(selectedId) : null),
  );

  const topScore = results?.hits[0]?.score ?? 0;

  const resultLabel = useMemo(() => {
    if (!canSearch) return null;
    if (isLoading) return "Searching…";
    if (!results) return null;
    if (results.total === 0) return `No matches for “${debouncedQuery}”`;
    return `${results.total} result${results.total === 1 ? "" : "s"} · ${results.tookMs}ms`;
  }, [canSearch, isLoading, results, debouncedQuery]);

  function applySuggestion(term: string) {
    setQuery(term);
    setSelectedId(null);
    inputRef.current?.focus();
  }

  function clearSearch() {
    setQuery("");
    setDebouncedQuery("");
    setSelectedId(null);
    inputRef.current?.focus();
  }

  return (
    <AppShell health={health}>
      <div className="search-page">
        <PageIntro
          title="Search"
          description="Find anything RECALL knows — across every app you've imported."
        />

        <div className="search-box">
          <label className="search-label" htmlFor="memory-search">
            Search your memory
          </label>
          <div className="search-input-row">
            <input
              ref={inputRef}
              id="memory-search"
              type="search"
              className="search-input"
              placeholder="Try “TypeScript”, “deadline”, or “hackathon”"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedId(null);
              }}
              autoComplete="off"
              spellCheck={false}
            />
            {query.length > 0 && (
              <button type="button" className="btn ghost search-clear" onClick={clearSearch}>
                Clear
              </button>
            )}
          </div>

          <div className="search-suggestions">
            <span className="search-suggestions-label">Try</span>
            {SEARCH_SUGGESTIONS.map((term) => (
              <button
                key={term}
                type="button"
                className="pill"
                onClick={() => applySuggestion(term)}
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        <div className="search-filters">
          <div className="search-filter-group">
            <span className="search-filter-label">App</span>
            <div className="filter-pills" role="tablist" aria-label="Filter by app">
              {SOURCE_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={sourceFilter === f.id}
                  className={`pill${sourceFilter === f.id ? " active" : ""}`}
                  onClick={() => {
                    setSourceFilter(f.id);
                    setSelectedId(null);
                  }}
                >
                  {f.id !== "all" ? (
                    <span className="search-pill-logo">
                      <SourceLogo source={f.id} size={14} />
                    </span>
                  ) : null}
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="search-filter-group">
            <span className="search-filter-label">Type</span>
            <div className="filter-pills" role="tablist" aria-label="Filter by memory type">
              {SEARCH_TYPE_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={typeFilter === f.id}
                  className={`pill${typeFilter === f.id ? " active" : ""}`}
                  onClick={() => {
                    setTypeFilter(f.id);
                    setSelectedId(null);
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {!canSearch ? (
          <div className="search-idle">
            <p className="search-idle-title">
              {health?.memoryCount
                ? `Search across ${health.memoryCount.toLocaleString()} memories`
                : "Search your RECALL memory"}
            </p>
            <p className="muted">
              Hybrid search on Supermemory Local — same engine as <code className="inline-code">recall_search</code> in MCP.
            </p>
          </div>
        ) : (
          <>
            {resultLabel && <p className="search-meta">{resultLabel}</p>}

            {results && results.total > 0 && (
              <ul className="search-results">
                {results.hits.map((hit) => {
                  const matchPct = topScore > 0 ? Math.round((hit.score / topScore) * 100) : 0;
                  const expanded = selectedId === hit.memory.id;

                  return (
                    <li key={hit.memory.id} className={`search-result${expanded ? " expanded" : ""}`}>
                      <button
                        type="button"
                        className="search-result-btn"
                        onClick={() => setSelectedId(expanded ? null : hit.memory.id)}
                        aria-expanded={expanded}
                      >
                        <div className="search-result-top">
                          <SourceLogo source={hit.memory.source} size={18} showLabel />
                          <span className="type-pill">{TYPE_LABELS[hit.memory.type]}</span>
                          <span className="search-score">{matchPct}% match</span>
                        </div>
                        <p className="search-result-snippet">
                          <HighlightText text={hit.snippet} query={debouncedQuery} />
                        </p>
                        <span className="memory-card-date">{formatDate(hit.memory.validFrom)}</span>
                      </button>

                      {expanded && (
                        <div className="search-result-detail">
                          {detailLoading ? (
                            <p className="muted">Loading…</p>
                          ) : detail ? (
                            <>
                              <p className="detail-quote">{detail.memory.contentPreview}</p>
                              <dl className="detail-facts">
                                <div>
                                  <dt>From</dt>
                                  <dd>{detail.sourceConversation.title}</dd>
                                </div>
                                <div>
                                  <dt>When</dt>
                                  <dd>{formatDate(detail.memory.validFrom)}</dd>
                                </div>
                                <div>
                                  <dt>Confidence</dt>
                                  <dd>{(detail.memory.confidence * 100).toFixed(0)}%</dd>
                                </div>
                              </dl>
                              <Link href="/" className="btn ghost">
                                Open on Home
                              </Link>
                            </>
                          ) : null}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {results && results.total === 0 && !isLoading && (
              <div className="search-empty">
                <p>No memories matched that query.</p>
                <p className="muted">Try a shorter word, switch filters, or import more history.</p>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}