/**
 * Project file generators from active RECALL memory.
 * CLAUDE.md · .cursorrules · AGENTS.md
 */

import { listAllMemories } from "./db";
import { rowToNode } from "./graph/queries";
import type { GeneratedFileKind, GeneratedFileResponse, MemoryNode, MemoryType } from "./types";

function active(): MemoryNode[] {
  return listAllMemories()
    .map(rowToNode)
    .filter((m) => !m.supersededBy)
    .sort((a, b) => b.confidence - a.confidence);
}

function ofTypes(nodes: MemoryNode[], types: MemoryType[], limit = 8): string[] {
  return nodes
    .filter((n) => types.includes(n.type))
    .slice(0, limit)
    .map((n) => n.contentPreview.replace(/^Conversation topic:\s*/i, "").trim());
}

function bullets(lines: string[]): string {
  if (lines.length === 0) return "- (none yet — import history in RECALL)";
  return lines.map((l) => `- ${l}`).join("\n");
}

export function generateProjectFile(kind: GeneratedFileKind): GeneratedFileResponse {
  const nodes = active();
  const prefs = ofTypes(nodes, ["preference", "decision"], 6);
  const constraints = ofTypes(nodes, ["constraint", "goal"], 4);
  const project = ofTypes(nodes, ["project_state"], 4);
  const workflow = ofTypes(nodes, ["workflow", "skill", "correction"], 5);

  if (kind === "claude_md") {
    const content = `# Project context (from RECALL)

## Preferences & decisions
${bullets(prefs)}

## Constraints
${bullets(constraints)}

## Current work
${bullets(project)}

## Workflow
${bullets(workflow)}

## Notes
- Memory is local via Supermemory Local (localhost:6767).
- Prefer RECALL tools (\`recall_search\`, \`recall_context\`) when available.
`;
    return { kind, filename: "CLAUDE.md", content };
  }

  if (kind === "cursorrules") {
    const lines = [...prefs, ...constraints, ...workflow, ...project].slice(0, 12);
    const content = `# RECALL-injected rules

${lines.map((l) => `- ${l}`).join("\n") || "- Import memories in RECALL to populate rules"}

# Local memory
- Structured memory lives on this machine (Supermemory Local).
- Do not invent user preferences that contradict the list above.
`;
    return { kind, filename: ".cursorrules", content };
  }

  // agents_md
  const content = `# Agent instructions (RECALL)

You have access to the user's structured memory via RECALL MCP when configured.

## Known preferences & decisions
${bullets(prefs)}

## Active constraints
${bullets(constraints)}

## Active project
${bullets(project)}

## Workflow
${bullets(workflow)}

## Tools
Use \`recall_search\` and \`recall_context\` before assuming user history.
Use \`recall_remember\` for durable new facts the user confirms.
`;
  return { kind, filename: "AGENTS.md", content };
}
