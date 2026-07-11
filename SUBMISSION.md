# Submission checklist

Deadline: **Sunday, July 13 · 23:59 PST**

**Only one form** (no separate register):

### 1. Submit project (judges score this)

https://forms.gle/ARXHNpFY5VNfiNDBA

| Field | Paste this |
|-------|------------|
| Project name | **RECALL** |
| One-line pitch | Import real ChatGPT/Claude history into Supermemory Local — hybrid search, auto profile, conflicts — then use that same memory in Cursor, Claude, and ChatGPT. |
| Team | (your name(s)) |
| Repo | https://github.com/daraijaola/recall |
| Demo video | (your Loom/YouTube link after you record) |
| Live demo | https://agentr.online/sites/recall/ |
| App | https://agentr.online/sites/recall/app/ |

### 2. Discord #project-showcase

1. Join: https://discord.com/invite/WtkvM62fHK  
2. Take **Hacker** role if needed  
3. Post with the pinned template:

```
**RECALL**
One-liner: Portable AI memory on Supermemory Local — import ChatGPT/Claude history, structure it, inject via packs + MCP.
Team: ...
Repo: https://github.com/daraijaola/recall
Demo video: ...
Live: https://agentr.online/sites/recall/
How it uses Supermemory Local: SM Local is the intelligence layer — storage, embeddings, hybrid search (/v4/search), and static+dynamic profile extraction (/v4/profile). RECALL imports official ChatGPT/Claude exports into that engine, surfaces the profile and similarity scores in a product UI, resolves cross-app conflicts, and injects the same local memory via context packs and MCP tools (recall_search, recall_context) into Cursor/Claude Code.
```

### 3. Demo video

- Follow [DEMO.md](./DEMO.md)  
- Max 3 minutes  
- Unlisted YouTube or Loom is fine  

---

## How it uses Supermemory Local (for the form)

> RECALL treats Supermemory Local as the system of record: every imported conversation and extracted memory is stored and searched via the local API on port 6767. We add a thin SQLite graph for types, relations, and supersession. Context packs and MCP tools (`recall_search`, `recall_context`) read that same local memory so ChatGPT/Grok get paste packs and Claude Code/Cursor get live tools — without cloud memory lock-in.
