import type { AppLogoId, MemoryType, Source } from "./types";

export const APP_BASE = "/sites/recall/app";
export const LANDING_URL = "/sites/recall/";

export const SOURCE_COLORS: Record<Source, string> = {
  chatgpt: "#10A37F",
  claude: "#D97757",
  grok: "#E8E8E8",
  claude_code: "#CC9B7A",
  cursor: "#7C7C7C",
  generic: "#888888",
};

export const SOURCE_LABELS: Record<Source, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  grok: "Grok",
  claude_code: "Claude Code",
  cursor: "Cursor",
  generic: "Any file",
};

export const SOURCE_LOGO: Record<Source, string> = {
  chatgpt: "chatgpt.svg",
  claude: "claude.svg",
  grok: "grok.svg",
  claude_code: "claude-code.svg",
  cursor: "cursor.svg",
  generic: "codex.svg",
};

export const TYPE_LABELS: Record<MemoryType, string> = {
  preference: "Preference",
  decision: "Decision",
  fact: "Fact",
  goal: "Goal",
  constraint: "Constraint",
  project_state: "Project",
  skill: "Skill",
  correction: "Correction",
  opinion: "Opinion",
  workflow: "Workflow",
};

export const NAV_ITEMS = [
  { href: "/", label: "Home", ready: true, primary: true },
  { href: "/import", label: "Import", ready: true, primary: true },
  { href: "/connect", label: "Connect", ready: true, primary: true },
  { href: "/contradictions", label: "Conflicts", ready: true, primary: false },
  { href: "/search", label: "Search", ready: true, primary: false },
  { href: "/setup", label: "Setup", ready: true, primary: false },
] as const;

export type McpTargetId = import("./types").McpTargetId;

export const CONTEXT_CHAT_APPS: AppLogoId[] = ["chatgpt", "grok", "claude", "gemini"];

export const MCP_TARGETS: {
  id: McpTargetId;
  label: string;
  logo: AppLogoId;
  hint: string;
}[] = [
  { id: "claude_desktop", label: "Claude Desktop", logo: "claude", hint: "Desktop app" },
  { id: "claude_code", label: "Claude Code", logo: "claude_code", hint: "Terminal agent" },
  { id: "cursor", label: "Cursor", logo: "cursor", hint: "IDE" },
  { id: "windsurf", label: "Windsurf", logo: "windsurf", hint: "IDE" },
];

export const PROJECT_FILES: {
  kind: import("./types").GeneratedFileKind;
  filename: string;
  description: string;
}[] = [
  { kind: "claude_md", filename: "CLAUDE.md", description: "Claude Code project context" },
  { kind: "cursorrules", filename: ".cursorrules", description: "Cursor rules from your memory" },
  { kind: "agents_md", filename: "AGENTS.md", description: "Agent instructions for any tool" },
];

export const MCP_TOOLS = ["recall_search", "recall_context", "recall_remember", "recall_forget"] as const;

export const SETUP_COMMAND = "npx supermemory local";

export const SETUP_DOCS_URL = "https://supermemory.ai/docs/self-hosting/quickstart";

export const SETUP_STEPS = [
  { id: "run", label: "Run locally", hint: "One command — embeddings, storage, search on your machine." },
  { id: "key", label: "Copy API key", hint: "Shown in the terminal when Supermemory Local starts." },
  { id: "connect", label: "RECALL connects", hint: "This app talks to localhost:6767 automatically." },
] as const;

export const SEARCH_SUGGESTIONS = [
  "TypeScript",
  "hackathon",
  "deadline",
  "workflow",
  "Next.js",
  "webhook",
] as const;

export const SEARCH_TYPE_FILTERS: { id: import("./types").MemoryType | "all"; label: string }[] = [
  { id: "all", label: "All types" },
  { id: "preference", label: "Preferences" },
  { id: "decision", label: "Decisions" },
  { id: "constraint", label: "Constraints" },
  { id: "project_state", label: "Projects" },
  { id: "workflow", label: "Workflows" },
  { id: "goal", label: "Goals" },
];

export const IMPORT_SOURCES = [
  { source: "chatgpt" as const, format: "conversations.json", hint: "Official export" },
  { source: "claude" as const, format: "conversations.json", hint: "Official export" },
  { source: "grok" as const, format: "export.json", hint: "Export file" },
  { source: "claude_code" as const, format: "*.jsonl", hint: "Session files" },
  { source: "cursor" as const, format: "chat export", hint: "Beta", beta: true },
  { source: "generic" as const, format: ".md · .txt · .json", hint: "Any content" },
];