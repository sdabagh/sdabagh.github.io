# AI for Creators & Researchers — Waking Notes

Built. Everything is local. **Nothing has been committed or pushed yet.**

---

## TL;DR

- **30 day pages + landing page generated** — all working in preview
- **~41,000 words of premium paid-tier content** across 6 themed weeks + capstone + certificate
- Lives at `/learn/ai-creators-researchers/` on your `sdabagh.github.io` repo
- **Nothing committed.** Review in preview first, then `git add / commit / push` when you're happy.

**Preview it locally:** server is already running on port 8080. Open:

- Landing: http://localhost:8080/learn/ai-creators-researchers/index.html
- Day 1 (NotebookLM): http://localhost:8080/learn/ai-creators-researchers/days/day-01.html
- Day 25 (MathGPT, College Week): http://localhost:8080/learn/ai-creators-researchers/days/day-25.html
- Day 29 (Capstone): http://localhost:8080/learn/ai-creators-researchers/days/day-29.html
- Day 30 (Certificate): http://localhost:8080/learn/ai-creators-researchers/days/day-30.html

---

## The 30-day curriculum

| Week | Theme | Days | Tools |
|---|---|---|---|
| 1 | Deep Research | 1-5 | NotebookLM · Perplexity Deep Research · Elicit · Consensus · Claude Projects |
| 2 | Coding & Vibe-Building | 6-10 | Cursor · Windsurf · GitHub Copilot · v0 · Bolt.new |
| 3 | Voice & Audio | 11-15 | ElevenLabs · Otter.ai · Descript · Suno · Adobe Podcast |
| 4 | Video Creation | 16-20 | Runway · HeyGen · Pictory · Opus Clip · Captions |
| 5 | Business Power Tools | 21-24 | Gamma · Clay · Lindy · Grammarly AI |
| 6 | College Student Toolkit | 25-28 | MathGPT · Sizzle AI · QuillBot · SciSpace (**strictly no ChatGPT**) |
| 7 | Capstone + Certificate | 29-30 | Multi-tool capstone · PDF certificate + reflection |

Every content day has the same deep structure:

1. Opening vignette (italicized scenario)
2. "Why this tool matters" (300+ word multi-paragraph framing)
3. Setup notes (account tier, privacy, prerequisites)
4. 6-step walkthrough
5. **Two** exercises: Basic + Advanced
6. 3 pitfalls / pro tips
7. Honest comparison to alternatives
8. "When to use — and when not to" guide
9. Further reading links

Every day ends with a **Mark Day N as complete** button (localStorage-backed). Day 30 adds the certificate gate.

---

## What makes this course different from the 28-day free one

| | AI Certificate (free) | AI for Creators & Researchers (this one) |
|---|---|---|
| Days | 28 | 30 |
| Min/day | ~15 | ~30 |
| Words per day | ~300 | ~1,100-1,500 |
| Exercises per day | 1 | 2 (beginner + advanced) |
| Audience | Working professionals 40+ | Creators, researchers, college students |
| Framing | Friendly tour | Paid-tier reference |
| Pricing line | "Free Forever" | "Free in preview, $49/yr later" |
| Color | Purple | Charcoal + warm gold |
| Tools | ChatGPT included | **No ChatGPT** (per your directive) |

Both courses sit side-by-side on the site. The free one is a natural on-ramp; this one is the depth course.

---

## File inventory

```
learn/ai-creators-researchers/
├── index.html                    (landing page, ~20KB)
├── build.py                      (week 1 + renderer)
├── build_days_2.py               (weeks 2-7, imported by build.py)
├── WAKING_NOTES.md               (this file)
├── assets/
│   ├── course.css                (~14KB, charcoal + gold premium styling)
│   ├── progress.js               (aiCRProgress namespace, 30-day tracker)
│   └── certificate.js            (gold-foil A4 PDF generator via jsPDF)
├── days/
│   └── day-01.html through day-30.html (~12-16KB each)
└── downloads/                    (empty; reserved for future add-ons)
```

Also modified: **`free-courses.html`** — added two new course cards under the AI & Technology section (the 28-day free course + this 30-day premium course).

---

