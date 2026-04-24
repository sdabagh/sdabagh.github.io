"""
build.py  —  AI for Creators & Researchers

Generates 30 premium day pages + landing page from the DAYS manifest.
Edit content here; re-run: python3 build.py
"""
from __future__ import annotations
from pathlib import Path
from textwrap import dedent
import html

ROOT = Path(__file__).resolve().parent
DAYS_DIR = ROOT / "days"
DAYS_DIR.mkdir(exist_ok=True)

# ---------------------------------------------------------------------------
# Weeks grouping for the landing page
# ---------------------------------------------------------------------------

WEEKS = [
    ("Week 1", "Deep Research", "Tools that read, search, and synthesize the scholarly web",
     [1, 2, 3, 4, 5]),
    ("Week 2", "Coding & Vibe-Building", "AI-native development environments and no-code builders",
     [6, 7, 8, 9, 10]),
    ("Week 3", "Voice & Audio", "Speech synthesis, transcription, editing, and music generation",
     [11, 12, 13, 14, 15]),
    ("Week 4", "Video Creation", "Generative video, avatar presenters, text-to-video, and social clips",
     [16, 17, 18, 19, 20]),
    ("Week 5", "Business Power Tools", "Presentations, lead enrichment, automation, and professional writing",
     [21, 22, 23, 24]),
    ("Week 6", "College Student Toolkit", "Study, writing, research, and problem-solving tools (no ChatGPT)",
     [25, 26, 27, 28]),
    ("Week 7", "Capstone & Certificate", "A real project using multiple tools, plus your certificate",
     [29, 30]),
]


# ---------------------------------------------------------------------------
# 30-day content manifest
# Each entry:
#   num: day number
#   tool: tool name (used in page title + card)
#   focus: one-line summary on the landing-page card
#   url: the tool's URL
#   tagline: hero tagline
#   pills: list of short badges shown in the hero (e.g. "~35 min", "Free tier")
#   vignette: opening scenario (italicized, block-quoted feel)
#   why_html: "Why this tool matters" — multi-paragraph HTML content
#   setup_html: short setup notes (account, pricing, prerequisites)
#   walkthrough: list of {title, body} step objects
#   ex_basic: {title, meta, body} — the beginner exercise
#   ex_advanced: {title, meta, body} — the advanced exercise
#   pitfalls: list of HTML paragraphs, each a named pitfall
#   compare_html: "Where it sits among alternatives" HTML
#   when_to_use: HTML content on when to use / when NOT to use this tool
#   further: list of {label, url} resource links
# ---------------------------------------------------------------------------

