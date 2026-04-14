#!/usr/bin/env python3
"""Replace navigation in all HTML files with new dropdown structure."""
import os, re, glob

ROOT = '/Users/safaadabagh/sdabagh.github.io'

def make_nav(prefix):
    """Generate nav HTML for a given prefix (e.g., '', '../../', '../../../')."""
    p = prefix
    return f'''<nav>
      <a href="{p}index.html">Home</a>
      <div class="nav-dropdown"><a href="{p}about.html">About</a><div class="dropdown-menu"><a href="{p}about.html">About Me</a><a href="{p}research.html">Research</a></div></div>
      <div class="nav-dropdown"><a href="{p}free-courses.html">Courses</a><div class="dropdown-menu"><a href="{p}free-courses.html">All Courses</a><div class="dropdown-divider"></div><a href="{p}learn/financial-literacy/hub.html">Financial Literacy</a><a href="{p}learn/trigonometry/index.html">Math Courses</a><a href="{p}learn/intro-python/index.html">Programming</a><a href="{p}learn/ai-course/index.html">AI &amp; Technology</a><a href="{p}student-resources.html">Student Resources</a></div></div>
      <a href="{p}young-learners.html">Young Learners</a>
      <div class="nav-dropdown"><a href="{p}books.html">Resources</a><div class="dropdown-menu"><a href="{p}books.html">Books</a><a href="{p}publications.html">Publications</a><a href="{p}instructor/index.html">Instructor Resources</a></div></div>
      <a href="{p}support.html">Support</a>
    </nav>'''

# Map prefix patterns
PREFIXES = {
    'style.css': '',
    '../style.css': '../',
    '../../style.css': '../../',
    '../../../style.css': '../../../',
    '../../../../style.css': '../../../../',
}

count = 0
for html_file in glob.glob(os.path.join(ROOT, '**/*.html'), recursive=True):
    try:
        with open(html_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except:
        continue

    if '<nav>' not in content and '<nav ' not in content:
        continue

    # Determine prefix from stylesheet link
    prefix = None
    for css_pat, pfx in PREFIXES.items():
        if f'href="{css_pat}"' in content:
            prefix = pfx
            break

    if prefix is None:
        continue

    # Replace everything between <nav> and </nav>
    new_nav = make_nav(prefix)
    new_content = re.sub(r'<nav>.*?</nav>', new_nav, content, count=1, flags=re.DOTALL)

    if new_content != content:
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        count += 1

print(f"Updated {count} files")
