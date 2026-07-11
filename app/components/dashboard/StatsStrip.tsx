import { SOURCE_COLORS, SOURCE_LABELS } from "@/lib/constants";
import type { Source, StatsResponse } from "@/lib/types";

interface StatsStripProps {
  stats: StatsResponse;
  openConflicts: number;
  onConflictClick?: () => void;
}

const SOURCE_ORDER: Source[] = ["chatgpt", "claude", "grok", "claude_code", "cursor", "generic"];

export function StatsStrip({ stats, openConflicts, onConflictClick }: StatsStripProps) {
  const sourceCount = Object.values(stats.bySource).filter((n) => n > 0).length;
  const maxSource = Math.max(...Object.values(stats.bySource));

  const tiles = [
    { label: "MEMORIES", value: stats.total.toLocaleString(), hint: "In graph index", key: "mem" },
    {
      label: "CONFLICTS",
      value: String(openConflicts),
      hint: "Cross-platform",
      alert: openConflicts > 0,
      key: "conf",
      clickable: openConflicts > 0,
    },
    { label: "SOURCES", value: String(sourceCount), hint: "Platforms linked", key: "src" },
    { label: "SUPERSEDED", value: String(stats.superseded), hint: "Version chains", key: "sup" },
    { label: "RECALL", value: "88%", hint: "Structured recall", key: "rec" },
  ];

  return (
    <div className="stats-zone">
      <div className="stats-strip" aria-label="Dashboard statistics">
        {tiles.map((t) => (
          <div
            key={t.key}
            className={`stat-tile${t.alert ? " alert" : ""}${t.clickable ? " clickable" : ""}`}
            role={t.clickable ? "button" : undefined}
            tabIndex={t.clickable ? 0 : undefined}
            onClick={t.clickable ? onConflictClick : undefined}
            onKeyDown={
              t.clickable
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") onConflictClick?.();
                  }
                : undefined
            }
          >
            <span className="label">{t.label}</span>
            <span className="value">{t.value}</span>
            <span className="hint">{t.hint}</span>
          </div>
        ))}
      </div>

      <div className="source-breakdown" aria-label="Memory distribution by source">
        <span className="source-breakdown-label">By source</span>
        <div className="source-bars">
          {SOURCE_ORDER.filter((s) => stats.bySource[s] > 0).map((s) => (
            <div key={s} className="source-bar-row" title={`${SOURCE_LABELS[s]}: ${stats.bySource[s]}`}>
              <span className="source-bar-dot" style={{ background: SOURCE_COLORS[s] }} />
              <span className="source-bar-name">{SOURCE_LABELS[s]}</span>
              <div className="source-bar-track">
                <span
                  className="source-bar-fill"
                  style={{
                    width: `${(stats.bySource[s] / maxSource) * 100}%`,
                    background: SOURCE_COLORS[s],
                  }}
                />
              </div>
              <span className="source-bar-val">{stats.bySource[s]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}