DAYS = [
    # =====================================================================
    # WEEK 1 — DEEP RESEARCH
    # =====================================================================
    {
        "num": 1,
        "tool": "NotebookLM",
        "focus": "Upload your sources. Ask anything. Get cited answers.",
        "url": "https://notebooklm.google.com",
        "tagline": "Your own private research assistant that has actually read your documents.",
        "pills": ["~35 min", "Free tier is generous", "Google account needed"],
        "vignette": (
            "It is 11:40 pm and you have seventy-two pages of interview "
            "transcripts, three journal articles, a policy memo, and a "
            "half-drafted literature review. Tomorrow morning you have to "
            "defend the review to a committee. You do not have time to "
            "re-read everything. You need something that has."
        ),
        "why_html": """
<p>
  <strong>NotebookLM is Google's research assistant that reads documents for you — then answers questions about them, with citations pointing back to the exact sentence in the source.</strong>
  It is the category-defining tool for what people now call <em>grounded AI</em>: an AI
  that is not trying to remember the world from its training data, but is reading
  your private stack of materials and reasoning only from there.
</p>
<p>
  This is a meaningful shift. When you ask a general chatbot like Claude or Gemini about a
  dense document, the model is vulnerable to filling in gaps with plausible-sounding invention.
  NotebookLM is structurally different: you upload up to 50 sources per notebook (PDFs, Google
  Docs, YouTube transcripts, web URLs, plain text), and the model is told — at the architecture
  level — to answer only from those sources. Every claim it produces links to a quotation from
  the original file.
</p>
<p>
  For researchers, graduate students, consultants, lawyers, clinicians, and anyone whose
  working life involves reading long documents to answer specific questions, this is the most
  consequential AI tool released in the last two years. It is not a search engine. It is not a
  chatbot. It is a <em>reading partner</em> that has read the exact stack you care about.
</p>
""",
        "setup_html": """
<p><strong>Account:</strong> a free Google account. NotebookLM is free for personal use.
Paid tier (<em>NotebookLM Plus</em>) adds more sources per notebook and more notebooks per
account; the free tier is enough to fall in love with the tool.</p>
<p><strong>Privacy:</strong> per Google's documentation, your uploaded sources are not used
to train the foundation model. If you are handling sensitive research, confirm your
institution's policy before uploading anything confidential.</p>
""",
        "walkthrough": [
            {
                "title": "Create a new notebook and feed it context",
                "body": (
                    "Go to notebooklm.google.com and click <strong>New notebook</strong>. "
                    "The very first thing NotebookLM asks is what sources to upload. Drag in "
                    "three to five related documents on a topic you know well. Good starter "
                    "stacks: a long PDF you are writing a summary of, plus two related articles; "
                    "a set of meeting transcripts; or three papers that contradict each other on "
                    "a methodological question."
                ),
            },
            {
                "title": "Wait for it to read (about 30 seconds)",
                "body": (
                    "NotebookLM ingests each source — it builds an index, extracts key topics, "
                    "and generates a short auto-summary per file. A coffee-length wait for a task "
                    "that would have taken you hours."
                ),
            },
            {
                "title": "Ask your first question",
                "body": (
                    "In the prompt box, ask something specific that requires the model to "
                    "synthesize across sources. Not <em>what is this document about</em> — that is "
                    "the auto-summary's job. Try: <em>What methodological disagreements exist "
                    "across these three studies, and on what points do the authors actually agree?</em>"
                ),
            },
            {
                "title": "Trust, but click the citations",
                "body": (
                    "Every factual claim in NotebookLM's answer has a small numbered citation. "
                    "Click at least three of them. Each click opens the exact paragraph of the "
                    "source document and highlights the supporting sentence. This is the feature "
                    "that turns it from a chatbot into a research tool."
                ),
            },
            {
                "title": "Generate the Audio Overview",
                "body": (
                    "Click <strong>Audio Overview</strong> in the right-hand Studio panel. In about "
                    "a minute, NotebookLM produces a 10-minute podcast conversation between two AI "
                    "hosts discussing your sources. It is eerily good. Use it on a walk. You will "
                    "remember the content better than you would from re-reading."
                ),
            },
            {
                "title": "Use the Studio for deliverables",
                "body": (
                    "The Studio panel on the right can also generate: a study guide, a briefing "
                    "doc, a FAQ, a timeline, or a mind map — all grounded in your sources. Each "
                    "is a one-click deliverable you can paste into your work."
                ),
            },
        ],
        "ex_basic": {
            "title": "Basic: Summarize a document you were going to skim",
            "meta": ["~10 min", "Level: Beginner"],
            "body": (
                "<p>Upload one PDF you have been meaning to read — a long article, a policy brief, "
                "a meeting transcript, a chapter of a textbook. Ask NotebookLM three questions:</p>"
                "<ol><li><em>In one paragraph, what is the main argument?</em></li>"
                "<li><em>What are the three strongest pieces of evidence the author presents?</em></li>"
                "<li><em>What is the author's biggest unaddressed weakness or blind spot?</em></li></ol>"
                "<p>Click at least one citation for each answer. You now know the document as "
                "well as someone who spent an hour with it.</p>"
            ),
        },
        "ex_advanced": {
            "title": "Advanced: Build a 5-source synthesis notebook",
            "meta": ["~30 min", "Level: Advanced"],
            "body": (
                "<p>Pick a question you actually care about in your field — something nuanced "
                "enough that different authors disagree. Gather five sources that represent "
                "different perspectives: journal articles, industry reports, book chapters, "
                "podcasts (paste a transcript), or news features. Upload all five to one notebook.</p>"
                "<p>Then produce three deliverables:</p>"
                "<ol><li>A <strong>Briefing Document</strong> (Studio → Briefing doc) that "
                "synthesizes the positions.</li>"
                "<li>Your own <strong>Comparison Table</strong> made by asking: <em>Make a "
                "markdown table comparing all five sources on [specific dimension].</em></li>"
                "<li>An <strong>Audio Overview</strong> to listen to tomorrow morning while "
                "you have coffee.</li></ol>"
                "<p>Save the notebook. You will return to it.</p>"
            ),
        },
        "pitfalls": [
            "<p><strong>It will not invent — but it will refuse.</strong> If you ask a question "
            "that truly is not answerable from the sources, NotebookLM will say so rather than "
            "hallucinate. That is the feature. If you want broader context, add more sources.</p>",
            "<p><strong>Video transcripts only, not video.</strong> YouTube as a source means "
            "NotebookLM reads the transcript, not the visuals. If the lecturer says &ldquo;look at "
            "this chart&rdquo; and the chart is never described, that information is invisible.</p>",
            "<p><strong>Citations are paragraph-level.</strong> NotebookLM points you to the "
            "right paragraph, not always the right sentence inside that paragraph. Always "
            "read a few lines above and below the highlighted quote before citing it in your "
            "own writing.</p>",
        ],
        "compare_html": """
<p>
  NotebookLM competes with <strong>Claude Projects</strong>, <strong>ChatGPT Projects</strong>,
  and <strong>Perplexity Spaces</strong>. All four let you pin a set of sources and ask
  questions grounded in them. NotebookLM's edge is the polish of the grounding — the
  citations, the Audio Overview, the Studio deliverables — and the absence of marketing
  fluff. Claude Projects is better if you need the model to also help you write new drafts
  in a long-running conversation; NotebookLM is stricter about staying inside the source
  material.
</p>
""",
        "when_to_use": """
<p><strong>Use NotebookLM when</strong> the question you are trying to answer is
<em>contained in a specific stack of documents</em>: a literature review, a case brief,
a grant application, a dissertation chapter, a meeting-archive search.</p>
<p><strong>Do not use NotebookLM when</strong> you need the model to bring in outside
knowledge (use Claude or Perplexity Deep Research), generate brand-new creative writing
(Claude is better), or help you code (Cursor/Windsurf are better). NotebookLM is a
reader, not a thinker-about-the-world.</p>
""",
        "further": [
            {"label": "NotebookLM official site", "url": "https://notebooklm.google.com"},
            {"label": "Help Center: how it works", "url": "https://support.google.com/notebooklm"},
        ],
    },
    {
        "num": 2,
        "tool": "Perplexity Deep Research",
        "focus": "An AI that takes ten minutes to actually research your question.",
        "url": "https://www.perplexity.ai",
        "tagline": "Give it a complex question, walk away, come back to a cited mini-paper.",
        "pills": ["~40 min", "Free tier limited", "Paid tier: $20/mo"],
        "vignette": (
            "Your manager just asked you to write a one-pager comparing four vendors in a "
            "market you do not know. It is due Thursday. A regular Google search will not "
            "get you there, and you do not have the time to open thirty tabs."
        ),
        "why_html": """
<p>
  <strong>Perplexity Deep Research is an AI agent that performs a ten-to-twenty-minute
  research session on your behalf</strong>, opens dozens of web pages, reads them,
  takes notes, and produces a cited multi-page report. It is the first tool in this course
  that is genuinely an <em>agent</em> in the useful sense: you set it loose on a goal and
  it works while you do other things.
</p>
<p>
  Regular Perplexity (the Ask view) is a search-augmented chatbot: you type a question, it
  searches the web, synthesizes an answer with citations. Deep Research is a different mode.
  You give it a research goal (&ldquo;compare the regulatory landscape for stablecoins in the
  US, EU, and Singapore in 2026&rdquo;), and it runs for 10–20 minutes. The output is
  typically 2,000–5,000 words, with 30–70 citations, structured as a report.
</p>
<p>
  For any research task where <em>breadth</em> matters more than a single right answer —
  competitive analyses, literature scans, regulatory overviews, due diligence, background
  briefings for meetings — Deep Research replaces what would have been a day of work with
  roughly twenty minutes of machine time.
</p>
""",
        "setup_html": """
<p><strong>Account:</strong> free Perplexity account at perplexity.ai. The free plan gives
limited Deep Research runs per day; the $20/month Pro plan removes the ceiling and unlocks
higher-quality model choices (Claude, GPT, and Perplexity's own Sonar).</p>
<p><strong>Prerequisite:</strong> a specific, somewhat complex question. Deep Research
wastes its power on simple factual questions that regular Perplexity handles better.</p>
""",
        "walkthrough": [
            {
                "title": "Pick Deep Research mode",
                "body": (
                    "Open perplexity.ai. In the query box, click the mode selector and pick "
                    "<strong>Deep Research</strong>. The affordance tells you this is going to "
                    "take longer than a normal query — do not fight it."
                ),
            },
            {
                "title": "Write a genuinely complex question",
                "body": (
                    "The quality of Deep Research output depends almost entirely on question "
                    "quality. Bad: <em>tell me about stablecoins</em>. Good: <em>What is the "
                    "current regulatory treatment of fiat-backed stablecoins in the US, EU, "
                    "and Singapore as of 2026? Compare reserve requirements, issuance licensing, "
                    "and consumer protections. Cite authoritative sources.</em>"
                ),
            },
            {
                "title": "Submit and get out of the way",
                "body": (
                    "Perplexity begins to stream its progress — you will see it opening sites, "
                    "reading, and taking notes. You can watch this if you want (it is mesmerizing "
                    "the first few times), but you can also close the tab. Results wait for you."
                ),
            },
            {
                "title": "Read with skepticism, then click through",
                "body": (
                    "When the report lands, read it as a draft — not gospel. Every paragraph "
                    "should have citations. For any claim that feels important or surprising, "
                    "click the citation and read the actual source. Deep Research is strong, "
                    "but it still occasionally misreads a nuanced source."
                ),
            },
            {
                "title": "Follow up to tighten",
                "body": (
                    "At the bottom of the report, you can continue the conversation. Ask: "
                    "<em>Of the three jurisdictions, where are reserve requirements strictest? "
                    "Cite the specific regulation.</em> This turns Deep Research into an "
                    "iterative process rather than a one-shot lottery."
                ),
            },
            {
                "title": "Export the artifact",
                "body": (
                    "Use the <strong>Export as PDF</strong> or <strong>Copy as Markdown</strong> "
                    "option in the menu. You now have a document you can edit into your own "
                    "brief, with an audit trail of every source."
                ),
            },
        ],
        "ex_basic": {
            "title": "Basic: A comparative briefing",
            "meta": ["~15 min", "Level: Beginner"],
            "body": (
                "<p>Pick three products, tools, frameworks, or policies in your field. Ask "
                "Deep Research to produce a comparison briefing on a specific dimension — "
                "pricing, feature set, adoption, regulatory posture, whatever matters in your "
                "world. Read the report. Identify one claim you did not already know, and "
                "click through to the source to verify it.</p>"
            ),
        },
        "ex_advanced": {
            "title": "Advanced: A real due-diligence memo",
            "meta": ["~35 min", "Level: Advanced"],
            "body": (
                "<p>Pick a real decision you or your team is currently weighing — a vendor, a "
                "hire, an investment, a methodology choice. Write a 3-paragraph Deep Research "
                "prompt that clearly states the decision, the dimensions you care about, and "
                "the level of rigor you need in the sources.</p>"
                "<p>Run it. Then spend 15 minutes doing a citation audit: open ten random "
                "citations and verify the report characterizes each source correctly. Flag "
                "any mischaracterizations. Edit the report into a 500-word memo you would be "
                "comfortable forwarding.</p>"
                "<p>The skill this exercise is building is not AI literacy — it is <em>AI "
                "output literacy</em>: knowing exactly how much to trust a machine-generated "
                "report.</p>"
            ),
        },
        "pitfalls": [
            "<p><strong>Deep Research is not peer review.</strong> It reads the open web. "
            "Low-quality sources (marketing pages, SEO-farm content) can end up cited alongside "
            "authoritative ones. Always check citations for anything decision-critical.</p>",
            "<p><strong>Recency matters.</strong> For fast-moving topics (policy, pricing, "
            "product releases), include the year in your prompt and explicitly ask for recent "
            "sources. Otherwise it will sometimes anchor on older articles.</p>",
            "<p><strong>One question per run.</strong> Deep Research performs worse when the "
            "prompt bundles multiple unrelated questions. Split them into separate runs.</p>",
        ],
        "compare_html": """
<p>
  Deep Research competes with <strong>ChatGPT Deep Research</strong>, <strong>Gemini Deep
  Research</strong>, and <strong>Claude Research</strong> — all released in a tight window
  in late 2024 and early 2025. At the current state of the art, they are roughly comparable
  on easy prompts and noticeably different on hard ones. Perplexity is usually strongest on
  <em>recent events</em> and <em>comparison structures</em>; ChatGPT is strongest when the
  output needs to be a long, well-written essay; Gemini is strongest when the topic is in
  Google's knowledge graph. For a professional brief, try the same prompt on two of them and
  compare.
</p>
""",
        "when_to_use": """
<p><strong>Use Deep Research when</strong> you have a complex, multi-sourced question and the
output needs citations a reviewer could click. Competitive analyses, regulatory scans,
literature reviews, background briefings — all ideal.</p>
<p><strong>Do not use Deep Research when</strong> the answer is in one known source (use
NotebookLM), when you need a single factual answer (regular Perplexity is five seconds),
or when the topic is so specialized that web sources are insufficient (you need expert
interviews, not AI).</p>
""",
        "further": [
            {"label": "Perplexity home", "url": "https://www.perplexity.ai"},
            {"label": "Deep Research announcement", "url": "https://www.perplexity.ai/hub"},
        ],
    },
    {
        "num": 3,
        "tool": "Elicit",
        "focus": "Literature review across thousands of academic papers.",
        "url": "https://elicit.com",
        "tagline": "Ask a research question; get structured answers from real peer-reviewed papers.",
        "pills": ["~35 min", "Free tier is enough to start", "Academic-focused"],
        "vignette": (
            "You are a graduate student starting a literature review. Your advisor has said "
            "&ldquo;just find the relevant papers&rdquo; as if that were a two-hour task. You "
            "have opened Google Scholar, clicked through fourteen abstracts, and you have not "
            "written a single sentence."
        ),
        "why_html": """
<p>
  <strong>Elicit is an AI research assistant built specifically on the academic literature.</strong>
  It searches tens of millions of papers (primarily from Semantic Scholar and OpenAlex),
  reads their abstracts and in many cases full texts, and produces structured answers to
  your research question — not as a chatbot summary, but as a table where each row is a paper
  and each column is an extracted data point you specified.
</p>
<p>
  The step-change Elicit introduces is the <em>data extraction</em> pattern. You ask a
  question, get back a table of 5–50 relevant papers, and then add columns like
  <em>sample size</em>, <em>main finding</em>, <em>methodology</em>, or <em>limitations</em>.
  Elicit reads each paper and fills the cells. You get something that would have taken a
  graduate research assistant a week in about fifteen minutes — and every cell links to the
  exact passage in the paper.
</p>
<p>
  This changes what a literature review <em>is</em>. You are no longer manually typing a
  synthesis table from PDF after PDF; you are editing one that was pre-populated for you.
  That time savings is the product.
</p>
""",
        "setup_html": """
<p><strong>Account:</strong> sign up at elicit.com with an institutional or personal email.
Free tier gives you a monthly credit budget that is sufficient for a real literature review;
heavy users move to Plus ($10/mo) or Pro ($42/mo).</p>
<p><strong>Scope:</strong> Elicit is strongest on biomedical, behavioral, and social-science
literature. It works less well for humanities, where evaluation is qualitative and the
&ldquo;findings&rdquo; pattern fits less naturally.</p>
""",
        "walkthrough": [
            {
                "title": "Start with a real research question",
                "body": (
                    "On the Elicit home page, type a research question — not a keyword search. "
                    "Bad: <em>adolescent depression</em>. Good: <em>What are the effects of "
                    "smartphone use on adolescent depression?</em> Elicit is tuned to parse "
                    "the structure of a research question; the more it looks like one, the "
                    "better the retrieval."
                ),
            },
            {
                "title": "Review the top 8 results",
                "body": (
                    "Elicit returns a ranked list of papers, each with a one-sentence summary "
                    "of the finding. Skim the top eight. If they are relevant, proceed; if not, "
                    "rephrase your question (try adding methodology: <em>…in randomized trials</em>)."
                ),
            },
            {
                "title": "Add extraction columns",
                "body": (
                    "Click <strong>Add column</strong>. Pick from common templates (Sample "
                    "size, Intervention, Outcome, Effect size) or write a custom column prompt "
                    "like <em>What limitations did the authors acknowledge?</em> Elicit reads "
                    "each paper and populates the cells."
                ),
            },
            {
                "title": "Inspect cells with skepticism",
                "body": (
                    "Click into any cell. Elicit shows you the source passage it drew the answer "
                    "from. This is your chance to check — AI paper reading is imperfect. Spot-"
                    "check roughly one in five cells on anything you will cite."
                ),
            },
            {
                "title": "Expand or narrow the set",
                "body": (
                    "If your initial eight papers are the wrong shape, use the filters to narrow "
                    "by year, publication type, or keyword. Use <strong>Find related papers</strong> "
                    "on a particularly relevant paper to discover adjacent work."
                ),
            },
            {
                "title": "Export to your writing tool",
                "body": (
                    "Elicit exports to CSV, Zotero, and RIS. If you are writing your literature "
                    "review in Notion, Word, or Google Docs, the CSV export becomes the skeleton "
                    "table of your Methods or Results section."
                ),
            },
        ],
        "ex_basic": {
            "title": "Basic: A focused mini-review",
            "meta": ["~15 min", "Level: Beginner"],
            "body": (
                "<p>Pick a research question from your domain that you think you understand. "
                "Run it through Elicit. Add three extraction columns: sample size, main finding, "
                "and a methodological concern of your choice. Open each paper's summary and "
                "decide whether it would have changed your review if you had missed it.</p>"
                "<p>Goal: realize that even a question you thought you understood has layers "
                "Elicit surfaces that you would have missed manually.</p>"
            ),
        },
        "ex_advanced": {
            "title": "Advanced: A 20-paper structured review",
            "meta": ["~45 min", "Level: Advanced"],
            "body": (
                "<p>Pick a question you genuinely need an answer to for work or study. Build "
                "an Elicit workspace with at least 20 papers and five extraction columns "
                "(one of them custom, specific to your domain). Spot-check twenty cells. "
                "Export the table to CSV.</p>"
                "<p>Write a 400-word synthesis paragraph grounded in the table. In a reflection "
                "note at the bottom, answer: (1) which columns were most valuable, and "
                "(2) which cells did Elicit get wrong — and what would have happened if you "
                "had trusted them without checking?</p>"
                "<p>This exercise is the working template of every future literature review you "
                "will do.</p>"
            ),
        },
        "pitfalls": [
            "<p><strong>Access matters.</strong> Elicit reads abstracts for free, but paywalled "
            "full texts are extracted less reliably. Connect your institutional access if you "
            "have it; the quality difference is significant.</p>",
            "<p><strong>Summaries flatten nuance.</strong> Extraction cells aim for concise "
            "answers and can smooth over methodological caveats. For any paper you will cite, "
            "read the abstract in full (not just Elicit's summary cell).</p>",
            "<p><strong>Citation drift.</strong> Elicit occasionally attributes an idea to a "
            "paper where the paper was citing that idea from somewhere else. For famous claims, "
            "always trace back to the primary source.</p>",
        ],
        "compare_html": """
<p>
  Elicit competes most directly with <strong>Consensus</strong> (Day 4), <strong>Scispace</strong>
  (Day 28), <strong>Scite</strong>, and <strong>ResearchRabbit</strong>. Roughly: Elicit is
  strongest at <em>structured extraction across many papers</em>; Consensus is strongest for
  <em>yes/no empirical questions</em> (<em>does X cause Y?</em>); Scispace is strongest at
  <em>reading one paper deeply</em>; ResearchRabbit is strongest for <em>discovering adjacent
  work via citation graphs</em>. A real research workflow uses at least two of these in
  sequence.
</p>
""",
        "when_to_use": """
<p><strong>Use Elicit when</strong> you need to synthesize findings across many papers —
anything with the shape of a systematic review, a literature scan, or a meta-analysis
pre-screen.</p>
<p><strong>Do not use Elicit when</strong> you already know the three papers that matter
(just read them), when your field is mostly qualitative or theoretical (Elicit's
extraction pattern fits badly), or when you need to reason about the argument of
<em>one</em> paper in depth (Scispace on Day 28 is better).</p>
""",
        "further": [
            {"label": "Elicit home", "url": "https://elicit.com"},
            {"label": "Elicit's guide to systematic reviews", "url": "https://elicit.com/blog"},
        ],
    },
    {
        "num": 4,
        "tool": "Consensus",
        "focus": "Does the evidence say yes or no?",
        "url": "https://consensus.app",
        "tagline": "An AI that reads the scientific literature and tells you where it actually lands.",
        "pills": ["~25 min", "Free tier", "Empirical questions only"],
        "vignette": (
            "Someone at dinner claims that intermittent fasting extends lifespan. You want to "
            "know what the science actually says without reading twenty papers. You are not "
            "going to be a lifelong expert on fasting. You need calibrated, cited, five-minute "
            "competence."
        ),
        "why_html": """
<p>
  <strong>Consensus is a search engine built specifically on empirical research claims.</strong>
  You ask a yes/no empirical question (<em>Does X cause Y? Does Z work?</em>), and Consensus
  searches the peer-reviewed literature, extracts claims from each paper, and shows you — for
  each paper — whether the authors found <strong>yes</strong>, <strong>no</strong>, or
  <strong>mixed / possibly</strong>. A meter at the top shows the overall direction of the
  evidence.
</p>
<p>
  This is a specialized tool with a specialized use case: reasoning about empirical questions
  you care about but are not an expert on. It is particularly good at the class of questions
  where the general internet will confidently give you whichever answer you want to hear —
  nutrition, exercise, sleep, supplements, psychological interventions, educational practices.
  Consensus forces the evidence to answer for itself.
</p>
<p>
  It is not a replacement for Elicit. Elicit is for structured data extraction across a
  literature; Consensus is for <em>stance classification</em> on a specific empirical claim.
  Most research workflows use both, at different moments.
</p>
""",
        "setup_html": """
<p><strong>Account:</strong> free at consensus.app. The free tier rate-limits AI features
(summaries, the Consensus Meter) but lets you search unlimited. Paid tier starts around
$9/month for students.</p>
<p><strong>Best for:</strong> questions that have the shape <em>&ldquo;Does X cause Y?&rdquo;</em>
or <em>&ldquo;Is Z effective for W?&rdquo;</em>. Empirical, testable, with a literature.</p>
""",
        "walkthrough": [
            {
                "title": "Ask an empirical yes/no question",
                "body": (
                    "Go to consensus.app. In the search bar, type a question phrased in natural "
                    "language: <em>Does meditation reduce anxiety? Is reading to children "
                    "effective? Does creatine improve muscle growth?</em>"
                ),
            },
            {
                "title": "Read the Consensus Meter",
                "body": (
                    "At the top of the results, Consensus shows a meter: how many of the top "
                    "papers say yes, no, or possibly. This is an orientation — not an answer. "
                    "The meter is based on the top 20 papers and their extracted claim classifications."
                ),
            },
            {
                "title": "Skim the top ten findings",
                "body": (
                    "Below the meter, each paper is represented with the extracted claim, the "
                    "classification (yes / no / possibly), the publication venue, and the "
                    "sample size. This is dense and useful — the page is almost a literature "
                    "scan on its own."
                ),
            },
            {
                "title": "Click into a representative paper",
                "body": (
                    "Pick a paper that sits right on the meter's center of mass. Click to see "
                    "the full abstract. Consensus highlights the exact sentence it extracted the "
                    "claim from. Read the abstract. Does the paper actually say what the "
                    "extracted claim says?"
                ),
            },
            {
                "title": "Use the GPT Summary",
                "body": (
                    "For questions with enough papers, Consensus offers a <strong>Consensus "
                    "Summary</strong> — a single paragraph that reconciles the top results. "
                    "Treat it as a hypothesis, not a conclusion; check it against two or three "
                    "of the cited papers."
                ),
            },
        ],
        "ex_basic": {
            "title": "Basic: Resolve one health myth",
            "meta": ["~10 min", "Level: Beginner"],
            "body": (
                "<p>Pick a health or wellness claim you have heard often and are not sure about: "
                "intermittent fasting and longevity, blue light and sleep, omega-3s and depression, "
                "cold exposure and cognition. Search it on Consensus. Read the meter, skim the top "
                "five findings, and click into the highest-impact paper.</p>"
                "<p>In three sentences, write what the evidence actually says — acknowledging "
                "uncertainty where it exists.</p>"
            ),
        },
        "ex_advanced": {
            "title": "Advanced: Build a position paper with evidence",
            "meta": ["~30 min", "Level: Advanced"],
            "body": (
                "<p>Pick an empirical question that matters for a real decision in your life or "
                "work. Run Consensus on it. Open five of the top papers. For each: note the "
                "effect size, the sample, the population studied, and the key limitation.</p>"
                "<p>Then write a 300-word position paragraph that (a) states the evidence-based "
                "answer, (b) acknowledges the limitations that the Consensus Meter smooths over, "
                "and (c) makes a calibrated recommendation. This is how professional analysts "
                "actually write.</p>"
            ),
        },
        "pitfalls": [
            "<p><strong>The Meter is a sketch, not a conclusion.</strong> It classifies the "
            "stated claim of each paper, but not the quality of the evidence. Five bad studies "
            "saying &ldquo;yes&rdquo; can tilt it wrongly. Always check the top two papers "
            "personally.</p>",
            "<p><strong>Question phrasing matters.</strong> <em>Does X cause Y?</em> and "
            "<em>Does X reduce Y?</em> can return different classifications from the same "
            "papers. Try rephrasing to see whether the direction of the meter holds up.</p>",
            "<p><strong>Sample bias in the literature.</strong> Consensus reflects the published "
            "literature, which has its own biases (novelty bias, positive-result bias, "
            "funding-source bias). A strong Consensus meter is not a guarantee that the real "
            "world agrees.</p>",
        ],
        "compare_html": """
<p>
  Consensus is unusual. The closest competitor is <strong>Scite</strong>, which tracks
  whether later papers have <em>supported</em>, <em>disputed</em>, or <em>mentioned</em> each
  citation — a different but related classification problem. Elicit (Day 3) does structured
  extraction but does not classify stance by default. For a yes/no empirical question, Consensus
  remains the sharpest tool we have.
</p>
""",
        "when_to_use": """
<p><strong>Use Consensus when</strong> the question you are chewing on is empirical and has
a literature (medicine, psychology, nutrition, education, exercise science). It is
particularly valuable for health and wellness claims, where internet sources are noisy.</p>
<p><strong>Do not use Consensus when</strong> the question is theoretical, legal,
historical, or a matter of design choice — these do not have a &ldquo;meter&rdquo;
in the same empirical sense.</p>
""",
        "further": [
            {"label": "Consensus home", "url": "https://consensus.app"},
            {"label": "How the Consensus Meter works", "url": "https://consensus.app/home/blog/"},
        ],
    },
    {
        "num": 5,
        "tool": "Claude Projects",
        "focus": "A persistent workspace where Claude keeps your context for months.",
        "url": "https://claude.ai",
        "tagline": "Stop starting over. Give Claude a project with memory, instructions, and files.",
        "pills": ["~35 min", "Claude Pro ($20/mo) or Team", "Built on Claude"],
        "vignette": (
            "You spent 90 minutes last Wednesday explaining your dissertation topic to Claude, "
            "pasting in your outline, and iterating on chapter 3. Today you start a new chat "
            "and discover the model knows none of it. Again."
        ),
        "why_html": """
<p>
  <strong>Claude Projects are persistent workspaces inside claude.ai that remember your
  context</strong> — custom instructions, uploaded documents, style references, terminology
  — across every conversation you have inside them. They turn Claude from a one-shot chatbot
  into a research or writing environment you can return to for months.
</p>
<p>
  The mental model: a Project is a <em>room</em>. The room holds 20-ish documents you have
  uploaded (your syllabus, a style guide, three source papers, an outline), and a custom
  instruction that tells Claude who it is for the work done here (<em>&ldquo;You are helping
  me write my PhD dissertation on X; maintain a scholarly voice; when I paste text, assume
  it is my writing and offer revisions, not praise.&rdquo;</em>). Every chat you start
  inside the Project inherits all of that.
</p>
<p>
  For anyone doing a long-running project — a book, a thesis, a consulting engagement, a
  research program, a family-history investigation — Projects are the feature that makes
  Claude actually usable as a recurring tool. Without them, you are re-explaining yourself
  every time.
</p>
""",
        "setup_html": """
<p><strong>Account:</strong> Claude Pro ($20/month) or Claude Team. Projects are not
available on the free tier as of this writing. The Pro tier includes everything a single
learner or researcher needs.</p>
<p><strong>Good first Project:</strong> a work project you will return to weekly for at
least a month. Projects pay off proportional to their lifespan.</p>
""",
        "walkthrough": [
            {
                "title": "Create a new Project and name it precisely",
                "body": (
                    "In claude.ai, click <strong>Projects</strong> in the left sidebar, then "
                    "<strong>Create a project</strong>. Name it as narrowly as you can: "
                    "<em>Dissertation Chapter 3 — Methodology</em> is better than "
                    "<em>Dissertation</em>. Narrow scope = better model behavior."
                ),
            },
            {
                "title": "Write the custom instructions",
                "body": (
                    "This is the single most important step. In about 200 words, tell Claude: "
                    "who you are, what you are working on, what voice or style you want, and "
                    "one or two things you do <em>not</em> want it to do. A good pattern: "
                    "<em>You are a collaborator on my dissertation in applied statistics. My "
                    "advisor is skeptical of AI-assisted writing, so keep my voice. Use "
                    "American Psychological Association style. When I paste my writing, "
                    "suggest edits inline with a brief rationale. Do not rewrite unless I "
                    "ask.</em>"
                ),
            },
            {
                "title": "Upload the foundational documents",
                "body": (
                    "Drag in 5–15 documents that give Claude the context it will need: a "
                    "style guide, your outline, three key source papers, a glossary of "
                    "terms specific to your field. Every chat in the Project will have these "
                    "in context."
                ),
            },
            {
                "title": "Start a chat and test the context",
                "body": (
                    "Start a new chat <em>inside the Project</em>. Ask a question that "
                    "would be impossible without the uploaded context: <em>Given the APA "
                    "style guide you have and my chapter outline, what section do I need "
                    "to write next?</em> If the answer is specific and grounded, your setup "
                    "worked."
                ),
            },
            {
                "title": "Add instructions as you learn",
                "body": (
                    "Every time you catch yourself correcting Claude on the same thing twice, "
                    "go back to the Project instructions and add a line. The instructions are "
                    "a living document. After two weeks of use, yours will be much better "
                    "than the first version."
                ),
            },
            {
                "title": "Branch conversations, keep the Project",
                "body": (
                    "Inside a Project, each chat is scoped to a task (one chat per chapter "
                    "section, say). The Project persists; chats come and go. You end up with "
                    "a clean archive of the work by sub-task."
                ),
            },
        ],
        "ex_basic": {
            "title": "Basic: Set up your first Project",
            "meta": ["~20 min", "Level: Beginner"],
            "body": (
                "<p>Create a Project for a real ongoing work item — a book you are drafting, "
                "a course you are preparing, a consulting engagement, a coding project. Write "
                "the custom instructions. Upload 5–8 documents. Start one chat and do 10 "
                "minutes of actual work inside it.</p>"
                "<p>Notice what Claude gets right that it would have needed re-explaining in "
                "a regular chat. That difference is the ROI of Projects.</p>"
            ),
        },
        "ex_advanced": {
            "title": "Advanced: A three-Project operating system",
            "meta": ["~40 min", "Level: Advanced"],
            "body": (
                "<p>Set up three Projects that cover your main work modes:</p>"
                "<ul>"
                "<li><strong>Research / reading</strong> — uploaded papers, your reading notes, "
                "instruction set: <em>help me read and connect ideas</em>.</li>"
                "<li><strong>Writing</strong> — style guide, voice samples, outline, instruction "
                "set: <em>help me draft and revise in my voice</em>.</li>"
                "<li><strong>Correspondence & communication</strong> — team bios, recent threads, "
                "instruction set: <em>help me draft professional replies in a warm-but-concise "
                "voice</em>.</li>"
                "</ul>"
                "<p>Use each at least once in the coming week. After a week, refine each "
                "Project's instructions based on the corrections you found yourself making. "
                "This is how you build a personal AI workspace that is meaningfully yours.</p>"
            ),
        },
        "pitfalls": [
            "<p><strong>Over-stuffed Projects.</strong> A Project with 40 documents and 800 "
            "words of instructions will behave worse than one with 8 documents and 200 words. "
            "More context is not always better; more <em>relevant</em> context is.</p>",
            "<p><strong>Context drift in long chats.</strong> Within a single chat, Claude's "
            "attention to the Project context can fade after many turns. Start a new chat for "
            "each new sub-task rather than running one 60-turn conversation.</p>",
            "<p><strong>Privacy.</strong> Anything uploaded to a Project is accessible to "
            "Claude during generation. For highly sensitive materials, use a Team plan (which "
            "has different data-handling policies) or anonymize before uploading.</p>",
        ],
        "compare_html": """
<p>
  Claude Projects competes with <strong>ChatGPT Projects</strong> (similar pattern, slightly
  different UX), <strong>Gemini Gems</strong> (Google's customizable assistants), and the
  <strong>Custom GPTs</strong> marketplace on ChatGPT. Functionally they are close. Claude's
  differentiator is the quality of the model on long-context writing and reading tasks — if
  you are doing sustained writing or analysis, Claude Projects tends to out-perform the
  equivalents. For quick-start productivity (&ldquo;I want a customer-email assistant in
  5 minutes&rdquo;), Custom GPTs are lower-friction.
</p>
""",
        "when_to_use": """
<p><strong>Use Claude Projects when</strong> you have a project you will return to for
weeks or months — writing a book, a thesis, running a research program, managing an
ongoing client. Projects pay off with repetition.</p>
<p><strong>Do not use Claude Projects when</strong> you have a one-off question (regular
Claude is faster), when you need web browsing (Perplexity is better), or when you are
still figuring out what the project is — Projects reward commitment.</p>
""",
        "further": [
            {"label": "Claude Projects docs", "url": "https://support.claude.com"},
            {"label": "Anthropic blog — Projects launch", "url": "https://www.anthropic.com/news/projects"},
        ],
    },
]


