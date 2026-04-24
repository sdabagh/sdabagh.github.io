"""
build.py

Generate the 28-day AI Certificate course:
  - Landing page (index.html)
  - 28 day pages (days/day-01.html ... days/day-28.html)

The day content lives in the DAYS list below. Edit content there, rerun this
script, and all pages regenerate from the canonical source.

Run:
  python3 build.py
"""

from __future__ import annotations
from pathlib import Path
from textwrap import dedent
import html
import json

ROOT = Path(__file__).resolve().parent
DAYS_DIR = ROOT / "days"
DAYS_DIR.mkdir(exist_ok=True)


# ----------------------------------------------------------------------
# Weeks structure (for grouping on the landing page)
# ----------------------------------------------------------------------

WEEKS = [
    ("Week 1", "Chat & Reasoning — the core LLMs", list(range(1, 8))),
    ("Week 2", "Agents & Builders — AI that acts", [8, 9, 10]),
    ("Week 3", "Image Generation — visual AI", [11, 12, 13, 14, 15]),
    ("Week 4", "Video & Audio — multimedia AI", [16, 17, 18, 19, 20]),
    ("Week 5", "Work & Productivity — daily-use stack", [21, 22, 23, 24, 25, 26]),
    ("Week 6", "Capstone & Certificate", [27, 28]),
]


# ----------------------------------------------------------------------
# The 28-day content manifest.
#
# Each entry has:
#   num        : day number (1-28)
#   tool       : tool name shown in title / cards
#   focus      : one-line tagline on cards
#   url        : official URL to bookmark
#   tagline    : longer tagline used in the day hero
#   why        : one paragraph, "why this tool matters"
#   walkthrough: list of numbered steps (strings)
#   exercise   : the hands-on task (string; may contain newlines)
#   tip        : a single pro-tip
#   link_label : what to call the bookmark link
# ----------------------------------------------------------------------

