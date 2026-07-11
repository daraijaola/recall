# Demo video script (≤ 3 minutes)

Speak calmly. Screen-record the live app: **https://agentr.online/sites/recall/app/**

---

## 0:00 – Hook (20s)

**Say:**  
“Six months of context in ChatGPT. Three in Claude. Switch tools — you start from zero. Your memory isn’t yours.”

**Show:** Landing page one-liner / logo.

---

## 0:20 – Import ChatGPT (40s)

**Go to:** Import  

**Do:** Drop `sample-chatgpt.json` (or real export).

**Say:**  
“RECALL imports your official export. Parsing conversations… extracting preferences and decisions… linking memories — all on Supermemory Local, on this machine.”

**Show:** Progress bar Parse → Extract → Link → done.

---

## 1:00 – Import Claude + conflict (40s)

**Do:** Drop `sample-claude.json`.

**Go to:** Conflicts  

**Show:** ChatGPT said **Python**; Claude said **TypeScript**.

**Say:**  
“Here’s the hero moment. You told ChatGPT you prefer Python. Months later you went all-in on TypeScript with Claude. RECALL surfaces the conflict.”

**Do:** Click **Use Claude’s version** (keep_new).

---

## 1:40 – Home graph (20s)

**Go to:** Home  

**Say:**  
“Your portable brain — typed memories, sources labeled, superseded facts handled.”

**Click** one memory → detail panel.

---

## 2:00 – Inject everywhere (40s)

**Go to:** Connect  

1. **Copy compact pack** — flash the text (deadline, TypeScript, etc.)  
   **Say:** “One click — paste into ChatGPT, Grok, or Gemini.”

2. **MCP** — expand Cursor or Claude Code config  
   **Say:** “For coding agents, `recall-mcp` tools: search, context, remember, forget.”

3. Optional: download **CLAUDE.md**

---

## 2:40 – Close (20s)

**Say:**  
“One brain. Every AI. Your machine. Built on Supermemory Local.”

**Show:** Setup “Connected” + logo / landing.

---

## Record tips

- Use fixtures so the conflict always appears  
- Hard-refresh before recording  
- 1080p, clear mouse  
- Max **3 minutes**  
- Upload unlisted YouTube/Loom → paste link in submission form  

---

## Backup if MCP live-connect fails

Don’t block the video. Show:

1. Connect → MCP config JSON  
2. Terminal: `node packages/recall-mcp/dist/index.js` starting  
3. Or skip MCP UI and say “stdio MCP ships in the repo — four tools”

The **import + conflict + pack** sequence is enough to win the story.
