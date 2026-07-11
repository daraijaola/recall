"use client";

import useSWR from "swr";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchHealth, fetchImportProgress, fetchImports, startImport } from "@/lib/mock-api";
import type { ImportProgress, Source } from "@/lib/types";
import { IMPORT_SOURCES } from "@/lib/constants";
import { AppShell } from "@/components/shell/AppShell";
import { PageIntro } from "@/components/shell/PageIntro";
import { SourceLogo } from "@/components/ui/SourceLogo";

const STEPS = [
  { key: "parsing", label: "Parse" },
  { key: "extracting", label: "Extract" },
  { key: "relating", label: "Link" },
] as const;

export function ImportClient() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pickedSource, setPickedSource] = useState<Source | null>(null);
  const [activeImportId, setActiveImportId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ImportProgress | null>(null);

  const { data: health } = useSWR("health", fetchHealth);
  const { data: history, mutate: refreshHistory } = useSWR("imports", fetchImports);

  const pollProgress = useCallback(async (importId: string) => {
    const p = await fetchImportProgress(importId);
    if (!p) return;
    setProgress(p);
    if (p.stage === "done" || p.stage === "error") {
      setActiveImportId(null);
      if (p.stage === "done") refreshHistory();
    } else {
      window.setTimeout(() => pollProgress(importId), 400);
    }
  }, [refreshHistory]);

  useEffect(() => {
    if (activeImportId) pollProgress(activeImportId);
  }, [activeImportId, pollProgress]);

  async function handleFile(file: File) {
    try {
      const { importId } = await startImport(file, pickedSource ?? undefined);
      setActiveImportId(importId);
      setProgress(null);
      setPickedSource(null);
    } catch (e) {
      setProgress({
        importId: "error",
        stage: "error",
        percent: 100,
        message: e instanceof Error ? e.message : "Import failed",
        fileName: file.name,
        source: pickedSource ?? "chatgpt",
      });
      setActiveImportId(null);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  const isImporting = activeImportId !== null && progress?.stage !== "done";
  const stepIndex = progress
    ? progress.stage === "parsing"
      ? 0
      : progress.stage === "extracting"
        ? 1
        : progress.stage === "relating" || progress.stage === "done"
          ? 2
          : 0
    : -1;

  return (
    <AppShell health={health}>
      <div className="import-page">
        <PageIntro
          title="Import your history"
          description="Drop an export from ChatGPT, Claude, or any AI you've used. RECALL turns it into structured memory on your machine."
        />

        <input
          ref={fileRef}
          type="file"
          className="sr-only"
          accept=".json,.jsonl,.md,.txt,.zip"
          onChange={onFileChange}
        />

        {!isImporting && progress?.stage !== "done" && progress?.stage !== "error" && (
          <>
            <button
              type="button"
              className={`drop-zone${dragOver ? " drag-over" : ""}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              <span className="drop-zone-icon">↓</span>
              <strong>Drop your export here</strong>
              <span className="muted">or click to browse · .json .jsonl .md .txt</span>
            </button>

            <p className="section-label">Or pick a source</p>
            <div className="platform-grid">
              {IMPORT_SOURCES.map((item) => (
                <button
                  key={item.source}
                  type="button"
                  className={`platform-card${pickedSource === item.source ? " selected" : ""}`}
                  onClick={() => {
                    setPickedSource(item.source);
                    fileRef.current?.click();
                  }}
                >
                  <SourceLogo source={item.source} size={28} showLabel />
                  <span className="platform-card-format">{item.format}</span>
                  <span className="platform-card-hint">
                    {item.beta ? "Beta" : item.hint}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {(isImporting || progress?.stage === "done" || progress?.stage === "error") && progress && (
          <div className="import-progress-card">
            <div className="import-progress-head">
              <SourceLogo source={progress.source} size={24} showLabel />
              <span className="muted">{progress.fileName}</span>
            </div>

            {progress.stage !== "error" && (
              <>
                <div className="progress-steps">
                  {STEPS.map((step, i) => (
                    <div
                      key={step.key}
                      className={`progress-step${i < stepIndex ? " done" : ""}${i === stepIndex ? " active" : ""}`}
                    >
                      <span className="progress-step-dot" />
                      <span>{step.label}</span>
                    </div>
                  ))}
                </div>

                <div className="progress-bar-track">
                  <span className="progress-bar-fill" style={{ width: `${progress.percent}%` }} />
                </div>
              </>
            )}
            <p className="progress-message">{progress.message}</p>

            {progress.stage === "done" && (
              <div className="import-done">
                <p>
                  <strong>{progress.memoryCount}</strong> structured rows ·{" "}
                  <strong>{progress.convCount}</strong> conversations →{" "}
                  <strong>Supermemory Local</strong>
                </p>
                <p className="muted import-done-sm">
                  Supermemory is embedding + auto-extracting static/dynamic profile facts. Next: see the
                  profile, prove hybrid search, then use the same memory in Cursor via MCP.
                </p>
                <ol className="import-next-steps">
                  <li>
                    <Link href="/" className="btn primary">
                      1 · See Supermemory profile
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/search?q=What%20programming%20language%20do%20I%20prefer%3F"
                      className="btn ghost"
                    >
                      2 · Ask preferred language
                    </Link>
                  </li>
                  <li>
                    <Link href="/connect" className="btn ghost">
                      3 · MCP into Cursor
                    </Link>
                  </li>
                </ol>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => {
                    setProgress(null);
                    setActiveImportId(null);
                  }}
                >
                  Import another export
                </button>
              </div>
            )}

            {progress.stage === "error" && (
              <div className="import-done">
                <div className="btn-row">
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => {
                      setProgress(null);
                      setActiveImportId(null);
                    }}
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {history && history.length > 0 && !isImporting && (
          <section className="import-history">
            <h2>Recent imports</h2>
            <ul className="import-history-list">
              {history.map((row) => (
                <li key={row.id} className="import-history-row">
                  <SourceLogo source={row.source} size={22} showLabel />
                  <span className="import-history-meta">
                    {row.convCount} conversations · {row.memoryCount} memories
                  </span>
                  <span className="import-history-file muted">{row.fileName}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </AppShell>
  );
}