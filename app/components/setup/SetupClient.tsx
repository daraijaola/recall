"use client";

import useSWR from "swr";
import { useEffect, useState } from "react";
import {
  buildSetupEnv,
  fetchHealth,
  fetchSetupStatus,
  saveSetupApiKey,
  testSmConnection,
} from "@/lib/mock-api";
import { SETUP_COMMAND, SETUP_DOCS_URL, SETUP_STEPS } from "@/lib/constants";
import { AppShell } from "@/components/shell/AppShell";
import { PageIntro } from "@/components/shell/PageIntro";
import { AppLogo } from "@/components/ui/AppLogo";
import { CopyButton } from "@/components/ui/CopyButton";

export function SetupClient() {
  const [testing, setTesting] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [keySaved, setKeySaved] = useState(false);

  const { data: health } = useSWR("health", fetchHealth);
  const { data: setup, mutate, isLoading } = useSWR("setup-status", fetchSetupStatus);

  useEffect(() => {
    if (setup?.apiKey && !apiKeyInput) setApiKeyInput(setup.apiKey);
  }, [setup?.apiKey, apiKeyInput]);

  const connected = setup?.connected ?? false;
  const bootPreview = setup
    ? `$ ${SETUP_COMMAND}

url       ${setup.url}
database  ${setup.databasePath}
api key   ${setup.apiKey}
container ${setup.container}`
    : "";

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    const result = await testSmConnection();
    setTestResult({ ok: result.ok, message: `${result.message} · ${result.latencyMs}ms` });
    await mutate();
    setTesting(false);
  }

  async function handleSaveKey() {
    setSavingKey(true);
    const result = await saveSetupApiKey(apiKeyInput);
    if (result.ok) {
      setKeySaved(true);
      await mutate();
      window.setTimeout(() => setKeySaved(false), 2000);
    }
    setSavingKey(false);
  }

  return (
    <AppShell health={health}>
      <div className="setup-page">
        <PageIntro
          title="Supermemory Local"
          description="The intelligence layer: store, embed, hybrid search, and profile extraction on your machine at localhost:6767. RECALL is the product UI + inject layer on top."
        />

        <section className={`setup-engine${connected ? " live" : ""}`}>
          <span className="engine-corner tl" aria-hidden="true" />
          <span className="engine-corner tr" aria-hidden="true" />
          <span className="engine-corner bl" aria-hidden="true" />
          <span className="engine-corner br" aria-hidden="true" />

          <div className="setup-engine-core">
            <span className="setup-engine-tag">SUPERMEMORY LOCAL</span>
            <AppLogo id="supermemory" variant="wordmark" size={32} />
            <div className="setup-engine-ops">
              <span>STORE</span>
              <span>EMBED</span>
              <span>HYBRID SEARCH</span>
              <span>PROFILE</span>
            </div>

            <div className="setup-engine-status">
              {isLoading ? (
                <span className="muted">Checking…</span>
              ) : (
                <span className={`setup-status-pill${connected ? " live" : " offline"}`}>
                  {connected ? "Connected" : "Not detected"}
                </span>
              )}
              {setup && connected && (
                <span className="setup-engine-meta muted">
                  {setup.memoryCount.toLocaleString()} memories · v{setup.version} · up {setup.uptime}
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="connect-section">
          <div className="connect-section-head">
            <div>
              <h2>Start the engine</h2>
              <p className="muted">One command in your terminal — copy and run.</p>
            </div>
            <a href={SETUP_DOCS_URL} className="btn ghost" target="_blank" rel="noopener noreferrer">
              Quickstart docs
            </a>
          </div>

          <div className="connect-card">
            <div className="setup-step-row">
              {SETUP_STEPS.map((step, i) => (
                <div key={step.id} className={`setup-step-chip${i === 0 ? " active" : i < (connected ? 3 : 1) ? " done" : ""}`}>
                  <span className="setup-step-chip-num">{i + 1}</span>
                  <div>
                    <strong>{step.label}</strong>
                    <span className="muted">{step.hint}</span>
                  </div>
                </div>
              ))}
            </div>

            {bootPreview && <pre className="pack-preview setup-terminal">{bootPreview}</pre>}
            <div className="btn-row">
              <CopyButton text={SETUP_COMMAND} label="Copy command" className="primary" />
            </div>
          </div>
        </section>

        <section className="connect-section">
          <div className="connect-section-head">
            <div>
              <h2>API key</h2>
              <p className="muted">Paste the key printed when Supermemory Local boots.</p>
            </div>
          </div>

          <div className="connect-card">
            <label className="search-label" htmlFor="sm-api-key">
              Supermemory API key
            </label>
            <div className="setup-key-row">
              <input
                id="sm-api-key"
                type="text"
                className="search-input setup-key-input"
                placeholder="sm_xxxxxxxxxxxxxxxx"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                spellCheck={false}
                autoComplete="off"
              />
              <button
                type="button"
                className={`btn${keySaved ? " copied" : ""}`}
                disabled={savingKey || !apiKeyInput.trim()}
                onClick={handleSaveKey}
              >
                {keySaved ? "Saved" : savingKey ? "Saving…" : "Save key"}
              </button>
            </div>

            {setup && (
              <ul className="connect-list setup-detail-list">
                <li className="connect-row">
                  <span className="setup-detail-key">URL</span>
                  <code className="setup-detail-val">{setup.url}</code>
                  <CopyButton text={setup.url} label="Copy" />
                </li>
                <li className="connect-row">
                  <span className="setup-detail-key">Container</span>
                  <code className="setup-detail-val">{setup.container}</code>
                  <CopyButton text={setup.container} label="Copy" />
                </li>
                <li className="connect-row">
                  <span className="setup-detail-key">Database</span>
                  <code className="setup-detail-val">{setup.databasePath}</code>
                  <CopyButton text={setup.databasePath} label="Copy" />
                </li>
                <li className="connect-row">
                  <span className="setup-detail-key">Embeddings</span>
                  <code className="setup-detail-val">{setup.embeddingModel}</code>
                </li>
              </ul>
            )}
          </div>
        </section>

        <section className="connect-section">
          <div className="connect-section-head">
            <div>
              <h2>Wire up tools</h2>
              <p className="muted">Drop into your shell or MCP config.</p>
            </div>
          </div>

          <div className="connect-card">
            <pre className="pack-preview setup-env-preview">{buildSetupEnv()}</pre>
            <div className="btn-row">
              <CopyButton text={buildSetupEnv()} label="Copy .env" />
              <button type="button" className="btn ghost" onClick={() => mutate()}>
                Refresh
              </button>
              <button type="button" className="btn primary" disabled={testing} onClick={handleTest}>
                {testing ? "Testing…" : "Test connection"}
              </button>
            </div>
            {testResult && (
              <p className={`setup-test-result${testResult.ok ? " ok" : " fail"}`} role="status">
                {testResult.message}
              </p>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}