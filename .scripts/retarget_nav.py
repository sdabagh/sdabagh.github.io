"""
retarget_nav.py

One-shot cleanup of the Learn-Without-Walls navigation:

  1. Remove the "Student Resources" link from the Courses dropdown
     (at every relative-path depth).
  2. Retarget the "Math Courses" link from learn/trigonometry/index.html
     to free-courses.html#math.
  3. Retarget the "Programming" link from learn/intro-python/index.html
     to free-courses.html#python.
  4. Retarget the "AI & Technology" link from learn/ai-course/index.html
     to free-courses.html#ai.
  5. Retarget the "Financial Literacy" link to free-courses.html#finance
     (keeping it consistent with the other category anchors).
  6. Replace any remaining href="...student-resources.html"
     (in content, footers, breadcrumbs) with href="...free-courses.html".

Run from repo root:
    python3 .scripts/retarget_nav.py
"""

from __future__ import annotations
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Files to touch: every .html in the repo, excluding anything in learn/ai-certificate
# (we just built that and its links are already modern).
# Also skip node_modules, .git, .wrangler, etc.
SKIP_DIRS = {".git", ".wrangler", "node_modules", ".claude"}

def html_files():
    for p in ROOT.rglob("*.html"):
        if any(part in SKIP_DIRS for part in p.parts):
            continue
        yield p


# Prefix capture group: relative paths like "", "../", "../../", "../../../"
# Match the slash variants carefully.
PREFIX = r'((?:\.\./)*)'

# Transform 1: remove the Student Resources <a> from the dropdown
# Pattern is always: <a href="PREFIX student-resources.html">Student Resources</a>
STUDENT_RES_LINK = re.compile(
    rf'<a href="{PREFIX}student-resources\.html">Student Resources</a>'
)

# Transform 2: retarget Math Courses link
MATH_NAV = re.compile(
    rf'<a href="{PREFIX}learn/trigonometry/index\.html">Math Courses</a>'
)

# Transform 3: retarget Programming link
PROG_NAV = re.compile(
    rf'<a href="{PREFIX}learn/intro-python/index\.html">Programming</a>'
)

# Transform 4: retarget AI & Technology link
AI_NAV = re.compile(
    rf'<a href="{PREFIX}learn/ai-course/index\.html">AI &amp; Technology</a>'
)

# Transform 5: retarget Financial Literacy link in the Courses dropdown
FIN_NAV = re.compile(
    rf'<a href="{PREFIX}learn/financial-literacy/hub\.html">Financial Literacy</a>'
)

# Transform 6: any remaining student-resources.html href in content / footer
STUDENT_RES_HREF = re.compile(
    rf'href="{PREFIX}student-resources\.html"'
)

COUNTS = {
    "student_res_nav_removed": 0,
    "math_nav_retargeted": 0,
    "prog_nav_retargeted": 0,
    "ai_nav_retargeted": 0,
    "fin_nav_retargeted": 0,
    "student_res_href_rewritten": 0,
    "files_modified": 0,
}


def process(path: Path) -> bool:
    orig = path.read_text(encoding="utf-8")
    s = orig

    def sub_student_nav(m):
        COUNTS["student_res_nav_removed"] += 1
        return ""
    s = STUDENT_RES_LINK.sub(sub_student_nav, s)

    def sub_math(m):
        COUNTS["math_nav_retargeted"] += 1
        return f'<a href="{m.group(1)}free-courses.html#math">Math Courses</a>'
    s = MATH_NAV.sub(sub_math, s)

    def sub_prog(m):
        COUNTS["prog_nav_retargeted"] += 1
        return f'<a href="{m.group(1)}free-courses.html#python">Programming</a>'
    s = PROG_NAV.sub(sub_prog, s)

    def sub_ai(m):
        COUNTS["ai_nav_retargeted"] += 1
        return f'<a href="{m.group(1)}free-courses.html#ai">AI &amp; Technology</a>'
    s = AI_NAV.sub(sub_ai, s)

    def sub_fin(m):
        COUNTS["fin_nav_retargeted"] += 1
        return f'<a href="{m.group(1)}free-courses.html#finance">Financial Literacy</a>'
    s = FIN_NAV.sub(sub_fin, s)

    def sub_student_href(m):
        COUNTS["student_res_href_rewritten"] += 1
        return f'href="{m.group(1)}free-courses.html"'
    s = STUDENT_RES_HREF.sub(sub_student_href, s)

    if s != orig:
        path.write_text(s, encoding="utf-8")
        COUNTS["files_modified"] += 1
        return True
    return False


def main() -> None:
    touched = []
    for p in html_files():
        if process(p):
            touched.append(p.relative_to(ROOT))

    print(f"Files modified: {COUNTS['files_modified']}")
    print(f"  Student Resources nav links removed: {COUNTS['student_res_nav_removed']}")
    print(f"  Math Courses nav retargeted:         {COUNTS['math_nav_retargeted']}")
    print(f"  Programming nav retargeted:          {COUNTS['prog_nav_retargeted']}")
    print(f"  AI & Technology nav retargeted:      {COUNTS['ai_nav_retargeted']}")
    print(f"  Financial Literacy nav retargeted:   {COUNTS['fin_nav_retargeted']}")
    print(f"  student-resources.html hrefs rewritten (content/footer): "
          f"{COUNTS['student_res_href_rewritten']}")


if __name__ == "__main__":
    main()
