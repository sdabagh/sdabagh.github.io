"""
strip_emojis.py

Remove decorative emojis and dingbats from every HTML/CSS/JS file in the repo.

What we strip:
  - All modern emoji (U+1F000-U+1FAFF block)
  - Miscellaneous Symbols (U+2600-U+26FF): sun, cloud, warning, etc.
  - Dingbats (U+2700-U+27BF): checkmarks, crosses, stars, hearts
  - HTML numeric entities for any of the above (&#x1F4CC; etc.)
  - The specific "clock / stopwatch" symbols in Miscellaneous Technical
    that are used decoratively (U+23F0, U+23F1, U+23F2, U+231A, U+231B)
  - CSS content: "..." rules whose content is a single emoji / entity

What we KEEP:
  - Arrows (U+2190-U+21FF): left/right/up/down, often used for nav
  - Mathematical Operators (U+2200-U+22FF): >=, <=, !=, etc.
  - General punctuation (em-dash, en-dash, curly quotes)
  - CSS escape sequences like "\2190" (arrows); we strip only emoji escapes.

After stripping, we collapse adjacent whitespace so headings like
"Before You Start" don't end up with a leading space.

Run from repo root:
    python3 .scripts/strip_emojis.py
"""

from __future__ import annotations
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

SKIP_DIRS = {".git", ".wrangler", "node_modules", ".claude", ".scripts"}

# Unicode character ranges to strip (emoji + dingbats + decorative technical)
EMOJI_CHAR_RE = re.compile(
    "["
    "\U0001F000-\U0001FAFF"   # all modern emoji blocks
    "\u2600-\u26FF"           # misc symbols (sun, cloud, warning, chess, etc.)
    "\u2700-\u27BF"           # dingbats (checkmarks, stars, hearts)
    "\u231A\u231B\u23F0-\u23F3"  # watch, stopwatch, alarm clock
    "\uFE0E\uFE0F"            # variation selectors (emoji vs text style)
    "\u200D"                  # zero-width joiner (for compound emojis)
    "]",
)

# HTML numeric entities pointing at any of the above
EMOJI_ENTITY_RE = re.compile(
    r"&#[xX]("
    r"1F[0-9A-Fa-f]{3,4}"      # emoji blocks like 1F4CC
    r"|2[67][0-9A-Fa-f]{2}"    # 26XX / 27XX
    r"|23[F0-9A-Fa-f][0-9A-Fa-f]"  # rough 23F0-23FF
    r"|231[AB]"
    r");"
)

# CSS Unicode escape sequences pointing at emoji code points
# e.g. "\2713 " or "\1F4CC"
CSS_EMOJI_ESCAPE_RE = re.compile(
    r"\\("
    r"1F[0-9A-Fa-f]{3,4}"
    r"|2[67][0-9A-Fa-f]{2}"
    r"|23[F][0-9A-Fa-f]"
    r"|231[AB]"
    r")\s?"
)

# After stripping, collapse double-spaces (but preserve newlines and >2 spaces
# that are likely indentation)
SPACE_COLLAPSE_RE = re.compile(r"[ \t]{2,}(?!\n)")

# Track stats
stats = {
    "files_modified": 0,
    "chars_stripped": 0,
    "entities_stripped": 0,
    "css_escapes_stripped": 0,
}


def should_skip(p: Path) -> bool:
    return any(part in SKIP_DIRS for part in p.parts)


def process(p: Path) -> bool:
    try:
        orig = p.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        return False

    s = orig

    # Count before we strip (for stats)
    char_hits = len(EMOJI_CHAR_RE.findall(s))
    entity_hits = len(EMOJI_ENTITY_RE.findall(s))
    css_hits = len(CSS_EMOJI_ESCAPE_RE.findall(s))

    if not (char_hits or entity_hits or css_hits):
        return False

    # Strip
    s = EMOJI_CHAR_RE.sub("", s)
    s = EMOJI_ENTITY_RE.sub("", s)
    s = CSS_EMOJI_ESCAPE_RE.sub("", s)

    # Clean up CSS content: "" that became empty after stripping, where the
    # rule was an emoji-only decoration. Easiest: if we see content: "" and
    # position:absolute ::before, leave it (it's now a no-op). CSS tolerates
    # content: "".

    # Collapse runs of whitespace inside HTML text (but keep indentation leading)
    # We only do this on lines where we stripped characters — detect by comparing
    # per line. Simpler: just fix ">  " (inside tag content) and "  <".
    s = re.sub(r"(>)\s+(\S)", lambda m: m.group(1) + (" " if m.start() > 0 and orig[m.start()-1] != ">" else "") + m.group(2), s)
    # Fix common "  word" leading spaces that were left after stripping an emoji-before-text pattern
    s = re.sub(r"(>)\s{2,}([A-Za-z])", r"\1\2", s)
    # Trim trailing whitespace inside tags like <h2>Text  </h2>
    s = re.sub(r"\s+(</)", r"\1", s)

    if s != orig:
        p.write_text(s, encoding="utf-8")
        stats["files_modified"] += 1
        stats["chars_stripped"] += char_hits
        stats["entities_stripped"] += entity_hits
        stats["css_escapes_stripped"] += css_hits
        return True
    return False


def main() -> None:
    # Process HTML, CSS, JS, MD files
    for ext in (".html", ".css", ".js", ".md"):
        for p in ROOT.rglob("*" + ext):
            if should_skip(p):
                continue
            process(p)

    print(f"Files modified:       {stats['files_modified']}")
    print(f"Emoji chars stripped: {stats['chars_stripped']}")
    print(f"HTML entities stripped: {stats['entities_stripped']}")
    print(f"CSS escapes stripped:   {stats['css_escapes_stripped']}")


if __name__ == "__main__":
    main()
