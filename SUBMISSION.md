# Submission checklist (do these)

Deadline: **Sunday, July 13 · 23:59 PST**

---

## Must do (forms + showcase)

### 1. Register (if not done)

https://forms.gle/A9dxNCfnqq2SVt3N9

### 2. Submit project (judges score this)

https://forms.gle/ARXHNpFY5VNfiNDBA

Suggested fields:

| Field | Value |
|-------|--------|
| Project name | **RECALL** |
| One-line pitch | Your AI memory shouldn’t die when you switch AIs — import chat history into one local brain on Supermemory Local, then inject it everywhere. |
| Team | (your name(s)) |
| Repo | https://github.com/daraijaola/recall |
| Demo video | (your Loom/YouTube link) |
| Live demo | https://agentr.online/sites/recall/ |
| App | https://agentr.online/sites/recall/app/ |

### 3. Discord showcase

1. Join: https://discord.com/invite/WtkvM62fHK  
2. Take **Hacker** role if needed  
3. Post in **#project-showcase** using the pinned template:

```
**RECALL**
One-liner: Portable AI memory on Supermemory Local — import ChatGPT/Claude history, structure it, inject via packs + MCP.
Team: ...
Repo: https://github.com/daraijaola/recall
Demo video: ...
Live: https://agentr.online/sites/recall/
How it uses Supermemory Local: All storage, embeddings, and hybrid search run on SM Local (localhost:6767). RECALL adds typed extraction, a SQLite graph (relations/supersession), import UI, and an MCP server (recall_search / recall_context / recall_remember / recall_forget) so coding agents read the same local memory.
```

### 4. Demo video

- Follow [DEMO.md](./DEMO.md)  
- Max 3 minutes  
- Public or unlisted link  

---

## Already done (code)

- [x] Public GitHub repo  
- [x] Real Supermemory Local integration  
- [x] Import ChatGPT + Claude  
- [x] Graph, conflicts, search  
- [x] Context pack + file generators  
- [x] MCP package  
- [x] README + START_HERE  

---

## Optional polish (only if time)

- [ ] npm publish `recall-mcp` (Connect can use `npx -y recall-mcp`)  
- [ ] Short GIF for Discord  
- [ ] Re-run `bash scripts/full-regression.sh` after last change  

---

## How it uses Supermemory Local (for judges)

Copy-paste answer:

> RECALL treats Supermemory Local as the system of record: every imported conversation and extracted memory is stored and searched via the local API on port 6767 (add document, hybrid search, list). We add a thin SQLite graph for types, relations, and supersession (which SM metadata doesn’t model). Context packs and MCP tools (`recall_search`, `recall_context`) read that same local memory so ChatGPT/Grok get paste packs and Claude Code/Cursor get live tools — without a cloud memory lock-in.
