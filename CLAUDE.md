# CLAUDE.md - AI Assistant Guide

## Repository Overview

This is the personal academic website for **Safaa Dabagh**, a community college mathematics and statistics instructor and PhD student in Statistics. The repository is hosted as a GitHub Pages site at `sdabagh.github.io`.

**Purpose**: Professional portfolio and course resource hub for students, showcasing:
- Teaching philosophy and biography
- Course materials for Math 54 (Introductory Statistics) and Math 4/4C (College Algebra)
- AI in Education journey and project roadmap
- Personal projects (Mommy Coding Camp)

---

## Repository Structure

```
sdabagh.github.io/
├── index.html                          # Homepage/landing page
├── about.html                          # Personal biography
├── math54.html                         # Math 54 course page
├── math4.html                          # Math 4/4C course page
├── ai-education.html                   # AI in Education project tracker
├── mommy-camp.html                     # Mommy Coding Camp page
├── 25Spring-Math4-4C-Syllabus.pdf     # Course syllabus PDF
├── 25Summer-Math54-4026.pdf           # Course syllabus PDF
├── printables/                         # Educational printables
│   ├── reward-chart.pdf
│   ├── camp-badge-template.pdf
│   └── daily-challenge-cards.pdf
├── README.md                           # Basic repository readme
└── CLAUDE.md                           # This file
```

---

## Page-by-Page Analysis

### 1. **index.html** - Homepage
- **Location**: `/index.html`
- **Purpose**: Main landing page introducing Safaa and linking to all sections
- **Key Sections**:
  - Personal introduction and teaching philosophy
  - Links to AI in Education journey
  - Current course listings for 2025-2026
- **Styling**: Inline styles with simple Arial font, centered layout (max-width: 700px)
- **Navigation**: Consistent nav menu linking to all main pages

### 2. **about.html** - Biography
- **Location**: `/about.html`
- **Purpose**: Personal story and background
- **Content**: Immigration story, family, education journey at UCLA
- **Styling**: Simple inline styles matching homepage
- **Navigation**: Simplified nav (Home, About Me, Math 54, Math 4/4C)

### 3. **math54.html** - Math 54 Course Page
- **Location**: `/math54.html`
- **Purpose**: Course information for Introductory Statistics
- **Content**:
  - Course details (term, meeting times, location)
  - Syllabus PDF download link
  - Contact information
- **Styling**: Simple inline styles
- **PDF Link**: `25Summer-Math54-4026.pdf`

### 4. **math4.html** - Math 4/4C Course Page
- **Location**: `/math4.html`
- **Purpose**: Course information for College Algebra
- **Content**:
  - Course details
  - Syllabus PDF and Canvas link
  - Placeholder for future lecture notes/worksheets
- **Styling**: Simple inline styles
- **PDF Link**: `25Spring-Math4-4C-Syllabus.pdf`

### 5. **ai-education.html** - AI in Education Journey
- **Location**: `/ai-education.html`
- **Purpose**: Project tracker for AI in Education professional development
- **Content**:
  - Three-phase roadmap (Foundations, Applied Project, Leadership)
  - Task lists with online courses and milestones
  - Sample calendar for July 2025
