import { TYPE_LABELS } from "@/lib/constants";
import { SourceLogo } from "@/components/ui/SourceLogo";
import type { MemoryNode, Source } from "@/lib/types";

interface MemoryListProps {
  memories: MemoryNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function MemoryList({ memories, selectedId, onSelect }: MemoryListProps) {
  if (memories.length === 0) {
    return (
      <div className="empty-panel">
        <p>No memories match this filter.</p>
        <p className="muted">Try &quot;All&quot; or import more history.</p>
      </div>
    );
  }

  return (
    <ul className="memory-list">
      {memories.map((m) => (
        <li key={m.id}>
          <button
            type="button"
            className={`memory-card-btn${selectedId === m.id ? " selected" : ""}${m.supersededBy ? " outdated" : ""}`}
            onClick={() => onSelect(m.id)}
          >
            <div className="memory-card-top">
              <SourceLogo source={m.source} size={18} showLabel />
              <span className="type-pill">{TYPE_LABELS[m.type]}</span>
              {m.supersededBy ? <span className="status-pill-sm outdated">Outdated</span> : null}
            </div>
            <p className="memory-card-text">{m.contentPreview}</p>
            <span className="memory-card-date">{formatDate(m.validFrom)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export const SOURCE_FILTERS: { id: Source | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "chatgpt", label: "ChatGPT" },
  { id: "claude", label: "Claude" },
  { id: "grok", label: "Grok" },
  { id: "claude_code", label: "Claude Code" },
  { id: "cursor", label: "Cursor" },
];