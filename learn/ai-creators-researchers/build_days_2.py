"""
build_days_2.py

Days 6–30 of the AI for Creators & Researchers course.
Imported by build.py as DAYS_WEEK_2_TO_7 and concatenated to the Week 1 data.

Content is deliberately long-form — this is a paid-tier course.
"""

DAYS_WEEK_2_TO_7 = [

    # =====================================================================
    # WEEK 2 — CODING & VIBE-BUILDING
    # =====================================================================
    {
        "num": 6,
        "tool": "Cursor",
        "focus": "The IDE that thinks alongside you.",
        "url": "https://cursor.com",
        "tagline": "An AI-native code editor that edits whole files, not just the line under your cursor.",
        "pills": ["~40 min", "Free tier available", "Paid: $20/mo"],
        "vignette": (
            "You've been stuck on a refactor for two hours. You know roughly what you want — "
            "&ldquo;pull this logic out of the handler into a separate module, update the three "
            "callers, keep the tests passing&rdquo; — but the path between knowing and doing "
            "involves opening eight files and holding everything in your head at once. You are "
            "about to type the entire instruction into a chat window and hope for the best."
        ),
        "why_html": """
<p>
  <strong>Cursor is a fork of VS Code rebuilt around the assumption that you will be
  collaborating with an AI on almost every change.</strong> Unlike GitHub Copilot (Day 8),
  which completes the line or block under your cursor, Cursor operates at the
  <em>project</em> level: you can describe a multi-file change in plain English and watch
  the editor propose diffs across your entire repository.
</p>
<p>
  The central experience is the <strong>Composer</strong> (Cmd+I). You open it, describe
  what you want — <em>&ldquo;extract the auth logic from <code>routes/login.js</code> into
  a new <code>lib/auth.js</code> module; update the two callers; don't touch the
  tests&rdquo;</em> — and Cursor proposes a multi-file diff. You review each file's
  changes, accept or reject, and the work is done. For tasks that would have required
  thirty minutes of window-switching, you get a reviewable pull-request-sized change in
  about ninety seconds.
</p>
<p>
  What makes Cursor genuinely different from &ldquo;AI autocomplete&rdquo; is the depth of
  project context. It indexes your whole repository, understands imports and dependencies,
  and references your actual code in the suggestions it makes. When it writes a function
  call, it uses the argument names your other files use. When it changes a type, it
  updates the dependents. This is the step-change from AI-as-autocompleter to
  AI-as-collaborator, and it is the reason professional developers have moved to it in
  droves over the past eighteen months.
</p>
""",
        "setup_html": """
<p><strong>Install:</strong> download from cursor.com for Mac, Windows, or Linux. Log in
with GitHub or Google. The free tier gives you enough requests to try the tool seriously;
the $20/month Pro tier removes the cap and unlocks faster models.</p>
<p><strong>Bring a project:</strong> open a real repository — even a small one (a personal
site, a class project, a half-finished script). Cursor's value is proportional to the
size of your codebase; a blank folder does not showcase what it can do.</p>
<p><strong>Prereq:</strong> basic comfort in the terminal and git. Cursor assumes you
know how to read a diff.</p>
""",
        "walkthrough": [
            {
                "title": "Open your project and index the codebase",
                "body": (
                    "In Cursor, use <strong>File &rarr; Open Folder</strong> and pick a real project. "
                    "Give it 30 seconds to index. In the bottom status bar you'll see "
                    "<em>Indexing &hellip;</em> finish. This is the moment Cursor reads every file "
                    "and builds a semantic map — the thing that makes everything that follows work."
                ),
            },
            {
                "title": "Inline edits (Cmd+K)",
                "body": (
                    "Open a file. Put your cursor on a line or select a block. Press <strong>Cmd+K</strong>. "
                    "Type an instruction in plain English: <em>&ldquo;Add input validation; reject "
                    "emails without an @ sign.&rdquo;</em> Cursor inserts a diff inline; press Tab to "
                    "accept or Esc to reject. This is the 10-second version of AI editing and you'll "
                    "use it fifty times a day."
                ),
            },
            {
                "title": "Chat (Cmd+L) — the conversation pane",
                "body": (
                    "Press <strong>Cmd+L</strong> to open the chat pane on the right. Drag any file "
                    "into the chat to add it as context, or type <code>@</code> to search your codebase "
                    "by name. Ask a question: <em>&ldquo;Where does this app handle user "
                    "registration?&rdquo;</em> Cursor answers by citing specific files and functions."
                ),
            },
            {
                "title": "Composer (Cmd+I) — multi-file changes",
                "body": (
                    "This is the flagship feature. Press <strong>Cmd+I</strong>. Describe a change "
                    "that spans multiple files: <em>&ldquo;Add a dark-mode toggle. Add the CSS "
                    "variables, the toggle component, and wire the state to localStorage so it "
                    "persists.&rdquo;</em> Cursor proposes a multi-file diff. Review each file, "
                    "accept/reject per-file or per-hunk, then apply."
                ),
            },
            {
                "title": "Use Cursor Rules to lock in your conventions",
                "body": (
                    "Create a <code>.cursor/rules</code> file in your repo. This is a plain-text "
                    "briefing for the AI: your coding style, the libraries you want it to prefer, "
                    "the patterns it should never produce. Every request to Cursor reads these "
                    "rules. The difference between Cursor with and without a rules file is dramatic; "
                    "a good rules file is the single highest-leverage 20 minutes you'll spend."
                ),
            },
            {
                "title": "Always read the diff before accepting",
                "body": (
                    "This is the one habit that separates people who ship bugs with AI from people "
                    "who ship clean code. Cursor will occasionally propose changes that look right "
                    "but do the wrong thing. Treat every diff like you would a pull request from a "
                    "competent but unknown junior engineer — trust, but verify."
                ),
            },
        ],
        "ex_basic": {
            "title": "Basic: Make one real change on a real project",
            "meta": ["~15 min", "Level: Beginner"],
            "body": (
                "<p>Open a project you have — yours or a cloned open-source one. Think of a "
                "small change you've been putting off: add a console log, fix a typo in a "
                "label, add one more validation check. Do it using only Cmd+K (inline edit). "
                "Read the diff before accepting.</p>"
                "<p>Goal: feel how different it is from typing the code yourself.</p>"
            ),
        },
        "ex_advanced": {
            "title": "Advanced: A Composer-driven feature",
            "meta": ["~40 min", "Level: Advanced"],
            "body": (
                "<p>Pick a small feature you actually want on a real project — a dark-mode "
                "toggle, a &ldquo;copy to clipboard&rdquo; button, an export-as-CSV, a sort-by-date "
                "option. Write a <code>.cursor/rules</code> file first (about 10 lines) declaring "
                "your coding style and preferred libraries.</p>"
                "<p>Then use <strong>Cmd+I (Composer)</strong> to describe the feature in 2-3 "
                "sentences. Review every file in the proposed diff before accepting. Run the "
                "tests (or the app manually). Fix anything that's wrong via iterative prompts: "
                "<em>&ldquo;the toggle flickers on load because the initial state is wrong — "
                "fix it by reading localStorage before first paint.&rdquo;</em></p>"
                "<p>Ship the change (commit, push). Write yourself a 50-word note: what was "
                "faster than doing it by hand? What did Cursor get wrong the first time?</p>"
            ),
        },
        "pitfalls": [
            "<p><strong>It will confidently delete things you wanted.</strong> Always read the "
            "full diff, not just the first file. Cursor sometimes removes code it considers "
            "redundant but that was actually load-bearing somewhere else. Version control (git) "
            "is not optional — commit before any Composer run so you can revert in one command.</p>",
            "<p><strong>Context limits matter.</strong> If you send Cursor ten huge files in "
            "one Composer request, it will forget half of them. For large projects, use "
            "<code>@</code> to reference only the files that matter, or break the change "
            "into two smaller passes.</p>",
            "<p><strong>A weak rules file leads to drift.</strong> Without a <code>.cursor/rules</code> "
            "file, Cursor gradually introduces new libraries, new style conventions, and its "
            "own preferred patterns into your codebase. After a month this adds up to real "
            "inconsistency. A rules file is the fence that keeps the AI inside your style.</p>",
        ],
        "compare_html": """
<p>
  Cursor's direct competitor is <strong>Windsurf</strong> (Day 7). The two are
  extraordinarily similar in capability — both are VS Code forks with inline edits,
  multi-file composer, and project indexing. Cursor tends to be slightly ahead on raw
  edit quality; Windsurf tends to be slightly ahead on its agentic &ldquo;Cascade&rdquo;
  mode, where the AI takes multi-step actions (running commands, reading output, iterating).
  <strong>GitHub Copilot</strong> (Day 8) is line-by-line autocomplete inside VS Code —
  a different and complementary paradigm. Most professional developers I know use Cursor
  <em>or</em> Windsurf as their primary editor, and keep Copilot installed as a
  background autocomplete.
</p>
""",
        "when_to_use": """
<p><strong>Use Cursor when</strong> you have a real codebase to work in and need changes
that span multiple files or require real project context. It is particularly good for
refactors, bug fixes in unfamiliar codebases, and &ldquo;I know what I want, I don't want
to type it all&rdquo; tasks.</p>
<p><strong>Do not use Cursor when</strong> you are writing from a completely blank slate
with no existing code (v0 and Bolt.new — Days 9 and 10 — are better for that), or when
you are exploring a design idea and need to throw away and restart often (a scratch file
in a regular editor is lighter).</p>
""",
        "further": [
            {"label": "Cursor home", "url": "https://cursor.com"},
            {"label": "Cursor docs: Rules for AI", "url": "https://docs.cursor.com/context/rules"},
        ],
    },
    {
        "num": 7,
        "tool": "Windsurf",
        "focus": "An agentic IDE that can take multi-step actions on its own.",
        "url": "https://windsurf.com",
        "tagline": "Ask it to do a task. Watch it read files, run commands, and iterate until it's done.",
        "pills": ["~40 min", "Free tier", "Paid: $15/mo"],
        "vignette": (
            "You've asked an AI to fix a bug, and it's given you the code change. But you know "
            "there will be a follow-up: the tests will fail, you'll paste the error back, it'll "
            "propose another fix, the linter will complain, another round. Five rounds to fix a "
            "three-line bug. What if the AI could just do all of that itself?"
        ),
        "why_html": """
<p>
  <strong>Windsurf (from Codeium) is a VS Code fork built around Cascade, an agentic
  coding mode that can run commands, read their output, and keep iterating until a task
  is done.</strong> It's the closest thing in this course to a real software-engineering
  agent: you describe a goal, Windsurf plans the steps, executes them, and tells you when
  it's blocked or finished.
</p>
<p>
  The practical difference from Cursor is subtle but important. Cursor is excellent at
  <em>proposing diffs</em>; you still apply them and run the tests yourself. Windsurf's
  Cascade mode takes the loop inward: it proposes a diff, applies it, runs the command
  you specified (<code>npm test</code>, <code>pytest</code>, <code>pnpm build</code>),
  reads the output, and — if something failed — proposes another round. For tasks with a
  clear automated signal of success (tests pass, build succeeds, lint is clean), this is
  transformative. A 20-minute debugging loop becomes a 2-minute walk-away.
</p>
<p>
  Windsurf also has an extraordinary <strong>memory</strong> feature: it remembers
  design decisions, coding preferences, and project-specific context across sessions. The
  first week with Windsurf feels similar to Cursor; by week three, it has learned
  enough about your habits that it starts producing work you barely need to edit.
</p>
""",
        "setup_html": """
<p><strong>Install:</strong> download from windsurf.com. Sign in with Google, GitHub, or
email. Free tier is generous enough for serious evaluation; Pro ($15/month) unlocks more
Cascade runs.</p>
<p><strong>Bring:</strong> a project with an automated success signal — a test suite,
a type checker, a linter, a build command. Windsurf's agentic mode rewards projects where
&ldquo;it works&rdquo; has a clear definition.</p>
""",
        "walkthrough": [
            {
                "title": "Open Cascade and try a simple task",
                "body": (
                    "Open your project. Press the <strong>Cascade</strong> button in the right "
                    "sidebar. Type a task that requires looking at the project: <em>&ldquo;What "
                    "does the authentication flow do? Walk me through the files involved.&rdquo;</em> "
                    "Watch Windsurf open files, read them, and summarize."
                ),
            },
            {
                "title": "Now give Cascade a task with an action",
                "body": (
                    "Try: <em>&ldquo;Find the function that validates email addresses. Add "
                    "support for plus-addressing (foo+tag@bar.com should be valid). Run the "
                    "tests and fix any that break.&rdquo;</em> Cascade will locate the function, "
                    "propose a diff, run your tests, and — if a test fails — iterate."
                ),
            },
            {
                "title": "Review the action log",
                "body": (
                    "As Cascade works, it shows you every step: the files it read, the commands "
                    "it ran, the output it saw, the diffs it applied. You can stop it at any "
                    "time, ask a question, or nudge it in a different direction. This is the "
                    "transparency that separates Windsurf from black-box agents."
                ),
            },
            {
                "title": "Approve command execution",
                "body": (
                    "Windsurf asks before running commands that touch your system — installing "
                    "packages, writing files outside the project, starting servers. Review each "
                    "request. The default deny-list is sensible, but the value of the tool is "
                    "maximum when you let it run tests, linters, and formatters freely."
                ),
            },
            {
                "title": "Use Memory to lock in style",
                "body": (
                    "When you notice Windsurf making the same mistake twice, tell Cascade: "
                    "<em>&ldquo;Remember: we use snake_case for database columns, never "
                    "camelCase.&rdquo;</em> Windsurf records this to long-term memory. Future "
                    "sessions will remember, without you re-explaining."
                ),
            },
            {
                "title": "End with a checkpoint commit",
                "body": (
                    "After a Cascade run, always commit to git with a descriptive message before "
                    "starting the next task. This gives you a clean revert point and a "
                    "human-readable audit trail. If a Cascade run goes sideways, <code>git reset "
                    "--hard HEAD</code> puts you right back where you were."
                ),
            },
        ],
        "ex_basic": {
            "title": "Basic: A single-file fix with Cascade",
            "meta": ["~20 min", "Level: Beginner"],
            "body": (
                "<p>Find a bug or a small feature in a project you know — something with a failing "
                "test, or something where the behavior is obvious (a label is wrong, a number is "
                "off by one). Ask Cascade to fix it. Watch it propose the diff, run the tests, "
                "and iterate if needed. Read the action log afterward.</p>"
                "<p>Goal: see how different &ldquo;AI writes and runs&rdquo; is from &ldquo;AI "
                "writes, I run.&rdquo;</p>"
            ),
        },
        "ex_advanced": {
            "title": "Advanced: A real refactor with a success signal",
            "meta": ["~50 min", "Level: Advanced"],
            "body": (
                "<p>Pick a refactor you've been putting off — something with a clear shape: "
                "&ldquo;extract this logic into a module,&rdquo; &ldquo;rename this concept "
                "throughout the codebase,&rdquo; &ldquo;switch from callbacks to async/await in "
                "this module.&rdquo; The key criterion: there must be a clear test command that "
                "tells you when the work is done.</p>"
                "<p>Write the task for Cascade in 3-5 sentences, including the success signal: "
                "<em>&ldquo;When this is done, <code>npm test</code> should pass and "
                "<code>grep -r &quot;old-name&quot; src/</code> should return zero results.&rdquo;</em></p>"
                "<p>Start Cascade and walk away for 5 minutes. Come back. Read the action log. "
                "Review the final diff carefully before committing.</p>"
                "<p>Write a 100-word reflection: what did Cascade do well, and what did you "
                "have to correct by hand? That reflection is the skill of being a good pilot of "
                "an agentic tool.</p>"
            ),
        },
        "pitfalls": [
            "<p><strong>Agents love scope creep.</strong> If your task description is vague, "
            "Cascade will sometimes &ldquo;helpfully&rdquo; refactor adjacent code you didn't "
            "ask it to touch. Be explicit about boundaries: <em>&ldquo;Only modify "
            "<code>src/auth/</code> and <code>tests/auth/</code>. Do not touch anything else.&rdquo;</em></p>",
            "<p><strong>Running commands without review is dangerous.</strong> Cascade can be "
            "convinced to run destructive commands (<code>rm -rf</code>, <code>git push "
            "--force</code>) if they were implied by the task. Review every command approval "
            "prompt. Never auto-approve.</p>",
            "<p><strong>Memory can go stale.</strong> After a few months, Windsurf's memory "
            "accumulates decisions that no longer reflect how you want to work. Visit the "
            "Memory settings quarterly and prune entries that are no longer true.</p>",
        ],
        "compare_html": """
<p>
  Windsurf and <strong>Cursor</strong> (Day 6) are the two leading AI-native IDEs; picking
  between them is often a matter of taste. Rough guidance: <em>Cursor</em> has a slight
  edge on the quality of inline edit diffs; <em>Windsurf</em> has a slight edge on the
  agentic Cascade experience. Both integrate every major model (Claude, GPT, Gemini) and
  both let you bring your own API keys. The right move for any serious developer is to
  try both for a week and keep whichever fits your habits. <strong>Replit Agent</strong>
  is the third strong competitor, notable for running in-browser with a live preview —
  great for web projects, less flexible for backends or CLI tools.
</p>
""",
        "when_to_use": """
<p><strong>Use Windsurf when</strong> your task has a clear automated success signal
(tests pass, build succeeds, lint clean) and would benefit from multi-step iteration —
refactors, bug-hunting, adding features that span many files.</p>
<p><strong>Do not use Windsurf when</strong> you're exploring an idea and want to think
at the keyboard (inline edits in Cursor or a regular editor are better for that), or when
the task has no automated signal (visual design, UX copy, product decisions). Agents
without a success signal tend to loop.</p>
""",
        "further": [
            {"label": "Windsurf home", "url": "https://windsurf.com"},
            {"label": "Windsurf docs: Cascade", "url": "https://docs.windsurf.com"},
        ],
    },
    {
        "num": 8,
        "tool": "GitHub Copilot",
        "focus": "The AI that finishes your sentence — line by line, inside your editor.",
        "url": "https://github.com/features/copilot",
        "tagline": "The lightest-weight AI coding tool you can add, and still one of the most valuable.",
        "pills": ["~30 min", "Free tier", "Paid: $10/mo"],
        "vignette": (
            "You are about to type the same for-loop you have typed a thousand times: iterate "
            "over a list, filter by a condition, push to a new array. Your fingers start the "
            "motion. A faint gray ghost of the entire loop appears. You hit Tab. Twelve "
            "keystrokes saved, and you didn't even break concentration."
        ),
        "why_html": """
<p>
  <strong>GitHub Copilot is the original AI autocomplete for code.</strong> It runs inside
  your existing editor (VS Code, JetBrains, Neovim, Visual Studio) as an extension, watches
  what you type, and offers completions — sometimes a single line, sometimes a whole
  function. You press <strong>Tab</strong> to accept. That's it. That is the entire core
  experience.
</p>
<p>
  It's easy to dismiss this as &ldquo;just autocomplete.&rdquo; That would be a mistake.
  Copilot is the AI coding tool with the lowest friction: if you already have VS Code,
  installing Copilot takes about two minutes, and its suggestions start appearing
  immediately in every file you write. For developers who don't want to switch editors to
  get AI help, Copilot is the answer — and for everyone else, it's a valuable companion
  alongside Cursor or Windsurf.
</p>
<p>
  In 2025 Copilot added <strong>Copilot Chat</strong> (a conversation pane), <strong>Edits
  mode</strong> (multi-file changes, similar to Cursor's Composer), and <strong>Copilot
  Workspace</strong> (a planning-to-execution agent). The completions are still the
  star, but the product is much more than that now.
</p>
""",
        "setup_html": """
<p><strong>Install:</strong> the Copilot extension is available in every major editor's
marketplace. Sign in with GitHub. The free tier gives you 2,000 completions per month —
enough to evaluate but not enough for daily work. Paid is $10/mo for individuals.</p>
<p><strong>Students and educators free:</strong> if you have a student or teacher email,
Copilot is free via GitHub Education. Apply at education.github.com — the verification
usually takes a day.</p>
""",
        "walkthrough": [
            {
                "title": "Install and sign in",
                "body": (
                    "In VS Code: Extensions &rarr; search <em>GitHub Copilot</em> &rarr; Install. "
                    "Sign in with your GitHub account. Within 30 seconds you should see a Copilot "
                    "icon in your status bar."
                ),
            },
            {
                "title": "Write a function signature; wait",
                "body": (
                    "Open a file. Type a function signature with a clear docstring: "
                    "<em>&ldquo;def parse_iso_date(s): 'Parse an ISO-8601 date string and return "
                    "a datetime.'&rdquo;</em> Stop typing. After half a second, a gray ghost-text "
                    "completion appears. Press <strong>Tab</strong> to accept, <strong>Esc</strong> "
                    "to reject."
                ),
            },
            {
                "title": "Use comments as instructions",
                "body": (
                    "Type a natural-language comment describing what the next block should do: "
                    "<code># Fetch the user's most recent 10 orders, sorted by date descending</code>. "
                    "Then move to the next line. Copilot uses the comment as a spec."
                ),
            },
            {
                "title": "Cycle through alternatives",
                "body": (
                    "When a ghost completion appears, press <strong>Alt+]</strong> (or "
                    "<strong>Option+]</strong> on Mac) to see the next suggestion. Copilot "
                    "usually generates 3-5 candidates; the first isn't always the best."
                ),
            },
            {
                "title": "Open Copilot Chat for questions",
                "body": (
                    "Click the Copilot Chat icon, or press <strong>Cmd+I</strong> in VS Code. "
                    "Ask: <em>&ldquo;What does this regex do?&rdquo;</em> (highlight the regex "
                    "first). Or: <em>&ldquo;Write unit tests for this function.&rdquo;</em> "
                    "Chat has full context of your open file and selection."
                ),
            },
            {
                "title": "Use Edits mode for bigger changes",
                "body": (
                    "In Copilot Chat, switch to <strong>Edits</strong>. Add one or more files "
                    "as context (drag them in). Describe a change. Copilot proposes a diff across "
                    "those files; review and apply. This is the feature that closes the gap with "
                    "Cursor for most day-to-day work."
                ),
            },
        ],
        "ex_basic": {
            "title": "Basic: Install and let it work for an hour",
            "meta": ["~60 min", "Level: Beginner"],
            "body": (
                "<p>Install Copilot in your editor. Open a project you work on. For the next "
                "hour of coding, <em>don't think about it</em>. Just code. Accept suggestions "
                "that look right; reject the rest. At the end of the hour, write down: (a) how "
                "many times did you accept, (b) how many times were you pleasantly surprised, "
                "(c) how many times did it propose something wrong.</p>"
                "<p>Goal: a gut-feel calibration. You now know whether Copilot is paying its "
                "$10/month rent for you.</p>"
            ),
        },
        "ex_advanced": {
            "title": "Advanced: Write a test suite with Copilot",
            "meta": ["~40 min", "Level: Advanced"],
            "body": (
                "<p>Pick a file with a function or class that is poorly tested (or untested). "
                "Open Copilot Chat. Highlight the code and ask: <em>&ldquo;Write a comprehensive "
                "test suite for this using [your test framework]. Include edge cases, error "
                "paths, and at least one property-based test if appropriate.&rdquo;</em></p>"
                "<p>Review the generated tests carefully. Copilot will often produce tests that "
                "pass vacuously (they test nothing real) — those are the dangerous ones. For "
                "each test, ask yourself: <em>if the function were buggy, would this test "
                "catch it?</em> Delete the tests that fail that question.</p>"
                "<p>Run the survivors. Fix any that fail. Commit.</p>"
                "<p>Write a 100-word note on which kinds of tests Copilot was strongest at and "
                "which kinds it consistently got wrong. This is the map you'll use when you "
                "ask it to write tests in the future.</p>"
            ),
        },
        "pitfalls": [
            "<p><strong>Autocomplete muscle memory.</strong> It is easy to accept a 10-line "
            "suggestion with one Tab and never read it. That's how bugs and subtle style "
            "drift enter your codebase. Develop a habit of reading every multi-line "
            "suggestion before accepting.</p>",
            "<p><strong>License contamination.</strong> Copilot learned from public GitHub "
            "code, and occasionally regurgitates a near-verbatim copy of a distinctive "
            "snippet from an open-source project. For most code this doesn't matter. For "
            "code you'll ship in a commercial product, be wary of long, idiomatic blocks "
            "that look &ldquo;too done.&rdquo;</p>",
            "<p><strong>It's weaker on unfamiliar stacks.</strong> Copilot is strongest in "
            "JavaScript, Python, TypeScript, Java, and Go. On obscure languages, bespoke "
            "frameworks, or proprietary internal APIs, the suggestions get visibly worse. "
            "Trust the tool less when the code looks less like the public internet.</p>",
        ],
        "compare_html": """
<p>
  GitHub Copilot's closest competitors are <strong>Cursor Tab</strong> (the autocomplete
  inside Cursor, often judged slightly better), <strong>Codeium</strong> (free, now
  rebranded as part of Windsurf's ecosystem), and <strong>Tabnine</strong> (the original
  AI autocomplete, now specialized for self-hosted and privacy-sensitive teams). For most
  developers in most stacks, the three are close enough that the deciding factor is
  which editor you already use.
</p>
""",
        "when_to_use": """
<p><strong>Use Copilot when</strong> you want AI help without changing your editor, when
you are working in a language it knows well (JS/TS/Python/Go/Java), or when you need its
GitHub-native integration (it reads your PRs, your issues, your Actions logs).</p>
<p><strong>Do not rely on Copilot alone when</strong> you need multi-file refactors (use
Cursor's Composer or Windsurf's Cascade), when you need an AI that remembers project
context across sessions (Cursor/Windsurf do, Copilot's memory is weaker), or when
privacy prohibits cloud code completion (look at Tabnine or a local model).</p>
""",
        "further": [
            {"label": "GitHub Copilot home", "url": "https://github.com/features/copilot"},
            {"label": "Copilot docs", "url": "https://docs.github.com/copilot"},
        ],
    },
    {
        "num": 9,
        "tool": "v0 by Vercel",
        "focus": "Describe a UI in English; get production-quality React components.",
        "url": "https://v0.dev",
        "tagline": "The fastest path from a sketch in your head to a working, styled web interface.",
        "pills": ["~35 min", "Free tier usable", "Paid: $20/mo"],
        "vignette": (
            "You are building a settings page. You know what fields you want, you know what it "
            "should look like, but every time you start writing the JSX and Tailwind classes, "
            "two hours evaporate. The code isn't hard — it's tedious. And then somebody asks "
            "for a design change."
        ),
        "why_html": """
<p>
  <strong>v0 is Vercel's generative-UI tool: you describe a web interface in English, and
  it produces a live React + Tailwind + shadcn/ui component you can copy-paste into your
  project.</strong> The outputs are not &ldquo;AI-slop&rdquo; mockups — they are the exact
  kind of polished, accessible, Tailwind-styled components that a senior frontend developer
  would produce, generated in thirty seconds.
</p>
<p>
  The step-change v0 introduces is <em>fidelity</em>. Earlier no-code tools produced
  proprietary output trapped inside their platform. v0 produces <strong>real component
  code using real open-source libraries (React, Tailwind, shadcn/ui)</strong> that you own
  and can edit forever. It is the production-quality starting point you would otherwise
  have spent half a day hand-writing.
</p>
<p>
  For creators who build marketing sites, researchers who build interactive demos for
  papers, and anyone shipping to the web without a full design team, v0 compresses the
  design-to-code cycle from &ldquo;a day of fiddling&rdquo; to &ldquo;iterate in English
  until it looks right, then copy the code.&rdquo;
</p>
""",
        "setup_html": """
<p><strong>Account:</strong> sign in at v0.dev with a Vercel account (or GitHub). Free
tier gives you a limited but real number of generations per month. Paid is $20/month for
the Premium tier.</p>
<p><strong>Prereq:</strong> basic familiarity with React and Tailwind. You don't need to
be able to write them fluently; you need to be able to <em>read</em> what v0 produces so
you can spot and fix issues.</p>
""",
        "walkthrough": [
            {
                "title": "Describe the component you need",
                "body": (
                    "Go to v0.dev. In the prompt box, describe the UI: <em>&ldquo;A settings "
                    "page with four sections: Profile (name, email, avatar upload), "
                    "Notifications (email, SMS, push toggles), Billing (current plan badge and "
                    "a manage-billing button), and Danger Zone (delete account with confirmation "
                    "modal). Use shadcn/ui components. Responsive.&rdquo;</em>"
                ),
            },
            {
                "title": "Wait for the preview",
                "body": (
                    "v0 generates three candidate designs in about 45 seconds. Each is a live, "
                    "interactive preview in your browser — you can actually click the buttons "
                    "and open the modal. Pick the one closest to what you want."
                ),
            },
            {
                "title": "Iterate in natural language",
                "body": (
                    "Below the preview, the chat box lets you refine: <em>&ldquo;Move the "
                    "avatar upload to the top and make it circular. The Danger Zone should "
                    "have a red-tinted background.&rdquo;</em> v0 regenerates; usually "
                    "within two or three rounds you have exactly what you want."
                ),
            },
            {
                "title": "Inspect the code",
                "body": (
                    "Click the <strong>Code</strong> tab. v0 shows you the React + Tailwind "
                    "source for the current design. Read it — this is what you'll be pasting "
                    "into your project. It should look like what a good frontend engineer would "
                    "write, not like AI spaghetti."
                ),
            },
            {
                "title": "Install dependencies",
                "body": (
                    "If your project doesn't already have shadcn/ui, run the shadcn add commands "
                    "v0 lists at the top of the code tab. This pulls the underlying components "
                    "into your project so v0's generated code has its dependencies."
                ),
            },
            {
                "title": "Drop it into your app and refine",
                "body": (
                    "Copy the component, paste it into your project, wire it to your real data. "
                    "You'll almost always make small changes — v0 produces static demos; turning "
                    "them into real features is the last mile. That's fine; the first 80% was "
                    "what was taking you all day."
                ),
            },
        ],
        "ex_basic": {
            "title": "Basic: Regenerate one page on your site",
            "meta": ["~25 min", "Level: Beginner"],
            "body": (
                "<p>Pick a single page or component on a site you're building or have built — "
                "a contact form, a pricing section, a feature grid, a footer. Describe it to "
                "v0 in 3-4 sentences. Compare what v0 produces to what you have. Which is "
                "better? Why? Copy the v0 code into a sandbox file and adapt it until it "
                "matches your brand.</p>"
            ),
        },
        "ex_advanced": {
            "title": "Advanced: A multi-component mini-app in one session",
            "meta": ["~60 min", "Level: Advanced"],
            "body": (
                "<p>Build a small, opinionated web app in a single v0 session: a reading-list "
                "tracker, an invoice generator, a research-paper organizer, a class-roster "
                "dashboard. Start with the shell: <em>&ldquo;A three-panel layout: left "
                "sidebar for nav, top bar with search and user menu, main area with the "
                "current view.&rdquo;</em></p>"
                "<p>Then iterate: <em>&ldquo;On the main area, show a table of items with "
                "columns X, Y, Z, a search filter above it, and a &lsquo;New item&rsquo; "
                "button that opens a form in a side drawer.&rdquo;</em></p>"
                "<p>Keep refining until you have something that actually looks like a product "
                "you'd want to use. Export the code. Paste it into a real Next.js project. "
                "Get it rendering locally with dummy data.</p>"
                "<p>Write a 150-word reflection: where did v0 save you time, and where did "
                "you still have to do the work by hand? That's the map for future v0 projects.</p>"
            ),
        },
        "pitfalls": [
            "<p><strong>v0 builds demos, not systems.</strong> The components it generates look "
            "polished but use placeholder data, placeholder handlers, and hardcoded state. "
            "Wiring them to real backends, real auth, and real state management is on you.</p>",
            "<p><strong>shadcn/ui lock-in.</strong> v0's default output uses shadcn/ui and "
            "Tailwind. If your project uses a different UI library (MUI, Chakra, Mantine), "
            "v0's output will be awkward to integrate. Either adopt shadcn/ui for new work or "
            "translate the structure into your library by hand.</p>",
            "<p><strong>Accessibility is improving, not solved.</strong> v0's outputs have "
            "gotten dramatically better at accessible markup in 2025, but still occasionally "
            "miss ARIA labels, focus management, or keyboard navigation. Audit generated UIs "
            "for a11y before shipping.</p>",
        ],
        "compare_html": """
<p>
  v0 competes with <strong>Bolt.new</strong> (Day 10, generates full-stack apps),
  <strong>Lovable</strong> (similar positioning, slightly different house style), and
  <strong>Galileo AI</strong> (Figma-style mockups rather than real code). The key
  differentiator: v0 produces <em>React component source code you own</em>. If you want a
  full deployed app with a database, Bolt.new is closer. If you want a Figma mockup to
  hand to a designer, Galileo is closer. For &ldquo;I need a beautiful, functional React
  component right now,&rdquo; v0 is unmatched.
</p>
""",
        "when_to_use": """
<p><strong>Use v0 when</strong> you're building a web interface, know roughly what you
want, and are tired of hand-writing Tailwind classes. Perfect for landing pages, dashboards,
forms, settings screens, and product pages.</p>
<p><strong>Do not use v0 when</strong> you need a full-stack app deployed with a database
and auth (use Bolt.new), when your existing codebase uses a non-React stack (Vue, Svelte,
plain HTML), or when you're designing brand-new visual language from scratch and need
freedom beyond shadcn/ui's aesthetic.</p>
""",
        "further": [
            {"label": "v0.dev", "url": "https://v0.dev"},
            {"label": "shadcn/ui components", "url": "https://ui.shadcn.com"},
        ],
    },
    {
        "num": 10,
        "tool": "Bolt.new",
        "focus": "Describe an app. Get a full-stack deployed app.",
        "url": "https://bolt.new",
        "tagline": "Vibe-code an entire web app — frontend, backend, database — from one prompt.",
        "pills": ["~50 min", "Free tier", "Paid: $20/mo"],
        "vignette": (
            "You have an idea for an app you'd use once a week — a workout tracker, a "
            "reading log, a class attendance pad, a tip-splitter for your Friday dinner group. "
            "It's not a startup. You won't hire a developer. You just want it to exist by "
            "Saturday."
        ),
        "why_html": """
<p>
  <strong>Bolt.new is StackBlitz's flagship generative-app tool: you describe an app in
  English, and it writes the frontend, backend, database, and deploys it to a live URL —
  all inside a browser tab.</strong> No local environment, no terminal, no deployment
  ceremony. The gap between &ldquo;I wish this app existed&rdquo; and &ldquo;it exists at
  a URL I can share&rdquo; has collapsed to about twenty minutes.
</p>
<p>
  This is the tool that makes real the promise of &ldquo;vibe coding&rdquo; — building
  software by describing what you want rather than writing it. Bolt sits at the full-stack
  end of the spectrum: while v0 (Day 9) produces individual components, Bolt produces the
  whole working application, with routes, API endpoints, a database schema, authentication,
  and a deploy to StackBlitz's infrastructure or Netlify.
</p>
<p>
  For everyone who has ever said <em>&ldquo;I'd build that if I could code&rdquo;</em> —
  and for many who can code, but want to skip the setup — Bolt is a genuine unlock. It
  is not a replacement for craft software engineering, but for small tools, internal
  dashboards, one-off apps, prototypes, class projects, and weekend experiments, it
  compresses a three-day build into an afternoon.
</p>
""",
        "setup_html": """
<p><strong>Account:</strong> sign in at bolt.new with a StackBlitz account (Google/GitHub
works). Free tier gives you a daily token budget — enough for a meaningful app; Pro is
$20/month for heavier use.</p>
<p><strong>Expectations:</strong> Bolt is stronger on frontend-heavy apps (React, Next.js)
than on backend-heavy ones. A CRUD app with a handful of tables and some auth is its
sweet spot. A multi-tenant SaaS with billing integration is stretching it.</p>
""",
        "walkthrough": [
            {
                "title": "Describe the app in one paragraph",
                "body": (
                    "At bolt.new, type a paragraph describing the app: <em>&ldquo;A personal "
                    "reading log where I can add books I've read with title, author, finish "
                    "date, and a rating 1-5. List view with sorting by date or rating. Simple "
                    "add-new form. No auth yet; just me.&rdquo;</em>"
                ),
            },
            {
                "title": "Watch it build in real time",
                "body": (
                    "Bolt streams the file creation: package.json, routes, components, database "
                    "schema, styles, all appearing in the left sidebar. Within about ninety "
                    "seconds you have a working app running in the preview on the right."
                ),
            },
            {
                "title": "Interact with the running app",
                "body": (
                    "Use the preview pane to try the app. Add a book. Notice that it persists "
                    "across refreshes (Bolt uses SQLite or similar by default). Everything is "
                    "already hooked up end-to-end. No separate server to start."
                ),
            },
            {
                "title": "Iterate in natural language",
                "body": (
                    "In the chat pane, describe changes: <em>&ldquo;Add a genre field. Filter "
                    "the list by genre. Show a count of books per genre at the top.&rdquo;</em> "
                    "Bolt rewrites the necessary files, restarts the app, and the preview "
                    "updates live."
                ),
            },
            {
                "title": "Add auth when you need it",
                "body": (
                    "Once the app is working for you alone, add: <em>&ldquo;Add email + "
                    "password authentication. Each user should only see their own books.&rdquo;</em> "
                    "Bolt scaffolds auth, adds a user table, and updates every query to filter "
                    "by user. Review the security assumptions — auth is where AI-generated "
                    "code most often introduces bugs."
                ),
            },
            {
                "title": "Deploy to a live URL",
                "body": (
                    "Click <strong>Deploy</strong>. Bolt deploys to Netlify in one click; you "
                    "get a permanent URL. Share it, bookmark it, use it. For an app you'll "
                    "develop further, click <strong>Export to GitHub</strong> to move the "
                    "code into your own repo and keep iterating outside Bolt."
                ),
            },
        ],
        "ex_basic": {
            "title": "Basic: A personal one-user tool",
            "meta": ["~30 min", "Level: Beginner"],
            "body": (
                "<p>Think of a tool you'd use at least once a week. Examples: a reading log, a "
                "workout tracker, a recipe box with search, a note-to-self log for a project, "
                "a simple CRM for your freelance clients. Keep it small and singular — one user, "
                "a few fields, no fancy permissions.</p>"
                "<p>Build it in Bolt in under 30 minutes. Deploy it. Bookmark the URL. Use the "
                "tool this week.</p>"
            ),
        },
        "ex_advanced": {
            "title": "Advanced: An app you'd show someone",
            "meta": ["~90 min", "Level: Advanced"],
            "body": (
                "<p>Pick a genuine need in your community — a sign-up tool for your class, a "
                "menu-voting app for your potluck group, an inventory tracker for a volunteer "
                "organization, a Q&amp;A board for a conference panel. Something with real "
                "users (even if just five).</p>"
                "<p>In Bolt, build: the frontend, auth (even if just email-only magic links), "
                "the database schema, and at least one non-trivial feature beyond basic CRUD "
                "(search, filtering, a small chart, email notifications, CSV export).</p>"
                "<p>Deploy. Invite two actual people to use it. Fix the three things they "
                "immediately complain about.</p>"
                "<p>Write a 200-word postmortem: what did Bolt do well? What was the hardest "
                "part to get right (usually auth + data model choices)? What would you do "
                "differently on the next app?</p>"
                "<p>This exercise is the closest thing in this course to shipping a real "
                "product. It's the one that most changes how you think about software.</p>"
            ),
        },
        "pitfalls": [
            "<p><strong>Auth is where AI-generated code bites.</strong> Bolt can scaffold auth "
            "in thirty seconds, but subtle bugs (tokens not verified, passwords stored "
            "insecurely, session fixation) are common. For any app with real users, have a "
            "human review the auth code specifically before going live.</p>",
            "<p><strong>The database schema is hard to refactor.</strong> Bolt picks a schema "
            "early based on your first prompt. Changing it later (renaming a table, restructuring "
            "a relationship) often causes regressions. If you can, sketch the data model on "
            "paper before your first prompt.</p>",
            "<p><strong>Credentials leak into code.</strong> Bolt will sometimes hardcode API "
            "keys or database URLs in source files rather than environment variables. Before "
            "pushing to a public repo, search the whole codebase for anything that looks like "
            "a secret.</p>",
        ],
        "compare_html": """
<p>
  Bolt.new's closest competitors are <strong>Lovable</strong> (similar vibe-coding product,
  slightly different house style and deployment story), <strong>Replit Agent</strong>
  (deeper into the IDE, with a chat-driven agent that can open and edit files), and
  <strong>v0</strong> (Day 9, same company's frontend-only counterpart). For a one-shot
  full-stack app with deployment, Bolt and Lovable are effectively interchangeable; try
  both and pick the one whose output style fits your taste. For a project you intend to
  keep building on for months, Replit Agent's deeper editor experience tends to win.
</p>
""",
        "when_to_use": """
<p><strong>Use Bolt.new when</strong> you want a working full-stack app this week, not
this month. Perfect for personal tools, internal dashboards, hackathon projects, class
projects, and &ldquo;wouldn't it be cool if X existed&rdquo; experiments.</p>
<p><strong>Do not use Bolt.new when</strong> you're building something with real scale
requirements, strong security/compliance requirements (HIPAA, PCI, SOC2), or a long-lived
codebase a team will maintain for years. For those, Bolt can still be useful as a
scaffolder — but plan to port the code into a real engineering setup afterward.</p>
""",
        "further": [
            {"label": "Bolt.new", "url": "https://bolt.new"},
            {"label": "StackBlitz blog", "url": "https://blog.stackblitz.com"},
        ],
    },

    # =====================================================================
    # WEEK 3 — VOICE & AUDIO
    # =====================================================================
    {
        "num": 11,
        "tool": "ElevenLabs",
        "focus": "Human-quality AI voice for narration, cloning, and dubbing.",
        "url": "https://elevenlabs.io",
        "tagline": "The voice model you can't tell is a model.",
        "pills": ["~40 min", "Free tier: 10k chars/mo", "Paid: $5\u201322/mo"],
        "vignette": (
            "You wrote a 2,000-word explainer article. You know the audience would benefit "
            "from an audio version. But you do not want to record yourself, and even if you "
            "did, the result would be ten takes, forty minutes of editing, and a voice that "
            "sounds like you had a cold. There is another way."
        ),
        "why_html": """
<p>
  <strong>ElevenLabs is the voice model that made AI speech indistinguishable from human
  recording.</strong> For narration, audiobook production, podcast intros, video
  voiceovers, language learning, and accessibility, it is the current gold standard. You
  paste a script; it produces audio that passes the listening test with strangers.
</p>
<p>
  Three capabilities matter most. First, the <em>voice library</em>: hundreds of
  professionally-designed voices across accents, ages, and emotional registers, each
  ready to use. Second, <em>Voice Cloning</em>: upload a few minutes of a real person's
  recorded speech (with their consent) and ElevenLabs can produce new audio in their
  voice, for any script you write. Third, <em>multilingual synthesis</em>: the same voice
  can read scripts in 30+ languages while preserving its timbre and personality — the
  feature that has quietly reshaped audiobook localization and YouTube dubbing.
</p>
<p>
  For creators and researchers, ElevenLabs is the tool that turns &ldquo;written work&rdquo;
  into &ldquo;written plus audio work&rdquo; at no meaningful cost. A blog post becomes a
  podcast. A research paper becomes a 12-minute listen on a walk. A video script becomes a
  produced narration track. The friction that used to gate audio publication — recording,
  editing, re-recording the words you fumbled — is gone.
</p>
""",
        "setup_html": """
<p><strong>Account:</strong> elevenlabs.io gives you a free tier with 10,000 characters
per month (about 10 minutes of speech). Paid tiers start at $5/mo (Starter) and scale up
to custom voice cloning on Creator ($22/mo).</p>
<p><strong>Consent matters:</strong> Voice Cloning requires explicit consent from the
voice owner. ElevenLabs asks you to certify this. For your own voice: trivially fine. For
anyone else: get explicit written permission before you clone — this is both an
ElevenLabs policy and, in many jurisdictions, a legal requirement.</p>
""",
        "walkthrough": [
            {
                "title": "Pick a voice from the library",
                "body": (
                    "Go to elevenlabs.io &rarr; Voice Library. Browse the curated voices. Each "
                    "has a 20-second preview. Find two or three voices that fit the tone you "
                    "want (calm explainer, warm storyteller, energetic announcer), and save "
                    "them to your <em>My Voices</em>."
                ),
            },
            {
                "title": "Paste a 200-word script",
                "body": (
                    "Open <strong>Text to Speech</strong>. Paste a real paragraph you wrote — "
                    "not lorem ipsum. Pick your voice. Click Generate. Download the MP3. "
                    "Listen on headphones. This is the baseline experience, and it is already "
                    "remarkable."
                ),
            },
            {
                "title": "Dial in the delivery with Voice Settings",
                "body": (
                    "Open the sliders: <em>Stability</em>, <em>Similarity</em>, "
                    "<em>Style Exaggeration</em>, <em>Speaker Boost</em>. Stability low = more "
                    "emotional variance (good for storytelling, risky for formal narration). "
                    "Style Exaggeration high = more dramatic, potentially cartoonish. Start "
                    "with defaults, then make one slider change at a time and regenerate."
                ),
            },
            {
                "title": "Use the Projects studio for long-form",
                "body": (
                    "For anything over 500 words, use <strong>Projects</strong> (or "
                    "<strong>Studio</strong>, depending on your plan). Paste the full script; "
                    "it splits the work into chapters and paragraphs and lets you regenerate "
                    "only the sections that sound wrong. This is how audiobook producers use "
                    "ElevenLabs in practice."
                ),
            },
            {
                "title": "Clone your own voice (optional)",
                "body": (
                    "Instant Voice Cloning on Creator tier: upload 1 minute of clean audio of "
                    "yourself speaking naturally (not reading). Name the voice. Thirty seconds "
                    "later you have a clone. Use it to generate a new paragraph. Listen with "
                    "someone who knows your voice. Ask if it sounds like you. It probably will."
                ),
            },
            {
                "title": "Export and post-produce",
                "body": (
                    "Download as MP3 or WAV. For a podcast-quality result, open the file in "
                    "Descript (Day 13) or Audacity and add: a gentle compressor, a high-pass "
                    "filter at 80 Hz, and a touch of room reverb. The raw ElevenLabs output is "
                    "clean but slightly flat; a 30-second post-production pass is worth it."
                ),
            },
        ],
        "ex_basic": {
            "title": "Basic: Audio version of one of your articles",
            "meta": ["~20 min", "Level: Beginner"],
            "body": (
                "<p>Take a real blog post, newsletter, or essay you've written (300\u20131,000 "
                "words). Generate an audio version in ElevenLabs. Listen to the whole thing. "
                "Decide: would you post this alongside the written version on your site?</p>"
                "<p>If yes, you just added a whole new content stream to your publishing "
                "practice for about 30 seconds of work per article.</p>"
            ),
        },
        "ex_advanced": {
            "title": "Advanced: A produced 5-minute narration track",
            "meta": ["~50 min", "Level: Advanced"],
            "body": (
                "<p>Write or repurpose a 600\u2013800-word script with intentional pacing: "
                "an intro, three clear beats, and a close. Generate it in ElevenLabs. Pick a "
                "voice that suits the tone. Tune the Stability and Style Exaggeration sliders "
                "until the delivery matches what a human narrator would do.</p>"
                "<p>Regenerate individual paragraphs until every one sounds right. Download "
                "the final WAV. Open it in Descript (you'll meet it on Day 13) or any audio "
                "editor. Add a subtle music bed at \u221224 dB. Add a 2-second fade in and out.</p>"
                "<p>Publish it somewhere public: as a podcast episode, as an embed on your "
                "site, as a LinkedIn native audio post. Write a 100-word reflection: how "
                "does it feel to have published audio you didn't record? What will you make "
                "next because the friction is gone?</p>"
            ),
        },
        "pitfalls": [
            "<p><strong>Consent is not optional.</strong> Cloning someone's voice without "
            "explicit written consent is both a terms-of-service violation and, in many "
            "jurisdictions (California's AB 2602, EU's AI Act), a legal violation. Clone "
            "your own voice freely; clone anyone else's only with a signed release.</p>",
            "<p><strong>Regenerations are not free.</strong> Each regeneration costs your "
            "monthly character budget. For long scripts, get the voice and settings right on "
            "a short test paragraph <em>before</em> running the full script. Otherwise you "
            "will burn through the free tier in an afternoon.</p>",
            "<p><strong>Pronunciation of proper nouns.</strong> ElevenLabs occasionally "
            "mispronounces names (yours, your company's, your subject's). Use the phonetic "
            "tags in the script (<code>&lt;phoneme alphabet=&quot;ipa&quot; ph=&quot;&hellip;&quot;&gt;</code>) "
            "for critical names, or spell them phonetically in the script itself (&ldquo;Safaa&rdquo; "
            "&rarr; &ldquo;Sa-FAH&rdquo;) and then fix in post."
        ],
        "compare_html": """
<p>
  ElevenLabs's main competitors are <strong>OpenAI TTS</strong> (cheaper, simpler,
  slightly less natural), <strong>PlayHT</strong> (close competitor, strong for podcast
  production, similar pricing), <strong>Murf</strong> (easier UI, weaker voices), and
  Google's <strong>Gemini TTS</strong> / <strong>NotebookLM Audio Overviews</strong>
  (great for conversational content but less flexible). For creator-tier voice quality —
  narration you'd actually publish — ElevenLabs remains the benchmark. For simple "read
  this text aloud" inside an app, OpenAI TTS is a meaningfully cheaper API call.
</p>
""",
        "when_to_use": """
<p><strong>Use ElevenLabs when</strong> the audio has to sound like a human said it:
narration, audiobooks, video voiceovers, accessibility audio, multilingual content. Also
a great fit for prototyping podcast intros and sketching tone before a live recording.</p>
<p><strong>Do not use ElevenLabs when</strong> you need conversational back-and-forth
(NotebookLM's Audio Overviews are built for that), when authentic voice and live
performance matter (record yourself), or when the audio will represent a real
individual's views verbatim without their knowledge (never — full stop).</p>
""",
        "further": [
            {"label": "ElevenLabs home", "url": "https://elevenlabs.io"},
            {"label": "ElevenLabs docs: voice design", "url": "https://elevenlabs.io/docs"},
        ],
    },
    {
        "num": 12,
        "tool": "Otter.ai",
        "focus": "Meeting transcription, summaries, and action items \u2014 automatically.",
        "url": "https://otter.ai",
        "tagline": "An AI teammate that attends every meeting and writes the notes you'd have forgotten to take.",
        "pills": ["~30 min", "Free tier: 300 min/mo", "Paid: $8.33/mo"],
        "vignette": (
            "You finished three back-to-back meetings and have no memory of what was decided "
            "in the second one. You took notes by hand for the first fifteen minutes, then "
            "got absorbed in the discussion and wrote nothing for the last forty-five. The "
            "follow-up email you're supposed to send tomorrow is a blank document."
        ),
        "why_html": """
<p>
  <strong>Otter.ai joins your Zoom, Google Meet, or Microsoft Teams meetings as a bot,
  records the audio, transcribes with speaker labels, and produces a summary with action
  items automatically.</strong> It is the quiet, uncool tool that returns more hours per
  week than almost anything else on this list.
</p>
<p>
  The experience is mundane in the best way. You connect your calendar once. From then on,
  for every meeting with a video link, Otter shows up, sits silently, and delivers a
  searchable transcript to your inbox within minutes of the meeting ending. The transcript
  has speaker names, timestamps, and a one-paragraph summary. A &ldquo;key takeaways&rdquo;
  section highlights the decisions and unresolved questions. An &ldquo;action items&rdquo;
  section calls out the work someone committed to.
</p>
<p>
  This is the AI tool that most directly helps knowledge workers do better at the work
  they were already doing. It makes you a better note-taker by freeing you to participate.
  It makes you a better follow-up-er by giving you the record to refer back to. It makes
  you a better teammate by letting you share clean notes with people who couldn't attend.
  The learning curve is roughly ten minutes.
</p>
""",
        "setup_html": """
<p><strong>Account:</strong> otter.ai free tier: 300 transcription minutes per month,
1 video meeting bot, 30 minutes per conversation. Pro ($8.33/mo annualized): 1,200
minutes, 4-hour conversations, custom vocabulary. For anyone in more than ~5 meetings a
week, Pro pays for itself the first month.</p>
<p><strong>Calendar integration:</strong> connect Google Calendar or Outlook. Otter
reads your upcoming meetings and lets you pick which to auto-join. Connect Zoom/Meet/Teams
for native integration.</p>
<p><strong>Consent note:</strong> always announce at the start of a meeting that Otter
is recording (the bot shows up as a named participant anyway). Most jurisdictions require
consent from all participants to record audio; for multi-state US calls, the strictest
state's law applies.</p>
""",
        "walkthrough": [
            {
                "title": "Connect Otter to your calendar + meeting platform",
                "body": (
                    "Sign in to otter.ai. Go to <strong>Settings &rarr; Calendar</strong>. "
                    "Connect Google or Outlook. Then <strong>Settings &rarr; Meeting</strong> "
                    "and connect Zoom (and/or Meet, Teams). Toggle on &ldquo;Auto-join meetings.&rdquo; "
                    "Otter now appears on your calendar as a line item for each meeting it "
                    "plans to attend."
                ),
            },
            {
                "title": "Run your next meeting; watch Otter join",
                "body": (
                    "When your meeting starts, Otter Bot joins as a participant. Announce to "
                    "the group that Otter is recording. If anyone objects, remove Otter "
                    "(<strong>Admit &rarr; Remove</strong>) and switch to manual note-taking "
                    "for that meeting."
                ),
            },
            {
                "title": "Let the meeting happen",
                "body": (
                    "Don't take notes. This is the whole point. Be fully present in the "
                    "conversation. Otter is capturing every word."
                ),
            },
            {
                "title": "Read the post-meeting summary",
                "body": (
                    "Within 2-5 minutes of the meeting ending, Otter emails you: the full "
                    "transcript, a one-paragraph summary, key takeaways, and action items. "
                    "Skim it. Fix any obvious speaker misattributions and the handful of "
                    "names it got wrong."
                ),
            },
            {
                "title": "Use Otter Chat to query a meeting",
                "body": (
                    "Open any Otter transcript and use <strong>Otter Chat</strong>: ask "
                    "questions about the meeting in plain English. <em>&ldquo;What did "
                    "Priya commit to?&rdquo;</em> <em>&ldquo;When did we say we'd revisit "
                    "the pricing decision?&rdquo;</em> Much faster than scrubbing the "
                    "transcript by hand."
                ),
            },
            {
                "title": "Build your meeting archive",
                "body": (
                    "After a few weeks, you have a searchable archive of every meeting you "
                    "cared about. Use the Otter search to find any past discussion by "
                    "keyword. This is the superpower most people don't realize they have: "
                    "perfect recall of what was actually said."
                ),
            },
        ],
        "ex_basic": {
            "title": "Basic: Run Otter on one real meeting this week",
            "meta": ["~30 min (+ a meeting)", "Level: Beginner"],
            "body": (
                "<p>Connect Otter to your calendar. Pick one meeting this week where you'd "
                "normally take notes. Let Otter join. Announce to the group. Don't take "
                "notes yourself.</p>"
                "<p>After the meeting, read Otter's summary and action items. Answer honestly: "
                "are they as good as what you'd have written? Where did Otter miss? Where "
                "did it catch something you would have missed?</p>"
            ),
        },
        "ex_advanced": {
            "title": "Advanced: Replace your note-taking workflow for a week",
            "meta": ["~60 min + a week of meetings", "Level: Advanced"],
            "body": (
                "<p>For one full week, let Otter attend every meeting on your calendar that "
                "you'd normally take notes in. Do not write your own notes during the meeting. "
                "After each meeting, take 5 minutes to: (1) review the Otter summary, (2) "
                "correct any factual errors, (3) add any context Otter couldn't capture (body "
                "language, off-camera chat, your own reasoning), and (4) send the cleaned "
                "summary to the attendees as the official record.</p>"
                "<p>At the end of the week, write a 200-word retrospective: what did this "
                "shift change about how you participate in meetings? How much time did you "
                "actually save? What would you tell a colleague who was considering it?</p>"
                "<p>This is the workflow change with the biggest ROI of anything in this "
                "course.</p>"
            ),
        },
        "pitfalls": [
            "<p><strong>Announce the recording.</strong> Otter shows up as a named "
            "participant, but some colleagues don't notice. In legal terms and in "
            "professional-courtesy terms, say it aloud when a meeting starts. If anyone "
            "objects, kick Otter and take manual notes for that session.</p>",
            "<p><strong>Speaker labels get confused in busy meetings.</strong> Otter "
            "identifies speakers well with 2-3 participants but stumbles with 6+, "
            "especially when people talk over each other. Fix attributions before you "
            "share a transcript externally.</p>",
            "<p><strong>Action items are draft quality.</strong> Otter's &ldquo;Action "
            "Items&rdquo; section is a strong draft, not a source of truth. It sometimes "
            "invents commitments that were discussed but not agreed to, and it sometimes "
            "misses soft commitments. Always review before circulating.</p>",
        ],
        "compare_html": """
<p>
  Otter competes with <strong>Fathom</strong> (we covered this in Course 1, stronger on
  Zoom integration and free tier generosity), <strong>Read.ai</strong> (stronger on
  &ldquo;meeting quality&rdquo; analytics), <strong>Fireflies.ai</strong> (similar
  capability, popular in sales teams), and <strong>Granola</strong> (a newer entrant
  that prioritizes the note you're typing alongside the AI summary). Otter's edge is
  maturity, the best search across past transcripts, and strong multi-platform integration
  (Zoom + Meet + Teams). For a solo professional, Fathom's free tier is arguably more
  generous; for a team that needs shared knowledge across dozens of meetings, Otter is
  usually the better buy.
</p>
""",
        "when_to_use": """
<p><strong>Use Otter when</strong> you attend recurring meetings you need to remember
accurately, or when you want to be more present in conversations without sacrificing
documentation. Exceptional for reporter-style interviewing, researcher-participant
conversations, client-discovery calls, and running a team.</p>
<p><strong>Do not use Otter when</strong> the conversation is legally or professionally
confidential and recording isn't permitted (therapy, legal privilege, certain medical
contexts), or when the other party hasn't consented. In those cases the cost of a
compliance failure is much higher than the benefit of the transcript.</p>
""",
        "further": [
            {"label": "Otter.ai home", "url": "https://otter.ai"},
            {"label": "Otter Chat documentation", "url": "https://help.otter.ai"},
        ],
    },
    {
        "num": 13,
        "tool": "Descript",
        "focus": "Edit audio and video by editing the transcript.",
        "url": "https://www.descript.com",
        "tagline": "Delete a word in the script; the video cuts that word out. It's that simple.",
        "pills": ["~50 min", "Free tier: 1 hr transcription/mo", "Paid: $12\u201324/mo"],
        "vignette": (
            "You just recorded a 20-minute podcast episode. There are 43 filler words "
            "(&ldquo;um,&rdquo; &ldquo;like,&rdquo; &ldquo;you know&rdquo;) scattered "
            "throughout. You said a thing at 4:12 that you want to cut. You want to trim "
            "the awkward 15-second pause at 11:30. In a traditional audio editor, that is "
            "90 minutes of scrubbing the waveform. In Descript, it is about five minutes of "
            "editing a Word document."
        ),
        "why_html": """
<p>
  <strong>Descript is an audio and video editor where the edit surface is the transcript.</strong>
  Import a recording; Descript transcribes it; the transcript becomes a document. Delete
  a word from the document and the corresponding audio (and video) disappears. Cut a
  paragraph, rearrange a sentence, remove every filler word with one button — all at the
  speed of word processing.
</p>
<p>
  For anyone making long-form audio or video — podcasts, video essays, tutorials, courses,
  interviews — Descript compresses what used to take days of scrubbing waveforms into an
  afternoon of reading and editing text. The UX metaphor is so natural that many users
  never realize they've bypassed the entire traditional audio-editing learning curve.
</p>
<p>
  Beyond the transcript edit, Descript includes <strong>Studio Sound</strong> (one-click
  audio enhancement that removes background noise and adds warmth), <strong>Overdub</strong>
  (AI voice cloning of yourself, so you can &ldquo;re-record&rdquo; a word by typing it),
  <strong>Eye Contact</strong> (corrects your gaze in video so you're always looking at
  the camera), and <strong>Filler Word Removal</strong> (the feature you'll use most and
  thank the universe for).
</p>
""",
        "setup_html": """
<p><strong>Account:</strong> descript.com free tier includes 1 hour of transcription per
month and basic editing \u2014 enough to evaluate with real work. Creator tier ($12/mo)
unlocks more transcription, Studio Sound, and Overdub. Pro ($24/mo) adds AI actions and
higher limits.</p>
<p><strong>Hardware:</strong> Descript runs as a desktop app on Mac and Windows. A decent
headset microphone matters more than the app for the quality of your output.</p>
""",
        "walkthrough": [
            {
                "title": "Import a recording",
                "body": (
                    "Open Descript. Create a new project. Drag in an audio or video file. "
                    "Descript transcribes it (about half real-time for audio, slower for "
                    "video). When done, you see a document: speaker names, paragraphs, "
                    "everything they said."
                ),
            },
            {
                "title": "Listen while you read",
                "body": (
                    "Click any word; playback jumps to that moment. Press spacebar to play "
                    "from there. This is the habit that makes the rest of the tool work: "
                    "always edit audio by reading, not by scrubbing."
                ),
            },
            {
                "title": "Delete text; the audio deletes too",
                "body": (
                    "Select a sentence you want to cut. Press Delete. The audio (and video) "
                    "cut instantly. Listen: does it flow? If the cut is abrupt, Descript "
                    "lets you re-add a short silence or a crossfade with one click."
                ),
            },
            {
                "title": "Remove filler words in one pass",
                "body": (
                    "Tools &rarr; <strong>Remove Filler Words</strong>. Descript scans the "
                    "whole transcript, highlights every &ldquo;um,&rdquo; &ldquo;uh,&rdquo; "
                    "&ldquo;like,&rdquo; &ldquo;you know.&rdquo; Review (some &ldquo;likes&rdquo; "
                    "are real words, not filler). One click removes all the surviving ones "
                    "from both transcript and audio simultaneously."
                ),
            },
            {
                "title": "Clean the sound with Studio Sound",
                "body": (
                    "Select the audio track. Toggle <strong>Studio Sound</strong>. Descript "
                    "removes background noise (HVAC, room echo, keyboard clicks) and applies "
                    "podcast-style EQ and compression. Compare before and after. The "
                    "difference on a mediocre recording is shocking."
                ),
            },
            {
                "title": "Publish or export",
                "body": (
                    "When the edit is done, <strong>Export</strong> as MP4 (video), MP3 "
                    "(audio), or publish directly to YouTube, Descript's hosted player, or "
                    "a podcast host. The transcript itself exports as SRT captions, clean "
                    "text, or a Word doc. One recording &rarr; five deliverables."
                ),
            },
        ],
        "ex_basic": {
            "title": "Basic: Clean a 5-minute voice memo",
            "meta": ["~25 min", "Level: Beginner"],
            "body": (
                "<p>Record yourself on your phone talking about one topic for 5 minutes \u2014 "
                "a work idea, a summary of something you read, a mini-tutorial. Import to "
                "Descript. Run Remove Filler Words. Delete the sentences that didn't quite "
                "land. Apply Studio Sound.</p>"
                "<p>Listen to the before and after. The before was a rough voice memo. The "
                "after is the opening of a podcast episode. You could publish it today.</p>"
            ),
        },
        "ex_advanced": {
            "title": "Advanced: Produce a real 10-minute episode",
            "meta": ["~90 min", "Level: Advanced"],
            "body": (
                "<p>Record a genuine 15-minute interview or monologue. Import to Descript. "
                "Edit until it's a tight 10 minutes: remove filler words, cut sections that "
                "didn't land, rearrange a paragraph or two if that improves the flow.</p>"
                "<p>Add: an intro sting (5 seconds of music), a brief verbal intro (3 "
                "sentences), chapter markers at natural transitions, captions exported as "
                "SRT, and a cover image.</p>"
                "<p>Publish it: as a podcast RSS feed from Descript's built-in host, or as "
                "a YouTube upload with captions, or as a blog post with embedded player.</p>"
                "<p>Write a 150-word reflection: where in the edit did the transcript-first "
                "workflow unlock something that would have been tedious in a traditional "
                "audio editor? Which Descript feature will you use every time going forward?</p>"
                "<p>This exercise builds the muscle that turns you into a creator, not just "
                "a consumer, of audio.</p>"
            ),
        },
        "pitfalls": [
            "<p><strong>Transcript accuracy is proportional to audio quality.</strong> "
            "Descript's ASR is among the best in the world, but a noisy recording (HVAC, "
            "echo, an inexpensive laptop mic) produces a noisy transcript. Invest in an "
            "under-$100 USB microphone before investing more time in Descript.</p>",
            "<p><strong>Over-editing makes speech sound unnatural.</strong> Removing every "
            "&ldquo;um&rdquo; and every 200ms pause produces audio that sounds weirdly "
            "machine-like. Leave some thinking pauses in. Good editing makes you sound "
            "like your best self, not like a synthesizer.</p>",
            "<p><strong>Overdub requires training data + consent.</strong> Descript's "
            "Overdub lets you generate new audio in your own voice by typing. It needs "
            "about 10 minutes of training audio. Use it sparingly \u2014 corrections of "
            "single mispronounced words are great; re-generating whole paragraphs is "
            "likely to sound uncanny to listeners who know you.</p>",
        ],
        "compare_html": """
<p>
  Descript's pure-audio competitors include <strong>Adobe Podcast</strong> (Day 15,
  stronger on audio enhancement, weaker on editing UX), <strong>Riverside.fm</strong>
  (better for recording remote interviews, weaker as an editor), and <strong>Alitu</strong>
  (podcaster-focused, simpler). On the video side, Descript competes with <strong>CapCut</strong>,
  <strong>Premiere Pro</strong>, and <strong>Final Cut</strong> \u2014 none of which have
  the transcript-first metaphor. If you are making audio or video regularly, Descript is
  the single tool most likely to change how you work; for one-off or highly stylized video,
  dedicated editors still win.
</p>
""",
        "when_to_use": """
<p><strong>Use Descript when</strong> you are making audio or video at any regular cadence:
a podcast, a YouTube channel, course recordings, tutorial videos, client case-study
interviews. The transcript-first edit metaphor compounds: the more you use it, the faster
you get.</p>
<p><strong>Do not use Descript when</strong> you're making music or heavily-mixed
multi-track audio (a proper DAW like Logic or Ableton wins), or when you're making
highly-composed cinematic video with complex color grading and VFX (Premiere Pro and
DaVinci Resolve remain the pros' tools).</p>
""",
        "further": [
            {"label": "Descript home", "url": "https://www.descript.com"},
            {"label": "Descript learning center", "url": "https://www.descript.com/learn"},
        ],
    },
    {
        "num": 14,
        "tool": "Suno",
        "focus": "Generate a real, full-length song from a text prompt.",
        "url": "https://suno.com",
        "tagline": "Describe a song; get a fully-produced track with lyrics, vocals, and instruments.",
        "pills": ["~30 min", "Free: 50 credits/day", "Paid: $10\u201330/mo"],
        "vignette": (
            "You need 90 seconds of original music for the intro of a YouTube video. Stock "
            "libraries have that one track everybody uses. Commissioning a real musician is "
            "$400. Making it yourself requires skills you haven't practiced in ten years. "
            "So instead you describe it."
        ),
        "why_html": """
<p>
  <strong>Suno is the text-to-music model that produces fully-composed, fully-produced,
  full-length songs from a prompt.</strong> You write a description (genre, mood, era,
  instrumentation) and optional lyrics; Suno returns a complete track \u2014 vocals,
  instrumentation, production, the lot \u2014 typically in under a minute. This is a
  newer category of AI than text or image generation, and the quality leap in 2024-2025
  has been startling.
</p>
<p>
  For creators, Suno removes a specific barrier: the gap between needing original
  background music and being able to produce it. Podcast intros, YouTube video beds,
  course-module jingles, family-video soundtracks, brand-video music, interactive-demo
  moods \u2014 all used to require either paying a composer, paying for a stock library,
  or learning to use a DAW. Suno reduces it to a text prompt.
</p>
<p>
  For research and teaching, Suno is also a surprisingly useful <em>learning tool</em>:
  it is educational for students of music theory to compare a &ldquo;folk ballad in D
  major&rdquo; Suno generation to &ldquo;folk ballad in D major with a melodic minor
  bridge&rdquo; and hear the structural differences in seconds.
</p>
""",
        "setup_html": """
<p><strong>Account:</strong> suno.com offers a generous free tier (50 credits/day, ~10
songs). Pro ($10/mo) removes the daily cap; Premier ($30/mo) unlocks commercial-use
licensing for generated songs.</p>
<p><strong>Commercial use:</strong> the free tier's songs are for personal use only. If
you plan to use Suno music in a monetized video or paid course, upgrade to Premier
before you generate \u2014 only songs generated on a commercial-licensed tier can be
used commercially, and the license does not retroactively apply.</p>
""",
        "walkthrough": [
            {
                "title": "Write a genre-first prompt",
                "body": (
                    "Suno responds best to prompts that lead with genre, tempo, and "
                    "instrumentation. Bad: <em>happy music</em>. Good: <em>Warm acoustic "
                    "folk, fingerpicked guitar, upright bass, light percussion, 90 BPM, "
                    "hopeful mood, like a Sunday morning.</em>"
                ),
            },
            {
                "title": "Decide: with lyrics or instrumental?",
                "body": (
                    "For intros and beds, pick <strong>Instrumental</strong>. For songs that "
                    "will stand alone (a birthday song, an event jingle, a course theme), "
                    "let Suno write lyrics from a prompt or paste your own."
                ),
            },
            {
                "title": "Generate two versions",
                "body": (
                    "Each generation produces two different takes. Listen to both. One will "
                    "usually feel closer to what you had in mind; flag it as a favorite and "
                    "toss the other. If neither works, rephrase the prompt and regenerate."
                ),
            },
            {
                "title": "Extend, remix, or regenerate sections",
                "body": (
                    "On a promising track, use <strong>Extend</strong> to add another 30\u201360 "
                    "seconds (for a longer bed) or <strong>Replace Section</strong> to "
                    "regenerate a specific bridge or chorus that didn't land."
                ),
            },
            {
                "title": "Download stems for editing",
                "body": (
                    "On paid tiers, download the <strong>Stems</strong>: separate audio "
                    "files for vocals, bass, drums, and melody. This lets you take the "
                    "Suno track into Descript or Logic and edit it as real multi-track "
                    "audio \u2014 drop out vocals for an intro version, fade the drums for "
                    "a reflective beat."
                ),
            },
            {
                "title": "Credit it honestly",
                "body": (
                    "When you use Suno music in a public work, note it \u2014 a simple "
                    "&ldquo;Music: Suno&rdquo; line in your video description or show "
                    "notes is sufficient for most contexts. Pretending AI-generated music "
                    "was composed by a human is both misleading and, when discovered, "
                    "damages trust."
                ),
            },
        ],
        "ex_basic": {
            "title": "Basic: Two intro beds for your next video",
            "meta": ["~20 min", "Level: Beginner"],
            "body": (
                "<p>Think of two different vibes you'd want for two different pieces of "
                "content \u2014 a calm explainer, an upbeat tutorial, a reflective essay, a "
                "punchy update. Write a genre-led prompt for each. Generate both. Listen "
                "to all four takes (two per prompt). Download the best.</p>"
                "<p>Use one in a real piece of content you're making this week.</p>"
            ),
        },
        "ex_advanced": {
            "title": "Advanced: A custom song for a real occasion",
            "meta": ["~45 min", "Level: Advanced"],
            "body": (
                "<p>Pick a real occasion in the next 30 days: a birthday, an anniversary, a "
                "class graduation, a launch party, a farewell. Write lyrics (you, or Suno) "
                "that reference specific details about the person or event. Generate several "
                "versions in different genres until you find one that fits.</p>"
                "<p>Use Extend to bring it to 2\u20133 minutes. Download the stems. Drop it "
                "into a short video you produce in Descript or iMovie (family photos, event "
                "footage, class slides). Present it at the occasion.</p>"
                "<p>Reflect briefly: what does it feel like to give someone a custom song "
                "that was effectively free to make? What shifts when this kind of personalized "
                "creative act is within reach of everyone?</p>"
            ),
        },
        "pitfalls": [
            "<p><strong>Vocals can feel uncanny.</strong> Suno's vocals are getting better "
            "quickly, but certain genres (opera, gospel, very bluesy pieces) still sound "
            "stilted. Lean on genres where synthetic-ish vocals are already common "
            "(electronic, lo-fi, acoustic pop) for more natural-sounding results.</p>",
            "<p><strong>Licensing rights are a moving target.</strong> Music-industry "
            "copyright law around AI-generated output is in active litigation. For any "
            "commercial use, only rely on the Suno tier that grants a commercial license "
            "and save your receipts. For background music in a personal video, the risk "
            "is essentially nil.</p>",
            "<p><strong>Prompts that request a specific artist get refused or distorted.</strong> "
            "Suno will not generate in the style of named artists (&ldquo;a Taylor Swift "
            "song&rdquo;). Describe the sonic qualities you want (&ldquo;upbeat pop with "
            "acoustic guitar, country-adjacent storytelling lyrics&rdquo;) and you'll get "
            "closer to your reference without the legal risk.</p>",
        ],
        "compare_html": """
<p>
  Suno's closest competitor is <strong>Udio</strong>, which is comparable in quality and
  slightly better for certain genres (jazz, soul). <strong>Stable Audio</strong> (from
  Stability AI) is stronger for loops and sound effects, weaker for full songs.
  <strong>ElevenLabs Music</strong> launched in mid-2025 and is improving fast. For
  most creators, Suno is the safest default; running the same prompt through Udio in
  parallel for important pieces is a cheap way to double your odds of getting something
  great.
</p>
""",
        "when_to_use": """
<p><strong>Use Suno when</strong> you need original music and hiring a composer or
licensing from a stock library is overkill: podcast intros, video beds, course-module
themes, personal-event music, social-media content.</p>
<p><strong>Do not use Suno when</strong> the music is the centerpiece of the work (hire
a real musician), when you're releasing music commercially as an artist (audiences
already care that it was composed by a person), or when you need to match a specific
real track (license it properly).</p>
""",
        "further": [
            {"label": "Suno home", "url": "https://suno.com"},
            {"label": "Suno help \u2014 prompt writing", "url": "https://help.suno.com"},
        ],
    },
    {
        "num": 15,
        "tool": "Adobe Podcast",
        "focus": "The magic button that makes any recording sound studio-quality.",
        "url": "https://podcast.adobe.com",
        "tagline": "One-click audio restoration that rescues recordings you thought were unusable.",
        "pills": ["~20 min", "Free with Adobe ID", "Commercial use OK"],
        "vignette": (
            "You recorded a conversation at a caf\u00e9 because it was the only time you "
            "could meet. The transcript captures the words, but the audio is unusable: clattering "
            "dishes, overlapping conversations, HVAC hum, your voice bouncing off hard surfaces. "
            "You can't publish this. Except now you can."
        ),
        "why_html": """
<p>
  <strong>Adobe Podcast (specifically, <em>Enhance Speech</em>) is the single most
  consistently useful AI audio tool available.</strong> Upload a messy recording; click
  Enhance; download a dramatically cleaner version. Background noise, room echo, inconsistent
  levels, hollow phone-call quality \u2014 Enhance Speech fixes most of it in one pass,
  for free.
</p>
<p>
  The experience is closer to magic than to sophisticated audio engineering. The underlying
  model is trained to recognize and preserve human speech while suppressing everything
  else. For podcasters, interviewers, researchers recording participant conversations,
  teachers making lecture recordings, and anyone whose recording environment is imperfect,
  Enhance Speech is the rescue button that makes a B-grade recording sound A-grade.
</p>
<p>
  Adobe Podcast includes other tools \u2014 a browser-based recorder with in-browser
  editing, AI-powered transitions, and remote multi-track capture \u2014 but the reason
  you'll actually open it every week is Enhance Speech. It is free, it does not require
  Creative Cloud, and it runs entirely in your browser.
</p>
""",
        "setup_html": """
<p><strong>Account:</strong> sign in at podcast.adobe.com with an Adobe ID (free). Enhance
Speech is free with no usage cap for files under 4 hours. No paid tier.</p>
<p><strong>File prep:</strong> Enhance Speech works on single-track audio (one voice at a
time, or pre-mixed dialog). If you recorded a multi-track podcast with separate files per
speaker, run Enhance on each track individually before mixing.</p>
""",
        "walkthrough": [
            {
                "title": "Upload a real messy recording",
                "body": (
                    "At podcast.adobe.com, click <strong>Enhance Speech</strong>. Drag in "
                    "a file you actually have a use for: a voice memo, a recorded meeting, "
                    "a podcast episode, a lecture. For maximum education value, pick one "
                    "you know has issues \u2014 room echo, background noise, a weak mic."
                ),
            },
            {
                "title": "Wait (about real-time speed)",
                "body": (
                    "Enhancement takes roughly as long as the audio duration. A 30-minute "
                    "recording takes about 30 minutes. You can close the tab; Adobe emails "
                    "you when the enhanced file is ready."
                ),
            },
            {
                "title": "A/B the before and after",
                "body": (
                    "The result page has a toggle between Original and Enhanced. Listen to "
                    "the same passage on both. On headphones, use a 10-second clip with "
                    "background noise for the most dramatic comparison. This is the moment "
                    "most people become permanent Adobe Podcast users."
                ),
            },
            {
                "title": "Adjust the mix strength",
                "body": (
                    "By default Enhance Speech is aggressive. A slider lets you blend back "
                    "some of the original room tone if the result sounds too processed. "
                    "For professional work, a 70\u201380% setting usually feels most natural; "
                    "100% can sound faintly artificial."
                ),
            },
            {
                "title": "Download and deploy",
                "body": (
                    "Download the enhanced WAV or MP3. Import into Descript (Day 13), "
                    "Premiere, Audition, or whatever your editing pipeline is. The "
                    "enhanced file is the one you build the rest of your edit on."
                ),
            },
            {
                "title": "Use the in-browser recorder (optional)",
                "body": (
                    "If you haven't recorded yet, Adobe Podcast's browser recorder captures "
                    "multi-participant sessions directly in-browser, records each participant "
                    "on their own track locally (no audio-over-Zoom compression), and uploads "
                    "when you're done. Higher quality than most alternatives; less feature-"
                    "rich than Riverside.fm but free."
                ),
            },
        ],
        "ex_basic": {
            "title": "Basic: Rescue one recording",
            "meta": ["~15 min", "Level: Beginner"],
            "body": (
                "<p>Find a real recording you made that has audio problems \u2014 a voice memo "
                "in a noisy caf\u00e9, a Zoom meeting, a lecture recording, a phone interview. "
                "Run it through Enhance Speech. Listen A/B.</p>"
                "<p>If the enhanced version is usable, it just unlocked publication of "
                "something you had written off.</p>"
            ),
        },
        "ex_advanced": {
            "title": "Advanced: Rebuild your pre-record pipeline",
            "meta": ["~40 min", "Level: Advanced"],
            "body": (
                "<p>Design your new default audio workflow: (1) record (with whatever tool "
                "you have), (2) Enhance Speech, (3) Descript for editing and filler-word "
                "removal, (4) ElevenLabs for any narration or voice-over, (5) Suno for a "
                "short intro bed, (6) export.</p>"
                "<p>Run a real piece of content through this pipeline end-to-end: a podcast "
                "episode, a video explainer, a short course module, a lecture. Time each step. "
                "Compare total minutes to what this would have cost in studio time a year ago.</p>"
                "<p>Write a 150-word retrospective: where is your new bottleneck? It is "
                "almost certainly <em>editorial judgment</em>, not tooling. That's the "
                "insight that matters.</p>"
            ),
        },
        "pitfalls": [
            "<p><strong>It's too good at removing sound.</strong> Music playing in your "
            "recording, environmental sound you wanted to keep, a crowd reaction \u2014 "
            "all get suppressed or destroyed. Enhance Speech assumes speech is the only "
            "signal you care about. For mixed audio (music + talk), edit the music and "
            "voice on separate tracks and only enhance the voice.</p>",
            "<p><strong>It can introduce subtle artifacts.</strong> On very noisy sources, "
            "the model occasionally produces a faint underwater or robotic quality in "
            "speech. Use the mix slider to pull back the enhancement strength until the "
            "artifacts disappear. Better a slightly noisy recording than one that sounds "
            "synthetic.</p>",
            "<p><strong>Long files time out.</strong> Adobe lists a 4-hour cap per file, "
            "but files longer than about 90 minutes occasionally fail to process. Split "
            "long recordings (lecture series, conference panels) into 30\u201360 minute "
            "chunks before upload.</p>",
        ],
        "compare_html": """
<p>
  Adobe Podcast's closest competitor is <strong>Auphonic</strong> (pay-per-hour audio
  restoration, older, rougher UI, still beloved by podcasters for batch processing).
  <strong>Descript's Studio Sound</strong> (Day 13) is similar in spirit, included in
  Descript subscriptions, and slightly less aggressive. <strong>Krisp</strong> runs
  real-time noise suppression on live meetings, a different use case. For pure
  post-production cleanup of speech recordings, Adobe Podcast's Enhance Speech remains
  the highest-quality free option in the market.
</p>
""",
        "when_to_use": """
<p><strong>Use Adobe Podcast's Enhance Speech when</strong> you have a speech recording
with technical issues and want to improve it as a first pass. Always \u2014 literally,
run every recording through it before you do anything else. It's free and takes the
length of the recording.</p>
<p><strong>Do not use Adobe Podcast when</strong> the recording is already pristine (you
are just adding artifacts unnecessarily), when the audio is music or sound design rather
than speech, or when you need real-time noise suppression during a live call (use Krisp
or your video-conferencing platform's built-in noise removal instead).</p>
""",
        "further": [
            {"label": "Adobe Podcast home", "url": "https://podcast.adobe.com"},
            {"label": "Enhance Speech FAQ", "url": "https://helpx.adobe.com/audition"},
        ],
    },

    # =====================================================================
    # WEEK 4 — VIDEO CREATION
    # =====================================================================
    {
        "num": 16,
        "tool": "Runway",
        "focus": "Generate and edit video with AI \u2014 the creative-professional's tool.",
        "url": "https://runwayml.com",
        "tagline": "Text-to-video, image-to-video, and a full editing studio \u2014 used by real filmmakers.",
        "pills": ["~45 min", "Free: 125 credits", "Paid: $15\u201395/mo"],
        "vignette": (
            "You need a 5-second shot of a person opening a door into a bright, unfamiliar "
            "room. You do not have a person, a door, or a camera. What you have is a laptop "
            "and three paragraphs describing the mood. Three years ago, that was not a "
            "production plan. It is now."
        ),
        "why_html": """
<p>
  <strong>Runway is the AI video tool that real filmmakers use in production.</strong>
  Its Gen-3 model produces text-to-video and image-to-video clips at a quality that
  crosses the &ldquo;professionally shippable&rdquo; threshold \u2014 and its editor
  bundles dozens of AI-powered tools (inpainting, green-screen removal, motion tracking,
  camera-path generation, lip-sync) that would otherwise require a pipeline of specialty
  software.
</p>
<p>
  Where Day 16\u20132020 tools (ElevenLabs, Otter, Descript) made audio production
  accessible, Runway is the equivalent leap for video. The practical experience: you write
  a 2-3 sentence description of a shot, pick a camera movement, wait about ninety seconds,
  and download a 5 or 10-second clip that looks cinematic. Chain a dozen of these and
  you have a short film. Add real footage from your phone and use Runway's editor to
  composite, color-grade, and ship it. That was a multi-week production pipeline for a
  solo creator until about eighteen months ago; it is now an evening.
</p>
<p>
  For researchers, Runway is useful in a different way: visualizing abstract concepts for
  lectures (&ldquo;a DNA molecule unwinding in slow motion,&rdquo; &ldquo;a neural network
  activation pattern as fluid dynamics&rdquo;), creating illustrative b-roll for
  academic YouTube, and building explainer content for grant applications and outreach.
  Its learning curve is steeper than ChatGPT's, but the ceiling is dramatically higher.
</p>
""",
        "setup_html": """
<p><strong>Account:</strong> runwayml.com \u2014 free tier gives you 125 one-time credits
(enough to generate ~25 seconds of video and try the editor). Standard ($15/mo), Pro
($35/mo), and Unlimited ($95/mo) unlock progressively more generation budget and longer
clips. Serious users typically need at least Standard.</p>
<p><strong>Bring:</strong> a reference image or two. Gen-3's strongest mode is
image-to-video \u2014 generating motion from a still frame you already like. If you have
Midjourney or DALL-E outputs, bring them.</p>
""",
        "walkthrough": [
            {
                "title": "Generate a text-to-video shot",
                "body": (
                    "Log in at runwayml.com. Open <strong>Gen-3 Alpha</strong>. In the prompt "
                    "box: <em>&ldquo;A warm caf\u00e9 at golden hour, slow dolly-in toward a "
                    "steaming cup of coffee on a wooden table, shallow depth of field, "
                    "cinematic.&rdquo;</em> Pick duration 5 seconds. Click Generate."
                ),
            },
            {
                "title": "Try image-to-video with your own reference",
                "body": (
                    "Generate a reference image in Midjourney or DALL-E (or upload one of "
                    "your photos). In Runway, switch to <strong>Image to Video</strong>. "
                    "Upload the image. Prompt the motion: <em>&ldquo;Gentle wind moves the "
                    "leaves. Subtle camera push-in.&rdquo;</em> This mode produces the most "
                    "consistent, controllable results."
                ),
            },
            {
                "title": "Use camera controls instead of prose",
                "body": (
                    "Runway's newer interface exposes discrete camera controls: <em>Pan</em>, "
                    "<em>Tilt</em>, <em>Zoom</em>, <em>Orbit</em>, with intensity sliders. "
                    "Use these rather than trying to describe camera moves in the prompt. "
                    "The results are dramatically more predictable."
                ),
            },
            {
                "title": "Extend or remix a promising clip",
                "body": (
                    "When a generation lands, use <strong>Extend</strong> to add another 5 "
                    "seconds from the final frame, preserving style and subject. Use "
                    "<strong>Reprompt</strong> to generate variations on the same seed. "
                    "This is how you turn a fluke good generation into a usable sequence."
                ),
            },
            {
                "title": "Edit in the Runway studio",
                "body": (
                    "Bring clips into <strong>Sessions</strong> (Runway's video editor). "
                    "Trim, stack, add transitions, apply color presets. For live-action "
                    "footage: use <strong>Green Screen</strong> (AI background removal \u2014 "
                    "no green screen needed) and <strong>Motion Tracking</strong> to follow "
                    "subjects. These are the features that would require a full Premiere "
                    "and After Effects pipeline otherwise."
                ),
            },
            {
                "title": "Export in the right format",
                "body": (
                    "For YouTube: 1080p, MP4, h.264. For Instagram/TikTok: vertical 1080x1920. "
                    "For LinkedIn: square 1080x1080. Runway exports all three directly; "
                    "always match the platform's spec rather than letting it crop on upload."
                ),
            },
        ],
        "ex_basic": {
            "title": "Basic: One cinematic shot, two ways",
            "meta": ["~25 min", "Level: Beginner"],
            "body": (
                "<p>Pick a single shot you'd love to have: a specific mood, a specific subject, "
                "a specific lighting. Generate it two ways in Runway:</p>"
                "<ol><li>Pure text-to-video from a detailed prompt.</li>"
                "<li>Image-to-video starting from a still image you generate in Midjourney "
                "or upload from your camera roll.</li></ol>"
                "<p>Compare. Note which approach gave you more control and which gave you "
                "more surprise. Keep the better one as a reference for future shots.</p>"
            ),
        },
        "ex_advanced": {
            "title": "Advanced: A 30-second shot sequence",
            "meta": ["~90 min", "Level: Advanced"],
            "body": (
                "<p>Plan a 30-second sequence: five or six shots that tell a tiny story or "
                "explore a single idea visually. Storyboard on paper first (one sketch per "
                "shot). For each shot, decide: text-to-video, image-to-video, or real "
                "footage you'll shoot on your phone.</p>"
                "<p>Generate each shot. Iterate until each one stands on its own \u2014 "
                "don't move to the next until the current one is passable. Expect to burn "
                "a lot of credits.</p>"
                "<p>Import all shots into Runway Sessions. Cut to length, add simple "
                "transitions, color-grade for consistency across shots. Add a 30-second "
                "music bed from Suno (Day 14) or royalty-free stock.</p>"
                "<p>Export as a 1080p MP4. Share it with two people who know the topic and "
                "two who don't. Ask: does it communicate what you intended? Write a 200-word "
                "reflection on which shots worked, which didn't, and what you'd change on "
                "a second pass.</p>"
                "<p>You just made your first AI-assisted short film.</p>"
            ),
        },
        "pitfalls": [
            "<p><strong>Hands, text, and faces still betray AI.</strong> Gen-3 is good but "
            "not yet seamless on close-ups of hands, legible text, or sustained human faces "
            "in motion. For your hero shots, shoot real footage on your phone and use Runway "
            "for b-roll and establishing shots where imperfection reads as stylization.</p>",
            "<p><strong>Credit math gets expensive fast.</strong> Each generation is 5\u201310 "
            "credits. The 125-credit free tier gives you about 12\u201325 generations total, "
            "and maybe half of them will be usable. Generate a short test at 5 seconds "
            "before committing credits to a 10-second version.</p>",
            "<p><strong>Continuity breaks between shots.</strong> Runway doesn't maintain "
            "character or location identity across separate generations. A &ldquo;woman in a "
            "red coat&rdquo; looks different in shot 1 versus shot 2. For continuity, either "
            "shoot real footage, use the Extend feature to stay on the same generation, or "
            "embrace the shot-to-shot variation as stylistic.</p>",
        ],
        "compare_html": """
<p>
  Runway competes with <strong>Luma Dream Machine</strong> (strong on motion, cheaper),
  <strong>Pika</strong> (fun, creative, less cinematic), <strong>Kling</strong> (covered
  in Course 1, outstanding on physical realism, slower), and <strong>Sora 2</strong>
  (OpenAI, best overall quality as of this writing but access-restricted and expensive).
  Runway's edge is the <em>editor</em>: you can generate <em>and</em> edit in one place,
  and its non-generation tools (Green Screen, Motion Tracking, Inpainting) are category-
  leading. For a creator shipping video every week, Runway is usually the better platform
  even when Sora's raw quality is higher.
</p>
""",
        "when_to_use": """
<p><strong>Use Runway when</strong> you need cinematic-quality AI-generated video as
part of a real production: short films, branded video, lecture b-roll, explainer content,
music-video visuals. Also when you need the editor's AI features (background removal,
motion tracking, color grading) on real footage.</p>
<p><strong>Do not use Runway when</strong> you need a talking-head training video
(HeyGen \u2014 Day 17 \u2014 is better), when you're converting long-form written content
to social clips (Pictory \u2014 Day 18 \u2014 is faster), or when shooting simple phone
video that doesn't need AI generation (Captions \u2014 Day 20 \u2014 is lighter-weight).</p>
""",
        "further": [
            {"label": "Runway home", "url": "https://runwayml.com"},
            {"label": "Runway Academy \u2014 tutorials", "url": "https://academy.runwayml.com"},
        ],
    },
    {
        "num": 17,
        "tool": "HeyGen",
        "focus": "A studio in a browser. Type a script; an AI avatar reads it on camera.",
        "url": "https://www.heygen.com",
        "tagline": "The tool that quietly replaced expensive corporate-video production.",
        "pills": ["~40 min", "Free: 3 min/mo", "Paid: $29\u2013149/mo"],
        "vignette": (
            "Your training team needs 40 orientation videos across 12 languages. A "
            "traditional studio bid came in at six figures and a 10-week timeline. You "
            "have 10 days. You have a script. You do not have 12 presenters."
        ),
        "why_html": """
<p>
  <strong>HeyGen is the AI avatar video tool that has quietly become a standard in
  corporate training, product marketing, and multilingual content production.</strong>
  You pick an avatar (either from the library of 200+ pre-built ones, or a clone of
  yourself), paste a script, and HeyGen produces a video of the avatar speaking the
  script \u2014 lip-synced, gesture-matched, and professionally lit.
</p>
<p>
  What sets HeyGen apart from its peers is the fidelity. Earlier avatar tools produced
  presenters with a distinctly uncanny cadence \u2014 correct words, wrong breath. HeyGen's
  Avatar 4.0 model (released 2024) generates speakers whose mouth movements, micro-
  expressions, and upper-body motion are convincing enough that many viewers don't
  notice. You do notice when you see five minutes of the same avatar \u2014 the range is
  narrower than a real person's \u2014 but for 90-second training segments, news-style
  explainers, and welcome messages, the result is indistinguishable from an entry-level
  on-camera professional.
</p>
<p>
  HeyGen's multilingual feature is the headline capability for global organizations.
  Upload a 60-second video of yourself speaking English; HeyGen can translate, re-voice,
  and re-lip-sync the video into 40+ languages. It's not perfect \u2014 idiomatic
  expressions translate literally, cultural register sometimes misses \u2014 but as a
  first draft for localization, it compresses weeks of production into minutes.
</p>
""",
        "setup_html": """
<p><strong>Account:</strong> heygen.com free tier gives you 3 minutes of video per month
on a pre-built avatar (usable for evaluation, not for production). Creator ($29/mo)
unlocks 15 minutes and custom avatar cloning. Business ($89/mo) adds unlimited export,
team workspaces, and multilingual translation.</p>
<p><strong>Consent and identity:</strong> creating an avatar from your own face (Instant
Avatar) requires a short verification video where you say specific phrases on camera.
This is deliberate \u2014 HeyGen blocks cloning without consent. Take this seriously if
you plan to clone a colleague's avatar (which requires their own verification).</p>
""",
        "walkthrough": [
            {
                "title": "Pick an avatar from the library",
                "body": (
                    "At heygen.com, open <strong>Avatars</strong> and browse the stock "
                    "presenters. Use the filters (age, style, setting, language capability) "
                    "to find two or three that fit the tone you need. The &ldquo;Photo "
                    "Avatars&rdquo; are often more natural than the &ldquo;Studio Avatars&rdquo;."
                ),
            },
            {
                "title": "Paste a short script",
                "body": (
                    "Start a new video project. Pick an aspect ratio (16:9 for landscape "
                    "training, 9:16 for social). Paste a script: 90-150 words for a minute "
                    "of video. Pick the avatar's voice and pacing."
                ),
            },
            {
                "title": "Add visual context",
                "body": (
                    "Click <strong>Add scene</strong> to insert slides, images, or B-roll "
                    "behind the avatar. HeyGen can place the avatar on the lower third of a "
                    "slide (the &ldquo;news anchor&rdquo; layout) or full-frame. Mix the two "
                    "to keep long videos visually varied."
                ),
            },
            {
                "title": "Preview before you generate",
                "body": (
                    "<strong>Preview</strong> simulates the first 15 seconds without "
                    "consuming your credits. Listen to the pronunciation, especially of "
                    "technical terms and proper names. Edit the script to force correct "
                    "pronunciation (&ldquo;Saba&rdquo; &rarr; &ldquo;Sah-bah&rdquo; is a "
                    "reliable trick)."
                ),
            },
            {
                "title": "Generate, then spot-check",
                "body": (
                    "Click <strong>Generate</strong>. A 60-second video finishes in about 2\u20133 "
                    "minutes. Watch it once end-to-end. Pay attention to: lip-sync accuracy "
                    "around consonant clusters, eye-contact (the avatar should look into "
                    "camera, not off-axis), and any visual glitches around the jawline."
                ),
            },
            {
                "title": "Translate for global reach",
                "body": (
                    "On Business tier: after generating the English version, click "
                    "<strong>Translate</strong> and pick target languages. HeyGen regenerates "
                    "the audio in the selected language, re-lip-syncs the avatar, and keeps "
                    "the visuals. Always have a native speaker review before shipping \u2014 "
                    "nuances of professional register and cultural sensitivity still require "
                    "human review."
                ),
            },
        ],
        "ex_basic": {
            "title": "Basic: One 60-second explainer",
            "meta": ["~30 min", "Level: Beginner"],
            "body": (
                "<p>Write a 100-word script explaining one concept relevant to your work or "
                "teaching. Pick a pre-built HeyGen avatar. Produce a 60-second video in 16:9 "
                "format. Watch it critically: would you send this to a colleague or student?</p>"
                "<p>Answer honestly. If yes, you just proved that you can produce "
                "professional-looking explainer content in under an hour, repeatably.</p>"
            ),
        },
        "ex_advanced": {
            "title": "Advanced: Clone yourself + ship in 3 languages",
            "meta": ["~75 min", "Level: Advanced"],
            "body": (
                "<p>On Creator tier or higher: create an <strong>Instant Avatar</strong> of "
                "yourself (requires the verification video and about 15 minutes of "
                "processing). Write a 2-minute script for a welcome message: introduce "
                "yourself, your course or research, and invite the viewer to engage.</p>"
                "<p>Generate the English version with your own avatar. Review carefully \u2014 "
                "it should feel like you on a good day. Then generate translations into two "
                "other languages relevant to your audience (Spanish, Arabic, Mandarin, "
                "French, whatever fits).</p>"
                "<p>Have native speakers review each translated version. Note what the "
                "translation got right and what felt off. Send all three videos to their "
                "intended audiences.</p>"
                "<p>Write a 200-word reflection: how does it feel to have your face speaking "
                "three languages fluently? What shifts in your teaching, marketing, or "
                "outreach now that multilingual video is a 10-minute task?</p>"
            ),
        },
        "pitfalls": [
            "<p><strong>The same avatar at length gets uncanny.</strong> A 30-second "
            "avatar video is charming; a 10-minute one is exhausting to watch. Cut long "
            "content into multiple videos, alternate avatars, or use the avatar only as "
            "an intro/outro with B-roll and voiceover in the middle.</p>",
            "<p><strong>Do not represent the avatar as a real person.</strong> "
            "Presenting an AI avatar as &ldquo;our trainer Maya&rdquo; when Maya does not "
            "exist is a growing regulatory concern (and a trust problem when discovered). "
            "Label AI avatars clearly in introductions or on-screen text \u2014 audiences "
            "are more tolerant of transparent AI than discovered AI.</p>",
            "<p><strong>Translation is a draft, not a deliverable.</strong> HeyGen's "
            "translations are startlingly good at the surface level and systematically "
            "miss register, humor, and cultural context. Always have a native speaker "
            "review before publishing translated videos.</p>",
        ],
        "compare_html": """
<p>
  HeyGen's main competitors are <strong>Synthesia</strong> (covered in Course 1; older,
  more established in enterprise training), <strong>D-ID</strong> (easier for one-off
  talking-head moments from a single photo), and <strong>Tavus</strong> (specializes in
  personalized video at scale \u2014 each viewer gets a custom video with their name spoken).
  HeyGen's edge is the current quality leader on natural motion and the best multilingual
  translation pipeline. Synthesia remains the safer choice for large enterprises with
  compliance requirements. Tavus is the specialist tool for personalized outbound.
</p>
""",
        "when_to_use": """
<p><strong>Use HeyGen when</strong> you need talking-head video at volume and either
can't or don't want to record live: training videos, onboarding, product explainers,
multilingual course content, social-media content where you don't want to be on camera
every week.</p>
<p><strong>Do not use HeyGen when</strong> the audience knows you personally and expects
your real face and voice (they'll notice), when the content is emotionally sensitive
(grief, bad news, apology videos \u2014 authenticity matters), or when the script is
longer than ~3 minutes (avatar fatigue kicks in).</p>
""",
        "further": [
            {"label": "HeyGen home", "url": "https://www.heygen.com"},
            {"label": "HeyGen academy", "url": "https://academy.heygen.com"},
        ],
    },
    {
        "num": 18,
        "tool": "Pictory",
        "focus": "Turn a blog post into a narrated video with stock footage \u2014 automatically.",
        "url": "https://pictory.ai",
        "tagline": "Paste text. Get a video.",
        "pills": ["~30 min", "Free: 3 projects trial", "Paid: $23\u201347/mo"],
        "vignette": (
            "You have a 1,500-word article you've written. Your analytics say text-heavy "
            "posts on your site get 800 views. Video posts get 8,000. The gap is the "
            "production effort. What if that gap closed?"
        ),
        "why_html": """
<p>
  <strong>Pictory is the tool that turns long-form written content into video with
  minimal effort.</strong> Paste a blog post, a transcript, or a script; Pictory produces
  a video with matched stock footage, AI narration, captions, and pacing. The finished
  product feels more like a LinkedIn explainer than a Hollywood production \u2014 and
  for the repurposing use case, that's exactly right.
</p>
<p>
  The core idea: your content already exists as text. Video is a different channel with
  different audience behaviors. Re-producing the content for video manually would cost a
  day of effort per post and never happen. Pictory compresses that to about 20 minutes,
  which is short enough that people actually do it \u2014 and the second-order effect is
  that content reaches an audience that was never going to read the text version.
</p>
<p>
  For creators publishing regularly (blogs, newsletters, research notes, podcast show
  notes), Pictory is the repurposing layer that multiplies your reach without multiplying
  your production time. For educators, it's useful for turning lecture notes into watchable
  previews. For researchers, it's a fast path to making a paper's central argument
  accessible as a 90-second explainer on social media.
</p>
""",
        "setup_html": """
<p><strong>Account:</strong> pictory.ai offers a free 3-project trial (no credit card).
Standard ($23/mo annualized) unlocks 30 videos/month up to 10 minutes each. Premium
($47/mo) adds longer videos, team seats, and brand templates.</p>
<p><strong>Source material:</strong> Pictory works best on clear, structured text \u2014 a
blog post with good paragraph breaks, a tutorial, a how-to, an explainer. Dense academic
prose with long sentences and many clauses produces choppier videos.</p>
""",
        "walkthrough": [
            {
                "title": "Pick the right input mode",
                "body": (
                    "Pictory offers three entry points: <strong>Script to Video</strong> "
                    "(paste text), <strong>Article to Video</strong> (paste a URL), and "
                    "<strong>Visuals to Video</strong> (edit a transcript of a video you've "
                    "already made). For blog posts, use Article to Video. For long "
                    "structured text, use Script to Video."
                ),
            },
            {
                "title": "Paste content and let Pictory scene-ify it",
                "body": (
                    "Paste your 800\u20131,500-word article. Pictory segments it into scenes "
                    "(typically 8\u201315 scenes per 1,000 words), assigning one sentence or "
                    "short paragraph per scene. Each scene gets a stock-footage clip and a "
                    "caption. Review the segmentation; merge or split scenes as needed."
                ),
            },
            {
                "title": "Swap stock footage that doesn't fit",
                "body": (
                    "Pictory's auto-selected footage is frequently generic and sometimes "
                    "misses. For each scene, click <strong>Change</strong> and search "
                    "their stock library for something better. You can also upload your "
                    "own clips or images. Plan on replacing about 30\u201340% of the auto-picks."
                ),
            },
            {
                "title": "Tune the voiceover",
                "body": (
                    "Pick a voice from Pictory's library, or connect your ElevenLabs account "
                    "(Day 11) for higher-quality narration. Choose pacing \u2014 most "
                    "explainers work at 145-165 words per minute. Preview 30 seconds before "
                    "generating the whole thing."
                ),
            },
            {
                "title": "Add captions and a music bed",
                "body": (
                    "Captions are auto-generated and 90%+ accurate on clear narration. "
                    "Customize font, color, and position (bottom-center for YouTube, "
                    "center-middle for TikTok/Reels). Add a subtle music bed from the "
                    "built-in library or import your own from Suno (Day 14)."
                ),
            },
            {
                "title": "Export in multiple aspect ratios",
                "body": (
                    "Pictory can export the same project as 16:9 (YouTube), 9:16 (TikTok/"
                    "Reels/Shorts), and 1:1 (feed posts) in one workflow. For any piece of "
                    "content you'd like on multiple platforms, export all three rather than "
                    "re-cropping post-hoc."
                ),
            },
        ],
        "ex_basic": {
            "title": "Basic: Repurpose one existing post",
            "meta": ["~25 min", "Level: Beginner"],
            "body": (
                "<p>Pick a blog post, newsletter issue, or LinkedIn article you've already "
                "published. Paste into Pictory. Produce a 90-second video version. Swap at "
                "least 5 of the auto-selected stock clips for better ones.</p>"
                "<p>Post the video on the platform where your audience already engages with "
                "your written work. Watch the analytics for a week. Compare to the text-only "
                "post's reach.</p>"
            ),
        },
        "ex_advanced": {
            "title": "Advanced: Build a repurposing pipeline",
            "meta": ["~60 min + 4 posts", "Level: Advanced"],
            "body": (
                "<p>Pick four recent pieces of written content you've produced \u2014 four "
                "blog posts, four newsletter issues, four papers' abstracts, four research "
                "summaries. Produce a video version of each in Pictory.</p>"
                "<p>For each: vary the aspect ratio (one 16:9, one 9:16, two 1:1). Vary the "
                "voice. Vary the pacing. Add different music moods (calm, upbeat, "
                "reflective).</p>"
                "<p>Schedule all four to post to different platforms over a two-week period. "
                "Keep a simple spreadsheet of: source post reach (text), video reach, "
                "engagement rate, comments. After two weeks, compute the lift \u2014 is "
                "video-as-repurposing a good use of your time?</p>"
                "<p>Write a 200-word decision memo to yourself: should this be a permanent "
                "part of your publishing workflow, a tool you reach for only on high-value "
                "posts, or not worth continuing?</p>"
            ),
        },
        "pitfalls": [
            "<p><strong>Auto-selected stock footage is the weakest link.</strong> Pictory "
            "often picks clips that are topically adjacent but emotionally wrong \u2014 a "
            "&ldquo;happy businessperson&rdquo; stock shot for a somber post. Expect to "
            "replace about a third of the picks manually. Budget 15 minutes for this per "
            "video.</p>",
            "<p><strong>AI narration has tonal limits.</strong> Pictory's built-in voices "
            "are functional but flat. For any post where tone really matters (emotional, "
            "reflective, deeply personal), upgrade the narration by connecting ElevenLabs "
            "or re-recording yourself.</p>",
            "<p><strong>Don't feed it everything.</strong> Not every text post should "
            "become a video. Technical deep-dives, data-heavy analysis, and long nuanced "
            "arguments work better as text. Use Pictory for <em>discoverable</em> content "
            "\u2014 the introductions, the stories, the punchy takes \u2014 not for your "
            "scholarship.</p>",
        ],
        "compare_html": """
<p>
  Pictory's competitors include <strong>InVideo AI</strong> (similar concept, slightly
  more flexible editor, more templates), <strong>Synthesia's video maker</strong> (weaker
  as a repurposing tool but stronger for talking-head work), and <strong>Lumen5</strong>
  (the category's original entrant, still serviceable but feels dated). For pure
  text-to-video repurposing, Pictory and InVideo AI are effectively interchangeable \u2014
  try both on the same input and keep whichever you prefer. Opus Clip (Day 19) solves an
  adjacent but different problem: repurposing <em>video</em> into short-form video.
</p>
""",
        "when_to_use": """
<p><strong>Use Pictory when</strong> you have a text-publishing habit and want to extend
it into video with manageable effort. Particularly good for bloggers, newsletter writers,
educators, and researchers making a paper accessible to a non-academic audience.</p>
<p><strong>Do not use Pictory when</strong> the content's power is in its specific visuals
(data viz, diagrams, your own face) \u2014 stock footage dilutes that. Also skip it for
work where the human voice matters intrinsically (podcast episodes, personal reflections,
anything where listeners specifically want to hear <em>you</em>).</p>
""",
        "further": [
            {"label": "Pictory home", "url": "https://pictory.ai"},
            {"label": "Pictory learning hub", "url": "https://pictory.ai/academy"},
        ],
    },
    {
        "num": 19,
        "tool": "Opus Clip",
        "focus": "Turn a long video into a dozen viral-ready shorts in minutes.",
        "url": "https://www.opus.pro",
        "tagline": "Feed it an hour. Get back 15 clips, captioned, reframed, hook-ready.",
        "pills": ["~30 min", "Free: 60 min/mo", "Paid: $9\u201329/mo"],
        "vignette": (
            "You record a 90-minute podcast episode. Inside it are probably six or seven "
            "moments worth sharing \u2014 clever exchanges, concise explanations, surprise "
            "reactions \u2014 that would make excellent 30-second social clips. Finding them "
            "by hand would take you three hours with a scrub-bar and a notepad."
        ),
        "why_html": """
<p>
  <strong>Opus Clip finds the viral-worthy moments in long-form video and produces
  platform-ready short clips automatically.</strong> You give it a podcast episode, a
  lecture recording, a webinar, a YouTube upload, or a long interview. It analyzes the
  content, identifies 10\u201320 candidate clips, re-frames them for vertical video,
  adds auto-captions, generates hook-style titles, and scores each clip for likely
  virality. In about the time it takes to finish a coffee, you have a month's worth of
  social content from a single long-form recording.
</p>
<p>
  This is the <em>content multiplication</em> tool. Podcasters have been using it since
  2023 to turn every episode into 15\u201320 TikTok/Reels/Shorts clips without hiring an
  editor. Educators use it to turn long lectures into micro-learning moments for social
  and LMS previews. Researchers use it to pull accessible highlights out of interview-
  based qualitative work. The common thread: you already have the long-form content;
  Opus Clip is the production layer that converts it into reach.
</p>
<p>
  The tool has matured substantially since its 2023 debut. Auto-captions are now 95%+
  accurate on clear speech; the reframing is smart enough to follow the speaker's face
  as they move; the hook-title generation is usable (not great, but usable) on the
  first try; and the virality scoring \u2014 while not prophetic \u2014 is a reasonable
  prioritization signal.
</p>
""",
        "setup_html": """
<p><strong>Account:</strong> opus.pro free tier gives you 60 minutes of processing per
month (enough to process one podcast episode and generate clips). Starter ($9/mo)
unlocks 300 minutes; Pro ($19/mo) unlocks 1,200; Business ($29/mo) unlocks 6,000 plus
team features.</p>
<p><strong>Source requirements:</strong> Opus works on YouTube URLs, Zoom recordings,
direct uploads (up to 3 hours on paid tiers), and Google Drive / Dropbox links. Audio
quality matters; if your long-form has significant background noise, clean it with
Adobe Podcast (Day 15) before feeding to Opus.</p>
""",
        "walkthrough": [
            {
                "title": "Feed in a real long-form recording",
                "body": (
                    "At opus.pro, click <strong>Create clips</strong>. Paste a YouTube URL, "
                    "or upload a recording. For your first run, pick something you already "
                    "know well \u2014 a podcast episode you hosted, a lecture you gave, an "
                    "interview you conducted. Familiarity makes it easier to judge Opus's "
                    "clip-picking quality."
                ),
            },
            {
                "title": "Pick clip length and platform",
                "body": (
                    "Opus asks for target length (30s / 60s / 90s) and destination platform "
                    "(TikTok, Reels, Shorts, LinkedIn, Twitter). These determine aspect "
                    "ratio, caption style, and clip length. Pick based on where your "
                    "audience already engages."
                ),
            },
            {
                "title": "Wait ~5-15 minutes while Opus processes",
                "body": (
                    "Processing a 60-minute source takes ~5 minutes. A 90-minute source "
                    "takes ~15. The app emails you when done; you can close the tab in the "
                    "meantime."
                ),
            },
            {
                "title": "Review the clip list, sorted by viral score",
                "body": (
                    "Opus returns a list of candidate clips, each with: a generated title, "
                    "a virality score (0\u2013100), a duration, and a preview thumbnail. "
                    "The top 3\u20135 scored clips are usually the strongest \u2014 watch "
                    "them first. Lower-scored clips are sometimes better than Opus realizes; "
                    "don't dismiss them without watching."
                ),
            },
            {
                "title": "Edit before publishing",
                "body": (
                    "Open a promising clip. Adjust: the hook title (the generated one is "
                    "rarely your best option), the caption styling (make sure keywords pop), "
                    "trim the in/out points by a few seconds (Opus often starts slightly too "
                    "early). Consider adding: an opening text overlay (&ldquo;3 things about "
                    "X&rdquo;), a closing call-to-action."
                ),
            },
            {
                "title": "Schedule across the week",
                "body": (
                    "From a single source, you now have 10\u201320 clips. Don't post them all "
                    "at once. Schedule across 2\u20133 weeks at a rate of 3\u20135 per "
                    "platform per week. Use Opus's built-in scheduler (Business tier) or "
                    "export and schedule in Later, Buffer, or your platform's native tool."
                ),
            },
        ],
        "ex_basic": {
            "title": "Basic: Six clips from one video",
            "meta": ["~30 min + review", "Level: Beginner"],
            "body": (
                "<p>Pick a long-form recording you already have \u2014 a podcast episode, a "
                "lecture, a webinar, an interview, even a long Zoom conversation (with "
                "consent). Feed it to Opus. Review the top 10 clips. Pick the six you think "
                "are strongest; edit each one lightly (title, captions, trim).</p>"
                "<p>Post all six across the next two weeks. Note which got traction and why.</p>"
            ),
        },
        "ex_advanced": {
            "title": "Advanced: A month of content from one source",
            "meta": ["~90 min + ongoing", "Level: Advanced"],
            "body": (
                "<p>Pick your single strongest long-form recording from the past year. Run "
                "it through Opus. Generate clips for <em>all three</em> vertical-video "
                "platforms you care about (TikTok, Reels, Shorts, or LinkedIn verticals).</p>"
                "<p>Curate down to 15\u201320 clips you'd actually ship. Build a "
                "publication calendar spanning four weeks with clear platform allocation. "
                "For each clip: write your own hook title (don't use Opus's), add a "
                "platform-specific caption with 2\u20135 hashtags, and add a call-to-action.</p>"
                "<p>Ship one clip per day for 20 days. At the end, build an analytics table: "
                "which clips got traction on which platforms, and why? Did the Opus virality "
                "score correlate with actual performance? What does this tell you about what "
                "to record next?</p>"
                "<p>This exercise turns a single long-form recording into a month's worth of "
                "social content. That ratio \u2014 one hour of recording to 20 days of "
                "content \u2014 is the economic magic of this tool.</p>"
            ),
        },
        "pitfalls": [
            "<p><strong>Virality scores are not prophecy.</strong> A 90/100 clip can flop; "
            "a 60/100 clip can go viral. Use the score as a prioritization signal for which "
            "clips to review first, not as a ranking for what to publish. Your judgment of "
            "what matters to your audience beats the score.</p>",
            "<p><strong>Auto-reframing can cut your face in half.</strong> On clips where "
            "two speakers are conversing, Opus sometimes loses track and crops awkwardly. "
            "Preview every clip in the target aspect ratio before publishing. Fix reframing "
            "manually in the editor if needed.</p>",
            "<p><strong>Don't post everything.</strong> Opus generates 15\u201320 clips "
            "because it can. That doesn't mean you should ship them all. Half of what Opus "
            "picks is mediocre. Being willing to throw away 10 clips to ship 10 good ones "
            "is what separates creators with loyal audiences from creators with noise.</p>",
        ],
        "compare_html": """
<p>
  Opus Clip's direct competitors are <strong>Vizard</strong> (similar capability, slightly
  cheaper, less polished UI), <strong>SubMagic</strong> (captions-first, less smart at
  clip selection), <strong>2short.ai</strong> (YouTube-focused, good for Shorts
  specifically), and <strong>Munch</strong> (faster turnaround, smaller feature set).
  Opus is the current leader on clip-selection quality and the most polished overall,
  but Vizard is the budget-conscious choice with nearly equivalent output. Try both on
  one source video to see which picks land better with your content.
</p>
""",
        "when_to_use": """
<p><strong>Use Opus Clip when</strong> you regularly produce long-form video or audio
and want to extract social content from it. Essential for podcasters, YouTubers,
educators recording lectures, and anyone who wants to show up on short-form social
without recording specifically for it.</p>
<p><strong>Do not use Opus Clip when</strong> the long-form content is text-based
(Pictory \u2014 Day 18 \u2014 is the right tool), when your audience is on long-form
platforms only (YouTube long-form, podcasts), or when your content has sensitive moments
that shouldn't be clipped out of context.</p>
""",
        "further": [
            {"label": "Opus Clip home", "url": "https://www.opus.pro"},
            {"label": "Opus Academy \u2014 tutorials", "url": "https://academy.opus.pro"},
        ],
    },
    {
        "num": 20,
        "tool": "Captions",
        "focus": "The AI video-editor app that lives on your phone.",
        "url": "https://www.captions.ai",
        "tagline": "Record, caption, edit, enhance, and publish \u2014 all in one mobile app.",
        "pills": ["~30 min", "Free with limits", "Paid: $10\u201331/mo"],
        "vignette": (
            "You're walking and a thought lands. You want to capture it as a talking-head "
            "video before it evaporates. Opening a camera app, recording, transferring to "
            "a laptop, editing, exporting, re-uploading \u2014 by the time you were done the "
            "thought would be gone. What if the whole production pipeline fit in your "
            "pocket?"
        ),
        "why_html": """
<p>
  <strong>Captions is the all-in-one AI video studio designed for phone-first creators.</strong>
  It combines: a teleprompter for recording, AI-powered auto-captions in over 100 languages,
  eye-contact correction (you can look at the script and the AI makes you appear to be
  looking at camera), auto-editing (remove silences, ums, retakes), AI-generated B-roll
  to illustrate your words, color and lighting enhancement, and direct publishing to
  TikTok, Reels, and Shorts. All of it runs on an iPhone or Android device; most of it
  runs locally.
</p>
<p>
  The category this tool is best understood in is &ldquo;what replaces CapCut for creators
  who want AI in the loop.&rdquo; CapCut is the dominant free mobile video editor, used
  by essentially every creator shooting on their phone. Captions is the AI-augmented
  competitor: slightly pricier, dramatically smarter. For creators who value speed
  (record-to-publish in 15 minutes) and consistency (every video has the same caption
  style, the same pacing, the same polish), Captions is a genuine productivity unlock.
</p>
<p>
  Because it runs on your phone, Captions unlocks a different shape of content: the
  just-captured thought, the in-the-moment response, the on-location reflection. For
  educators and researchers who already do thinking-out-loud content, Captions makes it
  frictionless to ship.
</p>
""",
        "setup_html": """
<p><strong>Installation:</strong> download Captions from the App Store or Google Play.
Sign up free to evaluate. Paid tiers: Pro ($10/mo) for extended features; Scale ($31/mo)
for AI avatars and advanced generation.</p>
<p><strong>Hardware:</strong> a recent iPhone (Pro models preferred for low-light quality)
or mid-range Android. Earbuds with a built-in mic dramatically improve audio quality \u2014
use them for any published content.</p>
""",
        "walkthrough": [
            {
                "title": "Create a new project and pick a template",
                "body": (
                    "Open Captions. Start a new project. Pick a caption style from the "
                    "library \u2014 bold centered-yellow is the TikTok standard; cleaner "
                    "black-on-white works for LinkedIn. You can customize later; the point "
                    "now is consistency, not perfection."
                ),
            },
            {
                "title": "Use the teleprompter",
                "body": (
                    "If you have a script, paste it into the <strong>Teleprompter</strong>. "
                    "Captions scrolls the text over the camera preview as you record. The "
                    "scroll speed adapts to your reading speed. Position the phone at eye "
                    "level for natural-looking delivery."
                ),
            },
            {
                "title": "Record",
                "body": (
                    "Tap record. Deliver your lines. Don't worry about stumbles, long pauses, "
                    "or restarts \u2014 Captions will clean them up. If you blow a take "
                    "completely, restart from the beginning of that sentence; don't stop "
                    "the recording."
                ),
            },
            {
                "title": "Let AI edit pass one: silences and retakes",
                "body": (
                    "After recording, tap <strong>AI Edit</strong>. Captions identifies and "
                    "removes: long silences (&gt;1 second), filler words (um, uh, like), "
                    "and detected retakes (where you said the same sentence twice in a row). "
                    "Review the result; undo individual cuts if they lost a beat you wanted."
                ),
            },
            {
                "title": "Apply eye-contact correction (if needed)",
                "body": (
                    "If you read from the teleprompter and your eyes drifted off-camera, "
                    "enable <strong>Eye Contact</strong>. The AI re-renders your eyes to "
                    "look straight at the lens. It's subtle and remarkable \u2014 and also "
                    "slightly eerie if you study it too closely. Use it for teleprompter "
                    "recordings, not for authentic talking-head vlogs where off-camera "
                    "eyes read as human."
                ),
            },
            {
                "title": "Add captions + B-roll + publish",
                "body": (
                    "Auto-captions are already in place. Customize the timing and styling. "
                    "Add AI B-roll by tapping <strong>Add B-roll</strong> \u2014 Captions "
                    "generates a short clip illustrating each of your key points. Preview "
                    "the full video. Export directly to TikTok, Reels, Shorts, or as a file."
                ),
            },
        ],
        "ex_basic": {
            "title": "Basic: A captured thought, shipped in 15 minutes",
            "meta": ["~15 min", "Level: Beginner"],
            "body": (
                "<p>Think of something you've wanted to say to your audience this week. "
                "Write 3-5 sentences of script. Open Captions. Record with the teleprompter. "
                "Let AI Edit clean it up. Add captions and export.</p>"
                "<p>Publish it to one platform where your audience is. Note the total "
                "elapsed time from idea to published post. Anything under 20 minutes is "
                "a huge win.</p>"
            ),
        },
        "ex_advanced": {
            "title": "Advanced: Five-video batch day",
            "meta": ["~90 min", "Level: Advanced"],
            "body": (
                "<p>Pick a batch day on your calendar. Plan five short videos in advance \u2014 "
                "five ideas, five 60\u201390-word scripts, five hooks. Wear the same outfit. "
                "Pick a good light source.</p>"
                "<p>In one 90-minute session: record, AI-edit, caption, and export all five. "
                "Save them as drafts across the next two weeks of publishing. Batching is "
                "the productivity move that separates creators who ship consistently from "
                "those who don't; Captions makes batching viable on a phone.</p>"
                "<p>After publishing all five over two weeks, write a 150-word reflection: "
                "what did the batch day feel like versus recording-one-at-a-time? Which of "
                "the five performed best, and why? What do you want to do differently on "
                "your next batch day?</p>"
            ),
        },
        "pitfalls": [
            "<p><strong>Eye-contact correction at length feels unsettling.</strong> For a "
            "20-second clip where the speaker glanced at the teleprompter a few times, "
            "eye-contact correction is invisible and useful. For a 3-minute video of "
            "sustained direct eye contact, the correction starts to read as unnatural. "
            "Use it sparingly.</p>",
            "<p><strong>AI B-roll is decorative, not illustrative.</strong> The AI-generated "
            "B-roll is useful filler but rarely adds real information. For instructional "
            "content, shoot real B-roll (a photo, a screen recording, a demonstration) and "
            "layer it in. AI B-roll is fine for talking-head expansions of a concept, "
            "risky for how-to content.</p>",
            "<p><strong>Battery and storage.</strong> A batch day with Captions will drain "
            "a phone battery in 2 hours and chew through 10+ GB of storage. Plug in during "
            "the session; clear cache between projects; or invest in an external battery "
            "pack and a sync-to-cloud workflow.</p>",
        ],
        "compare_html": """
<p>
  Captions's competitors include <strong>CapCut</strong> (free, more manual, the
  dominant mobile video editor), <strong>InShot</strong> (similar to CapCut, older),
  <strong>Splice</strong> (faster UI, fewer AI features), and <strong>Descript's
  mobile app</strong> (Day 13, desktop-first but growing on mobile). For AI-first
  phone-based creation, Captions leads. For free, flexible, non-AI mobile editing,
  CapCut still dominates. Most creators use both: CapCut for heavy edits, Captions for
  speed and talking-head polish.
</p>
""",
        "when_to_use": """
<p><strong>Use Captions when</strong> you're a phone-first creator shipping talking-head
content, when speed from idea to published matters more than cinematic polish, or when
you need consistent caption styling and auto-editing at batch scale.</p>
<p><strong>Do not use Captions when</strong> you're producing cinematic video (Runway \u2014
Day 16 \u2014 or a desktop editor like Descript or Premiere), when you need multi-track
audio and complex layering (desktop wins), or when authenticity of your real delivery
matters more than polish (skip Eye Contact correction; embrace the human).</p>
""",
        "further": [
            {"label": "Captions home", "url": "https://www.captions.ai"},
            {"label": "Captions support", "url": "https://support.captions.ai"},
        ],
    },

    # =====================================================================
    # WEEK 5 — BUSINESS POWER TOOLS
    # =====================================================================
    {
        "num": 21,
        "tool": "Gamma",
        "focus": "Type an outline. Get a polished deck.",
        "url": "https://gamma.app",
        "tagline": "The presentation tool that doesn't make you fight with alignment for three hours.",
        "pills": ["~35 min", "Free: 400 AI credits", "Paid: $10\u201320/mo"],
        "vignette": (
            "You have a meeting in 90 minutes. You promised a deck. You have bullet points "
            "in a Notion doc and a strong argument in your head. What you do not have is "
            "the patience to spend the next hour dragging text boxes around in PowerPoint."
        ),
        "why_html": """
<p>
  <strong>Gamma is the AI presentation tool that eliminates the friction between an idea
  and a finished deck.</strong> Type an outline (or paste a doc), describe the tone, and
  Gamma produces a 10\u201320-slide presentation with a consistent design, relevant
  imagery, and real information hierarchy. No alignment fights. No hunting for stock
  photos. No wrestling with SmartArt.
</p>
<p>
  What makes Gamma different from its predecessors (Beautiful.ai, Tome) is the
  <em>editability after generation</em>. The output isn't a locked AI artifact \u2014 it's
  a real, editable document where you can rewrite text, swap layouts, change colors, and
  iterate slide-by-slide. Gamma sits in the sweet spot between &ldquo;blank PowerPoint&rdquo;
  (too much friction) and &ldquo;single-prompt decks&rdquo; (too little control).
</p>
<p>
  For consultants, researchers, educators, and anyone who makes decks regularly, Gamma
  compresses a 2\u20133 hour production task to about 25 minutes. The first draft is
  usually good enough to ship to an internal audience; with 15 minutes of editing, it's
  good enough for a client or a conference panel. For most business presentations \u2014
  not the ones you practice for weeks, but the hundreds you ship every year \u2014 that
  tradeoff is transformative.
</p>
""",
        "setup_html": """
<p><strong>Account:</strong> gamma.app free tier gives you 400 AI credits (enough for
~15 generations). Plus ($10/mo) unlocks unlimited AI and removes the Gamma watermark.
Pro ($20/mo) adds custom fonts, advanced analytics, and team features.</p>
<p><strong>Source material:</strong> Gamma works best with a clear outline, a structured
doc, or a Notion page. It struggles with very dense technical prose or unordered brain
dumps. Take five minutes to organize your thinking into 3\u20135 main sections before
you generate.</p>
""",
        "walkthrough": [
            {
                "title": "Start with the right input",
                "body": (
                    "At gamma.app, click <strong>New</strong>. You have three entry points: "
                    "<em>Generate</em> (describe the topic in a few sentences), <em>Text "
                    "transform</em> (paste an existing doc), or <em>Import</em> (from Notion, "
                    "a URL, a PDF). For a real deck, paste your actual outline into Text "
                    "transform. The generated result will be much closer to what you want."
                ),
            },
            {
                "title": "Pick a theme that matches your context",
                "body": (
                    "Gamma offers 40+ themes (curated, not AI-generated). Pick one that "
                    "matches the register of your meeting: crisp and corporate for a board "
                    "update, warmer and editorial for a conference keynote, minimal and "
                    "serif for an academic panel. You can change this later; picking "
                    "roughly right now saves two edits."
                ),
            },
            {
                "title": "Review the generated slides",
                "body": (
                    "Gamma takes about 60 seconds to generate. Review each slide in "
                    "sequence. Kill any slide that's redundant or off-topic. Merge slides "
                    "that are too thin. Expect the first draft to be 80% right; the last "
                    "20% is your actual work."
                ),
            },
            {
                "title": "Edit slide-by-slide with AI commands",
                "body": (
                    "On any slide, click <strong>Edit with AI</strong>. Commands like "
                    "<em>&ldquo;make this more concise,&rdquo;</em> <em>&ldquo;add a real "
                    "example,&rdquo;</em> <em>&ldquo;turn this into a comparison table,&rdquo;</em> "
                    "or <em>&ldquo;replace the image with something more editorial&rdquo;</em> "
                    "work directly. This is where Gamma's editor beats every other AI-deck "
                    "tool \u2014 you can steer each slide individually."
                ),
            },
            {
                "title": "Swap layouts, not just content",
                "body": (
                    "For any slide whose structure isn't working, click the <strong>Layout</strong> "
                    "picker. Gamma offers 20+ layouts per slide (two-column, quote-heavy, "
                    "image-first, timeline, table, big-number, etc.). Swapping to the right "
                    "layout often fixes a slide that feels bad without changing any content."
                ),
            },
            {
                "title": "Export for the context you need",
                "body": (
                    "Gamma decks live natively on the web (sharable by link, interactive, "
                    "responsive on mobile). For a meeting where someone needs to present "
                    "from PowerPoint, export to PPTX. For a leave-behind, export to PDF. "
                    "For a link you'll drop in Slack or email, use the shareable URL \u2014 "
                    "it always shows the latest version."
                ),
            },
        ],
        "ex_basic": {
            "title": "Basic: One real deck for a real meeting",
            "meta": ["~30 min", "Level: Beginner"],
            "body": (
                "<p>Pick a deck you need to ship this week. Paste your outline into Gamma. "
                "Generate. Spend 15 minutes editing slide-by-slide. Export as PPTX (if "
                "presenting in PowerPoint) or keep native Gamma (if presenting from your "
                "browser).</p>"
                "<p>Ship the deck. Note the total time from blank slate to done. Compare "
                "to what a deck like this would normally take you.</p>"
            ),
        },
        "ex_advanced": {
            "title": "Advanced: A three-deck series with a consistent voice",
            "meta": ["~90 min", "Level: Advanced"],
            "body": (
                "<p>Pick a topic with three related sub-topics \u2014 a three-part training "
                "series, a three-module curriculum, a three-stage project update, a "
                "three-scenario pitch. Produce a separate deck for each.</p>"
                "<p>Before generating any decks, define your voice in 3\u20134 sentences: "
                "tone (confident/warm/formal?), vocabulary (technical/accessible?), visual "
                "style (bold/minimal?). Paste those guidelines into every Generate prompt.</p>"
                "<p>Generate all three. Edit each to shipping quality. At the end, review "
                "them side-by-side: do they feel like they came from the same voice? Fix "
                "inconsistencies.</p>"
                "<p>Share all three with one real audience (a class, a client, a team). "
                "Collect feedback on clarity and cohesion. Write a 150-word reflection: "
                "does Gamma's output scale to a series, or does each deck need its own "
                "hand-crafted pass? That answer determines how much of your future deck-"
                "making should live in this tool.</p>"
            ),
        },
        "pitfalls": [
            "<p><strong>Generated text is often verbose.</strong> Gamma's AI writes in "
            "complete sentences where bullet fragments would be stronger. Read every slide "
            "out loud; cut half the words on any slide that reads like a paragraph. Decks "
            "are not essays.</p>",
            "<p><strong>Stock imagery is generic.</strong> Gamma's default image selection "
            "is better than PowerPoint's clip art but still produces the same &ldquo;AI-"
            "looking&rdquo; photos everyone has seen. For hero slides, replace with a "
            "Midjourney or real photograph; for supporting slides, accept the stock.</p>",
            "<p><strong>Data slides are the weak spot.</strong> Gamma generates charts "
            "from text descriptions, but the result is often numerically meaningless or "
            "visually confusing. For any real data, paste an image of the chart from your "
            "actual source (Excel, Tableau, a screenshot) rather than having Gamma draw it.</p>",
        ],
        "compare_html": """
<p>
  Gamma competes with <strong>Beautiful.ai</strong> (covered in Course 1, stronger on
  auto-layout constraints, weaker on AI generation), <strong>Tome</strong> (similar
  feature set, slightly more narrative-focused), <strong>Pitch</strong> (collaborative,
  less AI-first), and <strong>Canva's AI decks</strong> (cheaper, lower ceiling).
  Gamma's edge is the combination of strong AI generation plus genuinely good per-slide
  editing \u2014 most competitors are better at one or the other. For serious deck
  volume, Gamma is currently the default choice; keep PowerPoint for the 1\u20132 decks
  a year where pixel-perfect custom design matters.
</p>
""",
        "when_to_use": """
<p><strong>Use Gamma when</strong> you're shipping decks frequently and the friction of
traditional slide software is the bottleneck: weekly team updates, client briefings,
internal training, conference proposals, course modules, research summaries for
non-academic audiences.</p>
<p><strong>Do not use Gamma when</strong> the deck will be used for years as a template
(build in PowerPoint with a proper master), when you need precise corporate branding
controls (enterprise tools win), or when the deck is genuinely data-driven (build charts
in Excel or Tableau and paste images in).</p>
""",
        "further": [
            {"label": "Gamma home", "url": "https://gamma.app"},
            {"label": "Gamma help center", "url": "https://help.gamma.app"},
        ],
    },
    {
        "num": 22,
        "tool": "Clay",
        "focus": "AI-powered research and outreach at spreadsheet scale.",
        "url": "https://clay.com",
        "tagline": "The spreadsheet where every cell can make an AI call and every row can enrich itself.",
        "pills": ["~50 min", "Free: 100 credits/mo", "Paid: $149+/mo"],
        "vignette": (
            "You have a list of 200 prospects. You need to find each one's LinkedIn, their "
            "current role, their company's latest funding round, and write a personalized "
            "outreach email. This is six hours of browser-tab drudgery \u2014 unless every "
            "cell in your spreadsheet can think."
        ),
        "why_html": """
<p>
  <strong>Clay is a spreadsheet where every row is a subject of research and every cell
  can make an AI call, a web scrape, or an API request.</strong> It is the tool that has
  quietly become the backbone of modern sales and business-development operations \u2014
  but its capabilities extend well beyond sales into research, journalism, recruiting,
  competitive intelligence, and any workflow that involves enriching a list of entities.
</p>
<p>
  The experience is unusual. You start with a list of names, URLs, or companies. You
  add columns like: <em>Find LinkedIn URL</em>, <em>Current job title</em>, <em>Company
  size</em>, <em>Recent news</em>, <em>Personalized opener based on their last post</em>,
  <em>Classify into these 4 segments</em>. Each column is powered by a combination of:
  dozens of integrated data providers (ZoomInfo, Clearbit, LinkedIn, Crunchbase, etc.);
  web scrapers for any site with a URL pattern; and AI (GPT, Claude, Gemini) calls that
  can read enriched data and produce new insights per row.
</p>
<p>
  For a researcher: imagine a spreadsheet of 300 academic papers that auto-populates
  columns for methodology, sample size, and a plain-English summary. For a journalist: a
  list of 50 public companies with auto-enriched quarterly earnings, recent litigation,
  and a short risk profile. For a non-profit: 200 potential donors with their giving
  history and personalized outreach drafts. Clay is the tool that lets one person do what
  used to require a research team.
</p>
""",
        "setup_html": """
<p><strong>Account:</strong> clay.com free tier includes 100 credits/month and 14 days
of Pro access \u2014 enough to complete a real workflow end-to-end. Pricing starts at
$149/mo for Starter (2,000 credits), scaling to $349/mo and custom enterprise tiers.
This is the most expensive tool in this course; use the trial period deliberately.</p>
<p><strong>Prereq:</strong> comfort with spreadsheets and the idea that &ldquo;each cell
is a formula.&rdquo; If you've used Google Sheets formulas, you'll be fluent in Clay in
about 30 minutes. If spreadsheets intimidate you, do Day 12 (Otter) and Day 21 (Gamma)
first; Clay rewards spreadsheet thinking.</p>
""",
        "walkthrough": [
            {
                "title": "Start with a seed list",
                "body": (
                    "In Clay, create a new table. Paste or import a list of 20\u201350 "
                    "entities you want to research \u2014 names + companies, or URLs, or "
                    "LinkedIn profiles, or research-paper DOIs. Clay needs at least one "
                    "identifying column to anchor the enrichment."
                ),
            },
            {
                "title": "Add one enrichment column",
                "body": (
                    "Click <strong>Add Column &rarr; Enrich</strong>. Pick a simple enrichment: "
                    "<em>Find LinkedIn URL</em> or <em>Find company website</em>. Map the "
                    "input column. Run it. Watch cells populate one by one. This is your "
                    "&ldquo;aha&rdquo; moment."
                ),
            },
            {
                "title": "Chain enrichments",
                "body": (
                    "Add a second column that depends on the first. <em>Given the LinkedIn "
                    "URL, find their current company.</em> Then a third: <em>Given the "
                    "company, find recent news.</em> Each cell computes from the previous; "
                    "errors propagate, so check your first column's accuracy before layering "
                    "on more."
                ),
            },
            {
                "title": "Use AI to reason over enriched data",
                "body": (
                    "Add an <strong>AI column</strong>. Prompt it to read values from other "
                    "columns and produce output: <em>&ldquo;Given their recent job title and "
                    "company news, write a 2-sentence personalized note that references "
                    "something specific.&rdquo;</em> Pick Claude or GPT. Run on the first "
                    "3 rows only to calibrate; then run on the full set."
                ),
            },
            {
                "title": "Filter and segment with conditions",
                "body": (
                    "Once enriched, use filters to segment: <em>company size &gt; 50</em>, "
                    "<em>recent news contains &ldquo;funding&rdquo;</em>, <em>job title "
                    "contains &ldquo;research&rdquo;</em>. Export segments to CSV, or push "
                    "directly to HubSpot / Salesforce / Airtable via Clay's native "
                    "integrations."
                ),
            },
            {
                "title": "Build a reusable recipe",
                "body": (
                    "When a workflow is proven, save it as a <strong>Template</strong>. The "
                    "next time you have a list of the same entity type, point the template "
                    "at the new list and it runs end-to-end. This is where Clay pays back "
                    "its price: the second use of any workflow is essentially free."
                ),
            },
        ],
        "ex_basic": {
            "title": "Basic: Enrich a list of 20 entities",
            "meta": ["~45 min", "Level: Beginner"],
            "body": (
                "<p>Build a seed list of 20 things you'd genuinely want to know more about \u2014 "
                "20 companies you're tracking, 20 researchers in your field, 20 local "
                "non-profits, 20 podcasts you might pitch, 20 competitors. Enrich each row "
                "with 3\u20135 columns (including one AI-generated field).</p>"
                "<p>Review the output. Spot-check 3 rows against the source \u2014 is the "
                "data right? Is the AI reasoning reasonable? Export to CSV and use the data "
                "for something real this week.</p>"
            ),
        },
        "ex_advanced": {
            "title": "Advanced: Build a reusable research pipeline",
            "meta": ["~2 hours + recurring use", "Level: Advanced"],
            "body": (
                "<p>Identify a recurring research task in your work: monthly competitor "
                "tracking, weekly investor outreach, quarterly partner scouting, "
                "term-by-term student outreach, annual donor research. Design a Clay "
                "workflow that automates it:</p>"
                "<ol><li>Input column(s) that represent the seed list.</li>"
                "<li>5\u201310 enrichment columns that cover everything you care about.</li>"
                "<li>2\u20133 AI columns that produce reasoning or copy.</li>"
                "<li>A filter or segment that surfaces the high-priority rows.</li>"
                "<li>A push destination (CSV export, HubSpot, Airtable, email).</li></ol>"
                "<p>Save it as a template. Run it on a real batch this week. Compare the "
                "result to what you would have produced by hand in the same time. Run the "
                "same template again next month on fresh data.</p>"
                "<p>Write a 200-word memo: what just became possible that wasn't before? "
                "What is the annual time savings? Is Clay's subscription priced correctly "
                "for your usage?</p>"
            ),
        },
        "pitfalls": [
            "<p><strong>Credit costs add up fast.</strong> Every enrichment cell costs "
            "credits, and AI cells cost more per call than data-provider cells. A naive "
            "workflow on 500 rows with 10 columns can burn through 5,000 credits. Always "
            "test on 5\u201310 rows before running on the full list \u2014 this is the "
            "single habit that saves Clay subscribers the most money.</p>",
            "<p><strong>Enrichment accuracy varies by data source.</strong> Clay aggregates "
            "dozens of providers; the first one tried is not always the best. For "
            "mission-critical fields, use the <em>waterfall</em> feature to try multiple "
            "providers in sequence and use the first successful result.</p>",
            "<p><strong>AI columns hallucinate on thin context.</strong> If you ask for "
            "&ldquo;a personalized opener&rdquo; and the only data Clay has about the "
            "person is their job title, it will invent details. Always include enough "
            "enrichment columns to ground the AI, and review AI output before sending "
            "anywhere it represents you.</p>",
        ],
        "compare_html": """
<p>
  Clay's direct competitors are <strong>Apollo.io</strong> (cheaper, narrower, sales-
  focused), <strong>Airtable + custom automations</strong> (more flexible, much more
  work to set up), <strong>ZoomInfo</strong> (data-provider-first, less workflow flex),
  and <strong>Instantly</strong> (outbound-specific, lighter research). For general-
  purpose &ldquo;research every row in a list with multiple data sources + AI,&rdquo;
  Clay is currently unmatched. For sales-only workflows at smaller companies, Apollo is
  the budget choice. Zapier (Course 1) can orchestrate pieces of what Clay does but
  cannot replicate the spreadsheet-as-canvas metaphor.
</p>
""",
        "when_to_use": """
<p><strong>Use Clay when</strong> you have a recurring need to enrich and reason over
lists of entities: sales prospects, research subjects, journalism targets, donor lists,
competitive scans, recruiting pipelines. The ROI is proportional to how often you'd
otherwise be opening browser tabs.</p>
<p><strong>Do not use Clay when</strong> your list is one-off and small (&lt;20 entities,
a manual afternoon beats the Clay learning curve), when your data is highly proprietary
and can't go through third-party enrichment APIs (compliance teams say no), or when
you just need a better CRM (use HubSpot; Clay feeds into CRMs, it doesn't replace them).</p>
""",
        "further": [
            {"label": "Clay home", "url": "https://clay.com"},
            {"label": "Clay University \u2014 tutorials", "url": "https://university.clay.com"},
        ],
    },
    {
        "num": 23,
        "tool": "Lindy",
        "focus": "AI agents that do your work while you do other things.",
        "url": "https://lindy.ai",
        "tagline": "A personal AI teammate that triages your email, takes meeting notes, and books itself onto your calendar.",
        "pills": ["~45 min", "Free: 400 tasks/mo", "Paid: $49.99\u2013299/mo"],
        "vignette": (
            "Your inbox has 180 unread messages. Forty need responses; the rest are "
            "informational or spam. Before reading the first one, you already know that "
            "you'll spend two hours doing this and finish unsatisfied. What if an agent "
            "could read all 180, draft replies to the forty, and summarize the rest?"
        ),
        "why_html": """
<p>
  <strong>Lindy is a platform for building personal AI agents that take real actions \u2014
  read email, join meetings, search the web, update CRMs, book calendar time \u2014 on
  your behalf.</strong> Unlike chatbots that respond when you ask, Lindy agents sit
  running in the background, triggered by events (a new email arrives, a meeting starts,
  a Slack message is sent) and take their assigned actions automatically.
</p>
<p>
  The design insight: most knowledge work is pattern-following. The same kinds of emails
  show up every day and want the same kinds of responses. The same meeting-prep motion
  runs before every customer call. The same CRM-update ritual happens after every
  conversation. Lindy lets you describe the pattern in plain English, connect the tools
  it needs, and deploy an agent that handles the pattern while you do work that requires
  actual judgment.
</p>
<p>
  For a researcher, a Lindy agent can monitor new papers in specific journals and email
  you summaries weekly. For a consultant, an agent can draft responses to prospect
  inquiries overnight, save drafts to a review queue, and only escalate the genuinely
  complex. For a solo business owner, an agent can triage the whole inbox every morning
  and present a 3-line briefing with the messages that actually need you. This is the
  frontier of personal AI \u2014 where the tool starts to feel less like software and
  more like staff.
</p>
""",
        "setup_html": """
<p><strong>Account:</strong> lindy.ai free tier gives you 400 tasks/month and access to
the full agent builder \u2014 enough to deploy one real agent and see it work. Pro
($49.99/mo) scales to 5,000 tasks; Business ($299/mo) adds team features and phone
integration.</p>
<p><strong>Prereq:</strong> the tools you want the agent to work with (Gmail, Google
Calendar, Slack, HubSpot, Airtable, etc.) need to be integrated via OAuth. Have those
accounts ready and be willing to grant Lindy the permissions its agents require \u2014 or
pick tasks that stay inside Lindy's sandbox.</p>
""",
        "walkthrough": [
            {
                "title": "Pick a template for your first agent",
                "body": (
                    "At lindy.ai, open the <strong>Template Gallery</strong>. Templates cover "
                    "the common patterns: email triage, meeting notes, lead qualification, "
                    "scheduling, research monitoring, inbox auto-draft. Pick one that maps "
                    "to a real pain you have this week. Don't try to design a custom agent "
                    "from scratch on your first try."
                ),
            },
            {
                "title": "Connect the tools it needs",
                "body": (
                    "Lindy asks which accounts to link (Gmail, Calendar, etc.) before it "
                    "can run. Grant only what the template requires. Read the permissions "
                    "scope carefully \u2014 an agent that &ldquo;drafts replies&rdquo; is "
                    "different from one that &ldquo;sends replies without review.&rdquo; "
                    "Start with drafts-only."
                ),
            },
            {
                "title": "Customize the agent's instructions",
                "body": (
                    "Every Lindy agent has a plain-English instruction block. Edit it to "
                    "match your voice and rules: <em>&ldquo;For emails from existing clients, "
                    "draft a warm reply that references our last conversation. For prospecting "
                    "emails, draft a polite decline. For everything else, flag for my "
                    "review.&rdquo;</em> Be specific. Specificity is the difference between "
                    "a useful agent and a noisy one."
                ),
            },
            {
                "title": "Run in sandbox mode first",
                "body": (
                    "Lindy offers a <strong>test mode</strong> where the agent processes real "
                    "inputs but doesn't take real actions \u2014 drafts stay as drafts, "
                    "messages get flagged but not sent. Let it run for a full day in sandbox. "
                    "Review everything the agent would have done. Correct the instructions "
                    "based on what you see."
                ),
            },
            {
                "title": "Enable live mode \u2014 but keep review",
                "body": (
                    "When the sandbox results are 80%+ right, switch to live. For high-stakes "
                    "actions (sending emails, creating calendar events, updating CRM records), "
                    "keep a human-in-the-loop for the first month: the agent drafts, you "
                    "approve. Only graduate to autonomous action after you've audited a few "
                    "hundred examples."
                ),
            },
            {
                "title": "Stack agents for bigger workflows",
                "body": (
                    "Lindy agents can hand off to each other: an email-triage agent flags a "
                    "meeting request, a scheduling agent proposes times, a CRM agent logs "
                    "the booking. Each agent stays narrow and explicable; the combination "
                    "handles workflows no single agent could. This is where power users "
                    "live."
                ),
            },
        ],
        "ex_basic": {
            "title": "Basic: An inbox triage agent",
            "meta": ["~45 min + a week of observation", "Level: Beginner"],
            "body": (
                "<p>Set up an email-triage agent using a Lindy template. Customize the "
                "instructions to reflect your real rules (what gets drafted, what gets "
                "flagged, what gets archived). Run in sandbox for three days and review "
                "every proposed action.</p>"
                "<p>After three days, decide: are the proposals 80% right? If yes, graduate "
                "to live-with-review. If not, refine the instructions and sandbox another "
                "three days. The instructions are the product \u2014 invest here.</p>"
            ),
        },
        "ex_advanced": {
            "title": "Advanced: Build a 3-agent workflow",
            "meta": ["~3 hours + ongoing tuning", "Level: Advanced"],
            "body": (
                "<p>Design a real business workflow that requires multiple agents coordinating. "
                "Example: (1) an email-triage agent classifies incoming messages, (2) a "
                "meeting-prep agent produces a briefing whenever a calendar event is about "
                "to start, (3) a follow-up agent drafts a thank-you email within 30 minutes "
                "of a meeting ending, referencing action items from Otter (Day 12).</p>"
                "<p>Build each agent. Test in sandbox. Wire them together so output of one "
                "triggers the next. Run the full chain on a real day of work.</p>"
                "<p>Write a 250-word retrospective answering: (a) how many hours did the "
                "chain save, (b) what failed and why, (c) where is judgment still required, "
                "(d) what would you automate next given this proves out?</p>"
                "<p>This exercise is the gateway to operating with a personal AI workforce. "
                "Most people never cross it \u2014 the ones who do have hours per day back.</p>"
            ),
        },
        "pitfalls": [
            "<p><strong>Autonomous action at scale is dangerous.</strong> An agent that "
            "sends emails on your behalf will eventually send something wrong to someone "
            "important. Keep a human review step for any outbound communication until the "
            "agent has proven itself on hundreds of examples \u2014 and even then, random-"
            "sample audits.</p>",
            "<p><strong>Permissions creep.</strong> Agents accumulate access over time: "
            "Gmail, Calendar, Slack, HubSpot, Notion, Drive. Each new permission is a new "
            "attack surface. Quarterly, review which agents have which permissions and "
            "revoke anything the agent no longer needs.</p>",
            "<p><strong>Instructions drift from reality.</strong> Your business changes; "
            "your agent's instructions often don't keep up. Every month, spend 15 minutes "
            "re-reading each agent's instructions and updating them to reflect how you "
            "actually work now. Agents without maintenance become noisy, then wrong, "
            "then harmful.</p>",
        ],
        "compare_html": """
<p>
  Lindy's competitors include <strong>Zapier AI</strong> (Course 1; lighter-weight,
  trigger-action focused, less agent-like), <strong>n8n</strong> (self-hostable,
  developer-facing), <strong>Make.com</strong> (similar to Zapier), and
  <strong>Relevance AI</strong> (more technical, better for building custom multi-step
  agents). Lindy's edge is the focus on personal productivity agents \u2014 agents that
  sit between you and your work, not between systems. For technical users building
  complex automations, Relevance AI is stronger. For business users delegating email
  and meeting work, Lindy is unusually well-designed.
</p>
""",
        "when_to_use": """
<p><strong>Use Lindy when</strong> you notice yourself doing the same motion repeatedly
every day or week \u2014 inbox triage, meeting prep, CRM updates, lead qualification,
research monitoring. The pattern is the signal that an agent can help.</p>
<p><strong>Do not use Lindy when</strong> the task requires substantial domain judgment
(it will produce confident wrong answers), when compliance forbids third-party access to
sensitive data, or when the volume doesn't justify the setup cost (one email a week is
not worth an agent).</p>
""",
        "further": [
            {"label": "Lindy home", "url": "https://lindy.ai"},
            {"label": "Lindy templates", "url": "https://lindy.ai/templates"},
        ],
    },
    {
        "num": 24,
        "tool": "Grammarly AI",
        "focus": "The writing assistant that has quietly turned into a competent co-writer.",
        "url": "https://www.grammarly.com",
        "tagline": "Not just a grammar checker anymore \u2014 an AI that writes, rewrites, and shortens at a keystroke.",
        "pills": ["~25 min", "Free tier", "Paid: $12\u201315/mo"],
        "vignette": (
            "You are writing the third paragraph of an important email. You know what you "
            "want to say; the words are not coming. You have written and deleted the same "
            "sentence four times. What if there were a shortcut that kept your voice "
            "intact but moved you past the moment?"
        ),
        "why_html": """
<p>
  <strong>Grammarly has quietly evolved from a grammar-checker into one of the most-
  integrated AI writing assistants in knowledge work.</strong> It runs inside every
  writing surface you use (Gmail, Outlook, Google Docs, Slack, LinkedIn, Word) and
  offers generative features that extend well past spellcheck: <em>rewrite with a
  clearer tone</em>, <em>shorten by 30%</em>, <em>respond to this email</em>, <em>make
  this more persuasive</em>, <em>add a professional tone</em>.
</p>
<p>
  The trick Grammarly gets right is <em>integration over brilliance</em>. Its writing
  suggestions are not better than Claude's or ChatGPT's in isolation \u2014 but because
  they appear in the exact context where you are writing, without copy-paste, without
  switching tabs, they get used. For most knowledge workers, the quality ceiling matters
  less than whether the tool is available at the moment of struggle. Grammarly is, and
  that's the whole product.
</p>
<p>
  For researchers and academics, Grammarly Premium's tone-detection and academic-style
  features are particularly useful on long-form writing. For anyone who sends a lot of
  professional email, the <em>Reply with AI</em> feature in Gmail/Outlook saves 5\u20131515
  minutes a day. For non-native English writers, Grammarly is the single most valuable
  AI tool on this list \u2014 it catches not just grammar but register (too casual, too
  stiff) that is hard to self-correct for.
</p>
""",
        "setup_html": """
<p><strong>Account:</strong> grammarly.com free tier covers grammar, spelling, and basic
tone detection. Premium ($12/mo annualized) unlocks generative AI features (rewrite,
summarize, compose), advanced tone controls, and citations checking. Business
($15/user/mo) adds brand tones for teams.</p>
<p><strong>Install:</strong> the browser extension (Chrome, Firefox, Safari, Edge) is
the most-used surface. There are also desktop apps for Mac and Windows, a mobile
keyboard, and a Word/Outlook plugin. Install the ones that match where you write most.</p>
""",
        "walkthrough": [
            {
                "title": "Install and enable the browser extension",
                "body": (
                    "Go to grammarly.com. Install the extension. Sign in. Open Gmail or "
                    "Google Docs. Start typing. You'll see green underlines for grammar "
                    "suggestions and a small Grammarly icon in the corner of every text "
                    "field. This is the base experience; everything else layers on top."
                ),
            },
            {
                "title": "Set your writing goals per document",
                "body": (
                    "When you start a new Google Doc, Grammarly asks you to set goals: "
                    "<em>audience</em> (general, knowledgeable, expert), <em>formality</em> "
                    "(informal, neutral, formal), <em>tone</em> (friendly, confident, "
                    "persuasive), and <em>intent</em> (inform, describe, convince, tell a "
                    "story). These dial the suggestions in to fit the document."
                ),
            },
            {
                "title": "Try the generative rewrite commands",
                "body": (
                    "Highlight a paragraph. The Grammarly popover shows options: "
                    "<em>Rewrite</em>, <em>Shorten</em>, <em>Make sound confident</em>, "
                    "<em>Change tone</em>. Click Shorten. Compare the before and after. "
                    "Often the shortened version is 30% tighter and communicates the same "
                    "idea \u2014 that's a habit worth building."
                ),
            },
            {
                "title": "Reply to email with AI",
                "body": (
                    "Open an email in Gmail or Outlook. Click the Grammarly button in the "
                    "reply box. Pick <strong>Reply</strong> and describe what you want: "
                    "<em>&ldquo;Decline politely and suggest next month.&rdquo;</em> "
                    "Grammarly drafts the reply, grounded in the context of the email it's "
                    "replying to. Edit before sending \u2014 AI replies still need your "
                    "voice \u2014 but the first-draft friction is gone."
                ),
            },
            {
                "title": "Use tone detection actively",
                "body": (
                    "Long emails and docs get a tone score: <em>This email sounds "
                    "curious and confident</em>, or <em>This email sounds concerned and "
                    "formal</em>. Use the scoring to catch misfires before sending. If "
                    "you intended warmth and the tone score reads as formal, there's a "
                    "gap between what you meant and what you wrote \u2014 fix it."
                ),
            },
            {
                "title": "Create a personal dictionary",
                "body": (
                    "Over time, Grammarly flags proper nouns, jargon, and stylistic "
                    "choices that aren't wrong. Add them to your <strong>personal "
                    "dictionary</strong> as you encounter them. After a few weeks of "
                    "maintenance, Grammarly stops creating noise about your "
                    "domain-specific vocabulary."
                ),
            },
        ],
        "ex_basic": {
            "title": "Basic: A day of Grammarly-augmented writing",
            "meta": ["~10 min setup + a day", "Level: Beginner"],
            "body": (
                "<p>Install the extension and the Gmail/Outlook plugin. For one full workday, "
                "use the generative features actively: rewrite at least three paragraphs "
                "to shorten, use Reply with AI on at least two emails, check tone on "
                "anything important before sending.</p>"
                "<p>At the end of the day, note: how many minutes did it save? Did anyone "
                "notice a shift in your writing style? Which feature will you use every day "
                "going forward?</p>"
            ),
        },
        "ex_advanced": {
            "title": "Advanced: Raise the baseline on your writing",
            "meta": ["~2 hours + 30 days of practice", "Level: Advanced"],
            "body": (
                "<p>Pick three pieces of your own writing from the last six months: a long "
                "email, a blog post or newsletter, a report or document. For each, set the "
                "Grammarly goals correctly, then run through the full suggestion pass. Note "
                "every suggestion you agree with and every one you reject \u2014 and why.</p>"
                "<p>Identify your three most common writing weaknesses based on what "
                "Grammarly surfaced (verbose paragraphs, passive voice overuse, hedged "
                "claims, misplaced commas, tone mismatches, whatever it is for you).</p>"
                "<p>For the next 30 days, watch for those three weaknesses in your live "
                "writing. Catch them yourself before Grammarly does. At the end of 30 days, "
                "compare a fresh document against your originals. Is your first-draft "
                "quality higher? Are you making the same mistakes less often?</p>"
                "<p>Grammarly is the rare AI tool that, used well, actually makes you "
                "better \u2014 not just faster \u2014 at the underlying skill.</p>"
            ),
        },
        "pitfalls": [
            "<p><strong>Flattening of voice.</strong> Over-applied, Grammarly's suggestions "
            "nudge your writing toward a generic professional register \u2014 shorter "
            "sentences, fewer distinctive phrases, neutral tone. For personal newsletters, "
            "creative writing, or anything where your voice is the value, reject more "
            "suggestions than you accept.</p>",
            "<p><strong>False confidence on complex grammar.</strong> Grammarly is "
            "excellent at common errors but occasionally confidently wrong about subtle "
            "grammar (subjunctive, nested modifiers, technical jargon). Treat suggestions "
            "as drafts; don't accept blindly. For academic writing especially, a human "
            "editor still outperforms.</p>",
            "<p><strong>Privacy considerations.</strong> Grammarly reads everything you "
            "type in the apps where it's installed. For work at a company with data-"
            "handling policies, check whether Grammarly (or Grammarly Business) is "
            "approved before installing on work accounts.</p>",
        ],
        "compare_html": """
<p>
  Grammarly competes with <strong>Wordtune</strong> (stronger rewrite suggestions, weaker
  grammar), <strong>ProWritingAid</strong> (long-form focused, excellent for fiction and
  academic writing), <strong>Hemingway Editor</strong> (simple, free, readability-focused),
  and <strong>built-in Gmail/Docs Smart Compose</strong> (free, less capable, more
  integrated). Grammarly's edge is the breadth of integrations \u2014 no other tool lives
  in as many writing surfaces. For most professionals, Grammarly is the default; for
  novelists and long-form academic writers, ProWritingAid often wins. Claude and ChatGPT
  outperform all of them on raw quality, but none live inside your Gmail.
</p>
""",
        "when_to_use": """
<p><strong>Use Grammarly when</strong> you write regularly in common surfaces (email,
Docs, Word) and want ambient AI help without context-switching. Essential for non-native
English writers, anyone in customer-facing email roles, and anyone whose writing sample
is part of their professional reputation.</p>
<p><strong>Do not rely on Grammarly when</strong> the writing is highly creative or
voice-driven (it will flatten), highly technical (it doesn't understand your jargon),
or legally sensitive (use a lawyer, not an AI, for contracts). Treat it as a tireless
proofreader, not as a ghost-writer.</p>
""",
        "further": [
            {"label": "Grammarly home", "url": "https://www.grammarly.com"},
            {"label": "Grammarly support", "url": "https://support.grammarly.com"},
        ],
    },

    # =====================================================================
    # WEEK 6 — COLLEGE STUDENT TOOLKIT  (strictly no ChatGPT)
    # =====================================================================
    {
        "num": 25,
        "tool": "MathGPT",
        "focus": "A math solver that shows its work, not just the answer.",
        "url": "https://www.mathgptpro.com",
        "tagline": "An AI that can read a math problem from a photo and walk you through it step by step.",
        "pills": ["~30 min", "Free tier generous", "Paid: $9.99/mo"],
        "vignette": (
            "It is 11 pm. You have a calculus problem set due at midnight. Problem 7 has "
            "you stuck \u2014 a chain-rule derivative that somehow is not coming out right. "
            "Your tutor is asleep. Your TA's office hours were yesterday. The generic chatbot "
            "would confidently give you an answer you cannot verify. What you actually need "
            "is to see the work, step by step, so you can learn the move that was eluding you."
        ),
        "why_html": """
<p>
  <strong>MathGPT is an AI built specifically for mathematics \u2014 with a renderer for
  mathematical notation, a solver that shows intermediate steps, and an explanation engine
  that describes <em>why</em> each step follows.</strong> Unlike a general chatbot that
  will happily produce plausible-looking but sometimes wrong derivations, MathGPT is tuned
  on the kind of step-by-step work that actually helps a student learn.
</p>
<p>
  Three features matter most. First, the <em>photo input</em>: take a picture of a
  hand-written or textbook problem with your phone, and MathGPT parses the notation and
  solves it. Second, the <em>step-by-step explanations</em>: every move is justified with
  one or two sentences of prose, not just symbolic manipulation. Third, the <em>&ldquo;ask
  a follow-up&rdquo;</em> interaction: if step 4 confuses you, ask &ldquo;why did you
  multiply by the conjugate here?&rdquo; and get a targeted explanation.
</p>
<p>
  If you are a college student taking math, physics, engineering, economics, statistics, or
  any quantitative major, MathGPT is not a shortcut around learning \u2014 it is a
  patient, 24/7 tutor that shows you the <em>reasoning path</em> you were supposed to
  absorb in lecture. The distinction matters ethically and practically: used to check your
  work and understand what you got wrong, it makes you a stronger student; used to copy
  answers into a problem set, it makes you a weaker one. Same tool, opposite outcomes.
</p>
""",
        "setup_html": """
<p><strong>Account:</strong> sign up at mathgptpro.com with Google or email. The free
tier handles a meaningful volume of problems daily; Pro ($9.99/mo) removes limits and
unlocks priority model access. Most undergraduates find the free tier sufficient.</p>
<p><strong>What works:</strong> algebra, precalculus, calculus (single- and multi-
variable), linear algebra, differential equations, discrete math, probability, basic
statistics, and a lot of engineering coursework. It struggles on very open-ended proofs,
graduate-level abstract algebra, and anything requiring visual geometric intuition
beyond what a typed problem conveys.</p>
<p><strong>Ethical prerequisite:</strong> read your course's AI policy before you use any
AI on graded work. Many professors allow AI for practice and understanding; many forbid
it on problem sets and exams. &ldquo;I didn't know&rdquo; is not a defense when a policy
is on the syllabus.</p>
""",
        "walkthrough": [
            {
                "title": "Start with a problem you already know the answer to",
                "body": (
                    "Before you trust MathGPT with a problem you're stuck on, test it with one "
                    "you can verify. Pick a problem from a previous assignment you got right. "
                    "Type or photograph it into MathGPT. Compare the steps to your own work. "
                    "Did it match? Where did its presentation differ from yours?"
                ),
            },
            {
                "title": "Now use it on a problem you're stuck on",
                "body": (
                    "Photograph or type the problem. Ask not just for the answer but for the "
                    "<em>full working</em>. Read each step carefully. Stop at any step you "
                    "don't understand."
                ),
            },
            {
                "title": "Ask follow-up questions at stuck points",
                "body": (
                    "When a step confuses you, use the chat to ask: <em>&ldquo;Why did you "
                    "substitute u here instead of directly integrating?&rdquo;</em> or "
                    "<em>&ldquo;What's the intuition for taking the conjugate on both "
                    "sides?&rdquo;</em> The answers are often where the real learning "
                    "happens. This is the difference between checking an answer and being "
                    "tutored."
                ),
            },
            {
                "title": "Redo the problem by hand without looking",
                "body": (
                    "Close the MathGPT tab. On a fresh sheet of paper, redo the problem "
                    "from scratch. This is the step most students skip and it is the step "
                    "that creates learning. If you can reproduce the work independently, "
                    "you learned something. If you can't, go back and ask more follow-ups."
                ),
            },
            {
                "title": "Generate practice variants",
                "body": (
                    "Ask MathGPT: <em>&ldquo;Give me three similar problems with different "
                    "numbers, from easier to harder, to help me practice this technique.&rdquo;</em> "
                    "It generates a mini problem set. Do them by hand. Check against "
                    "MathGPT's solutions. This is how you convert &ldquo;I understood that "
                    "one problem&rdquo; into &ldquo;I own this technique.&rdquo;"
                ),
            },
            {
                "title": "Save your debugging log",
                "body": (
                    "Over a semester, keep a running doc of problems you had to ask MathGPT "
                    "for help on, along with the specific step that tripped you. Before an "
                    "exam, review that doc. You're studying your actual weaknesses, not "
                    "the generic chapter summary."
                ),
            },
        ],
        "ex_basic": {
            "title": "Basic: A real problem you're stuck on",
            "meta": ["~25 min", "Level: Beginner"],
            "body": (
                "<p>Pick one problem from your current coursework that you're stuck on. "
                "Photograph or type it into MathGPT. Read the full solution with intent. "
                "Ask at least one follow-up question at the step that was unclear.</p>"
                "<p>Then close the tab and redo the problem on paper. If you can, you've "
                "converted an unsolved homework problem into an understood technique. If "
                "you can't, go ask more questions.</p>"
            ),
        },
        "ex_advanced": {
            "title": "Advanced: Build a weekly review habit",
            "meta": ["~60 min/week", "Level: Advanced"],
            "body": (
                "<p>For the next four weeks, every Sunday, do a 60-minute MathGPT review "
                "session. Pick five problems you either got wrong, guessed at, or found "
                "hard on the week's problem sets. For each:</p>"
                "<ol><li>Redo the problem on paper without looking at your original attempt.</li>"
                "<li>If stuck, ask MathGPT for the <em>full working</em> + <em>the "
                "intuition in two sentences</em>.</li>"
                "<li>Write a one-line note for yourself: <em>&ldquo;Remember: when the "
                "integrand has a trig function times a polynomial, try integration by "
                "parts first.&rdquo;</em></li>"
                "<li>Generate one variant and solve it independently.</li></ol>"
                "<p>At the end of four weeks, review the one-line notes. You have built "
                "a personalized cheat sheet of the techniques that your specific brain "
                "needs to practice. This is how top students actually use AI \u2014 as a "
                "mirror for their own weaknesses, not as a replacement for their own work.</p>"
            ),
        },
        "pitfalls": [
            "<p><strong>It can still be wrong.</strong> MathGPT is much more reliable on "
            "routine undergraduate math than a generic chatbot, but on tricky edge cases "
            "(piecewise functions, limits that require L'H\u00f4pital's iteratively, "
            "unusual boundary conditions) it still errs. Always cross-check: does the "
            "answer have the right units? The right sign? The right behavior at the "
            "boundary values?</p>",
            "<p><strong>Using it to skip learning catches up with you on exams.</strong> "
            "The problem sets are graded; the midterm is, too. If you farm your problem "
            "sets to MathGPT without understanding the moves, the first exam will be the "
            "moment the gap becomes visible. By then it's too late. Use MathGPT to "
            "<em>close</em> gaps; never to <em>hide</em> them.</p>",
            "<p><strong>Know your course's policy.</strong> Some instructors allow AI for "
            "unlimited use; some ban it outright; most have a middle policy (allowed for "
            "understanding, forbidden for graded work). Find out early in the semester. "
            "Violating the policy, even accidentally, is an academic-integrity matter.</p>",
        ],
        "compare_html": """
<p>
  MathGPT competes most directly with <strong>Wolfram Alpha</strong> (computes answers
  cleanly but explains less pedagogically), <strong>Photomath</strong> (mobile-first,
  excellent on photographed problems, narrower subject range), <strong>Symbolab</strong>
  (strong step-by-step for algebra and calculus, weaker on explanation), and
  <strong>Sizzle AI</strong> (Day 26, which covers more STEM subjects but less depth per
  problem). For pure math homework with a tutor-style explanation layer, MathGPT is the
  current strongest fit. For raw computational answers (<em>what is the determinant of
  this 4x4 matrix?</em>), Wolfram Alpha is more authoritative. For physics and chemistry
  together with math, Sizzle is broader.
</p>
""",
        "when_to_use": """
<p><strong>Use MathGPT when</strong> you are learning a technique, checking your own
work, debugging a persistent error, or reviewing before an exam. It is the right tool
whenever the goal is for <em>you</em> to understand something new.</p>
<p><strong>Do not use MathGPT when</strong> your course forbids AI assistance on the
specific work (check the syllabus), during a closed-book exam (obviously), or as a
substitute for actually doing practice problems yourself. AI-assisted understanding
without independent practice creates the illusion of competence; exams reveal the
truth.</p>
""",
        "further": [
            {"label": "MathGPT home", "url": "https://www.mathgptpro.com"},
            {"label": "Wolfram Alpha (complement)", "url": "https://www.wolframalpha.com"},
        ],
    },
    {
        "num": 26,
        "tool": "Sizzle AI",
        "focus": "A Socratic tutor that walks you through STEM problems at your pace.",
        "url": "https://www.sizzle.ai",
        "tagline": "Not a solver \u2014 a tutor. Shows you how to think, not just what to write.",
        "pills": ["~30 min", "Free tier generous", "Paid: Sizzle Pro available"],
        "vignette": (
            "You finally ask the chemistry problem aloud to yourself: &ldquo;What even is "
            "this reaction doing?&rdquo; You don't need the answer \u2014 you need someone "
            "to say &ldquo;OK, first, what functional group are you looking at? Good. What "
            "does that functional group typically do in the presence of a strong base?&rdquo; "
            "You need a patient partner with a whiteboard. You need Sizzle."
        ),
        "why_html": """
<p>
  <strong>Sizzle AI is a tutor, not a solver.</strong> Where MathGPT (Day 25) gives you
  a complete step-by-step solution, Sizzle uses a Socratic method: it asks guiding
  questions, waits for your response, corrects your thinking in real time, and only
  provides answers when you're truly stuck. It covers math (K\u201312 through early
  college), science (chemistry, physics, biology), writing feedback, and homework help
  across subjects.
</p>
<p>
  The product design reflects a specific pedagogical opinion: students learn more when
  they <em>generate</em> the answer than when they <em>receive</em> it. Sizzle's
  interface enforces this \u2014 it prompts you to take the next step; if you type
  &ldquo;I don't know,&rdquo; it breaks the problem into smaller pieces and asks an
  easier question until you can respond. Then it builds back up.
</p>
<p>
  For college students, Sizzle is the complement to MathGPT: MathGPT for the moments
  when you need to see a complete worked example and dissect it, Sizzle for the moments
  when you need to <em>practice the thinking motion</em>. The two together approximate a
  study partner who is equally comfortable explaining a proof and asking you tough
  questions about it.
</p>
""",
        "setup_html": """
<p><strong>Account:</strong> sizzle.ai lets you start without an account; sign-up
(Google or email) unlocks history and progress features. The free tier is generous for
student use; paid tiers add features for teachers and parents.</p>
<p><strong>What works:</strong> problems with a clear right answer in math, chemistry,
physics, and biology. Sizzle shines on conceptual problems where the struggle is in the
setup, not the arithmetic. It is weaker on open-ended essay questions and on problems
requiring external data or graphs.</p>
""",
        "walkthrough": [
            {
                "title": "Describe what you're working on",
                "body": (
                    "At sizzle.ai, describe the subject and the type of problem: <em>&ldquo;I'm "
                    "working on a mechanism problem in organic chemistry \u2014 SN1 vs "
                    "SN2.&rdquo;</em> Sizzle calibrates its explanation level to the course you "
                    "name."
                ),
            },
            {
                "title": "Paste or photograph the problem",
                "body": (
                    "Provide the specific problem. Sizzle will typically <em>not</em> "
                    "immediately solve it. Instead, it asks a question about your current "
                    "understanding or the first step."
                ),
            },
            {
                "title": "Answer the question honestly",
                "body": (
                    "This is the counterintuitive move. Don't bluff. If Sizzle asks &ldquo;what "
                    "functional group is the substrate?&rdquo; and you aren't sure, type "
                    "<em>&ldquo;I'm not sure \u2014 is it an alcohol?&rdquo;</em> Sizzle will "
                    "correct and explain. The interaction only works when you actually "
                    "engage."
                ),
            },
            {
                "title": "Work through in small steps",
                "body": (
                    "Sizzle breaks problems into chunks. Each chunk is a small, answerable "
                    "question. You respond; Sizzle responds; you advance. The cumulative "
                    "effect is that by the end, you've <em>walked</em> the solution, not "
                    "read it."
                ),
            },
            {
                "title": "Ask for the big-picture pattern",
                "body": (
                    "Once you've worked through a problem, ask: <em>&ldquo;What's the general "
                    "strategy for recognizing when to use SN1 versus SN2?&rdquo;</em> Sizzle "
                    "will give you a concise decision heuristic. Save this. It is the "
                    "transferable insight, not the specific answer."
                ),
            },
            {
                "title": "Use the practice-generator",
                "body": (
                    "After any completed problem, ask: <em>&ldquo;Give me three practice "
                    "problems on the same concept, increasing in difficulty.&rdquo;</em> "
                    "Work them independently. Return to Sizzle only if you get stuck. The "
                    "practice-generator is the single feature that most effectively turns a "
                    "tutoring session into durable learning."
                ),
            },
        ],
        "ex_basic": {
            "title": "Basic: One tutored problem \u2014 engage fully",
            "meta": ["~30 min", "Level: Beginner"],
            "body": (
                "<p>Pick one problem from current coursework in math, physics, chemistry, or "
                "biology that you find conceptually challenging. Work it through Sizzle, "
                "engaging honestly with every prompt \u2014 even when Sizzle asks what feels "
                "like an obvious question. Answer even when you're not sure.</p>"
                "<p>At the end, note: which question in the chain was the key one? Where did "
                "your understanding click? That moment is what Sizzle sells.</p>"
            ),
        },
        "ex_advanced": {
            "title": "Advanced: A full study-session workflow",
            "meta": ["~2 hours", "Level: Advanced"],
            "body": (
                "<p>Pick one chapter or topic from a class you're currently taking. Design a "
                "2-hour study session with Sizzle as the tutoring core:</p>"
                "<ol>"
                "<li><strong>Warm-up (15 min):</strong> ask Sizzle to quiz you on the key "
                "definitions and concepts of the chapter. Answer honestly.</li>"
                "<li><strong>Concept problems (45 min):</strong> work three conceptual "
                "problems through Sizzle, engaging at every step.</li>"
                "<li><strong>Independent practice (45 min):</strong> work five problems "
                "Sizzle generates, completely on your own. Don't ask for help until you're "
                "stuck for at least 5 minutes.</li>"
                "<li><strong>Review (15 min):</strong> ask Sizzle for a one-page summary of "
                "the decision heuristics for this topic.</li>"
                "</ol>"
                "<p>Write a 200-word reflection: which stage of the session taught you the "
                "most? Where did you rush past something you should have lingered on? "
                "Design your next study session with those lessons in mind.</p>"
            ),
        },
        "pitfalls": [
            "<p><strong>It will be slower than just getting the answer.</strong> That is the "
            "feature, not a bug. A Sizzle session on one problem can take 20 minutes "
            "where MathGPT would take 2. But the learning density per minute is much "
            "higher. If you keep catching yourself wanting to skip ahead, you are "
            "confirming that Sizzle is doing its job \u2014 keep going.</p>",
            "<p><strong>You have to engage or it's pointless.</strong> If you type &ldquo;I "
            "don't know&rdquo; to every prompt without actually trying, Sizzle eventually "
            "gives you more of the answer, but you learned nothing. The tool assumes good-"
            "faith participation. No automation can replace effort.</p>",
            "<p><strong>Not every question needs a tutor.</strong> For quick definitional "
            "questions (<em>what's the unit of electric charge?</em>), Sizzle's Socratic "
            "method is overkill \u2014 just look it up. Reserve Sizzle for problems where "
            "the <em>reasoning</em> is what you're learning.</p>",
        ],
        "compare_html": """
<p>
  Sizzle's closest peers are <strong>Khanmigo</strong> (Khan Academy's AI tutor, strong
  on K\u201312 topics and tightly integrated with Khan's curriculum), <strong>Socratic by
  Google</strong> (free, photo-input, mobile-first, less conversational), and
  <strong>Photomath</strong> (math-only, shortest path from photo to answer). Sizzle's
  edge is the breadth of STEM coverage plus the genuinely Socratic interaction design;
  Khanmigo is the pick for students who are already living in Khan Academy's ecosystem.
  MathGPT (Day 25) is complementary rather than competitive: use MathGPT to see a solved
  example cleanly, then use Sizzle to practice generating similar reasoning yourself.
</p>
""",
        "when_to_use": """
<p><strong>Use Sizzle when</strong> you want to actively learn a technique, when you
have time to think rather than just to copy, or when a concept has felt slippery and you
suspect you're missing the intuition. It is the tool that turns a 20-minute study block
into a 20-minute tutoring session.</p>
<p><strong>Do not use Sizzle when</strong> you need a quick factual lookup, during a
timed exam (its cadence assumes you have time), or when the problem is so far from your
current level that you cannot engage meaningfully with the first prompt \u2014 in that
case, review the underlying concept first, then return.</p>
""",
        "further": [
            {"label": "Sizzle AI home", "url": "https://www.sizzle.ai"},
            {"label": "Khanmigo (alternative)", "url": "https://www.khanmigo.ai"},
        ],
    },
    {
        "num": 27,
        "tool": "QuillBot",
        "focus": "The writing workshop that runs inside your essay.",
        "url": "https://quillbot.com",
        "tagline": "Paraphrase, grammar-check, cite, summarize, detect AI text \u2014 all in one suite.",
        "pills": ["~30 min", "Free tier usable", "Paid: $9.95\u201319.95/mo"],
        "vignette": (
            "You have a 2,000-word essay due tomorrow at 9 am. You have written 1,400 "
            "words. You're reading the draft and noticing: a paragraph that repeats the "
            "same construction three times, a sentence that sounds awkward but you can't "
            "fix, a source quote that needs a proper citation you haven't generated yet. "
            "You need a writing toolkit, not another chatbot."
        ),
        "why_html": """
<p>
  <strong>QuillBot is the most widely-used AI writing suite among college students, and
  for reasons that reward a serious look.</strong> It combines six tools that are
  individually useful and together cover most of a student writer's needs: a paraphraser,
  a grammar checker, a summarizer, an AI detector, a plagiarism checker, and a citation
  generator. Each is competitive with or better than dedicated single-purpose tools; the
  combination in one suite is the product.
</p>
<p>
  The paraphraser is the feature everyone knows. It rewrites a sentence or paragraph in
  several different styles (Standard, Fluent, Formal, Academic, Simple, Creative, Shorten,
  Expand). Used well, it is a vocabulary teacher: you see five different ways to express
  an idea and internalize the range of options. Used poorly, it is a tool for laundering
  someone else's writing through a synonym engine \u2014 which is academic misconduct in
  most institutions.
</p>
<p>
  For college students specifically, QuillBot pays off on <em>every</em> essay. The
  grammar check catches the mistakes you stopped noticing. The summarizer gives you a
  quick recap of source articles before you cite them. The citation generator formats
  references in APA, MLA, Chicago, IEEE, and AMA automatically. The plagiarism checker
  catches sources you forgot to cite before your professor does. And the AI detector
  \u2014 well, we'll get to that in the pitfalls.
</p>
""",
        "setup_html": """
<p><strong>Account:</strong> quillbot.com free tier is genuinely usable: paraphrasing up
to 125 words per operation, all six tools accessible. Premium ($9.95/mo annualized)
removes the word cap and unlocks advanced modes. Most undergraduates can do serious work
on the free tier.</p>
<p><strong>Install the browser extension:</strong> Chrome/Firefox/Edge extension brings
QuillBot into Gmail, Google Docs, LinkedIn, and any text field. The extension is the
reason regular QuillBot users develop the habit of using it continuously.</p>
<p><strong>Ethical prerequisite:</strong> paraphrasing someone else's writing to avoid
citation is plagiarism; paraphrasing your own writing to improve clarity is editing.
These are the same action performed on different sources. Know the difference in your
own work.</p>
""",
        "walkthrough": [
            {
                "title": "Paraphrase a sentence you wrote yourself",
                "body": (
                    "Go to quillbot.com. In the Paraphraser, paste a sentence from your own "
                    "current essay that feels awkward. Cycle through the paraphrase modes: "
                    "Standard, Fluent, Formal, Academic. Notice how the meaning stays constant "
                    "while register shifts. Pick the version closest to what you meant, then "
                    "<em>edit it into your own voice</em> \u2014 don't copy it verbatim."
                ),
            },
            {
                "title": "Run the grammar checker on a paragraph",
                "body": (
                    "Switch to Grammar Checker. Paste a paragraph. QuillBot flags issues "
                    "inline with suggested fixes. Accept or reject each \u2014 learn the "
                    "rules behind the suggestions, not just the corrections. Recurring "
                    "error types tell you where your writing habits need practice."
                ),
            },
            {
                "title": "Summarize a source before citing it",
                "body": (
                    "Paste the text of an article or journal excerpt into the Summarizer. "
                    "Get a 3-5 bullet summary. Use it to verify you understood the source "
                    "before you cite it in your own writing. This is the habit that prevents "
                    "the subtle misreading of sources that shows up in graded drafts."
                ),
            },
            {
                "title": "Generate a citation from a URL or DOI",
                "body": (
                    "Open the Citation Generator. Paste a URL, DOI, or ISBN. Pick the style "
                    "your class requires (APA 7th, MLA 9th, Chicago, IEEE, etc.). QuillBot "
                    "fills in the fields and outputs a properly formatted citation. Copy "
                    "into your references section. Double-check dates and author names \u2014 "
                    "automation is not yet perfect on edge cases."
                ),
            },
            {
                "title": "Use the plagiarism check on your finished draft",
                "body": (
                    "Before submitting, paste your finished essay into the Plagiarism Checker. "
                    "It flags any passages matching existing sources. In most cases the "
                    "flags are false positives (common phrases, cited quotes) \u2014 but "
                    "occasionally it catches a sentence you paraphrased too closely from a "
                    "source and forgot to cite. Fix these before the professor sees them."
                ),
            },
            {
                "title": "Install the extension for ambient help",
                "body": (
                    "Install the browser extension. Open Gmail or Google Docs. Start writing. "
                    "QuillBot underlines errors and offers paraphrase options inline as you "
                    "type. For routine writing, this is where the tool earns its keep \u2014 "
                    "dozens of small improvements across every piece of writing you do."
                ),
            },
        ],
        "ex_basic": {
            "title": "Basic: Run a real essay through QuillBot",
            "meta": ["~30 min", "Level: Beginner"],
            "body": (
                "<p>Pick an essay you're currently working on or recently submitted. Run it "
                "through three QuillBot tools in sequence: (1) Grammar Checker on the whole "
                "essay, (2) Paraphraser on three sentences you thought were awkward, "
                "(3) Plagiarism Checker on the full text.</p>"
                "<p>List the three most useful changes you made. Which tool contributed "
                "each one? That map tells you where QuillBot is most valuable in your "
                "writing process.</p>"
            ),
        },
        "ex_advanced": {
            "title": "Advanced: A full writing workflow for a term paper",
            "meta": ["~3 hours + across a week", "Level: Advanced"],
            "body": (
                "<p>Build a repeatable workflow for every significant essay you write this "
                "semester. Design it across three phases:</p>"
                "<ol>"
                "<li><strong>Research phase:</strong> for every source you plan to cite, "
                "paste its text into QuillBot's Summarizer and keep the summary in your "
                "notes. This is your &ldquo;did I actually understand this?&rdquo; check. "
                "Generate the citation at the same time using the Citation Generator; save "
                "it to your references.</li>"
                "<li><strong>Drafting phase:</strong> write normally. When a sentence feels "
                "stuck, use the Paraphraser on your own draft sentence \u2014 not on a "
                "source \u2014 to see alternative phrasings. Pick one, edit into your voice.</li>"
                "<li><strong>Revision phase:</strong> Grammar Checker on the full draft; "
                "Plagiarism Checker before submission; AI Detector to verify your own "
                "writing reads as human (useful for institutions using Turnitin AI "
                "detection).</li>"
                "</ol>"
                "<p>Apply this workflow to your next term paper. Track your time: which "
                "phase saved the most time, and which improved quality the most? Write a "
                "250-word workflow document for future-you.</p>"
            ),
        },
        "pitfalls": [
            "<p><strong>Paraphrasing a source \u2260 citing it.</strong> Running a "
            "paragraph from an article through QuillBot's Paraphraser and pasting the "
            "output into your essay without citation is plagiarism, full stop \u2014 "
            "regardless of how different the final words look. The ideas are still the "
            "author's. Cite the source.</p>",
            "<p><strong>AI detectors are not reliable.</strong> QuillBot includes an AI "
            "detector, and Turnitin (used by most universities) has one too. Both produce "
            "false positives on sophisticated human writing and false negatives on "
            "AI-generated text that was edited by a human. If you are accused of using AI "
            "based on a detector, ask your instructor for the specific evidence and be "
            "prepared to discuss your process. Keep drafts and timestamps.</p>",
            "<p><strong>Over-paraphrasing flattens your voice.</strong> If every sentence "
            "in your essay has been cycled through QuillBot, the result reads oddly "
            "homogenous \u2014 recognizable to graders as the &ldquo;QuillBot voice.&rdquo; "
            "Use paraphrasing surgically, on specific awkward sentences, not as a "
            "whole-draft pass.</p>",
        ],
        "compare_html": """
<p>
  QuillBot competes with <strong>Grammarly</strong> (Day 24; stronger grammar and tone,
  weaker paraphrasing, more expensive), <strong>Wordtune</strong> (paraphrasing focus,
  similar quality to QuillBot, narrower scope), <strong>Scribbr</strong> (stronger
  academic focus, best citation generator, less integrated), and <strong>Hemingway
  Editor</strong> (free, simpler, readability-focused only). The trade-off: Grammarly
  is the better writing companion inside your normal apps; QuillBot is the better
  academic-writing workshop for essays and papers. Most students on a budget go with
  QuillBot; students with institutional Grammarly access use both.
</p>
""",
        "when_to_use": """
<p><strong>Use QuillBot when</strong> you are writing academic essays, research papers,
or long-form structured writing that needs grammar review, citation management, and
paraphrasing-as-editing. Particularly valuable for non-native English writers and
students writing in fields with strict citation conventions.</p>
<p><strong>Do not use QuillBot when</strong> the assignment specifically forbids AI
assistance (check the syllabus), when you are tempted to paraphrase a source instead of
citing it, or when your own voice matters more than polish (personal essays, creative
writing, application essays).</p>
""",
        "further": [
            {"label": "QuillBot home", "url": "https://quillbot.com"},
            {"label": "QuillBot academic writing guide", "url": "https://quillbot.com/blog"},
        ],
    },
    {
        "num": 28,
        "tool": "SciSpace",
        "focus": "An AI that reads academic papers with you, one paragraph at a time.",
        "url": "https://scispace.com",
        "tagline": "Highlight a sentence; get an explanation. Ask a question; get an answer grounded in the paper.",
        "pills": ["~40 min", "Free tier usable", "Paid: $12/mo"],
        "vignette": (
            "Your professor assigned a 28-page paper with four equations, two experimental "
            "protocols, and a paragraph of statistics that reads like a different language. "
            "You need to understand it for Thursday's seminar discussion. You also need to "
            "eat, sleep, and finish other classes. Traditional approach: three hours with "
            "a dictionary of terms. Modern approach: three hours with SciSpace, reading "
            "two to three times deeper, in about a third of the time."
        ),
        "why_html": """
<p>
  <strong>SciSpace (formerly Typeset) is an AI reading assistant built specifically for
  academic papers.</strong> You upload a PDF (or search its 270+ million-paper library);
  SciSpace opens it in an enhanced reader with an AI copilot pane alongside. Highlight
  any sentence or paragraph and SciSpace explains it in plain English, grounded in the
  paper's context. Ask follow-up questions and it answers from the paper itself, not
  from general web knowledge.
</p>
<p>
  Three features matter most for student use. First, the <em>explain highlighted text</em>
  feature \u2014 you never have to open a separate search tab to look up a term, because
  a one-click explanation appears inline. Second, the <em>ask a question</em> feature,
  where SciSpace answers &ldquo;what methodology did the authors use?&rdquo; or
  &ldquo;what were the main findings?&rdquo; with paragraph-level citations back to the
  source. Third, the <em>find related papers</em> feature, which suggests other papers
  on the same topic with links \u2014 particularly useful when a single paper becomes
  the entry point to a whole subfield.
</p>
<p>
  SciSpace is complementary to Elicit (Day 3 in Week 1). Elicit is the tool for searching
  across many papers; SciSpace is the tool for reading <em>one</em> paper deeply. Serious
  academic work uses both \u2014 Elicit to build your reading list and extract high-level
  data, SciSpace to actually understand each paper once it's on your desk.
</p>
""",
        "setup_html": """
<p><strong>Account:</strong> scispace.com free tier allows limited uploads and copilot
interactions per month \u2014 enough for one serious reading session per week. Premium
($12/mo annualized) removes limits and unlocks deeper features (full-text search across
all your uploaded papers, longer conversations, faster processing).</p>
<p><strong>Source material:</strong> SciSpace works on PDF uploads, papers from its
library (search by title or DOI), and arXiv/ssrn/PubMed links. It works best on papers
with clean typesetting; scanned-image PDFs need to be OCR'd first.</p>
""",
        "walkthrough": [
            {
                "title": "Upload or search for a paper",
                "body": (
                    "At scispace.com, upload the PDF of a paper assigned in one of your "
                    "classes, or search the library by title. SciSpace opens the paper in "
                    "a two-pane reader: the paper on the left, the AI copilot on the right."
                ),
            },
            {
                "title": "Get the copilot's overview",
                "body": (
                    "In the copilot pane, ask: <em>&ldquo;In 200 words, what is this paper "
                    "about and why does it matter?&rdquo;</em> The answer is grounded in "
                    "the paper's abstract and introduction. This orientation makes the "
                    "rest of your reading substantially more productive."
                ),
            },
            {
                "title": "Highlight to explain",
                "body": (
                    "As you read, highlight sentences that confuse you. SciSpace offers "
                    "<strong>Explain</strong> in the highlight menu. Click. The copilot "
                    "explains the highlighted text in context \u2014 referencing what "
                    "came before, defining jargon, unpacking equations. This is the feature "
                    "you'll use most."
                ),
            },
            {
                "title": "Ask structured questions",
                "body": (
                    "Use the copilot to ask the questions your professor will expect you "
                    "to answer in discussion: <em>&ldquo;What methodology did they use? "
                    "What were the main findings? What are the key limitations the authors "
                    "acknowledge? What questions does this paper leave unanswered?&rdquo;</em> "
                    "Each answer cites paragraphs you can verify yourself."
                ),
            },
            {
                "title": "Use Find Related Papers",
                "body": (
                    "Click <strong>Related Papers</strong> in the copilot. SciSpace "
                    "suggests 5\u201310 papers on similar topics with brief descriptions. "
                    "For a research paper or thesis, this is how you build a literature "
                    "map from a single entry point. Open 2\u20133 of the suggested papers "
                    "and repeat the process."
                ),
            },
            {
                "title": "Take your own structured notes",
                "body": (
                    "After finishing, write your own 200-word summary of the paper \u2014 "
                    "without looking at SciSpace's explanations. Then compare. Where did "
                    "your version and SciSpace's diverge? Those divergences are where your "
                    "understanding is still forming. The act of writing your own summary "
                    "is what moves knowledge from &ldquo;I read that&rdquo; to &ldquo;I "
                    "know that.&rdquo;"
                ),
            },
        ],
        "ex_basic": {
            "title": "Basic: Read one assigned paper with SciSpace",
            "meta": ["~90 min", "Level: Beginner"],
            "body": (
                "<p>Pick one paper assigned in a current class. Upload to SciSpace. Use "
                "the copilot for overview, inline explanations, and the standard seminar "
                "questions (methodology, findings, limitations). Finish by writing your "
                "own 200-word summary from memory.</p>"
                "<p>Bring the summary to class discussion. Notice: did you understand the "
                "paper more deeply than usual? Did you contribute more confidently? That's "
                "the change SciSpace can make to your semester.</p>"
            ),
        },
        "ex_advanced": {
            "title": "Advanced: Build a literature-review notebook",
            "meta": ["~5 hours across a week", "Level: Advanced"],
            "body": (
                "<p>Pick a research question you genuinely care about \u2014 a thesis topic, "
                "a term paper, a topic you're considering for graduate school. Spend a week "
                "building a proper literature-review notebook:</p>"
                "<ol>"
                "<li>Use <strong>Elicit</strong> (Day 3) to find 10\u201315 relevant papers.</li>"
                "<li>Upload each to <strong>SciSpace</strong>.</li>"
                "<li>For each paper, run your standard question set (overview, methodology, "
                "findings, limitations) and copy the grounded answers into a Notion or "
                "Google Docs notebook, with the citation from QuillBot's (Day 27) "
                "Citation Generator.</li>"
                "<li>After all 10\u201315 papers are processed, read your own notebook end-"
                "to-end and write a 500-word synthesis: <em>what does the literature "
                "actually say about your question? where do studies converge? where do "
                "they disagree? what's missing?</em></li>"
                "</ol>"
                "<p>You now have the skeleton of a real literature review \u2014 produced "
                "in a week rather than a month, and built on primary sources you have "
                "genuinely read. This is the workflow that separates students who thrive "
                "in research from students who struggle.</p>"
            ),
        },
        "pitfalls": [
            "<p><strong>It explains, it does not interpret.</strong> SciSpace can tell you "
            "<em>what</em> a paper says; it cannot tell you whether the paper's argument "
            "is sound. Critical evaluation \u2014 &ldquo;is this methodology appropriate? "
            "Are the authors over-claiming? Is the sample biased?&rdquo; \u2014 is still "
            "your job. Do not mistake comprehension for critique.</p>",
            "<p><strong>Paragraph-level citations can be misleading.</strong> SciSpace "
            "links to the paragraph it derived an answer from; occasionally it mis-attributes "
            "an idea the paper cites from elsewhere as if it were the paper's own claim. "
            "For any citation you will use in your own writing, trace it back to the "
            "primary source.</p>",
            "<p><strong>Not a substitute for close reading on seminal papers.</strong> For "
            "the 2\u20133 papers that will actually define your thinking \u2014 your "
            "thesis's foundational references, a field's landmark study \u2014 read them "
            "yourself, line by line, with SciSpace as a jargon-dictionary rather than as "
            "the primary reading surface. Depth of engagement matters more than efficiency "
            "on papers that shape your intellectual life.</p>",
        ],
        "compare_html": """
<p>
  SciSpace's closest competitors are <strong>Elicit</strong> (Day 3; structured extraction
  across many papers, weaker single-paper deep reading), <strong>Consensus</strong> (Day
  4; yes/no empirical questions across the literature), <strong>ResearchRabbit</strong>
  (discovery and citation-graph navigation, less in-depth reading), <strong>Explainpaper</strong>
  (simpler interface, less integrated feature set), and <strong>ChatPDF</strong> (general-
  purpose PDF chat, lacks academic-paper features like related-papers discovery). For
  reading one paper deeply with AI support, SciSpace is currently the strongest; for
  structured cross-paper work, Elicit remains better.
</p>
""",
        "when_to_use": """
<p><strong>Use SciSpace when</strong> you have been assigned a difficult academic paper
and want to understand it more deeply in less time. Also ideal for building a literature
review, exploring a new subfield, or preparing for seminar discussions where you need to
say something substantive.</p>
<p><strong>Do not use SciSpace when</strong> the paper is one you should be reading
closely as a learning exercise in critical reading itself (some seminars exist to teach
you that skill; AI shortcuts defeat the purpose), or when you need to cite exact wording
from the source (always verify against the original PDF, not the copilot's paraphrase).</p>
""",
        "further": [
            {"label": "SciSpace home", "url": "https://scispace.com"},
            {"label": "SciSpace blog \u2014 research tips", "url": "https://scispace.com/resources"},
        ],
    },

    # =====================================================================
    # WEEK 7 — CAPSTONE & CERTIFICATE
    # =====================================================================
    {
        "num": 29,
        "tool": "Capstone Project",
        "focus": "One real project. At least three tools from this course. Chained into a workflow.",
        "url": "",
        "tagline": "The point of learning 26 tools is knowing how to chain them. Today you prove you can.",
        "pills": ["~3\u20136 hours", "Real deliverable", "Portfolio-worthy"],
        "vignette": (
            "Everything you have learned over the last 28 days sits in your head now as "
            "individual tools. The skill that actually matters \u2014 the skill that "
            "distinguishes someone who knows AI from someone who is <em>using</em> AI \u2014 "
            "is knowing which tool to reach for at which moment, and how to chain them so "
            "the output of one feeds cleanly into the next. That skill cannot be taught. "
            "It can only be practiced. Today is the practice."
        ),
        "why_html": """
<p>
  <strong>The capstone is not a finale; it is the exam.</strong> Not an exam of recall,
  but of judgment. You have 26 tools available. Your job is to pick a real project you
  need to ship, identify where each tool fits in the workflow, execute the chain, and
  ship the result. The judgment \u2014 which tool, which moment, how to hand off output
  from one to the next \u2014 is the skill the whole course has been building toward.
</p>
<p>
  The specific project does not matter. What matters is that it is <em>real</em>: a
  presentation you actually need for Friday, a research memo your work actually wants, a
  video for a channel you actually post to, a mini-app for a problem you actually have. A
  made-up capstone produces a made-up workflow. A real capstone produces a workflow you
  will use again next week.
</p>
<p>
  The one rule: use at least three distinct tools from the course, and design the chain
  so that the output of one tool becomes the input of the next. This constraint forces you
  past the &ldquo;one tool, one task&rdquo; habit and into the <em>compose</em> habit that
  is what AI-fluent professionals actually do every day. The difference between &ldquo;I
  use AI&rdquo; and &ldquo;I work with AI&rdquo; is the ability to describe your workflow
  as a sequence of deliberate handoffs.
</p>
""",
        "setup_html": """
<p><strong>Pick the project first.</strong> Before you open any tool, spend 10 minutes
deciding what to build. Good capstones have: (1) a real audience or use, (2) a clear
deliverable with a shape (a deck, a paper, a video, a mini-app, a dashboard, a literature
review), and (3) a deadline within the next two weeks. Bad capstones are open-ended
explorations without a shipping moment.</p>
<p><strong>Common capstone shapes from past cohorts:</strong></p>
<ul>
  <li><strong>The Research Brief.</strong> A 2-page memo on a question you actually care
  about, chaining Perplexity Deep Research + NotebookLM + Claude Projects + Gamma for
  the final deck.</li>
  <li><strong>The Explainer Video.</strong> A 3-minute explainer on a concept from your
  field, chaining Claude Projects (script) + ElevenLabs (narration) + Runway (b-roll) +
  Descript (edit) + Captions (final mobile cut).</li>
  <li><strong>The Social-Repurposing Pipeline.</strong> Turn one existing long-form piece
  (a lecture, a podcast, an article) into a month of social content, chaining Otter.ai +
  Opus Clip + Pictory + Captions.</li>
  <li><strong>The Student Research Notebook.</strong> A literature-review notebook on a
  thesis-worthy question, chaining Elicit + SciSpace + QuillBot (citations) + Gamma (final
  presentation).</li>
  <li><strong>The Mini-App Ship.</strong> A small personal tool deployed to a live URL,
  chaining Claude Projects (planning) + Bolt.new (build) + v0 (UI polish) + Cursor
  (custom logic).</li>
</ul>
""",
        "walkthrough": [
            {
                "title": "Decide the shape of the deliverable",
                "body": (
                    "Write one sentence describing what you will produce by the end. "
                    "<em>&ldquo;A 5-minute explainer video about why compound interest is "
                    "the single most important concept in personal finance, posted to "
                    "YouTube by Sunday.&rdquo;</em> Make the sentence concrete enough that "
                    "a stranger could tell you when you're done."
                ),
            },
            {
                "title": "Map the workflow on paper",
                "body": (
                    "Sketch the workflow as a chain: <em>Claude Projects (script) &rarr; "
                    "QuillBot (tighten prose) &rarr; ElevenLabs (narration) &rarr; Runway "
                    "(b-roll generation) &rarr; Descript (edit + captions) &rarr; Captions "
                    "(final vertical cut)</em>. Each arrow is a handoff: what goes from one "
                    "tool to the next, in what format?"
                ),
            },
            {
                "title": "Build an asset bookkeeping doc",
                "body": (
                    "In a Google Doc or Notion page, track every artifact: the script, the "
                    "narration audio file, the generated video clips, the editing project. "
                    "Name files consistently. In a multi-tool workflow, 40% of the friction "
                    "is finding last step's output. Solve it upfront."
                ),
            },
            {
                "title": "Work through each tool in sequence",
                "body": (
                    "Resist the urge to multitask. Do one tool's portion fully before "
                    "moving to the next. Review the output. Fix or regenerate before "
                    "handing off. A clean input to each tool produces a clean output; a "
                    "messy hand-off compounds into disaster three steps later."
                ),
            },
            {
                "title": "Ship it, even if imperfect",
                "body": (
                    "At some point you will be tempted to regenerate the narration one "
                    "more time, re-edit the video once more, tweak the deck just a little. "
                    "Set a cutoff. Ship at 80%. The capstone's value is the <em>completion</em>, "
                    "not the polish. You learn more from shipping a rough one than from "
                    "never shipping a perfect one."
                ),
            },
            {
                "title": "Write a 300-word project retrospective",
                "body": (
                    "After shipping, write a retro: which tools pulled their weight, which "
                    "underdelivered, which handoff was the trickiest, what you will do "
                    "differently next time. This retro is the single most valuable artifact "
                    "of the capstone \u2014 it is the template for every future multi-tool "
                    "project you will run."
                ),
            },
        ],
        "ex_basic": {
            "title": "Basic Capstone: A ship-it-this-week project",
            "meta": ["~3 hours", "Level: Beginner"],
            "body": (
                "<p>Pick a small but real deliverable you need to ship this week. Chain "
                "exactly three tools from the course. Ship it to its intended audience "
                "(even if the audience is just yourself). Write a 200-word retrospective.</p>"
                "<p>Examples: a team update deck (Claude Projects + Gamma + Grammarly); "
                "a 90-second social video from your latest blog post (Pictory + Descript + "
                "Captions); a personalized outreach email batch (Clay + Grammarly + your "
                "email client).</p>"
                "<p>Goal: prove you can run a real chain end-to-end. Time matters less "
                "than completion.</p>"
            ),
        },
        "ex_advanced": {
            "title": "Advanced Capstone: A project you'd put in your portfolio",
            "meta": ["~6 hours", "Level: Advanced"],
            "body": (
                "<p>Pick a capstone you would genuinely show to a prospective client, "
                "employer, or collaborator. Chain 5\u20137 tools. Ship to a real audience "
                "where feedback will follow.</p>"
                "<p>Example shape 1 (for researchers): an accessible-audience summary of "
                "your research, delivered as a short explainer video with cited sources. "
                "Chain Elicit + SciSpace + Claude Projects + ElevenLabs + Runway + "
                "Descript + Captions + Opus Clip (for social shorts).</p>"
                "<p>Example shape 2 (for creators): launch a piece of content across "
                "three platforms simultaneously. Chain a single long-form recording "
                "through Adobe Podcast + Descript + Opus Clip + Pictory + Captions, "
                "producing one YouTube video, three TikToks/Reels, and one LinkedIn post.</p>"
                "<p>Example shape 3 (for educators): a single-topic micro-course across "
                "5 days. Chain Gamma + HeyGen + Descript + ElevenLabs + QuillBot + "
                "Grammarly, producing a welcome video, four lesson modules with AI "
                "narration, and a written summary.</p>"
                "<p>Ship it. Solicit feedback from three real people. Write a 500-word "
                "retrospective analyzing which tools compounded each other and which "
                "were redundant in your particular chain. This retro is your personal "
                "operating manual for the next year of AI-fluent work.</p>"
            ),
        },
        "pitfalls": [
            "<p><strong>Tool collection without tool composition.</strong> The trap is "
            "using five tools in parallel instead of in sequence. If your &ldquo;chain&rdquo; "
            "is actually five separate workflows that happen to be in the same project, "
            "you have not done the real exercise. A chain is when the output of one step "
            "is the input of the next.</p>",
            "<p><strong>Scope creep midway.</strong> As you work, each tool suggests "
            "adjacent opportunities (<em>I could also generate an intro bed in Suno</em>, "
            "<em>I could add an AI avatar intro with HeyGen</em>). Resist every one that "
            "isn't in your original plan. Finishing a simple chain beats half-finishing "
            "an ambitious one.</p>",
            "<p><strong>Skipping the retrospective.</strong> The retrospective feels "
            "optional but is not. Most people finish a multi-tool project, feel relief, "
            "and move on \u2014 losing the specific insights about their own workflow. "
            "Those insights are what make the <em>next</em> project go twice as fast.</p>",
        ],
        "compare_html": """
<p>
  The capstone format comes out of executive-education and engineering curricula, where
  a final integrative project is known to outperform a final exam on skill retention and
  professional application. Compared to more-structured capstone formats (with rubrics,
  submission portals, instructor review), this capstone is deliberately self-directed:
  you are accountable to your own intended audience, not to a grade. For serious learners
  this is more rigorous, not less \u2014 an audience that wants the thing you shipped is
  a harder judge than a course rubric.
</p>
""",
        "when_to_use": """
<p><strong>Do the capstone as soon as you have one real project in mind.</strong> Many
people delay it waiting for the &ldquo;right&rdquo; project; the right project is the
first genuine one. Ship something small and real before you try something ambitious. The
skill you are proving is <em>integration</em>, not <em>scale</em>.</p>
<p><strong>Do not do the capstone</strong> as a throwaway exercise with no intended
audience. Without a real reader, viewer, or user, the chain becomes academic and the
judgment muscle stays weak. If you cannot think of a real project, interview a friend
about their work and build a deliverable they actually need.</p>
""",
        "further": [
            {"label": "Capstone inspiration \u2014 past cohort projects", "url": "/learn/ai-creators-researchers/index.html"},
            {"label": "Day 30 \u2014 Certificate and reflection", "url": "day-30.html"},
        ],
    },
    {
        "num": 30,
        "tool": "Certificate & Reflection",
        "focus": "Claim your certificate. Decide what comes next.",
        "url": "",
        "tagline": "Thirty days done. One page of reflection. One PDF to download.",
        "pills": ["~30 min", "Finish the course", "Lifetime access"],
        "vignette": (
            "Thirty days ago, you had heard of most of these tools. Six weeks ago, you "
            "had used two or three. Today, you have practiced with twenty-six and shipped "
            "a capstone. What you have now is not a trophy; it is a different kind of "
            "fluency. A different relationship with what is possible in a working day. "
            "Today is the moment to acknowledge that, mark it, and pick what's next."
        ),
        "why_html": """
<p>
  <strong>The certificate is a credential, but it is not the product.</strong> The product
  is what has changed about how you work. You now know which tool to reach for when a
  long document arrives, when a deck is due in two hours, when an interview needs to be
  transcribed, when a social post needs a video, when a hard problem needs a patient
  tutor. That taste, built by thirty days of repetition, is what compounds. The PDF is
  a useful marker of it, nothing more.
</p>
<p>
  Equally important is a clear-eyed look at what the certificate <em>does not</em>
  represent. It is not a license. It is not accredited. It does not guarantee that any
  tool you used on Day 4 still exists on Day 400 \u2014 this field is moving fast, and
  half the specific products you touched will have changed in two years. What the
  certificate <em>does</em> represent is the habit you built: the habit of picking up
  new AI tools, testing them critically, placing them honestly in your workflow, and
  discarding them when something better shows up. That habit is the durable skill.
</p>
<p>
  Today's page is the shortest in the course. Do the reflection exercise. Generate and
  download the certificate. Then read the &ldquo;what comes next&rdquo; section \u2014
  because a course ends, but the work of staying AI-fluent does not.
</p>
""",
        "setup_html": """
<p><strong>Prerequisite:</strong> all 29 prior days must be marked complete for the
certificate to unlock. Scroll to the <strong>Certificate</strong> section lower on this
page; it will show &ldquo;locked&rdquo; if any day is still open.</p>
<p><strong>Privacy note:</strong> the certificate is generated entirely in your browser
using jsPDF. Nothing is uploaded; the name you type appears only in the PDF you
download to your own machine. Your progress is stored in localStorage and does not sync
across devices \u2014 this is deliberate, to keep the course free of accounts and
tracking.</p>
""",
        "walkthrough": [
            {
                "title": "Check all 29 prior days are complete",
                "body": (
                    "Return to the <a href=\"../index.html\">course home page</a>. Every day "
                    "card should show the gold check dot in the corner. If any are missing, "
                    "click that day and mark it complete \u2014 either you did the work and "
                    "forgot to mark it, or the day deserves a proper visit before you claim "
                    "the certificate. Be honest with yourself about which."
                ),
            },
            {
                "title": "Write your own reflection",
                "body": (
                    "Before generating the certificate, write your own 200-word reflection "
                    "answering: <em>Which three tools genuinely changed how I work? Which "
                    "three did I try and set down? What is one workflow I now have that I "
                    "did not have 30 days ago?</em> Keep this reflection somewhere you will "
                    "see it in six months."
                ),
            },
            {
                "title": "Decide what to update in your bio",
                "body": (
                    "You have spent 30 days building a specific kind of fluency. If your "
                    "LinkedIn, personal site, or professional bio does not mention it, add "
                    "one sentence. Not a boast \u2014 a factual statement of capability: "
                    "<em>&ldquo;Comfortable with the modern AI creator and research stack: "
                    "conducting deep research with AI-augmented tools, producing video and "
                    "audio with generative AI, and shipping mini-apps with AI-native "
                    "IDEs.&rdquo;</em>"
                ),
            },
            {
                "title": "Generate and download the certificate",
                "body": (
                    "Scroll to the <strong>Your Certificate</strong> section below. Enter "
                    "your name exactly as you want it to appear. Click <strong>Generate "
                    "Certificate (PDF)</strong>. The certificate is a landscape A4 PDF with "
                    "a warm cream background, gold foil frame, and your name in elegant "
                    "italic serif. Save it somewhere permanent."
                ),
            },
            {
                "title": "Share it, or don't",
                "body": (
                    "You are welcome to post the certificate on LinkedIn, frame it, tack it "
                    "on a corkboard, or simply keep it in your records. The certificate was "
                    "designed to look credible on a corporate wall and on a personal "
                    "portfolio page. What you do with it is up to you."
                ),
            },
            {
                "title": "Pick one habit to keep",
                "body": (
                    "Before you close this tab, pick one tool from the course to use every "
                    "day for the next 30 days. One. Not five. The difference between people "
                    "who take AI courses and people who benefit from them is the practice "
                    "that comes after the course ends."
                ),
            },
        ],
        "ex_basic": {
            "title": "Basic: The 200-word reflection",
            "meta": ["~20 min", "Level: Everyone"],
            "body": (
                "<p>Write, in your own voice, a 200-word reflection on the last 30 days. "
                "Answer: which three tools genuinely changed how you work, which three you "
                "tried and set down, and what one workflow you now have that you did not "
                "have when you started.</p>"
                "<p>Save the reflection somewhere you will see it in six months. Re-read it "
                "then. Notice what changed in how you answered.</p>"
            ),
        },
        "ex_advanced": {
            "title": "Advanced: A personal AI operating manual",
            "meta": ["~90 min", "Level: Advanced"],
            "body": (
                "<p>Spend 90 minutes writing a personal AI operating manual \u2014 a 1,500-"
                "word document that describes, for you specifically, how you work with AI "
                "now. Structure it as four sections:</p>"
                "<ol>"
                "<li><strong>My daily drivers.</strong> Which 3\u20135 tools do you use "
                "every day? What is the specific job each one does for you?</li>"
                "<li><strong>My workflows.</strong> Which 3\u20135 multi-tool chains do you "
                "run regularly? Sketch each as a sequence of tool handoffs.</li>"
                "<li><strong>My rules.</strong> Your personal guardrails: what you will "
                "never let AI do (send without review? make pricing decisions? write your "
                "voice?), what you always check AI output for, how you decide when to trust "
                "a generation and when to verify.</li>"
                "<li><strong>My frontier.</strong> Three capabilities that are at the edge "
                "of what you can currently do with AI but that you want to develop next. "
                "What specifically will you practice in the next 90 days?</li>"
                "</ol>"
                "<p>Keep this document living. Revisit it quarterly. This is the single most "
                "valuable artifact you will produce in this course \u2014 the only one that "
                "compounds for years.</p>"
            ),
        },
        "pitfalls": [
            "<p><strong>Treating completion as the end of the work.</strong> The course "
            "ends; AI does not stop evolving. Three months from now, tools from Week 3 will "
            "have changed. Twelve months from now, there will be new categories. The habit "
            "of pickup-and-evaluate \u2014 not the specific tool list \u2014 is what "
            "persists. Keep practicing it.</p>",
            "<p><strong>Over-promising on your resume.</strong> The certificate does not "
            "make you an &ldquo;AI expert&rdquo; or an &ldquo;AI engineer.&rdquo; It makes "
            "you AI-<em>fluent</em> at the application level. Use language that matches "
            "the actual capability; overclaiming invites questions you cannot answer and "
            "trust you cannot rebuild.</p>",
            "<p><strong>Not using any of it.</strong> The saddest thing a learner can do "
            "is finish the course, download the certificate, and return to work without "
            "changing a single habit. If in one month you cannot name a specific workflow "
            "that is now different, the certificate is decoration. Pick one tool today. "
            "Use it tomorrow. Build from there.</p>",
        ],
        "compare_html": """
<p>
  Unlike accredited professional certificates (PMP, AWS, Google, etc.), this is a
  self-paced, self-verified course. Its value is proportional to the work you put in.
  Employers who ask about it will be checking that you can <em>speak</em> to your
  workflows \u2014 what you chained, what you learned, what you rejected and why. Treat
  it the way you would treat any course you took to learn a stack: it opens the
  conversation; the conversation itself reveals the capability.
</p>
""",
        "when_to_use": """
<p><strong>Mention the certificate</strong> on your LinkedIn, on your personal site's
education or skills section, in cover letters where AI literacy is relevant, and in
professional conversations where a colleague is curious how you got up to speed. The
certificate is social proof for the capability; your capstone and your retro are the
proof of the capability itself.</p>
<p><strong>Do not lean on the certificate</strong> to replace demonstration. In any
interview or conversation where AI matters, have a specific workflow you can describe in
detail \u2014 the three-tool chain you used last week, the mistake you caught in a
generation yesterday, the tool you stopped using last month and why. That texture is
what makes the fluency real.</p>
""",
        "further": [
            {"label": "Review the 30-day index", "url": "../index.html"},
            {"label": "The first AI Certificate course (free, 28 days)", "url": "/learn/ai-certificate/index.html"},
        ],
    },
]