DAYS = [
    # ====================== WEEK 1: Chat & Reasoning ======================
    {
        "num": 1,
        "tool": "ChatGPT",
        "focus": "The conversation you've been hearing about.",
        "url": "https://chatgpt.com",
        "link_label": "chatgpt.com",
        "tagline": "Write a difficult email with a surprisingly good first draft.",
        "why": (
            "ChatGPT is the product that turned large language models into a "
            "household tool. It is the baseline every other chatbot is measured "
            "against, and it is still the best starting point for most tasks — "
            "brainstorming, summarizing, drafting, rewriting, and thinking "
            "out loud. You already know how to write an email; what you're "
            "learning today is how to have a draft ready in 90 seconds instead "
            "of 20 minutes."
        ),
        "walkthrough": [
            "Go to chatgpt.com and sign in (Google or email, both work).",
            "In the chat box, paste this prompt: <em>Draft a polite but firm email declining a colleague's request to take over their project while they are on leave. I am already at capacity. Keep it under 120 words, professional, and offer one alternative.</em>",
            "Read the draft. Notice what it got right and what sounds off.",
            "Reply to the chat with one sentence of revision: <em>Make it warmer and mention that I appreciate being thought of.</em>",
            "Accept the second draft, or keep iterating. Two or three rounds is normal.",
        ],
        "exercise": (
            "Pick a real email you have been putting off writing — the kind "
            "that requires careful wording. Use ChatGPT to produce a draft, "
            "then revise it once. Send the email today. (Or at least "
            "schedule it.)"
        ),
        "tip": (
            "Give it a role and a constraint. &ldquo;You are a seasoned "
            "operations manager. Draft this in under 100 words&rdquo; is "
            "worth four follow-ups of nudging."
        ),
    },
    {
        "num": 2,
        "tool": "Claude",
        "focus": "The chatbot for long, careful thinking.",
        "url": "https://claude.ai",
        "link_label": "claude.ai",
        "tagline": "Summarize a long PDF without reading the middle parts yourself.",
        "why": (
            "Claude is Anthropic's chatbot. It has two superpowers that matter "
            "for working professionals: it handles much longer documents than "
            "most alternatives (you can paste an entire handbook, contract, or "
            "journal article), and it writes with a steadier, more deliberate "
            "tone. If ChatGPT is the brainstorming partner, Claude is the one "
            "you hand the long document to before a meeting."
        ),
        "walkthrough": [
            "Sign in at claude.ai. The free plan is plenty for today.",
            "Find a long PDF on your desktop — a policy, a report, an article. Drag it into the chat.",
            "Ask: <em>Summarize this in three levels: one sentence, one paragraph, and one page. Use bullet points for the page-long version.</em>",
            "Scan the three summaries. Notice which level is most useful for your purpose.",
            "Follow up with: <em>What are the three most important questions a reader should ask after reading this?</em>",
        ],
        "exercise": (
            "Take a document you need to be familiar with by the end of this "
            "week — a meeting prep read, a memo, a research paper. Have Claude "
            "produce a one-paragraph summary plus the three questions. Keep "
            "the summary; it is your new briefing note."
        ),
        "tip": (
            "Claude respects custom styles. Try &ldquo;summarize in the "
            "voice of a cautious lawyer&rdquo; vs. &ldquo;summarize in the "
            "voice of an energetic startup founder&rdquo; — the shift is "
            "dramatic and occasionally exactly what you need."
        ),
    },
    {
        "num": 3,
        "tool": "Gemini",
        "focus": "Google's chatbot, wired into everything Google.",
        "url": "https://gemini.google.com",
        "link_label": "gemini.google.com",
        "tagline": "Ask a research question and get an answer with real sources.",
        "why": (
            "Gemini is Google's answer to ChatGPT, and it has two advantages "
            "that matter in practice: it is connected to live Google Search "
            "(so it handles current events competently), and it integrates "
            "directly into Gmail, Docs, and Sheets if you use Workspace. For "
            "anything where you need recent information, Gemini will often "
            "beat the pre-trained competition."
        ),
        "walkthrough": [
            "Go to gemini.google.com and sign in with your Google account.",
            "Ask: <em>What are the three most important developments in solar panel efficiency in the past 12 months? Cite the sources inline.</em>",
            "Notice the linked sources at the bottom of the response.",
            "Click one source to verify the claim. This is the &ldquo;trust but verify&rdquo; habit.",
            "Follow up with: <em>Rewrite that as a two-paragraph briefing I could forward to my boss.</em>",
        ],
        "exercise": (
            "Think of a question a colleague asked you recently where you "
            "had to say &ldquo;let me get back to you.&rdquo; Ask Gemini. "
            "Check the sources. Send the answer with citations — and with "
            "credit to yourself for knowing which tool to reach for."
        ),
        "tip": (
            "In Google Docs, Help me write now uses Gemini under the hood. "
            "The most-overlooked command is &ldquo;tone &middot; make it "
            "more formal&rdquo; — a two-second fix for any draft."
        ),
    },
    {
        "num": 4,
        "tool": "Perplexity",
        "focus": "A search engine that writes the answer for you.",
        "url": "https://www.perplexity.ai",
        "link_label": "perplexity.ai",
        "tagline": "Get a cited, verifiable answer instead of ten blue links.",
        "why": (
            "Perplexity is the tool you reach for when you want a cited "
            "answer fast. It searches the web in real time and writes a "
            "short synthesis with sources attached to every claim. It is "
            "less opinionated than ChatGPT and more focused than Google — "
            "a middle ground that is often exactly right for work questions."
        ),
        "walkthrough": [
            "Go to perplexity.ai. No account required to start.",
            "Ask: <em>What are the main differences between HSAs and FSAs for a US employee choosing benefits this year?</em>",
            "Read the answer. Each claim has a numbered source you can click.",
            "Try one of the <strong>follow-up suggestions</strong> at the bottom.",
            "Toggle <strong>Focus &rarr; Academic</strong> and re-ask a research question to see peer-reviewed sources only.",
        ],
        "exercise": (
            "Use Perplexity to answer a factual question you have been meaning "
            "to look up — a regulation, a historical fact, a comparison "
            "between two products. Open two of the cited sources to confirm. "
            "Save the conversation; Perplexity keeps a searchable history."
        ),
        "tip": (
            "Perplexity Spaces let you pin a set of trusted sources (your "
            "company wiki, a specific set of journals) and ask questions "
            "scoped to only those. Worth the 2 minutes to set up one."
        ),
    },
    {
        "num": 5,
        "tool": "DeepSeek",
        "focus": "A free, open-weight model that punches above its class.",
        "url": "https://chat.deepseek.com",
        "link_label": "chat.deepseek.com",
        "tagline": "Try a free alternative and notice the tradeoffs honestly.",
        "why": (
            "DeepSeek is an open-weight model out of a Chinese AI lab. It's "
            "free to use, surprisingly capable, and genuinely fast on "
            "reasoning tasks. Today is about knowing the alternatives exist "
            "— you are now someone who can honestly evaluate whether the "
            "$20/month premium tier is worth it for your use case."
        ),
        "walkthrough": [
            "Go to chat.deepseek.com and sign in.",
            "Paste a question you have already asked ChatGPT today. Compare the two answers side by side.",
            "Turn on <strong>DeepThink</strong> mode for a reasoning question (e.g. a logic puzzle, a planning task).",
            "Notice: it shows its chain of thought. Sometimes this is illuminating; sometimes it is noise.",
            "Ask: <em>What are the limitations of this model compared to ChatGPT or Claude?</em> — and read what it says about itself.",
        ],
        "exercise": (
            "Take one work task you did with ChatGPT this week. Redo it with "
            "DeepSeek. Which answer did you actually prefer? Keep the winner "
            "as your default for that category of task."
        ),
        "tip": (
            "Because it is open-weight, DeepSeek can be run locally or on "
            "private infrastructure. If data privacy is a blocker to using "
            "AI at work, DeepSeek is an important part of the conversation "
            "with your IT department."
        ),
    },
    {
        "num": 6,
        "tool": "Microsoft Copilot",
        "focus": "The AI already inside your Word, Excel, and Outlook.",
        "url": "https://copilot.microsoft.com",
        "link_label": "copilot.microsoft.com",
        "tagline": "Use AI inside the apps you already have open.",
        "why": (
            "If you have a Microsoft 365 license at work, Copilot is likely "
            "already there waiting — as a side panel in Word, a Draft-with-Copilot "
            "button in Outlook, a formula helper in Excel. Today is about "
            "turning it on and making it useful in the tool you already spend "
            "hours a day inside."
        ),
        "walkthrough": [
            "Open copilot.microsoft.com (free, no Office needed) or click the Copilot button in Word/Outlook/Excel if your organization provides it.",
            "In Outlook: compose a new email, click <strong>Draft with Copilot</strong>, and describe what you want to say in plain English.",
            "In Word: open a blank doc, click the Copilot icon, and ask it to draft a meeting agenda for a recurring team meeting.",
            "In Excel: select a column of numbers, click Copilot, and ask for a summary with the outliers highlighted.",
            "Compare how it feels versus switching to a separate tab for ChatGPT.",
        ],
        "exercise": (
            "Pick one document or email you were going to write this week "
            "anyway. Write it with Copilot inside the Microsoft app rather "
            "than with a separate chat tab. Notice what you save — or give up."
        ),
        "tip": (
            "Copilot's best feature in Outlook is the <strong>Coaching</strong> "
            "panel: paste a sensitive email you are about to send, and it "
            "will flag tone issues before you hit Send. Worth the insurance."
        ),
    },
    {
        "num": 7,
        "tool": "Grok",
        "focus": "Real-time news and opinions from X, synthesized.",
        "url": "https://grok.com",
        "link_label": "grok.com",
        "tagline": "Synthesize what the internet is actually saying right now.",
        "why": (
            "Grok is xAI's chatbot, integrated directly with X (formerly Twitter). "
            "Its edge is live access to the conversation happening on X in the "
            "last hour — useful for breaking news, market reactions, and the "
            "informal pulse of an industry. Treat it as a lens, not a source "
            "of truth."
        ),
        "walkthrough": [
            "Go to grok.com (free tier available) or open Grok inside X.",
            "Ask: <em>What is the market saying about the latest Fed rate decision?</em> (or whatever is happening this week).",
            "Notice that Grok cites recent posts, not just web pages.",
            "Ask a question in your professional domain: <em>What are researchers on X discussing about [your field] this week?</em>",
            "Compare the tone to what ChatGPT says about the same question — Grok is more informal and opinionated.",
        ],
        "exercise": (
            "Pick a topic in your field. Ask Grok what the live conversation "
            "on X is saying. Open two of the cited posts to see the source. "
            "Decide whether this is a useful signal or too noisy for your "
            "work. (It's different for everyone.)"
        ),
        "tip": (
            "Grok can be dismissive of sources it disagrees with. Always "
            "follow through to the cited posts. You are using it for the "
            "pulse of the conversation, not the truth of it."
        ),
    },
    # ====================== WEEK 2: Agents & Builders ======================
    {
        "num": 8,
        "tool": "Lovable",
        "focus": "Describe an app in English; get a working app.",
        "url": "https://lovable.dev",
        "link_label": "lovable.dev",
        "tagline": "Build a small web app without writing a line of code.",
        "why": (
            "Lovable is the poster child for &ldquo;vibe coding&rdquo; — you "
            "describe what you want in plain English, and it builds a working "
            "web app with a real database behind it. This was science fiction "
            "two years ago. Today is about proving to yourself that the "
            "software you imagine is within reach without a developer."
        ),
        "walkthrough": [
            "Go to lovable.dev and sign up.",
            "In the prompt box, type: <em>A small web app to track books I want to read. Fields: title, author, why I want to read it, status (unread / reading / finished). A simple list view and an add-new form. Use pleasant colors.</em>",
            "Wait about a minute. Lovable generates the code and opens a preview on the right.",
            "Try adding a book. Does it work? Edit the prompt to tweak: <em>Add a &ldquo;started date&rdquo; field and sort the list by status.</em>",
            "When you are happy, click <strong>Publish</strong>. You now have a URL to share.",
        ],
        "exercise": (
            "Build one real tool you have been wishing existed — a simple "
            "form, a tracker, a calculator. Keep the scope tiny (one page). "
            "Publish it. Send yourself the link."
        ),
        "tip": (
            "Lovable gets confused by very complex requirements. If a prompt "
            "produces something broken, do not argue with it — start a new "
            "project and write a shorter, clearer prompt."
        ),
    },
    {
        "num": 9,
        "tool": "Manus",
        "focus": "An AI agent that can do multi-step research on its own.",
        "url": "https://manus.im",
        "link_label": "manus.im",
        "tagline": "Delegate a multi-step task instead of asking a question.",
        "why": (
            "Manus represents the next tier: an <em>agent</em>, not a chatbot. "
            "You give it a goal, it plans the steps, opens tabs, reads pages, "
            "writes notes, and comes back with a deliverable. It is slow, "
            "sometimes wrong, and genuinely astonishing when it works. Today "
            "is about understanding the shape of this new kind of tool."
        ),
        "walkthrough": [
            "Go to manus.im and request access if needed (the waitlist moves fast).",
            "Give it a task: <em>Research three electric SUVs in the $50-70k range that are available in California today. Build me a comparison table covering range, charging speed, cargo space, and tax credit eligibility. Cite every number.</em>",
            "Watch the live trace: it searches, opens pages, compares data.",
            "When it finishes, review the table. Ask follow-up questions to refine.",
            "Notice the times it made mistakes. That is the cost of this tier of tool right now.",
        ],
        "exercise": (
            "Delegate one multi-hour research task you have been dreading — "
            "comparing health plans, researching vendors, drafting a "
            "competitive analysis. Let Manus take a first pass. You review "
            "and refine. Note how long you saved."
        ),
        "tip": (
            "Agents work best when the success criterion is obvious (a table, "
            "a list, a ranked shortlist). Vague goals like &ldquo;help me "
            "think&rdquo; are a job for ChatGPT, not Manus."
        ),
    },
    {
        "num": 10,
        "tool": "Kimi",
        "focus": "A chatbot that handles genuinely enormous documents.",
        "url": "https://kimi.com",
        "link_label": "kimi.com",
        "tagline": "Summarize a 200-page document in one conversation.",
        "why": (
            "Kimi (from Moonshot AI) has one standout feature: an enormous "
            "context window, meaning it can read and reason over very long "
            "documents in a single pass. If you work with long reports, "
            "legal filings, scientific literature reviews, or hefty "
            "transcripts, Kimi is a tool worth knowing about."
        ),
        "walkthrough": [
            "Go to kimi.com. Sign in via QR code or email.",
            "Upload the longest work document you have — a report, a handbook, a transcript.",
            "Ask: <em>Give me a one-page executive summary, then list the three most important tables or figures and explain what each one shows.</em>",
            "Ask a specific question about a detail buried on page 180. It should actually know.",
            "Try: <em>Write five follow-up questions I should ask the author.</em>",
        ],
        "exercise": (
            "Take the longest document you have been meaning to read — a "
            "product spec, a research paper, a whitepaper, a book. Upload to "
            "Kimi. Come away with the one-page summary and three questions. "
            "That is your reading for the week, compressed."
        ),
        "tip": (
            "Long-context models sometimes miss details in the middle of a "
            "document. Always ask a specific middle-document question as a "
            "sanity check before trusting a long summary."
        ),
    },
    # ====================== WEEK 3: Image Generation ======================
    {
        "num": 11,
        "tool": "Midjourney",
        "focus": "The image model with the best artistic eye.",
        "url": "https://www.midjourney.com",
        "link_label": "midjourney.com",
        "tagline": "Create a genuinely beautiful image for a presentation or post.",
        "why": (
            "Midjourney has the strongest aesthetic of any image model. Its "
            "defaults look like cover art. For anything where the look "
            "matters — presentation backdrops, blog headers, marketing "
            "concepts — it is still the gold standard."
        ),
        "walkthrough": [
            "Go to midjourney.com and sign in. The web interface replaces the old Discord workflow.",
            "Type a prompt like: <em>A minimalist illustration of a teacher explaining data to a room of adults, soft pastel colors, editorial style, horizontal composition</em>.",
            "Wait for four variations. Click one to upscale.",
            "Use the <strong>Vary (Subtle)</strong> button to iterate without starting over.",
            "Download the one you like at 2x resolution.",
        ],
        "exercise": (
            "Create one professional image you actually need — a banner, a "
            "header, a metaphor for a concept in a talk. Use it. Your "
            "slide-of-the-month got an upgrade."
        ),
        "tip": (
            "The hardest part is prompt writing. Study the <strong>Explore</strong> "
            "feed: copy prompts that look great and modify the nouns. You "
            "will learn the aesthetic vocabulary quickly."
        ),
    },
    {
        "num": 12,
        "tool": "DALL\u00b7E 3 (inside ChatGPT)",
        "focus": "Image generation inside the tool you already use.",
        "url": "https://chatgpt.com",
        "link_label": "chatgpt.com",
        "tagline": "Generate illustrations without switching apps.",
        "why": (
            "DALL\u00b7E 3 lives inside ChatGPT. That convenience is its "
            "superpower — you can describe an image conversationally, refine "
            "it with plain English (&ldquo;make the cat orange, and put it on a "
            "red chair&rdquo;), and copy-paste it into a document without "
            "leaving the tab. It is less stylish than Midjourney, but much "
            "easier to iterate on."
        ),
        "walkthrough": [
            "In ChatGPT, start a new chat. Type: <em>Draw a friendly illustration of a scientist explaining a pie chart to a skeptical cat. Flat colors, editorial style.</em>",
            "ChatGPT generates the image. Ask for changes conversationally: <em>Make the cat look more skeptical. Add a lab coat on the scientist.</em>",
            "Ask: <em>Keep the same style but draw the scientist explaining a bar chart instead.</em> (Style continuity in one conversation.)",
            "Download the image (right-click &rarr; Save).",
            "For a series (a deck, a blog post), ask ChatGPT to plan the images first, then generate each one.",
        ],
        "exercise": (
            "Generate two illustrations for a presentation, a blog post, or a "
            "social post you are working on this week. Keep them in the same "
            "visual style. Use them."
        ),
        "tip": (
            "ChatGPT refuses to draw real people by name. Describe the "
            "person's role and appearance instead (e.g. &ldquo;a middle-aged "
            "doctor with kind eyes&rdquo;) and you will get something usable."
        ),
    },
    {
        "num": 13,
        "tool": "Leonardo AI",
        "focus": "Image generation with fine-grained style controls.",
        "url": "https://leonardo.ai",
        "link_label": "leonardo.ai",
        "tagline": "Design a logo, brand asset, or brand-consistent illustration.",
        "why": (
            "Leonardo AI's edge is control. It has specialized models for "
            "specific styles (photoreal portraits, flat illustration, game "
            "assets, anime), plus tools for reference images, consistent "
            "characters, and brand colors. If you need your AI images to feel "
            "like a coherent set, Leonardo is the right stop."
        ),
        "walkthrough": [
            "Go to leonardo.ai and sign up. The free plan gives you 150 generations per day.",
            "Pick a model from the library — try <strong>Leonardo Phoenix</strong> for versatility.",
            "Generate a logo concept: <em>A minimalist logo for a literacy nonprofit, geometric shapes, friendly, book silhouette subtly integrated, black on white</em>.",
            "Upload a reference image of a style you like (your brand color palette, an existing asset). Use it as a <strong>Style Reference</strong>.",
            "Iterate. Leonardo's <strong>Image Guidance</strong> slider controls how much the output looks like your reference.",
        ],
        "exercise": (
            "Design three concept variations of something your work could "
            "use: a talk logo, a section header, an icon set. Keep them in "
            "one consistent style. Screenshot the contact sheet."
        ),
        "tip": (
            "For a logo, ALWAYS regenerate the final chosen concept as SVG "
            "by taking the PNG into a vector tracing tool. AI-generated PNGs "
            "look great at slide size and terrible at business-card size."
        ),
    },
    {
        "num": 14,
        "tool": "Nano Banana",
        "focus": "Google's image editor that uses natural-language edits.",
        "url": "https://gemini.google.com",
        "link_label": "gemini.google.com",
        "tagline": "Edit a photo by describing what should change.",
        "why": (
            "&ldquo;Nano Banana&rdquo; is the nickname for Google's image "
            "editing feature in Gemini. Upload a photo, describe the change "
            "you want, and it edits the image without destroying the rest. "
            "Remove an object. Change a background. Swap a color. For the "
            "everyday editing you used to do in Photoshop, this is the "
            "fastest path."
        ),
        "walkthrough": [
            "Go to gemini.google.com. Upload any photo you have on your phone.",
            "Type: <em>Remove the person in the background on the left side. Keep everything else exactly the same.</em>",
            "Wait 10 seconds. Compare before and after.",
            "Try: <em>Change the sky to a dramatic sunset.</em> Then: <em>Put the same person in a suit instead of a t-shirt.</em>",
            "Download the edited version.",
        ],
        "exercise": (
            "Take three real photos from your camera roll. Make one edit to "
            "each: remove a stranger, change a background, fix bad lighting. "
            "You are now the person who does photo edits in a minute."
        ),
        "tip": (
            "Nano Banana is surprisingly good at maintaining the identity of a "
            "person's face across edits. That also means you need to be "
            "thoughtful — don't edit someone else's photo of themselves "
            "without their permission."
        ),
    },
    {
        "num": 15,
        "tool": "Canva Magic Studio",
        "focus": "AI embedded in the design tool you already use.",
        "url": "https://www.canva.com",
        "link_label": "canva.com",
        "tagline": "Design a flyer or one-pager in under five minutes.",
        "why": (
            "Canva quietly added AI to every corner of its design tool: "
            "generate text, generate images, write copy, remove backgrounds, "
            "translate, resize to any format. If your job involves making "
            "flyers, social graphics, or one-pagers, Canva Magic Studio is "
            "the productivity unlock."
        ),
        "walkthrough": [
            "Open canva.com. Click <strong>Create a design</strong> &rarr; <strong>Flyer</strong>.",
            "In the blank canvas, click <strong>Magic Design</strong> and describe what you need: <em>A flyer announcing a weekend workshop on financial planning for families, warm colors, approachable.</em>",
            "Canva generates several templates. Pick one.",
            "Use <strong>Magic Write</strong> to generate the body copy inline.",
            "Use <strong>Magic Eraser</strong> to clean up the stock photo. Use <strong>Magic Resize</strong> to make an Instagram version.",
        ],
        "exercise": (
            "Design one thing you actually need this week — a flyer, a "
            "social graphic, a poster for your fridge. Use at least three "
            "Magic Studio features. Export as PDF."
        ),
        "tip": (
            "Canva's AI is weakest at generating photo-real people. Lean on "
            "its <strong>illustrations</strong> and <strong>icons</strong> "
            "(which it does beautifully) and save the human photography for "
            "stock sources."
        ),
    },
    # ====================== WEEK 4: Video & Audio ======================
    {
        "num": 16,
        "tool": "Veo 3",
        "focus": "Google's text-to-video model with synced audio.",
        "url": "https://gemini.google.com",
        "link_label": "gemini.google.com",
        "tagline": "Generate a short video clip with matching sound.",
        "why": (
            "Veo 3 is Google's text-to-video model, notable for generating "
            "video AND synchronized audio (dialogue, ambient sound) from a "
            "single prompt. This is the tier of AI that turns a one-sentence "
            "idea into a usable clip without a camera, an actor, or a studio."
        ),
        "walkthrough": [
            "Open Gemini (or the Veo 3 interface in Google Labs if available to you).",
            "Prompt: <em>A cozy neighborhood coffee shop at 7am, morning light streaming through windows, a barista steaming milk, soft jazz playing in the background. 8 seconds, cinematic.</em>",
            "Wait. Video generation takes 30-90 seconds.",
            "Watch with sound. Notice the synced ambient noise.",
            "Try a second prompt, shorter: <em>A teacher explaining a concept on a whiteboard. Her voice is warm. She says: &lsquo;And that is why the sample mean has less variance than a single observation.&rsquo;</em>",
        ],
        "exercise": (
            "Generate one 8-second clip you could conceivably use — for a "
            "social post, an intro to a talk, a mood piece. Download it. "
            "Share it with yourself."
        ),
        "tip": (
            "Video generation is expensive on Google's end; rate limits are "
            "tight on free tiers. Save your prompts in a doc and batch your "
            "experiments so you don't waste quota on typos."
        ),
    },
    {
        "num": 17,
        "tool": "Sora 2",
        "focus": "OpenAI's video model with a focus on physical realism.",
        "url": "https://sora.com",
        "link_label": "sora.com",
        "tagline": "Generate a cinematic clip from a description.",
        "why": (
            "Sora 2 is OpenAI's text-to-video model. Its focus is on physical "
            "realism — objects bounce, fall, and collide the way things "
            "actually do. For scenes that need to look genuinely believable "
            "rather than artistic, Sora 2 is typically the stronger choice "
            "over Veo for the same prompt."
        ),
        "walkthrough": [
            "Go to sora.com. Sign in with your OpenAI account.",
            "Try a prompt where physics matters: <em>A ceramic coffee cup slides slowly across a polished wooden table as the camera follows. It reaches the edge and tips, spilling coffee. 6 seconds, slow motion.</em>",
            "Compare to the same prompt in Veo 3. Which feels more physically correct?",
            "Try an interior scene: <em>A small dog running up a flight of carpeted stairs. Handheld camera. 5 seconds.</em>",
            "Save both outputs. Notice your own taste — where do you prefer Sora, and where do you prefer Veo?",
        ],
        "exercise": (
            "Pick a scene from your life — something ordinary. Generate it "
            "in Sora. The point is not to make art; it is to see how "
            "passably your real environment can be simulated by an AI "
            "today."
        ),
        "tip": (
            "Sora is strict about requests involving real people, logos, and "
            "children. Describe generic roles (&ldquo;a woman in her 40s in a "
            "lab coat&rdquo;) rather than named individuals."
        ),
    },
    {
        "num": 18,
        "tool": "Synthesia",
        "focus": "Generate a presenter-style video with an AI avatar.",
        "url": "https://www.synthesia.io",
        "link_label": "synthesia.io",
        "tagline": "Create a training video without recording yourself.",
        "why": (
            "Synthesia turns a script into a professional-looking video "
            "with an AI presenter. For training content, onboarding videos, "
            "internal announcements, or translations, it replaces the camera, "
            "the teleprompter, the editor, and the re-shoots. You type the "
            "script; it handles the rest."
        ),
        "walkthrough": [
            "Go to synthesia.io and start a free trial.",
            "Pick an avatar that looks credible for your use case. Browse the diversity of options first.",
            "Paste a 90-second script — a welcome message, a policy explainer, a how-to.",
            "Pick a slide template. Add a few bullets on the right side of the video.",
            "Click generate. Wait a minute. Download the MP4.",
        ],
        "exercise": (
            "Record one real message you would otherwise have to shoot "
            "yourself — a welcome message, a change announcement, a tutorial "
            "snippet. Watch it. Send it if useful. Notice the uncanny-valley "
            "moments; decide whether they are a dealbreaker for your context."
        ),
        "tip": (
            "Synthesia shines for multilingual translation: write once, "
            "generate in 30 languages. Before you ship translated content, "
            "have a native speaker review — it is usually good, occasionally "
            "awkward."
        ),
    },
    {
        "num": 19,
        "tool": "Kling",
        "focus": "A strong Chinese alternative for text-to-video.",
        "url": "https://klingai.com",
        "link_label": "klingai.com",
        "tagline": "Try another video model and notice how they differ.",
        "why": (
            "Kling is Kuaishou's text-to-video model out of China. It "
            "competes directly with Veo and Sora, and for certain subjects "
            "(especially stylized, cinematic shots) it is surprisingly "
            "strong. Today is about broadening your bench — when Veo gives "
            "you nothing you like, Kling is the second shot."
        ),
        "walkthrough": [
            "Go to klingai.com. Sign up with an email.",
            "Try a prompt you have already tried in Veo or Sora. Generate.",
            "Compare side by side. Notice stylistic differences.",
            "Try a prompt that emphasizes cinematography: <em>A lone lighthouse keeper climbs a spiral staircase at dusk, warm lamplight glowing above. Anamorphic lens, cinematic, 8 seconds.</em>",
            "Keep a short note: for what kind of scene does each model shine?",
        ],
        "exercise": (
            "Pick a scene and generate it in all three models you now know "
            "(Veo, Sora, Kling). Put them side by side. That comparison is "
            "your cheat sheet for the next year."
        ),
        "tip": (
            "Kling's free tier is generous, but queues are long during peak "
            "hours (GMT+8 business hours). Generate overnight (US time) for "
            "much faster results."
        ),
    },
    {
        "num": 20,
        "tool": "AssemblyAI",
        "focus": "Transcribe, summarize, and analyze any audio file.",
        "url": "https://www.assemblyai.com/playground",
        "link_label": "assemblyai.com/playground",
        "tagline": "Turn a meeting recording into a searchable transcript.",
        "why": (
            "AssemblyAI is a speech-to-text API with a no-code playground. "
            "Upload an audio or video file; get back a transcript, a summary, "
            "key chapters, sentiment, and speaker labels. For anyone who "
            "attends meetings, interviews, or lectures, this is quietly "
            "life-changing."
        ),
        "walkthrough": [
            "Go to assemblyai.com/playground. Sign up — the free tier is ample.",
            "Upload any audio file you have: a recorded meeting, a voice memo, a podcast.",
            "Turn on <strong>Speaker Diarization</strong> and <strong>Auto Chapters</strong> before transcribing.",
            "Review the results: you will get a clean transcript, with speaker tags and chapter breaks.",
            "Copy the summary into your notes app. Save 20 minutes you would have spent re-listening.",
        ],
        "exercise": (
            "Record a 3-minute voice memo of yourself thinking out loud about "
            "one work problem. Upload to AssemblyAI. Read the transcript "
            "back. Notice what you actually thought vs. what you remembered "
            "thinking."
        ),
        "tip": (
            "For Zoom meetings, the cleanest workflow is: record locally &rarr; "
            "upload to AssemblyAI &rarr; save the transcript next to your "
            "notes. In a few weeks you will have a searchable archive of "
            "every meeting you cared about."
        ),
    },
    # ====================== WEEK 5: Work & Productivity ======================
    {
        "num": 21,
        "tool": "Notion AI",
        "focus": "AI inside the doc you already use for everything.",
        "url": "https://www.notion.so",
        "link_label": "notion.so",
        "tagline": "Turn rough notes into a polished doc without copying anything out.",
        "why": (
            "Notion's AI lives inside every page. Type <code>/</code>, pick an "
            "AI action, and it operates on your existing notes — summarize, "
            "expand, translate, rewrite, make into a table, turn into action "
            "items. If Notion is already where your knowledge lives, AI "
            "inside it is more useful than any external chatbot."
        ),
        "walkthrough": [
            "In any Notion page, type <code>/ai</code> and explore the menu.",
            "Drop your last meeting notes into a page. Select them.",
            "Run <strong>Summarize</strong>, then <strong>Find action items</strong>, then <strong>Translate &rarr; Spanish</strong>.",
            "Try <strong>AI blocks</strong>: a block that auto-summarizes anything you paste below it. Useful for running logs.",
            "Give Notion AI custom instructions (&ldquo;You are a concise product manager&rdquo;) so every action reflects your voice.",
        ],
        "exercise": (
            "Take one messy set of meeting notes. Run it through three "
            "Notion AI actions: summarize, extract action items, draft a "
            "follow-up email. That transformation — five minutes, start to "
            "finish — is the habit."
        ),
        "tip": (
            "Notion AI has access only to the page you are on by default. "
            "To make it reason over your whole workspace, turn on "
            "<strong>Q&amp;A</strong> in workspace settings and ask "
            "&ldquo;What did we decide about X last quarter?&rdquo;"
        ),
    },
    {
        "num": 22,
        "tool": "Jasper",
        "focus": "An AI writing tool tuned for marketing teams.",
        "url": "https://www.jasper.ai",
        "link_label": "jasper.ai",
        "tagline": "Write marketing copy that sounds like a professional wrote it.",
        "why": (
            "Jasper is an AI writing platform built for marketers and content "
            "teams. Its edge is templates (email sequences, landing pages, "
            "social posts) plus brand-voice training — you give it samples "
            "of your writing, and it reproduces your tone across assets. "
            "For anyone who owns external comms, this is a force-multiplier."
        ),
        "walkthrough": [
            "Go to jasper.ai. Start the free trial.",
            "Create a <strong>Brand Voice</strong>: paste three samples of your existing writing (a blog post, a newsletter, a social caption). Jasper learns the voice.",
            "Pick the <strong>AIDA email template</strong>. Describe the product: <em>A free Saturday workshop on retirement planning basics for busy parents.</em>",
            "Jasper generates four variants. Edit the best one.",
            "Run the same product through the <strong>Landing Page Hero</strong> template. Notice the voice consistency.",
        ],
        "exercise": (
            "Train one brand voice on three pieces of your own writing. "
            "Then generate a marketing email in that voice for a real thing "
            "you are promoting. Save the brand voice — it is now reusable."
        ),
        "tip": (
            "Jasper shines for volume. For a one-off email, ChatGPT is fine. "
            "The moment you need 30 emails in the same voice, Jasper pays "
            "for itself. Don't over-adopt; match the tool to the volume."
        ),
    },
    {
        "num": 23,
        "tool": "Beautiful.ai",
        "focus": "Presentations that design themselves as you type.",
        "url": "https://www.beautiful.ai",
        "link_label": "beautiful.ai",
        "tagline": "Build a presentation from an outline in under ten minutes.",
        "why": (
            "Beautiful.ai is a presentation tool whose AI layout engine keeps "
            "every slide looking polished as you add content. Its newer AI "
            "features (<em>DesignerBot</em>) will build an entire deck from "
            "a single prompt. For anyone who spends hours fighting with "
            "PowerPoint alignment, this is the escape hatch."
        ),
        "walkthrough": [
            "Go to beautiful.ai and start a trial.",
            "Click <strong>Generate with DesignerBot</strong>. Describe the deck: <em>A 10-slide deck for a town hall on new company benefits. Cover: what's changing, who is affected, the timeline, the FAQ, and next steps. Confident, clear tone.</em>",
            "Wait 45 seconds. Review the generated deck.",
            "Edit a slide by typing. Notice that the layout auto-adjusts as the content grows.",
            "Export to PowerPoint for the meeting — your audience will never know.",
        ],
        "exercise": (
            "Build one real deck you need for a meeting this week. Use "
            "DesignerBot to draft, then customize. Time yourself. The "
            "benchmark is &lt;30 minutes, end to end."
        ),
        "tip": (
            "Beautiful.ai is at its best for 10-15 slide decks. For a "
            "50-slide board report, it fights you. Use it for the decks "
            "where style matters more than density."
        ),
    },
    {
        "num": 24,
        "tool": "Fathom",
        "focus": "Automatic meeting notes and action items from Zoom.",
        "url": "https://fathom.video",
        "link_label": "fathom.video",
        "tagline": "Never take notes in a Zoom meeting again.",
        "why": (
            "Fathom joins your Zoom, Google Meet, or Teams meeting as a bot, "
            "records it, transcribes it, and — the clever part — produces "
            "a <em>summary with action items and timestamps</em> while you "
            "are still saying goodbye. Free forever for the basic tier. "
            "This is the tool that most directly returns hours to your week."
        ),
        "walkthrough": [
            "Go to fathom.video and connect it to your calendar and Zoom/Meet/Teams.",
            "Schedule (or wait for) your next meeting. Fathom joins automatically.",
            "After the meeting, check your email: Fathom has sent the summary, action items, and highlights.",
            "Click a highlight to jump to that moment in the recording.",
            "Share the summary with the attendees as a follow-up note. You have replaced 20 minutes of post-meeting writing.",
        ],
        "exercise": (
            "Let Fathom sit in on your next three meetings this week. At the "
            "end of each, review the auto-summary before writing anything. "
            "Decide: do you still need human notes, or does Fathom's output "
            "cover it?"
        ),
        "tip": (
            "Always tell the meeting it is being recorded. Some jurisdictions "
            "(and all of good manners) require it. Fathom has a setting to "
            "auto-announce on join."
        ),
    },
    {
        "num": 25,
        "tool": "Zapier AI",
        "focus": "Automate workflows by describing them in English.",
        "url": "https://zapier.com",
        "link_label": "zapier.com",
        "tagline": "Automate a three-step workflow in five minutes.",
        "why": (
            "Zapier has been the universal glue between work apps for a "
            "decade. Its AI layer (<em>Copilot</em>) lets you describe a "
            "workflow in plain English, and it builds the &ldquo;Zap&rdquo; "
            "automation for you. If you have been thinking &ldquo;someone "
            "should automate this,&rdquo; this is where you become that "
            "someone."
        ),
        "walkthrough": [
            "Go to zapier.com. Sign up (free).",
            "Click <strong>Create Zap</strong> &rarr; <strong>Copilot</strong>.",
            "Describe a real need: <em>When a new row is added to my Google Sheet of event RSVPs, send me a Slack message and email the attendee a confirmation.</em>",
            "Copilot builds the Zap. Connect the accounts it asks for (Google, Slack, email).",
            "Test it with one row. Watch the chain fire.",
        ],
        "exercise": (
            "Automate one thing you do manually every week. Literally "
            "anything: RSS to email, form to spreadsheet, calendar to task "
            "list. Turn it on. You just bought back that recurring time."
        ),
        "tip": (
            "Zapier's AI Actions let you call ChatGPT/Claude <em>inside</em> "
            "a Zap, so an incoming email can be summarized and routed based "
            "on its content. Once you see that possibility, half your "
            "inbox can be automated."
        ),
    },
    {
        "num": 26,
        "tool": "Meta AI",
        "focus": "The AI inside WhatsApp, Instagram, and Facebook.",
        "url": "https://www.meta.ai",
        "link_label": "meta.ai",
        "tagline": "Ask AI questions from the apps you check anyway.",
        "why": (
            "Meta AI is built into WhatsApp, Messenger, Instagram, and "
            "Facebook — and is free. For quick questions during a chat, image "
            "understanding on a photo you just took, and multilingual help "
            "on the go, it is the AI with the lowest activation energy. You "
            "don't open an app; it is already there."
        ),
        "walkthrough": [
            "On your phone, open WhatsApp. Tap <strong>New chat</strong> &rarr; <strong>Meta AI</strong>.",
            "Ask it a quick question: <em>What is the capital of Uruguay, and give me one interesting fact about it?</em>",
            "Take a photo of a receipt or a plant. Attach it. Ask: <em>What is this, and how do I care for it?</em> (or: <em>Itemize this receipt.</em>)",
            "In Instagram, tap the search bar and ask Meta AI a question about a trend.",
            "Try a creative generation: <em>Write me a poem about being 45 and learning AI tools.</em>",
        ],
        "exercise": (
            "Spend one full day (today) asking Meta AI every casual "
            "question you would normally Google. Notice the shape of "
            "answers. Decide which questions are worth the weight of a "
            "full chatbot conversation and which are fine here."
        ),
        "tip": (
            "Meta AI is chatty and less careful than Claude or ChatGPT. "
            "Never use it for anything high-stakes (medical, legal, "
            "financial). It is the casual tier of your AI stack."
        ),
    },
    # ====================== WEEK 6: Capstone & Certificate ======================
    {
        "num": 27,
        "tool": "Capstone",
        "focus": "Chain three tools into one real workflow.",
        "url": "",
        "link_label": "",
        "tagline": "Take the training wheels off. One project. Three tools.",
        "why": (
            "You have now used 26 AI tools. Today you prove that you can "
            "combine them — which is the actual skill. The best AI users "
            "are not the ones who know the most tools; they are the ones "
            "who see which tool to reach for at which step of a real task."
        ),
        "walkthrough": [
            "Pick a real project you need to do in the next two weeks. A talk to prepare. A report to write. A decision to make. Not a fake example.",
            "Sketch the steps you would normally take.",
            "For each step, choose the right tool from your new toolbox. Write the plan: <em>Step 1 &mdash; use Claude to summarize the three source docs. Step 2 &mdash; use Midjourney to generate three candidate cover images. Step 3 &mdash; use Beautiful.ai to build the deck with DesignerBot.</em>",
            "Execute. Note what worked and what surprised you.",
            "Write it up as a 200-word case study. (Or use Claude to help.)",
        ],
        "exercise": (
            "Your capstone is one real project, completed using at least "
            "three tools from this course. The deliverable is both the "
            "project and a short write-up of your process. That write-up is "
            "what makes this real learning instead of just clicking through."
        ),
        "tip": (
            "When you get stuck, the answer is usually not &ldquo;try "
            "harder with this tool&rdquo; — it is &ldquo;wrong tool, switch "
            "to a different one.&rdquo; Taste in tool choice is the meta-skill "
            "this course has been teaching."
        ),
    },
    {
        "num": 28,
        "tool": "Certificate",
        "focus": "Reflect. Download. Move on.",
        "url": "",
        "link_label": "",
        "tagline": "You finished. Claim the certificate and decide what comes next.",
        "why": (
            "You just used 26 AI tools in 28 days, plus a capstone. That is "
            "more hands-on exposure than most professionals will have for "
            "another year or two. Today is about marking the moment, "
            "generating your certificate, and deciding where to go next."
        ),
        "walkthrough": [
            "Confirm all 28 days are marked complete on the landing page.",
            "Scroll down on this page to the <strong>Certificate</strong> section and enter your name exactly as you want it to appear.",
            "Click <strong>Generate Certificate</strong>. A PDF downloads.",
            "Share it on LinkedIn, print it, frame it — whatever makes the accomplishment feel real.",
            "Keep one habit. Pick the tool you used the most and make it a daily driver for the next 30 days.",
        ],
        "exercise": (
            "Write yourself a two-sentence answer to this: <em>What changed "
            "about how I work because of the last 28 days?</em> That "
            "sentence is what you share when someone asks about the "
            "certificate."
        ),
        "tip": (
            "AI tools change monthly. The certificate marks that you have "
            "the <em>habit</em> of picking them up, not that you have "
            "memorized any particular one. The habit is the durable skill."
        ),
    },
]