## How to edit content

All 30 days' content lives in two files:

- `build.py` contains Week 1 (Days 1-5) in the `DAYS` list
- `build_days_2.py` contains Weeks 2-7 (Days 6-30) in the `DAYS_WEEK_2_TO_7` list

To edit any day: open the corresponding Python file, find the entry for that day, edit the fields (`why_html`, `walkthrough`, `ex_basic`, `ex_advanced`, etc.), then run:

```bash
cd learn/ai-creators-researchers
python3 build.py
```

All 30 pages regenerate. Never edit the generated `.html` files directly — they get overwritten.

---

## What I verified (QC)

- Landing page renders: 30 day cards across 7 week blocks, progress bar, pricing band, all 4 pillar cards
- Day 1 (NotebookLM) page: vignette, 14 sections, 2 exercise blocks, 3 meta pills, proper day nav
- Day 30 (Certificate): cert gate flips correctly
  - With 0-29 days complete → "locked" view with "X days remaining"
  - With 30 days complete → "unlocked" view with name input + Generate button
- Name prefills from localStorage across page refreshes
- `aiCRProgress` namespace does not collide with the first course's `aiCertProgress`
- Certificate generator loads jsPDF cleanly
- Every day page has: mark-complete button, prev/next nav, "All 30 days" center link
- Test localStorage was **cleared** before I handed it back — you'll see a fresh course on first load

---

## Pricing strategy (for your review)

The landing page currently says:

> **Free while in preview**
> This course is free to access during its launch period.
> **Free · moving to $49 / year later**
> Start now — anyone who completes the course during preview keeps lifetime access when the paid tier launches.

This is the scarcity-meets-generosity framing you'd want for a launch. Two ways to monetize later:

1. **Keep it free + add a "Certificate of Completion" paid verification** ($19 one-time for a signed, QR-coded PDF that verifies against your site). Low friction, high conversion.
2. **Paywall the course proper** with Stripe (~$49/year or $9/month). Higher revenue, higher friction, harder to build authority fast.

My vote: keep option 1 in mind; start free-forever and add a paid verification layer once you have users. I haven't wired any payment integration — that's a deliberate gap waiting for your direction.

---

## Known gaps / deliberate choices

- **No screenshots in walkthroughs.** Tool UIs change monthly; stale screenshots are worse than no screenshots. The written walkthroughs are detailed enough to follow without them.
- **No video intros.** Could add per-week video intros (recorded by you, narrated by ElevenLabs, or HeyGen avatars) as a paid-tier perk later.
- **Certificate signer is "Safaa Dabagh · Founder, Learn Without Walls."** If you'd prefer a different signer line, edit `assets/certificate.js` around line 80.
- **Mobile landing page:** tested, works, looks fine. Day pages also responsive.
- **Nav global rewrite:** not needed. Every page's "Courses → AI & Technology" dropdown routes through `/free-courses.html#ai`, which now lists both AI courses. Global nav is already discoverable.
- **Accessibility:** the charcoal + gold design is high-contrast and readable. Haven't run a formal WCAG audit but the palette is designed for it.

---

## When you're ready to ship

```bash
cd /Users/safaadabagh/sdabagh.github.io
git status                    # review what's new
git add learn/ai-creators-researchers free-courses.html
git commit -m "Add AI for Creators & Researchers — 30-day premium course"
git push
```

GitHub Pages will rebuild in ~60 seconds. After that, the course is live at:

- https://learnwithoutwalls.com/learn/ai-creators-researchers/

And linked from https://learnwithoutwalls.com/free-courses.html#ai .

---

## Running tally across both AI courses

- **AI Certificate in 28 Days** (free): 28 pages, ~8,500 words. Published. Live.
- **AI for Creators & Researchers** (this): 30 pages, ~41,000 words. Built. Not yet committed.

Together: **58 day pages of AI course content on your site.** That's a genuinely differentiated offering. Congratulations on making something real.

---

Have fun reading through. The course template is extensible — if you want to add a Week 8 later (specialized themes like legal AI, healthcare AI, AI in education), the pattern is in `build_days_2.py`; adding another 5 days would take an afternoon.
