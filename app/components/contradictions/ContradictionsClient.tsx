"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";
import { fetchAllContradictions, fetchHealth, resolveContradiction } from "@/lib/mock-api";
import type { ConflictResolution, ContradictionCard } from "@/lib/types";
import { SOURCE_LABELS, TYPE_LABELS } from "@/lib/constants";
import { AppShell } from "@/components/shell/AppShell";
import { PageIntro } from "@/components/shell/PageIntro";
import { SourceLogo } from "@/components/ui/SourceLogo";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function resolutionLabel(card: ContradictionCard): string {
  if (!card.resolution) return "Resolved";
  const newer = SOURCE_LABELS[card.newMemory.source];
  const older = SOURCE_LABELS[card.oldMemory.source];
  if (card.resolution === "keep_new") return `Kept ${newer}'s version`;
  if (card.resolution === "keep_old") return `Kept ${older}'s version`;
  return "Keeping both active";
}

export function ContradictionsClient() {
  const { data: health } = useSWR("health", fetchHealth);
  const { data: all, mutate, isLoading } = useSWR("contradictions-all", fetchAllContradictions);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [justResolvedId, setJustResolvedId] = useState<string | null>(null);
  const [lastResolution, setLastResolution] = useState<ConflictResolution | null>(null);
  const [lastWinnerLabel, setLastWinnerLabel] = useState<string | null>(null);

  const open = useMemo(() => all?.filter((c) => c.status === "open") ?? [], [all]);
  const resolved = useMemo(() => all?.filter((c) => c.status === "resolved") ?? [], [all]);

  const activeId = selectedId ?? open[0]?.id ?? null;
  const active = open.find((c) => c.id === activeId) ?? null;

  async function handleResolve(resolution: ConflictResolution) {
    if (!active || resolving) return;
    setResolving(true);
    const older = SOURCE_LABELS[active.oldMemory.source];
    const newer = SOURCE_LABELS[active.newMemory.source];
    const winner =
      resolution === "keep_new" ? newer : resolution === "keep_old" ? older : "Both kept";
    const result = await resolveContradiction(active.id, resolution);
    if (result) {
      setJustResolvedId(active.id);
      setLastResolution(resolution);
      setLastWinnerLabel(winner);
      await mutate();
      setSelectedId(null);
      window.setTimeout(() => {
        setJustResolvedId(null);
        setLastResolution(null);
        setLastWinnerLabel(null);
      }, 3200);
    }
    setResolving(false);
  }

  return (
    <AppShell health={health}>
      <div className="conflicts-page">
        <PageIntro
          title="Conflicts"
          description="Supermemory hybrid ranks the same topic from ChatGPT and Claude highly — RECALL makes the contradiction visible and resolvable. You pick truth; supersession stays in the local graph."
        />

        <p className="conflicts-sm-banner">
          <span className="engine-pill">SM HYBRID</span>
          Python vs TypeScript? Same query hits both memories at ~93% similarity. Supermemory surfaces related facts; RECALL turns the disagreement into a one-click resolve.
        </p>

        {justResolvedId && lastWinnerLabel && (
          <div className="conflict-global-toast" role="status">
            <strong>✓ Conflict resolved</strong>
            <span>
              {lastResolution === "keep_both"
                ? "Both stay active in search + packs."
                : `${lastWinnerLabel} is now the active truth · other memory superseded in your graph.`}
            </span>
          </div>
        )}

        {!isLoading && all && (
          <p className="conflicts-summary">
            {open.length > 0 ? (
              <>
                <strong>{open.length}</strong> need{open.length === 1 ? "s" : ""} your call
              </>
            ) : (
              <strong>All clear</strong>
            )}
            {resolved.length > 0 && (
              <>
                {" · "}
                {resolved.length} settled
              </>
            )}
          </p>
        )}

        {isLoading ? (
          <p className="muted">Loading conflicts…</p>
        ) : open.length === 0 ? (
          <div className="conflicts-empty">
            <p className="conflicts-empty-title">Nothing to resolve</p>
            <p className="muted">
              Import ChatGPT + Claude samples — Supermemory hybrid retrieval surfaces the same topic
              from both apps; we flag the contradiction here.
            </p>
          </div>
        ) : (
          <section className="conflicts-open">
            {open.length > 1 && (
              <div className="conflict-picker" role="tablist" aria-label="Open conflicts">
                {open.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    role="tab"
                    aria-selected={c.id === activeId}
                    className={`pill${c.id === activeId ? " active" : ""}`}
                    onClick={() => setSelectedId(c.id)}
                  >
                    {SOURCE_LABELS[c.oldMemory.source]} vs {SOURCE_LABELS[c.newMemory.source]}
                  </button>
                ))}
              </div>
            )}

            {active && (
              <article className="conflict-card">
                <header className="conflict-card-head">
                  <div className="conflict-card-logos">
                    <SourceLogo source={active.oldMemory.source} size={24} showLabel />
                    <span className="conflict-vs">vs</span>
                    <SourceLogo source={active.newMemory.source} size={24} showLabel />
                  </div>
                  <p className="conflict-card-lead">{active.explanation}</p>
                  <p className="conflict-sm-note">
                    <span className="engine-pill">~93% sim · SM</span>
                    Both memories rank high on Supermemory hybrid search for the same topic — that&apos;s how the contradiction was found.
                  </p>
                </header>

                <div className="conflict-compare">
                  <MemorySide
                    memory={active.oldMemory}
                    tag={`Older · ${SOURCE_LABELS[active.oldMemory.source]} · pick to keep this truth`}
                    tone="old"
                  />
                  <MemorySide
                    memory={active.newMemory}
                    tag={`Newer · ${SOURCE_LABELS[active.newMemory.source]} · pick to keep this truth`}
                    tone="new"
                  />
                </div>

                <div className="conflict-actions">
                  <button
                    type="button"
                    className="btn primary conflict-action-btn"
                    disabled={resolving}
                    onClick={() => handleResolve("keep_new")}
                  >
                    <SourceLogo source={active.newMemory.source} size={18} />
                    Use {SOURCE_LABELS[active.newMemory.source]}&apos;s version
                  </button>
                  <button
                    type="button"
                    className="btn conflict-action-btn"
                    disabled={resolving}
                    onClick={() => handleResolve("keep_old")}
                  >
                    <SourceLogo source={active.oldMemory.source} size={18} />
                    Use {SOURCE_LABELS[active.oldMemory.source]}&apos;s version
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    disabled={resolving}
                    onClick={() => handleResolve("keep_both")}
                  >
                    Keep both
                  </button>
                </div>
              </article>
            )}
          </section>
        )}

        {resolved.length > 0 && (
          <section className="conflicts-resolved">
            <h2>Already settled</h2>
            <ul className="conflict-history">
              {resolved.map((c) => (
                <li key={c.id} className="conflict-history-row">
                  <div className="conflict-history-logos">
                    <SourceLogo source={c.oldMemory.source} size={18} />
                    <span className="conflict-vs">vs</span>
                    <SourceLogo source={c.newMemory.source} size={18} />
                  </div>
                  <div className="conflict-history-copy">
                    <strong>{c.explanation}</strong>
                    <span className="muted">
                      {resolutionLabel(c)}
                      {c.resolvedAt ? ` · ${formatDate(c.resolvedAt)}` : ""}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function MemorySide({
  memory,
  tag,
  tone,
}: {
  memory: ContradictionCard["newMemory"];
  tag: string;
  tone: "old" | "new";
}) {
  return (
    <div className={`compare-card ${tone}`}>
      <div className="compare-card-top">
        <SourceLogo source={memory.source} size={20} showLabel />
        <span className="type-pill">{TYPE_LABELS[memory.type]}</span>
      </div>
      <p>{memory.contentPreview}</p>
      <span className="muted compare-card-meta">
        {tag} · {formatDate(memory.validFrom)} · {(memory.confidence * 100).toFixed(0)}% sure
      </span>
    </div>
  );
}