# Making the courses work for neurodivergent and ADHD learners

Audit of all 26 courses under `learn/` (1,935 pages), October 2026. Part 1 is what was changed in this pass.
Part 2 is a prioritised plan for what comes next, with the evidence from the audit next to each item.

## Part 1. Done in this pass

| Change | Why it matters |
|---|---|
| The Lexend dyslexia font now actually loads. The `@import` sat in the middle of `style.css`, where browsers ignore it, so the "Dyslexia Font" toggle only changed spacing. | Lexend and wider letter spacing are the two things dyslexic readers ask for most. |
| Accessibility panel added to the 457 course pages that lacked it (Financial Literacy for Statisticians, Hayya Beena Naqraa, Math for Young Minds, Yalla Arabic, and scattered pages elsewhere). | Dark mode, font size, dyslexia font and reading mode were missing on a quarter of the site. |
| New panel options: **Reading Ruler** (a soft band that follows the pointer) and **Read Aloud** (browser speech, reads a selection or the whole lesson). | Line-tracking and listening-while-reading are the two cheapest supports for ADHD and dyslexia. |
| "Skip to content" link on every page, visible on the first Tab. | Keyboard and screen-reader users no longer tab through the menu on every page. |
| Visible focus ring on every link, button and form control. | Keyboard users can see where they are. |
| Animations and transitions switch off when the operating system's "reduce motion" setting is on. | Motion is a documented distraction and vestibular trigger. |
| Dead ends fixed: College Algebra post-assessment said "Module 2 coming soon" (it exists); Statistics with R was reachable only by URL, now listed on the catalogue, the search page and the learning path. | A dead end is where an ADHD learner stops. |

## Part 2. Recommendations, in priority order

### 1. Chunk the long lessons (highest impact)

Audit: College Algebra lessons have a median of 1,342 words and run to 5,900 (conic sections, linear programming).
Financial Literacy for Statisticians has a median of 3,618 words per page and 108 paragraphs over 120 words.
Math for Young Minds sessions run to 2,950 words on one page. Intro Stats lessons run to 4,300.

- Target 10 to 15 minutes per page (roughly 900 to 1,200 words with one worked example). Split anything above 2,000 words into "Part 1 / Part 2" pages with their own Key Takeaways.
- Put a **lesson map** at the top of every lesson: numbered sections with anchor links and a "you are here" marker, and make sections collapsible so a learner can hide what is done.
- Cap paragraphs at about 60 words. Turn multi-idea paragraphs into numbered steps or two-column "idea / example" blocks.

### 2. Make every lesson page the same shape

Audit: Intro Stats and College Algebra follow a consistent pattern (objectives, concept, Check Your Understanding, Key Takeaways). AI Certificate (0 of 29 pages) and Data Analyst (0 of 22) have no summary block; labs have no estimated time; only 30 percent of lesson pages state a time.

A predictable template reduces the executive-function load of "what do I do on this page". Recommended order, identical everywhere:

1. Header card: what you will learn (3 bullets), estimated time, what you need.
2. Warm-up: one question that activates prior knowledge (30 seconds).
3. Concept in plain language, then the formal statement.
4. Worked example with numbered steps and a one-line "why" beside each step.
5. Try it: 2 to 3 questions with immediate feedback and a hint before the solution.
6. Key Takeaways (3 bullets) and "One thing to remember".
7. Next step button, and "Mark this lesson done".

### 3. Progress that the learner can see

Audit: only the AI Certificate, AI for Creators and the Python/R/SQL labs save progress; 20 course index pages have none.

- "Mark lesson done" button storing to localStorage; module index shows a checkmark per lesson and a percent bar.
- "Resume where you left off" banner on the course index (the Stats Without Walls tool already does this; reuse the pattern).
- Visible streaks are optional and should be opt-in; a broken streak is demotivating for many ADHD learners.

### 4. Working-memory supports for the math itself

- A **sticky formula box** on lesson pages: the one to three formulas in play, pinned while scrolling.
- Consistent colour coding across a course (for example the same colour for the mean, for a standard deviation, for the test statistic) and a legend on the quick reference card.
- Render formulas with KaTeX or MathML instead of plain text. No course page currently uses either, so expressions like `(x - mean) / s` are read as prose by screen readers and are hard to scan visually.
- "Estimate first" prompts before calculations, and number lines or area pictures before symbols (the Intro Stats visualizations already do this well; extend to algebra and calculus).

### 5. Practice that fits short attention windows

- Practice sets of 5 with a "do 5 more" button, instead of pages of 15 to 20 problems. The problems can stay; the presentation changes.
- Hint, then second hint, then solution (the Intro Stats practice pages use expandable solutions; add the hint layer).
- Allow retries on quizzes without penalty and show the explanation for every option, not only the correct one.
- Keep the current "no time limit" rule on every assessment (all intro-stats assessments already say so).

### 6. Reading and attention controls (platform-wide)

- **Focus mode**: extend Reading Mode to also hide the header, footer and side cards, leaving only the lesson column.
- Line length of 60 to 75 characters in reading mode (the 720px cap does this; keep it when the font is enlarged).
- Glossary tooltips: hover or tap on a bold term shows a one-sentence definition. Only Intro Stats, Kids Coding and Financial Literacy have glossaries at all.
- A one-line plain-language summary at the top of every module index.

### 7. Make the remaining pages part of the system

Audit: 82 study-guide and quick-reference pages (Calculus I, Linear Algebra, Trigonometry, Differential Equations) carry their own styles and do not load `style.css`, so none of the accessibility controls reach them. Migrate them to the shared stylesheet and the same page template.

### 8. Fun, not just accessible

- Story-driven problems with recurring characters per course (the young-learners courses do this; the college courses mostly do not).
- A choice of practice path ("pick any 3 of these 6") gives autonomy, which raises engagement for ADHD learners more than points do.
- Celebrate completion of each lesson with a badge and a one-sentence "what you can now do" (badges already exist in Intro Stats; make them universal).
- Interactive demonstrations over static text: the SVG visualizations in Intro Stats and the Desmos labs in College Algebra are the model.

### 9. Measure it

- Add a single question at the end of each quiz: "Was this lesson the right length?" (too short / right / too long). Two weeks of answers will say exactly which pages to split first.
- Track lesson completion rates per page with a privacy-respecting counter (Plausible or GoatCounter) once an account exists; a page where many start and few finish is the next one to chunk.

## Suggested order of work

1. Chunk College Algebra and Financial Literacy for Statisticians (the longest pages).
2. Apply the lesson template and "mark done" progress to Intro Stats, then College Algebra (your own courses first).
3. Formula rendering (KaTeX) and sticky formula boxes across the math courses.
4. Migrate the 82 orphan study-guide pages to the shared stylesheet.
5. Glossary tooltips and focus mode.

## Update, 2026-10-20: the statistics app

Stats Without Walls (`stats/`) now carries the same accessibility panel as the course pages (dark mode, larger text, Lexend,
reading ruler, read aloud), bottom left so it stays clear of the Ask helper. Its dialogs show the essentials first and fold
the sections most runs never touch under a "more options" heading that stays open once opened, which cuts the longest dialogs
from a wall of fields to a handful. A green bar announces a new version instead of leaving people on a stale copy.
