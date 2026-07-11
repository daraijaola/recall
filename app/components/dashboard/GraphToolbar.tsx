import { SOURCE_LABELS, TYPE_LABELS } from "@/lib/constants";
import type { MemoryType, Source } from "@/lib/types";

interface GraphToolbarProps {
  includeSuperseded: boolean;
  onToggleSuperseded: () => void;
  sourceFilter: Source | "all";
  typeFilter: MemoryType | "all";
  onSourceFilter: (v: Source | "all") => void;
  onTypeFilter: (v: MemoryType | "all") => void;
  onZoomFit: () => void;
  nodeCount: number;
  edgeCount: number;
}

const SOURCES: (Source | "all")[] = ["all", "chatgpt", "claude", "grok", "claude_code", "cursor", "generic"];
const TYPES: (MemoryType | "all")[] = [
  "all",
  "preference",
  "decision",
  "constraint",
  "project_state",
  "goal",
  "skill",
  "fact",
  "correction",
  "opinion",
  "workflow",
];

export function GraphToolbar({
  includeSuperseded,
  onToggleSuperseded,
  sourceFilter,
  typeFilter,
  onSourceFilter,
  onTypeFilter,
  onZoomFit,
  nodeCount,
  edgeCount,
}: GraphToolbarProps) {
  return (
    <div className="graph-toolbar">
      <div className="graph-toolbar-main">
        <div className="graph-filters">
          <button
            type="button"
            className={`filter-chip${!includeSuperseded ? " active" : ""}`}
            onClick={onToggleSuperseded}
            aria-pressed={!includeSuperseded}
          >
            {includeSuperseded ? "Showing all versions" : "Active memories only"}
          </button>

          <label className="filter-select">
            <span>Source</span>
            <select
              value={sourceFilter}
              onChange={(e) => onSourceFilter(e.target.value as Source | "all")}
            >
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All sources" : SOURCE_LABELS[s]}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-select">
            <span>Type</span>
            <select
              value={typeFilter}
              onChange={(e) => onTypeFilter(e.target.value as MemoryType | "all")}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === "all" ? "All types" : TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="graph-toolbar-actions">
          <button type="button" className="filter-chip" onClick={onZoomFit}>
            Fit view
          </button>
          <span className="graph-count">
            <strong>{nodeCount}</strong> nodes · <strong>{edgeCount}</strong> relations
          </span>
        </div>
      </div>
    </div>
  );
}