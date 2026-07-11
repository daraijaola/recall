# Demo video — baby steps

**One video. Max 3 minutes.**  
Record this and use it for the hackathon + Discord.

---

## Before you hit record

### 1. Download the 2 demo files

From the repo (or your PC if you have them):

- `app/fixtures/sample-chatgpt.json`  
- `app/fixtures/sample-claude.json`  

Put them on your Desktop so you can drag them in.

### 2. Open these tabs

1. **Landing:** https://agentr.online/sites/recall/  
2. **App:** https://agentr.online/sites/recall/app/  
3. Hard-refresh the app (`Ctrl+Shift+R`)

### 3. Screen recorder

Loom / OBS / Windows Game Bar — 1080p if you can.

### 4. Optional: reset Conflicts

If Conflicts is empty, Import both samples again first (do this **before** recording).

---

## What we built (say this if asked)

| Piece | What it is |
|-------|------------|
| **RECALL** | Your app — portable AI memory |
| **Supermemory Local** | Runs on the machine (`localhost:6767`) — stores + searches memory |
| **Import** | Reads ChatGPT/Claude export files |
| **Home** | Graph/list of real memories |
| **Conflicts** | When two AIs disagree (Python vs TypeScript) |
| **Connect** | Paste packs + MCP config for other AIs |
| **recall-mcp** | Tools so Claude Code/Cursor can ask your memory |

**Story:** Your memory lives on YOUR machine, not locked in ChatGPT or Claude.

---

## Record this exact sequence

### Scene 1 — Hook (0:00–0:20)

**Screen:** Landing page  

**Say (slow):**  
“Six months of context in ChatGPT. Three months in Claude. Switch tools — you start from zero. Your memory isn’t yours.”

**Then:** Click into the **app** (or open the app tab).

---

### Scene 2 — Setup is live (0:20–0:35)

**Click:** **Setup** (nav)  

**Show:** Green **Connected** + memory count  

**Say:**  
“RECALL is plugged into Supermemory Local — everything stays on this machine.”

---

### Scene 3 — Import ChatGPT (0:35–1:05)

**Click:** **Import**  

**Do:** Drag `sample-chatgpt.json` onto the drop zone  

**Watch:** Parse → Extract → Link → done  

**Say:**  
“We import an official ChatGPT export. RECALL parses conversations, extracts memories, and stores them in Supermemory Local.”

---

### Scene 4 — Import Claude (1:05–1:25)

**Still on Import**  

**Do:** Drag `sample-claude.json`  

**Say:**  
“Same for Claude. Now both histories live in one brain.”

---

### Scene 5 — Hero conflict (1:25–1:55)

**Click:** **Conflicts**  

**Show:** ChatGPT = Python · Claude = TypeScript  

**Say:**  
“Hero moment. You told ChatGPT you prefer Python. Later you went all-in on TypeScript with Claude. RECALL catches that.”

**Click:** **Use Claude’s version** (the main blue button)  

**Say:**  
“You choose which version to trust. Graph updates.”

---

### Scene 6 — Home (1:55–2:15)

**Click:** **Home**  

**Show:** Real memories (not empty)  
**Click** one card so the detail panel opens  

**Say:**  
“Your portable memory — typed, labeled by source, ready to inject.”

---

### Scene 7 — Connect / inject (2:15–2:45)

**Click:** **Connect**  

**Do:**  
1. Toggle **Compact** pack — show the text (deadline, TypeScript, etc.)  
2. Click **Copy to clipboard**  
3. Briefly expand **Cursor** or **Claude Code** MCP config  

**Say:**  
“One click: paste this pack into ChatGPT or Grok. For coding agents — MCP tools: search, context, remember, forget.”

---

### Scene 8 — Close (2:45–3:00)

**Screen:** Landing or Setup “Connected”  

**Say:**  
“One brain. Every AI. Your machine. Built on Supermemory Local.”

**Stop recording.**

---

## After record

1. Upload unlisted YouTube **or** Loom  
2. Copy the link  
3. Paste into:
   - Submission form: https://forms.gle/ARXHNpFY5VNfiNDBA  
   - Discord #project-showcase (see SUBMISSION.md)  

---

## If something breaks mid-demo

| Problem | Fix |
|---------|-----|
| Not connected | Skip Setup story; still show Import |
| Conflict missing | Import both samples again, then Conflicts |
| MCP not live in Claude | Just **show the JSON** on Connect — enough for judges |
| App slow | Wait 2s on progress bars; don’t panic |

---

## Checklist before you submit the video

- [ ] Under 3 minutes  
- [ ] Import both files shown  
- [ ] Conflict shown + resolved  
- [ ] Connect pack shown  
- [ ] You said “Supermemory Local” at least once  
- [ ] Link works when opened in private browser  
