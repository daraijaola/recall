"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo } from "react";
import { APP_BASE, SOURCE_COLORS, SOURCE_LOGO, SOURCE_LABELS } from "@/lib/constants";
import type { GraphResponse, MemoryNode, MemoryType, Source } from "@/lib/types";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

interface MemoryGraphProps {
  data: GraphResponse;
  selectedId: string | null;
  includeSuperseded: boolean;
  sourceFilter: Source | "all";
  typeFilter: MemoryType | "all";
  onSelect: (id: string | null) => void;
}

export function MemoryGraph({
  data,
  selectedId,
  includeSuperseded,
  sourceFilter,
  typeFilter,
  onSelect,
}: MemoryGraphProps) {
  const graphData = useMemo(() => {
    const nodes = data.nodes.filter((n) => {
      if (!includeSuperseded && n.supersededBy) return false;
      if (sourceFilter !== "all" && n.source !== sourceFilter) return false;
      if (typeFilter !== "all" && n.type !== typeFilter) return false;
      return true;
    });
    const nodeIds = new Set(nodes.map((n) => n.id));

    return {
      nodes: nodes.map((n) => ({ ...n, id: n.id, val: 8 })),
      links: data.edges
        .filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to))
        .map((e) => ({
          ...e,
          source: e.from,
          target: e.to,
          color: e.kind === "contradicts" ? "#ff6b6b" : "rgba(255,255,255,0.15)",
        })),
    };
  }, [data, includeSuperseded, sourceFilter, typeFilter]);

  const paintNode = useCallback(
    (node: MemoryNode & { x?: number; y?: number }, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const r = selectedId === node.id ? 10 : 8;
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const selected = selectedId === node.id;
      const faded = node.supersededBy;

      ctx.globalAlpha = faded ? 0.35 : selected ? 1 : 0.85;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fillStyle = SOURCE_COLORS[node.source];
      ctx.fill();

      if (selected) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2 / globalScale;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      if (selected || globalScale > 1.2) {
        const label = node.contentPreview.length > 28
          ? `${node.contentPreview.slice(0, 28)}…`
          : node.contentPreview;
        const fontSize = Math.max(11, 12 / globalScale);
        ctx.font = `500 ${fontSize}px var(--font-sans), sans-serif`;
        ctx.fillStyle = selected ? "#fff" : "rgba(255,255,255,0.7)";
        ctx.fillText(label, x - r, y - r - 6);
      }
    },
    [selectedId],
  );

  if (graphData.nodes.length === 0) {
    return <p className="muted map-empty">Nothing to show for this filter.</p>;
  }

  return (
    <div className="map-canvas">
      <ForceGraph2D
        graphData={graphData}
        nodeCanvasObject={paintNode as never}
        nodePointerAreaPaint={(node, color, ctx) => {
          const n = node as MemoryNode & { x?: number; y?: number };
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(n.x ?? 0, n.y ?? 0, 14, 0, 2 * Math.PI);
          ctx.fill();
        }}
        linkColor={(link) => (link as { color?: string }).color ?? "rgba(255,255,255,0.12)"}
        linkWidth={(link) => ((link as { kind?: string }).kind === "contradicts" ? 2 : 1)}
        onNodeClick={(node) => onSelect((node as MemoryNode).id)}
        onBackgroundClick={() => onSelect(null)}
        backgroundColor="transparent"
        cooldownTicks={80}
        d3VelocityDecay={0.35}
      />
      <div className="map-legend">
        {(["chatgpt", "claude", "grok", "claude_code", "cursor"] as Source[]).map((s) => (
          <span key={s} className="map-legend-item">
            <img src={`${APP_BASE}/logos/${SOURCE_LOGO[s]}`} alt="" width={14} height={14} />
            {SOURCE_LABELS[s]}
          </span>
        ))}
      </div>
    </div>
  );
}