# Due to content length, the remaining 25 days are defined in a second file.
# This file keeps Week 1 in full.
from build_days_2 import DAYS_WEEK_2_TO_7   # noqa: E402
DAYS.extend(DAYS_WEEK_2_TO_7)


# ---------------------------------------------------------------------------
# Template & renderer
# ---------------------------------------------------------------------------

HEADER_NAV = '''<header>
  <div class="site-title">Learn Without Walls</div>
  <nav>
    <a href="/index.html">Home</a>
    <div class="nav-dropdown"><a href="/about.html">About</a><div class="dropdown-menu"><a href="/about.html">About Me</a><a href="/research.html">Research</a></div></div>
    <div class="nav-dropdown"><a href="/free-courses.html">Courses</a><div class="dropdown-menu"><a href="/free-courses.html">All Courses</a><div class="dropdown-divider"></div><a href="/free-courses.html#finance">Financial Literacy</a><a href="/free-courses.html#math">Math Courses</a><a href="/free-courses.html#python">Programming</a><a href="/free-courses.html#ai">AI &amp; Technology</a><a href="/learn/ai-creators-researchers/index.html">Creators &amp; Researchers</a></div></div>
    <a href="/young-learners.html">Young Learners</a>
    <div class="nav-dropdown"><a href="/books.html">Resources</a><div class="dropdown-menu"><a href="/books.html">Books</a><a href="/publications.html">Publications</a><a href="/instructor/index.html">Instructor Resources</a></div></div>
    <a href="/support.html">Support</a>
  </nav>
</header>'''

