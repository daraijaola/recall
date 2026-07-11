"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { TYPE_LABELS } from "@/lib/constants";
import { SourceLogo } from "@/components/ui/SourceLogo";
import type { ContradictionCard, MemoryDetailResponse } from "@/lib/types";

interface DetailPanelProps {
  detail: MemoryDetailResponse | null;
  contradiction: ContradictionCard | null;
  loading: boolean;
  showConflict: boolean;
  onClose: () => void;
  onShowConflict: () => void;
  onBackToMemory: () => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export const DetailPanel = forwardRef<HTMLElement, DetailPanelProps>(function DetailPanel(
  { detail, contradiction, loading, showConflict, onClose, onShowConflict, onBackToMemory },
  ref,
) {
  return (
    <aside className="detail-panel" ref={ref}>
      <div className="detail-panel-head">
        {showConflict ? (
          <>
            <button type="button" className="text-btn" onClick={onBackToMemory}>← Back</button>
            <h2>Conflict</h2>
          </>
        ) : detail ? (
          <>
            <button type="button" className="text-btn" onClick={onClose}>Close</button>
            <h2>Memory</h2>
          </>
        ) : (
          <h2>Select a memory</h2>
        )}
      </div>

      <div className="detail-panel-body">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : showConflict && contradiction ? (
          <ConflictContent contradiction={contradiction} />
        ) : detail ? (
          <MemoryContent detail={detail} />
        ) : (
          <EmptyContent hasConflict={!!contradiction} />
        )}
      </div>
    </aside>
  );
});

function EmptyContent({ hasConflict }: { hasConflict: boolean }) {
  return (
    <div className="detail-empty">
      <p>Tap any memory to see where it came from and how it connects to the rest of your brain.</p>
      {hasConflict && (
        <Link href="/contradictions" className="btn">
          Resolve on Conflicts page
        </Link>
      )}
    </div>
  );
}

function ConflictContent({ contradiction }: { contradiction: ContradictionCard }) {
  return (
    <div className="detail-stack">
      <p className="lead">{contradiction.explanation}</p>

      <div className="compare-card old">
        <SourceLogo source={contradiction.oldMemory.source} size={20} showLabel />
        <p>{contradiction.oldMemory.contentPreview}</p>
        <span className="muted">Older · no longer active</span>
      </div>

      <div className="compare-card new">
        <SourceLogo source={contradiction.newMemory.source} size={20} showLabel />
        <p>{contradiction.newMemory.contentPreview}</p>
        <span className="muted">Current truth</span>
      </div>

      <div className="btn-row">
        <button type="button" className="btn">Keep newer one</button>
        <button type="button" className="btn ghost">Keep both</button>
      </div>
    </div>
  );
}

function MemoryContent({ detail }: { detail: MemoryDetailResponse }) {
  const { memory, versionChain, sourceConversation } = detail;

  return (
    <div className="detail-stack">
      <div className="detail-meta-row">
        <SourceLogo source={memory.source} size={20} showLabel />
        <span className="type-pill">{TYPE_LABELS[memory.type]}</span>
      </div>

      <p className="detail-quote">{memory.contentPreview}</p>

      <dl className="detail-facts">
        <div>
          <dt>From</dt>
          <dd>{sourceConversation.title}</dd>
        </div>
        <div>
          <dt>When</dt>
          <dd>{formatDate(memory.validFrom)}</dd>
        </div>
        <div>
          <dt>Confidence</dt>
          <dd>{(memory.confidence * 100).toFixed(0)}%</dd>
        </div>
      </dl>

      {versionChain.length > 1 && (
        <div className="detail-section">
          <h3>How this changed</h3>
          {versionChain.map((v) => (
            <p key={v.id} className={`history-line${v.supersededBy ? " old" : ""}`}>
              {v.contentPreview}
            </p>
          ))}
        </div>
      )}

      <Link href="/connect" className="btn ghost full">
        Use in ChatGPT / Claude
      </Link>
    </div>
  );
}