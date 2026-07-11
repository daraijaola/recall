"use client";

import useSWR from "swr";
import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  fetchContradictions,
  fetchGraph,
  fetchHealth,
  fetchMemoryDetail,
  fetchStats,
} from "@/lib/mock-api";
import type { Source } from "@/lib/types";
import { AppShell } from "@/components/shell/AppShell";
import { SourceLogo } from "@/components/ui/SourceLogo";
import { MemoryList, SOURCE_FILTERS } from "@/components/dashboard/MemoryList";
import { MemoryGraph } from "@/components/dashboard/MemoryGraph";
import { DetailPanel } from "@/components/dashboard/DetailPanel";

export function DashboardClient() {
  const detailRef = useRef<HTMLElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<Source | "all">("all");
  const [view, setView] = useState<"list" | "map">("list");
  const [showConflict, setShowConflict] = useState(false);

  const { data: health } = useSWR("health", fetchHealth);
  const { data: stats } = useSWR("stats", fetchStats);
  const { data: graph, isLoading } = useSWR("graph", fetchGraph);
  const { data: contradictions } = useSWR("contradictions", fetchContradictions);
  const { data: detail, isLoading: detailLoading } = useSWR(
    selectedId ? `memory-${selectedId}` : null,
    () => (selectedId ? fetchMemoryDetail(selectedId) : null),
  );

  const conflict = contradictions?.[0] ?? null;
  const sourceCount = stats ? Object.values(stats.bySource).filter((n) => n > 0).length : 0;

  const memories = useMemo(() => {
    if (!graph) return [];
    return graph.nodes
      .filter((n) => sourceFilter === "all" || n.source === sourceFilter)
      .sort((a, b) => b.validFrom.localeCompare(a.validFrom));
  }, [graph, sourceFilter]);

  const scrollToDetail = useCallback(() => {
    if (window.innerWidth > 900) return;
    detailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  function selectMemory(id: string) {
    setSelectedId(id);
    setShowConflict(false);
    setTimeout(scrollToDetail, 50);
  }

  function openConflict() {
    setShowConflict(true);
    setSelectedId(null);
    setTimeout(scrollToDetail, 50);
  }

  return (
    <AppShell health={health}>
      <div className="dash">
        <header className="dash-hero">
          <div>
            <h1>Your memories</h1>
            <p className="dash-sub">
              {health?.memoryCount.toLocaleString() ?? "—"} things RECALL knows about you
              {sourceCount > 0 ? ` · from ${sourceCount} apps` : ""}
            </p>
          </div>
          <div className="dash-actions">
            <Link href="/import" className="btn primary">Import history</Link>
            <Link href="/connect" className="btn ghost">Use in other AIs</Link>
          </div>
        </header>

        {conflict && (
          <Link href="/contradictions" className="conflict-alert">
            <div className="conflict-alert-logos">
              <SourceLogo source={conflict.oldMemory.source} size={20} />
              <span className="conflict-vs">vs</span>
              <SourceLogo source={conflict.newMemory.source} size={20} />
            </div>
            <div className="conflict-alert-text">
              <strong>1 conflict needs you</strong>
              <span>{conflict.explanation}</span>
            </div>
          </Link>
        )}

        <div className="dash-toolbar">
          <div className="filter-pills" role="tablist" aria-label="Filter by app">
            {SOURCE_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={sourceFilter === f.id}
                className={`pill${sourceFilter === f.id ? " active" : ""}`}
                onClick={() => setSourceFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="view-toggle" role="tablist" aria-label="View mode">
            <button
              type="button"
              role="tab"
              aria-selected={view === "list"}
              className={`pill${view === "list" ? " active" : ""}`}
              onClick={() => setView("list")}
            >
              List
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "map"}
              className={`pill${view === "map" ? " active" : ""}`}
              onClick={() => setView("map")}
            >
              Map
            </button>
          </div>
        </div>

        <div className="dash-body">
          <section className="dash-main" aria-label="Memories">
            {isLoading || !graph ? (
              <div className="empty-panel"><p className="muted">Loading your memories…</p></div>
            ) : view === "list" ? (
              <MemoryList
                memories={memories}
                selectedId={selectedId}
                onSelect={selectMemory}
              />
            ) : (
              <div className="map-wrap">
                <p className="map-hint">Tap a dot to read the memory. Lines show how memories relate.</p>
                <MemoryGraph
                  data={graph}
                  selectedId={selectedId}
                  includeSuperseded
                  sourceFilter={sourceFilter}
                  typeFilter="all"
                  onSelect={(id) => id && selectMemory(id)}
                />
              </div>
            )}
          </section>

          <DetailPanel
            ref={detailRef}
            detail={detail ?? null}
            contradiction={conflict}
            loading={!!selectedId && detailLoading}
            showConflict={showConflict}
            onClose={() => setSelectedId(null)}
            onShowConflict={openConflict}
            onBackToMemory={() => setShowConflict(false)}
          />
        </div>
      </div>
    </AppShell>
  );
}