FOOTER = '''<footer>
  <div class="footer-links">
    <a href="/index.html">Home</a>
    <a href="/about.html">About</a>
    <a href="/books.html">Books</a>
    <a href="/free-courses.html">Courses</a>
    <a href="mailto:dabagh_safaa@smc.edu">Contact</a>
  </div>
  <p>&copy; 2026 Learn Without Walls. All rights reserved.</p>
</footer>
<script src="/accessibility.js"></script>
<script src="/mobile-nav.js"></script>'''


def render_day(day: dict, prev: dict | None, nxt: dict | None) -> str:
    n = day["num"]
    prev_link = (f'<a href="day-{prev["num"]:02d}.html">&larr; Day {prev["num"]}: {html.escape(prev["tool"])}</a>'
                 if prev else '<a href="../index.html">&larr; Course home</a>')
    next_link = (f'<a href="day-{nxt["num"]:02d}.html">Day {nxt["num"]}: {html.escape(nxt["tool"])} &rarr;</a>'
                 if nxt else '<a href="../index.html">Course home &rarr;</a>')

    pills_html = "".join(f'<span class="pill">{html.escape(p)}</span>' for p in day.get("pills", []))

    walkthrough = "".join(
        f'<div class="day-section"><h3>Step {i+1}: {html.escape(step["title"])}</h3>'
        f'<p>{step["body"]}</p></div>'
        for i, step in enumerate(day["walkthrough"])
    )

    ex_basic_meta = "".join(f'<span class="tag">{html.escape(m)}</span>' for m in day["ex_basic"]["meta"])
    ex_adv_meta = "".join(f'<span class="tag">{html.escape(m)}</span>' for m in day["ex_advanced"]["meta"])

    pitfalls_html = "".join(day["pitfalls"])

    further_html = "".join(
        f'<li><a href="{r["url"]}" target="_blank" rel="noopener">{html.escape(r["label"])}</a></li>'
        for r in day.get("further", [])
    )

    cert_block = ""
    if n == 30:
        cert_block = '''
  <section class="day-section" id="cert-gate">
    <h2>Your Certificate</h2>
    <div id="cert-locked" class="cert-panel locked" style="display:none;">
      <h2>Not quite yet</h2>
      <p>Your certificate unlocks once all 30 days are marked complete.</p>
      <p id="cert-remaining" style="font-weight:600; color: var(--c-gold-deep);">&nbsp;</p>
      <p><a href="../index.html">Back to the 30-day grid &rarr;</a></p>
    </div>
    <div id="cert-unlocked" class="cert-panel" style="display:none;">
      <h2>You finished. Claim your certificate.</h2>
      <p id="cert-progress" style="color: var(--c-stone);">&nbsp;</p>
      <p>Enter your name exactly as you want it to appear:</p>
      <input type="text" class="name-input-large" placeholder="Your full name" aria-label="Your full name">
      <br>
      <button id="cert-generate" class="btn-gold">Generate Certificate (PDF)</button>
      <p class="cert-note">Your certificate is generated in your browser. Nothing is uploaded.</p>
    </div>
  </section>
  <script src="../assets/certificate.js"></script>
'''

    return dedent(f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Day {n}: {html.escape(day["tool"])} &mdash; AI for Creators &amp; Researchers</title>
<link rel="stylesheet" href="/style.css">
<link rel="stylesheet" href="../assets/course.css">
</head>
<body class="course-root">

{HEADER_NAV}

<main class="container day-page">

  <div class="day-breadcrumb">
    <a href="../index.html">AI for Creators &amp; Researchers</a> &rsaquo; Day {n}
  </div>

  <section class="day-hero-premium">
    <div class="day-label">Day {n} of 30</div>
    <h1>{html.escape(day["tool"])}</h1>
    <p class="tagline">{day["tagline"]}</p>
    <div class="day-meta">{pills_html}</div>
  </section>

  <blockquote class="vignette">{day["vignette"]}</blockquote>

  <section class="day-section">
    <h2>Why this tool matters</h2>
    {day["why_html"]}
  </section>

  <section class="day-section">
    <h2>Setup</h2>
    <div class="callout callout-setup">
      <span class="callout-label">Before you start</span>
      {day["setup_html"]}
    </div>
  </section>

  <section class="day-section">
    <h2>Walkthrough</h2>
    {walkthrough}
  </section>

  <section class="day-section">
    <h2>Your turn</h2>

    <div class="exercise-block">
      <div class="exercise-kicker">Exercise 1</div>
      <h3>{html.escape(day["ex_basic"]["title"])}</h3>
      <div class="exercise-meta">{ex_basic_meta}</div>
      {day["ex_basic"]["body"]}
    </div>

    <div class="exercise-block">
      <div class="exercise-kicker">Exercise 2</div>
      <h3>{html.escape(day["ex_advanced"]["title"])}</h3>
      <div class="exercise-meta">{ex_adv_meta}</div>
      {day["ex_advanced"]["body"]}
    </div>
  </section>

  <section class="day-section">
    <h2>Pitfalls and pro tips</h2>
    {pitfalls_html}
  </section>

  <section class="day-section">
    <h2>How it compares</h2>
    <div class="callout callout-compare">
      <span class="callout-label">Among alternatives</span>
      {day["compare_html"]}
    </div>
  </section>

  <section class="day-section">
    <h2>When to use &mdash; and when not to</h2>
    {day["when_to_use"]}
  </section>

  <section class="day-section">
    <h2>Further reading</h2>
    <div class="callout callout-link">
      <span class="callout-label">Bookmarks</span>
      <ul>{further_html}</ul>
    </div>
  </section>

  {cert_block}

  <div class="complete-box" data-day="{n}">
    <button class="complete-btn">Mark Day {n} as complete</button>
    <div class="complete-status">&nbsp;</div>
  </div>

  <nav class="day-nav">
    <span>{prev_link}</span>
    <span class="middle"><a href="../index.html">All 30 days</a></span>
    <span>{next_link}</span>
  </nav>

</main>

{FOOTER}
<script src="../assets/progress.js"></script>
</body>
</html>''')


LANDING_TMPL = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AI for Creators &amp; Researchers &mdash; Learn Without Walls</title>
<meta name="description" content="A 30-day advanced AI course for creators, researchers, and college students. 26 specialized tools across research, coding, voice, video, productivity, and study. Certificate on completion.">
<link rel="stylesheet" href="/style.css">
<link rel="stylesheet" href="assets/course.css">
</head>
<body class="course-root">

{HEADER_NAV}

<main class="container">

  <section class="premium-hero">
    <div class="eyebrow">A 30-day AI certificate program</div>
    <h1>AI for Creators &amp; Researchers</h1>
    <p class="lede">
      A structured, hands-on tour of the modern AI stack &mdash; deep research,
      vibe-coding, voice and video creation, business tools, and the specialized
      kit every college student should know. Twenty-six tools. Thirty days. One capstone.
    </p>
    <div class="premium-cta-row">
      <a href="days/day-01.html" class="btn-gold">Start Day 1 &rarr;</a>
      <a href="#curriculum" class="btn-ghost">See the curriculum</a>
    </div>
    <div class="hero-meta-row">
      <div class="meta-stat"><span class="num">30</span><span class="label">Days</span></div>
      <div class="meta-stat"><span class="num">26</span><span class="label">AI tools</span></div>
      <div class="meta-stat"><span class="num">6</span><span class="label">Themes</span></div>
      <div class="meta-stat"><span class="num">~30</span><span class="label">Min per day</span></div>
    </div>
  </section>

  <section>
    <h2 style="font-family:'Merriweather',Georgia,serif; color:var(--c-ink); margin-bottom:0.8rem;">A course for people who take AI seriously</h2>
    <p style="color:var(--c-graphite); max-width:70ch;">
      If you have taken the free <a href="/learn/ai-certificate/index.html">AI Certificate in 28 Days</a>,
      this is the natural next step. Each day here goes deeper: you will not just try a tool,
      you will set it up properly, use it on real work, and learn when <em>not</em> to reach for it.
      Content is designed for creators, researchers, graduate students, and knowledge-work
      professionals who want AI to compound their expertise rather than replace it.
    </p>
  </section>

  <div class="pillar-grid">
    <div class="pillar-card">
      <div class="pillar-num">01</div>
      <h3>Depth, not just breadth</h3>
      <p>Every day is ~30 minutes, with setup notes, a full walkthrough, and two exercises (beginner + advanced) you can do on real work.</p>
    </div>
    <div class="pillar-card">
      <div class="pillar-num">02</div>
      <h3>Honest comparisons</h3>
      <p>Each tool is placed in context against its alternatives, with clear guidance on when to use it and when another tool is better.</p>
    </div>
    <div class="pillar-card">
      <div class="pillar-num">03</div>
      <h3>A real capstone</h3>
      <p>Day 29 asks you to chain three tools into one real project you actually need to ship &mdash; not a toy prompt. Day 30 issues your certificate.</p>
    </div>
    <div class="pillar-card">
      <div class="pillar-num">04</div>
      <h3>Privacy-first progress</h3>
      <p>Your progress is saved locally in your browser. No account, no tracking, no email list. The certificate is generated in your browser and downloaded as a PDF.</p>
    </div>
  </div>

  <section class="progress-wrap">
    <h3>Your progress</h3>
    <div class="progress-outer"><div class="progress-inner"></div></div>
    <div class="progress-labels">
      <span class="left">0 of 30 days complete</span>
      <span class="right">0%</span>
    </div>
    <p data-welcome style="margin-top:0.8rem; color:var(--c-stone); font-size:0.92rem;">&nbsp;</p>
  </section>

  <section id="curriculum">
    <h2 style="font-family:'Merriweather',Georgia,serif; color:var(--c-ink); margin:2rem 0 0.2rem;">The 30-day curriculum</h2>
    <p style="color:var(--c-stone); margin-bottom:1.6rem;">Six themed weeks plus a capstone. Click any day to jump in.</p>
    {weeks_html}
  </section>

  <section class="pricing-band">
    <h2>Free while in preview</h2>
    <p class="price-line">This course is free to access during its launch period.</p>
    <div class="price">Free &middot; <span style="font-size:1rem; color:var(--c-stone); font-weight:400;">moving to $49 / year later</span></div>
    <p class="price-note">Start now &mdash; anyone who completes the course during preview keeps lifetime access when the paid tier launches.</p>
  </section>

  <section>
    <h2 style="font-family:'Merriweather',Georgia,serif; color:var(--c-ink);">How to use this course</h2>
    <ul style="color:var(--c-graphite); max-width:70ch;">
      <li><strong>30 minutes a day.</strong> Each day is designed to fit in one focused sitting.</li>
      <li><strong>Do the advanced exercise, not just the walkthrough.</strong> Reading is necessary; doing is where learning sticks.</li>
      <li><strong>Mark days complete as you finish.</strong> Your progress syncs to the Day 30 certificate gate.</li>
      <li><strong>Skip around if you want.</strong> Most days stand alone. The capstone is the only one that assumes the rest.</li>
      <li><strong>Return for reference.</strong> Each day's comparison table is designed to be a bookmark you come back to.</li>
    </ul>
  </section>

  <div class="text-center" style="margin:3rem 0; text-align:center;">
    <a href="/index.html" class="back-link">&larr; Back to Home</a>
  </div>

</main>

{FOOTER}
<script src="assets/progress.js"></script>
</body>
</html>
"""


def render_weeks(day_list: list[dict]) -> str:
    lookup = {d["num"]: d for d in day_list}
    blocks = []
    for week_no, title, subtitle, nums in WEEKS:
        cards = []
        for n in nums:
            d = lookup.get(n)
            if not d:
                continue
            href = f"days/day-{n:02d}.html"
            cards.append(f'''<a class="day-card" data-day="{n}" href="{href}">
        <span class="day-kicker">Day {n:02d}</span>
        <span class="day-name">{html.escape(d["tool"])}</span>
        <span class="day-gist">{html.escape(d["focus"])}</span>
        <span class="check-dot" aria-hidden="true"></span>
      </a>''')
        blocks.append(f'''<section class="week-block">
      <div class="week-head">
        <div><span class="week-no">{week_no}</span><br><span class="week-title">{html.escape(title)}</span></div>
        <div class="week-meta">{html.escape(subtitle)}</div>
      </div>
      <div class="day-grid">{"".join(cards)}</div>
    </section>''')
    return "\n".join(blocks)


def main() -> None:
    for i, day in enumerate(DAYS):
        prev = DAYS[i - 1] if i > 0 else None
        nxt = DAYS[i + 1] if i + 1 < len(DAYS) else None
        out = DAYS_DIR / f"day-{day['num']:02d}.html"
        out.write_text(render_day(day, prev, nxt), encoding="utf-8")

    landing_html = LANDING_TMPL.format(
        HEADER_NAV=HEADER_NAV, FOOTER=FOOTER, weeks_html=render_weeks(DAYS)
    )
    (ROOT / "index.html").write_text(landing_html, encoding="utf-8")
    print(f"Wrote {len(DAYS)} day pages + landing page.")


if __name__ == "__main__":
    main()
