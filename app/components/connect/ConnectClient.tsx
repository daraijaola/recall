"use client";

import useSWR from "swr";
import { useState } from "react";
import {
  fetchContextPack,
  fetchGeneratedFile,
  fetchHealth,
  fetchMcpConfig,
} from "@/lib/mock-api";
import type { ContextPackVariant, GeneratedFileKind, McpTargetId } from "@/lib/types";
import {
  CONTEXT_CHAT_APPS,
  MCP_TARGETS,
  MCP_TOOLS,
  PROJECT_FILES,
} from "@/lib/constants";
import { AppShell } from "@/components/shell/AppShell";
import { PageIntro } from "@/components/shell/PageIntro";
import { AppLogo } from "@/components/ui/AppLogo";
import { CopyButton } from "@/components/ui/CopyButton";

export function ConnectClient() {
  const [packVariant, setPackVariant] = useState<ContextPackVariant>("compact");
  const [expandedMcp, setExpandedMcp] = useState<McpTargetId | null>(null);

  const { data: health } = useSWR("health", fetchHealth);
  const { data: compactPack } = useSWR("context-compact", () => fetchContextPack("compact"));
  const { data: fullPack } = useSWR("context-full", () => fetchContextPack("full"));
  const activePack = packVariant === "compact" ? compactPack : fullPack;

  const pct = activePack?.limit
    ? Math.min(100, Math.round((activePack.charCount / activePack.limit) * 100))
    : null;

  async function downloadFile(kind: GeneratedFileKind) {
    const file = await fetchGeneratedFile(kind);
    const blob = new Blob([file.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell health={health}>
      <div className="connect-page">
        <PageIntro
          title="Use in other AIs"
          description="Same Supermemory Local memory — paste packs for chat apps, live MCP tools for coding agents. Import once, remember across tools."
        />

        {/* Temporal / MCP demo centerpiece — what MemMesh CLI cannot show as a product moment */}
        <section className="mcp-demo-hero" aria-label="MCP cross-tool demo">
          <div className="mcp-demo-kicker">
            <span className="engine-pill">MCP · CROSS-TOOL</span>
            <span className="sm-profile-live">Same memory as Home + Search</span>
          </div>
          <h2 className="mcp-demo-title">Prove it in Cursor or Claude Code</h2>
          <p className="mcp-demo-lead">
            After importing ChatGPT + Claude history, open your agent with RECALL MCP and ask:
          </p>
          <blockquote className="mcp-demo-prompt">
            What programming language do I prefer for backend?
          </blockquote>
          <p className="muted mcp-demo-note">
            The agent should call <code className="inline-code">recall_search</code> or{" "}
            <code className="inline-code">recall_context</code> — answers come from Supermemory Local
            (imported chats), not the agent&apos;s empty context window.
          </p>
          <div className="mcp-tools mcp-demo-tools">
            {MCP_TOOLS.map((t) => (
              <span key={t} className="mcp-tool-chip">
                {t}
              </span>
            ))}
          </div>
        </section>

        <section className="connect-section">
          <div className="connect-section-head">
            <div>
              <h2>Coding agents · MCP first</h2>
              <p className="muted">
                One-time setup — <code className="inline-code">npx recall-mcp</code> talks to localhost:6767
              </p>
            </div>
          </div>

          <ul className="connect-list">
            {MCP_TARGETS.map((target) => (
              <McpRow
                key={target.id}
                target={target}
                expanded={expandedMcp === target.id}
                onToggle={() => setExpandedMcp(expandedMcp === target.id ? null : target.id)}
              />
            ))}
          </ul>
        </section>

        <section className="connect-section">
          <div className="connect-section-head">
            <div>
              <h2>Paste into any chat</h2>
              <p className="muted">No setup — paste into custom instructions or your first message.</p>
            </div>
            <div className="connect-app-row">
              {CONTEXT_CHAT_APPS.map((id) => (
                <AppLogo key={id} id={id} size={22} />
              ))}
            </div>
          </div>

          <div className="connect-card">
            <div className="pack-toggle" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={packVariant === "compact"}
                className={`pill${packVariant === "compact" ? " active" : ""}`}
                onClick={() => setPackVariant("compact")}
              >
                Compact · ~1,500 chars
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={packVariant === "full"}
                className={`pill${packVariant === "full" ? " active" : ""}`}
                onClick={() => setPackVariant("full")}
              >
                Full pack
              </button>
            </div>

            {activePack && (
              <>
                {packVariant === "compact" && activePack.limit && (
                  <div className="pack-meter-row">
                    <div className="progress-bar-track">
                      <span className="progress-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="pack-meter-label">
                      {activePack.charCount.toLocaleString()} / {activePack.limit.toLocaleString()} chars
                    </span>
                  </div>
                )}

                <pre className="pack-preview">{activePack.content}</pre>

                <CopyButton text={activePack.content} label="Copy to clipboard" className="primary" />
              </>
            )}
          </div>
        </section>

        <section className="connect-section">
          <div className="connect-section-head">
            <div>
              <h2>Project files</h2>
              <p className="muted">Generated from your memory — drop into any repo.</p>
            </div>
          </div>

          <ul className="connect-list">
            {PROJECT_FILES.map((file) => (
              <li key={file.kind} className="connect-row">
                <span className="file-icon" aria-hidden="true">{file.filename.slice(0, 1)}</span>
                <div className="connect-row-body">
                  <strong>{file.filename}</strong>
                  <span className="muted">{file.description}</span>
                </div>
                <button type="button" className="btn ghost" onClick={() => downloadFile(file.kind)}>
                  Download
                </button>
              </li>
            ))}
          </ul>
        </section>

        <footer className="connect-footer">
          <AppLogo id="supermemory" variant="wordmark" size={20} showLabel label="Supermemory Local" />
          <span className="muted">Runs on your machine · localhost:6767</span>
        </footer>
      </div>
    </AppShell>
  );
}

function McpRow({
  target,
  expanded,
  onToggle,
}: {
  target: (typeof MCP_TARGETS)[number];
  expanded: boolean;
  onToggle: () => void;
}) {
  const { data: config } = useSWR(expanded ? `mcp-${target.id}` : null, () => fetchMcpConfig(target.id));

  return (
    <li className="connect-row connect-row-mcp">
      <AppLogo id={target.logo} size={24} showLabel label={target.label} />
      <span className="muted connect-row-hint">{target.hint}</span>
      <div className="connect-row-actions">
        <McpCopyButton targetId={target.id} />
        <button type="button" className="btn ghost" onClick={onToggle}>
          {expanded ? "Hide" : "Config"}
        </button>
      </div>
      {expanded && config && (
        <pre className="mcp-config-preview">{config.config}</pre>
      )}
    </li>
  );
}

function McpCopyButton({ targetId }: { targetId: McpTargetId }) {
  const { data } = useSWR(`mcp-copy-${targetId}`, () => fetchMcpConfig(targetId));
  if (!data) return <button type="button" className="btn ghost" disabled>Copy</button>;
  return <CopyButton text={data.config} label="Copy config" />;
}