- **Styling**: More sophisticated embedded CSS with:
  - Segoe UI font
  - Card-based layout with shadows and rounded corners
  - Styled tables for calendar
  - Blue color scheme (#2a6592, #007acc)
- **External Links**: Links to Google AI for Educators, Coursera, FutureLearn, etc.

### 6. **mommy-camp.html** - Mommy Coding Camp
- **Location**: `/mommy-camp.html`
- **Purpose**: Home-based summer coding camp for children (Issa and Zachariah)
- **Content**:
  - Weekly schedule with morning/afternoon activities
  - Learning resources (Scratch, Code.org, CS Unplugged)
  - Printable materials
- **Styling**: Embedded CSS with:
  - Pink/rose color scheme (#b23a48)
  - Card-based layout
  - Styled tables
- **Links to Printables**:
  - `/printables/reward-chart.pdf`
  - `/printables/camp-badge-template.pdf`
  - `/printables/daily-challenge-cards.pdf`

---

## Design Patterns and Conventions

### HTML Structure
- **DOCTYPE**: All pages use `<!DOCTYPE html>` with HTML5
- **Language**: All pages specify `lang="en"`
- **Character Encoding**: UTF-8 throughout
- **Viewport**: Pages with embedded CSS include responsive viewport meta tag

### Styling Approach
Two distinct patterns are used:

1. **Simple Pages** (index, about, math54, math4):
   - Inline styles in `<body>` tag
   - Arial font family
   - Max-width: 700px, centered with `margin: auto`
   - Padding: 20px
   - Line-height: 1.6

2. **Feature Pages** (ai-education, mommy-camp):
   - Embedded `<style>` blocks in `<head>`
   - Segoe UI font family
   - Max-width: 900px, centered
   - Card-based layouts using divs with classes
   - Box shadows: `0 0 10px rgba(0,0,0,0.05)`
   - Border-radius: 8px for rounded corners
   - Themed color schemes (blue for ai-education, pink for mommy-camp)

### Navigation
- **Standard Nav Menu**: Links to Home, About Me, Math 54, Math 4/4C
- **Extended Nav** (some pages): Also includes AI in Education and Mommy Coding Camp
- **Back Links**: Feature pages include "← Back to Home" link
- **Styling**: Inline styles with `margin-right: 15px` for spacing

### Color Schemes
- **Homepage/Simple pages**: Default link colors
- **AI Education**: Blue theme (#2a6592 headings, #007acc links, #e6f2ff table headers)
- **Mommy Camp**: Pink/rose theme (#b23a48 for headings and links, #f9d5d8 table headers)

### External Links
- Course syllabi are linked as relative paths (e.g., `25Summer-Math54-4026.pdf`)
- External resources use `target="_blank"` to open in new tabs
- Email links use `mailto:` protocol with `dabagh_safaa@smc.edu`

---

## Development Workflows

### Adding New Pages

When creating new HTML pages:

1. **Choose a styling approach**:
   - Use **simple inline styles** for basic informational pages (courses, bio)
   - Use **embedded CSS** for feature-rich pages with interactive elements

2. **Include standard navigation**:
   ```html
   <nav style="margin-bottom: 20px;">
     <a href="index.html" style="margin-right: 15px;">Home</a>
     <a href="about.html" style="margin-right: 15px;">About Me</a>
     <a href="math54.html" style="margin-right: 15px;">Math 54</a>
     <a href="math4.html">Math 4/4C</a>
   </nav>
   ```

3. **Update homepage** (`index.html`) with link to new page if appropriate

4. **Use semantic HTML**: Proper heading hierarchy (h1, h2, h3), paragraphs, lists

5. **Ensure responsive design**: Include viewport meta tag for mobile compatibility

### Adding Course Materials

For new course pages or semesters:

1. **Upload PDF syllabus** to repository root with naming convention:
   - Format: `{Term}{Year}-{Course}-{Number}.pdf`
   - Example: `25Summer-Math54-4026.pdf`

2. **Create/update course page** with:
   - Course title and number
   - Instructor name: Prof. Safaa Dabagh
   - Term and meeting information
   - PDF download link
   - Contact information

3. **Test PDF links** to ensure they work correctly

### Adding Printables

1. **Upload PDF** to `/printables/` directory
2. **Use descriptive filenames**: `reward-chart.pdf`, `camp-badge-template.pdf`
3. **Link from relevant page** using relative path: `/printables/filename.pdf`
4. **Add `target="_blank"`** to open in new tab

---

## Key Conventions for AI Assistants

### 1. Maintain Consistent Voice and Tone
- **Professional but warm**: Safaa's voice is compassionate, encouraging, and student-focused
- **Personal touches**: References to family, journey, and personal growth are appropriate
- **Educational focus**: Emphasize learning, growth, equity, and innovation

### 2. Preserve Design Integrity
- **Don't mix styling approaches**: Keep simple pages simple, feature pages styled
- **Maintain color themes**: Blue for AI/professional, pink for family/camp content
- **Keep layouts responsive**: Test on mobile viewports (use viewport meta tag)

### 3. HTML/CSS Best Practices
- **No external CSS files**: This site uses inline or embedded styles only
- **No JavaScript frameworks**: Keep it simple and static
- **Accessible links**: Use descriptive link text, not "click here"
- **Semantic HTML**: Use proper heading levels, nav tags, lists

### 4. Content Guidelines
- **Course information**: Always include term, instructor name, meeting times, syllabus link
- **External links**: Open in new tabs with `target="_blank"`
- **Email**: Use `dabagh_safaa@smc.edu` for contact
- **Institution**: Santa Monica College (SMC) or UCLA depending on context

### 5. File Management
- **PDFs in root**: Course syllabi go in repository root
- **PDFs in /printables/**: Educational materials and printables
- **Naming conventions**:
  - Syllabi: `{Term}{Year}-{Course}-{Code}.pdf`
  - Printables: `descriptive-name.pdf`
- **No subdirectories for HTML**: All HTML pages in root

### 6. Navigation Updates
When adding new pages:
- Update navigation menus where appropriate
- Consider whether page belongs in main nav or just links from homepage
- Maintain consistent nav structure across pages
- Always provide a "Back to Home" link on feature pages

### 7. GitHub Pages Considerations
- **No build process**: This is a static site, HTML/CSS only
- **Direct serving**: Files are served as-is from repository
- **Root index.html**: This is the landing page
- **Path references**: Use relative paths for internal links
- **Case sensitivity**: URLs are case-sensitive on GitHub Pages

### 8. Testing Before Committing
- **Validate HTML**: Ensure proper structure and closing tags
- **Test links**: Check all internal and external links
- **Check responsiveness**: Test on different screen sizes if possible
- **Verify PDF paths**: Ensure all PDFs exist and paths are correct
- **Proofread content**: Check spelling, grammar, and factual accuracy

---

## Common Maintenance Tasks

### Updating Course Information
1. Upload new syllabus PDF to root
2. Update relevant course page (math54.html or math4.html)
3. Update term, meeting times, and PDF link
4. Update homepage if necessary (course listings section)

### Adding AI Education Progress
1. Edit `ai-education.html`
2. Update task lists (change ⏳ to ✅ for completed items)
3. Update calendar if showing current month
4. Add new phases or milestones as needed
5. Update footer date

### Adding Coding Camp Content
1. Edit `mommy-camp.html`
2. Update weekly schedule table
3. Add new resources to learning resources list
4. Create and upload new printables to `/printables/` directory
5. Link new printables in printables section

### Site-Wide Navigation Updates
1. Identify all pages with navigation menus
2. Update nav HTML consistently across:
   - index.html
   - about.html
   - math54.html
   - math4.html
   - ai-education.html
   - mommy-camp.html
3. Test all navigation links

---

## Technical Notes

### Browser Compatibility
- Site uses standard HTML5 and CSS3
- No JavaScript dependencies
- Should work in all modern browsers
- Degrades gracefully in older browsers

### Performance
- Static HTML loads quickly
- Inline CSS means no additional HTTP requests for stylesheets
- PDFs may be large files (70-90KB for syllabi)
- Consider PDF file sizes when uploading new materials

### Accessibility
- Use proper heading hierarchy for screen readers
- Provide alt text for any images (currently none on site)
- Ensure sufficient color contrast for readability
- Use descriptive link text

### SEO Considerations
- Each page has a unique `<title>` tag
- Consider adding meta descriptions for better search results
- Use semantic HTML for better indexing
- Internal linking is good for SEO

---

## Future Enhancements to Consider

Based on the current structure, potential improvements:

1. **Extract CSS to separate file**: Reduce code duplication across pages
2. **Add meta descriptions**: Improve SEO and social sharing
3. **Include Open Graph tags**: Better social media previews
4. **Add a blog section**: For regular updates on AI in Education journey
5. **Create a resources page**: Centralize all external learning resources
6. **Add student testimonials**: If appropriate for professional portfolio
7. **Include research publications**: Link to academic work and papers
8. **Add photo/headshot**: Professional photo on About page
9. **Create a contact form**: Alternative to just email link
10. **Google Analytics**: Track visitor engagement (if desired)

---

## Contact Information

**Repository Owner**: Safaa Dabagh
**Email**: dabagh_safaa@smc.edu
**Institution**: Santa Monica College
**Education**: UCLA (BA Math/Economics, MA Statistics, PhD Statistics candidate)

---

## Version History

- **2025-11-15**: Initial CLAUDE.md created - comprehensive documentation of existing site structure and conventions

---

## Quick Reference Commands

### Git Workflow
```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Update course materials for Summer 2025"

# Push to branch (as per session requirements)
git push -u origin claude/claude-md-mi0vae022nif5jko-011Q4ScrQ77wnmQhCtigVZwN
```

### Common File Operations
```bash
# List all HTML files
ls -la *.html

# Check PDF file sizes
ls -lh *.pdf

# View directory structure
tree -L 2
```

---

**Last Updated**: November 15, 2025
**Maintained by**: AI Assistants working with Safaa Dabagh