# ----------------------------------------------------------------------
# Templates
# ----------------------------------------------------------------------

HEADER_NAV = '''<header>
  <div class="site-title">Learn Without Walls</div>
  <nav>
    <a href="/index.html">Home</a>
    <div class="nav-dropdown"><a href="/about.html">About</a><div class="dropdown-menu"><a href="/about.html">About Me</a><a href="/research.html">Research</a></div></div>
    <div class="nav-dropdown"><a href="/free-courses.html">Courses</a><div class="dropdown-menu"><a href="/free-courses.html">All Courses</a><div class="dropdown-divider"></div><a href="/learn/financial-literacy/hub.html">Financial Literacy</a><a href="/learn/trigonometry/index.html">Math Courses</a><a href="/learn/intro-python/index.html">Programming</a><a href="/learn/ai-certificate/index.html">AI Certificate (28 days)</a></div></div>
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


def render_landing(days: list[dict]) -> str:
    day_by_num = {d["num"]: d for d in days}
    week_blocks = []
    for week_num_label, week_title, nums in WEEKS:
        cards = []
        for n in nums:
            d = day_by_num[n]
            day_page = f"days/day-{n:02d}.html"
            cards.append(f'''<a class="day-card" data-day="{n}" href="{day_page}">
        <span class="day-num">Day {n}</span>
        <span class="day-tool">{html.escape(d["tool"])}</span>
        <span class="day-focus">{d["focus"]}</span>
        <span class="day-check" aria-hidden="true"></span>
      </a>''')
        week_blocks.append(f'''<section class="week-section">
      <div class="week-header">
        <div class="week-number">{week_num_label}</div>
        <div class="week-title">{html.escape(week_title)}</div>
      </div>
      <div class="day-grid">
        {"".join(cards)}
      </div>
    </section>''')

    return dedent(f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Certificate in 28 Days &mdash; Learn Without Walls</title>
  <meta name="description" content="A free 28-day AI Certificate program. 15 minutes a day, 26 AI tools, a capstone, and a certificate. Especially useful if you are over 40 and want a practical guided tour of modern AI.">
  <link rel="stylesheet" href="/style.css">
  <link rel="stylesheet" href="assets/ai-cert.css">
</head>
<body>

{HEADER_NAV}

<main class="container">

  <section class="ai-hero">
    <h1>AI Certificate in 28 Days</h1>
    <p class="subtitle">15 minutes a day. 26 tools, one capstone, one certificate.</p>
    <div class="hero-meta">
      <div class="meta-item"><span class="meta-num">28</span><span class="meta-label">Days</span></div>
      <div class="meta-item"><span class="meta-num">26</span><span class="meta-label">AI tools</span></div>
      <div class="meta-item"><span class="meta-num">15</span><span class="meta-label">Minutes a day</span></div>
      <div class="meta-item"><span class="meta-num">100%</span><span class="meta-label">Free</span></div>
    </div>
    <p data-welcome-reminder style="opacity:0.9; font-size:0.95rem; margin-top:0.5rem;">&nbsp;</p>
  </section>

  <div class="audience-callout">
    <strong>Especially if you&rsquo;re over 40.</strong>
    This course is written for working professionals who&rsquo;ve watched the AI wave from a distance
    and want a guided, low-stakes way in. No coding. No jargon that isn&rsquo;t defined on the spot.
    Every day is one tool, one walkthrough, and one hands-on task you&rsquo;ll actually use.
  </div>

  <section class="progress-summary">
    <h3>Your Progress</h3>
    <div class="progress-bar-outer"><div class="progress-bar-inner"></div></div>
    <div class="progress-stats">
      <span class="stats-left">0 of 28 days complete</span>
      <span class="stats-right">0%</span>
    </div>
  </section>

  <section>
    <h2>What you will do</h2>
    <p>
      Each day is one AI tool. You&rsquo;ll read a short &ldquo;why this matters,&rdquo; walk through a
      concrete example, then do a hands-on exercise that fits in 10 minutes. Mark the day complete
      when you finish. At the end of Day 28, a PDF certificate with your name on it unlocks and
      downloads.
    </p>
    <ol style="margin-left:1.5rem;">
      <li><strong>Read</strong> a short framing (why this tool matters, and what it replaces).</li>
      <li><strong>Watch</strong> a walkthrough: a real task, broken into 4&ndash;5 concrete steps.</li>
      <li><strong>Do</strong> a 10-minute exercise on something you actually need this week.</li>
      <li><strong>Mark the day complete</strong> &mdash; your progress is saved locally in your browser.</li>
    </ol>
  </section>

  <section class="weeks">
    <h2>The 28 days</h2>
    {"".join(week_blocks)}
  </section>

  <section>
    <h2>Your Certificate</h2>
    <p>
      Complete all 28 days and a personalized PDF certificate becomes available on the Day 28 page.
      Enter your name the way you want it to appear, click generate, and it downloads instantly.
      No login. No waiting. No email-list trick.
    </p>
    <p>
      <a class="cta-button" href="days/day-28.html" style="display:inline-block; background:var(--ai-purple); color:white; padding:0.7rem 1.3rem; border-radius:var(--radius-md); text-decoration:none; font-weight:600;">Preview the Day 28 certificate page &rarr;</a>
    </p>
  </section>

  <section>
    <h2>How to use this course</h2>
    <ul>
      <li><strong>Anywhere you are.</strong> All 28 days are published here, always free, always online.</li>
      <li><strong>Progress is local.</strong> Your completion ticks are saved in your browser. If you switch devices, you&rsquo;ll need to re-mark days on the new device &mdash; this is intentional; no account, no tracking.</li>
      <li><strong>Pace yourself.</strong> 15 minutes a day is the promise. You can double up on weekends, or take a rest day &mdash; nothing expires.</li>
      <li><strong>Skip around.</strong> The days mostly stand alone. Day 27 (capstone) and Day 28 (certificate) are the only ones that assume the rest.</li>
    </ul>
  </section>

  <div class="text-center mt-lg">
    <a href="/index.html" class="back-link">&larr; Back to Home</a>
  </div>

</main>

{FOOTER}
<script src="assets/progress.js"></script>
</body>
</html>''')


