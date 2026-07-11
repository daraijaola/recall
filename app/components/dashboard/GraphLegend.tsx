import { SOURCE_COLORS, SOURCE_LABELS } from "@/lib/constants";
import type { Source } from "@/lib/types";

const SOURCES: Source[] = ["chatgpt", "claude", "grok", "claude_code", "cursor", "generic"];

export function GraphLegend() {
  return (
    <div className="graph-legend" aria-label="Graph legend">
      {SOURCES.map((s) => (
        <span key={s} className="legend-item">
          <span className="legend-swatch" style={{ background: SOURCE_COLORS[s] }} />
          {SOURCE_LABELS[s]}
        </span>
      ))}
      <span className="legend-item">
        <span className="legend-swatch red" />
        Contradicts
      </span>
    </div>
  );
}