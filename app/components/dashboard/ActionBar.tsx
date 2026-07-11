"use client";

import Link from "next/link";
import { useState } from "react";

const PACK_CHARS = 1247;
const PACK_LIMIT = 1500;

export function ActionBar() {
  const [copied, setCopied] = useState(false);
  const pct = Math.round((PACK_CHARS / PACK_LIMIT) * 100);

  function handleCopy() {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <footer className="action-bar">
      <div className="action-bar-lead">
        <span className="action-label">Quick inject</span>
        <div className="pack-meter" aria-label={`Context pack ${PACK_CHARS} of ${PACK_LIMIT} characters`}>
          <div className="pack-meter-track">
            <span className="pack-meter-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="pack-meter-label">
            {PACK_CHARS.toLocaleString()} / {PACK_LIMIT.toLocaleString()} ch
          </span>
        </div>
      </div>
      <div className="action-bar-actions">
        <button type="button" className={`btn${copied ? " copied" : ""}`} onClick={handleCopy}>
          {copied ? "Copied" : "Copy context pack"}
        </button>
        <Link href="/connect" className="btn ghost">MCP config</Link>
        <button type="button" className="btn ghost">CLAUDE.md</button>
      </div>
    </footer>
  );
}