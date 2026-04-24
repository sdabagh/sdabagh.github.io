# AI Certificate in 28 Days — Waking Notes

Built while you slept. Everything is local; nothing has been committed or pushed.

---

## TL;DR

- Landing page + 28 day pages + client-side certificate generator = **all working in preview**.
- Site lives at `/learn/ai-certificate/` on your `sdabagh.github.io` repo (alongside the existing `/learn/ai-course/`, which I did not touch).
- Open in preview: server on port 8080, visit `/learn/ai-certificate/index.html`.
- Nothing committed yet. Review, edit, then `git add` + `commit` + `push` when you're happy.

---

## What you get

### Landing page — [`index.html`](index.html)
- Purple/indigo gradient hero with four big stats (28 days · 26 tools · 15 min/day · 100% free)
- "Especially if you're over 40" audience callout (your framing, unchanged)
- Live progress bar that reads from the visitor's localStorage
- Grid of 28 day cards organized into 6 weeks
- Explainer of how the course works + how the certificate unlocks
- Link into Day 28 for a certificate preview

### 28 day pages — [`days/day-01.html`](days/day-01.html) … [`days/day-28.html`](days/day-28.html)
Each day follows the same 4-section template:
1. **Why this tool matters** — one paragraph of framing
2. **Walkthrough** — 5 concrete numbered steps
3. **Your turn** — a specific exercise in a highlighted box
4. **Pro tip** + bookmark link to the tool

Plus a **Mark Day N as complete** button at the bottom (localStorage-backed) and prev/next nav.

**Day 28** additionally has the certificate section (locked/unlocked based on completion state) with a name input and a **Generate Certificate (PDF)** button.

### Certificate
- Generated client-side in the browser using jsPDF (no server, nothing uploaded).
- Landscape A4, purple-framed, learner's name in the middle, your name as signer at the bottom right.
- Saves as `AI_Certificate_<learner_name>.pdf`.
- **Gated** on all 28 days being marked complete. If they aren't, the page shows "27 days remaining" etc.

### Progress tracking
- All state lives in `localStorage` under `aiCertProgress` (object like `{"1": true, "2": true, …}`) and `aiCertLearnerName` (string).
- No account, no tracking, no cookies. If a learner switches browsers they re-mark days — intentional.
- Progress bar on the landing page and Day 28's gate both read the same state.

---

## The 28 days (quick reference)

| Week | Days | Theme |
|---|---|---|
| 1 | 1–7 | ChatGPT, Claude, Gemini, Perplexity, DeepSeek, Copilot, Grok |
| 2 | 8–10 | Lovable, Manus, Kimi |
| 3 | 11–15 | Midjourney, DALL·E 3, Leonardo AI, Nano Banana, Canva Magic Studio |
| 4 | 16–20 | Veo 3, Sora 2, Synthesia, Kling, AssemblyAI |
| 5 | 21–26 | Notion AI, Jasper, Beautiful.ai, Fathom, Zapier AI, Meta AI |
| 6 | 27–28 | Capstone (chain 3+ tools) · Certificate |

Each day has a specific, concrete exercise targeted at a working professional — not a toy prompt.

---

## File inventory

```
learn/ai-certificate/
├── index.html                    (landing, 28-day grid, progress bar)
├── build.py                      (the generator — rerun to regenerate all pages)
├── WAKING_NOTES.md               (this file)
├── assets/
│   ├── ai-cert.css               (course-specific styles, extends /style.css)
│   ├── progress.js               (localStorage tracker + progress bar renderer)
│   └── certificate.js            (client-side PDF cert via jsPDF)
├── days/
│   ├── day-01.html through day-28.html
└── downloads/                    (empty; reserved for future add-ons)
```

Global site nav was updated so the **Courses → AI Certificate (28 days)** dropdown link points to the new page.

---

## How to edit content

All 28 days' content lives in the `DAYS` list inside [`build.py`](build.py). To edit a day:

1. Open `build.py` and find the entry for that day (they're ordered).
2. Edit the `why`, `walkthrough`, `exercise`, `tip`, or `tagline` fields.
3. Run: `python3 build.py`
4. All pages regenerate from the manifest.

Don't edit the generated `.html` files directly — they'll be overwritten next time you run the builder.

---

## How to preview locally

A preview server on port 8080 is already running (launched during the build). If you need to restart it:

```bash
python3 -m http.server 8080 --directory /Users/safaadabagh/sdabagh.github.io
```

Then open:
- http://localhost:8080/learn/ai-certificate/index.html (landing)
- http://localhost:8080/learn/ai-certificate/days/day-01.html (first day)
- http://localhost:8080/learn/ai-certificate/days/day-28.html (certificate page)

---

## What I verified (QC)

-  Landing page renders all 28 day cards across 6 week sections
-  Audience callout, hero stats, and welcome reminder display correctly
-  Day 1 page renders the 4-section template with exercise + tip + bookmark
-  "Mark Day N as complete" button toggles and writes to localStorage
-  Day 28 cert page shows the **locked** view when progress < 28
-  Day 28 cert page shows the **unlocked** view when all 28 are complete
-  "Generate Certificate (PDF)" produces a valid PDF (verified with jsPDF sanity test)
-  Mobile layout checks out (hero stacks, cards wrap, nav collapses)
-  Test localStorage was cleared before I handed it back — you'll open a fresh state

---

## Known gaps / deliberate choices

- **No server-side tracking.** Intentional. If you want per-learner analytics later, drop a tiny `fetch` into the `markComplete` function in `assets/progress.js` to hit your own endpoint.
- **No payment.** The original marketing creative mentioned "$20." I built it free per our agreed defaults. If you want paid, the simplest path is a Stripe payment link on the landing page that unlocks an email-gated version — we can add that later.
- **Screenshots in walkthroughs are described, not shown.** Real screenshots would need you to record them (tool UIs change frequently; I don't want to ship stale ones). A future pass could add them.
- **Course exists in isolation so far.** I added it to the site's main nav dropdown, but you may want to also add a card for it on `free-courses.html` — 5-minute edit when you're ready.
- **Certificate signer is "Safaa Dabagh · Learn Without Walls · Course Author."** If you want a different signer line, edit `assets/certificate.js` around line ~75.
- **The `meta-num` for "100%" wraps slightly on small screens** because the number is longer than the others. Minor; you may or may not want to tweak.

---

## When you're ready to ship

```bash
cd /Users/safaadabagh/sdabagh.github.io
git status                                    # review the new files
git add learn/ai-certificate books.html textbook/Applied_Statistics_Using_R.pdf
git commit -m "Add AI Certificate in 28 Days course + MATH 205 textbook to books page"
git push
```

(Note: I did NOT commit anything on your behalf. Everything is working-tree only.)

---

Have fun reading through. Nothing is precious — rerun `build.py` anytime to regenerate.