def render_day(day: dict, prev_day: dict | None, next_day: dict | None) -> str:
    n = day["num"]
    prev_link = f'<a href="day-{prev_day["num"]:02d}.html">&larr; Day {prev_day["num"]}: {html.escape(prev_day["tool"])}</a>' if prev_day else '<a href="../index.html">&larr; Course home</a>'
    next_link = f'<a href="day-{next_day["num"]:02d}.html">Day {next_day["num"]}: {html.escape(next_day["tool"])} &rarr;</a>' if next_day else '<a href="../index.html">Course home &rarr;</a>'

    walkthrough_items = "".join(
        f'<li>{step}</li>' for step in day["walkthrough"]
    )

    bookmark_block = ""
    if day["url"]:
        bookmark_block = f'''<div class="callout callout-link">
        <span class="label">Bookmark</span>
        <p><a href="{day["url"]}" target="_blank" rel="noopener">{html.escape(day["link_label"])} &rarr;</a></p>
      </div>'''

    # Day 28 gets the certificate block appended
    cert_block = ""
    if n == 28:
        cert_block = '''
    <section class="day-section" id="cert-gate">
      <h2><span class="marker">5</span> Your Certificate</h2>

      <div id="cert-locked" class="cert-status locked" style="display:none;">
        <h2>Not quite yet</h2>
        <p>Your certificate unlocks once all 28 days are marked complete.</p>
        <p id="cert-remaining" style="font-weight:600; color:var(--ai-purple);">&nbsp;</p>
        <p><a href="../index.html">Back to the 28-day grid &rarr;</a></p>
      </div>

      <div id="cert-unlocked" class="cert-status" style="display:none;">
        <h2>You finished. Claim your certificate.</h2>
        <p id="cert-progress" style="color:var(--text-secondary);">&nbsp;</p>
        <p>Type your name exactly as you want it to appear:</p>
        <input type="text" class="name-input" placeholder="Your full name" aria-label="Your full name">
        <br>
        <button id="generate-cert-btn" class="cert-btn">Generate Certificate (PDF)</button>
        <p style="font-size:0.85rem; color:var(--text-light); margin-top:1.2rem;">
          The certificate is generated in your browser. Nothing is uploaded.
        </p>
      </div>
    </section>
    <script src="../assets/certificate.js"></script>
'''

    return dedent(f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Day {n}: {html.escape(day["tool"])} &mdash; AI Certificate in 28 Days</title>
  <link rel="stylesheet" href="/style.css">
  <link rel="stylesheet" href="../assets/ai-cert.css">
</head>
<body>

{HEADER_NAV}

<main class="container day-page">

  <div class="day-breadcrumb">
    <a href="../index.html">AI Certificate</a> &rsaquo; Day {n}
  </div>

  <div class="day-hero">
    <div class="day-label">Day {n} &middot; 15 minutes</div>
    <h1>{html.escape(day["tool"])}</h1>
    <p class="day-tagline">{day["tagline"]}</p>
    <span class="day-duration">~15 min read + 10 min hands-on</span>
  </div>

  <section class="day-section">
    <h2><span class="marker">1</span> Why this tool matters</h2>
    <p>{day["why"]}</p>
  </section>

  <section class="day-section">
    <h2><span class="marker">2</span> Walkthrough</h2>
    <ol>
      {walkthrough_items}
    </ol>
  </section>

  <section class="day-section">
    <h2><span class="marker">3</span> Your turn</h2>
    <div class="exercise-box">
      <h3>Today&rsquo;s exercise</h3>
      <p>{day["exercise"]}</p>
    </div>
  </section>

  <section class="day-section">
    <h2><span class="marker">4</span> Pro tip</h2>
    <div class="callout callout-tip">
      <span class="label">Worth keeping</span>
      <p>{day["tip"]}</p>
    </div>
    {bookmark_block}
  </section>

  {cert_block}

  <div class="mark-complete-wrap" data-day="{n}">
    <button class="mark-complete-btn">Mark Day {n} as complete</button>
    <div class="mark-complete-status">&nbsp;</div>
  </div>

  <nav class="day-nav">
    <span>{prev_link}</span>
    <span class="all-days"><a href="../index.html">All 28 days</a></span>
    <span>{next_link}</span>
  </nav>

</main>

{FOOTER}
<script src="../assets/progress.js"></script>
</body>
</html>''')


def main() -> None:
    (ROOT / "index.html").write_text(render_landing(DAYS), encoding="utf-8")
    print(f"Wrote {ROOT / 'index.html'}")

    for i, day in enumerate(DAYS):
        prev_day = DAYS[i - 1] if i > 0 else None
        next_day = DAYS[i + 1] if i + 1 < len(DAYS) else None
        out = DAYS_DIR / f"day-{day['num']:02d}.html"
        out.write_text(render_day(day, prev_day, next_day), encoding="utf-8")
        print(f"  wrote {out.name}")

    print(f"\nGenerated landing page + {len(DAYS)} day pages")


if __name__ == "__main__":
    main()
