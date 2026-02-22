# 📦 Batch Grading Feature

## Overview

The Batch Grading feature allows you to grade multiple student submissions at once by uploading a zip file downloaded from Canvas. This is perfect for grading assignments, discussion posts, and research papers in bulk.

---

## ✨ Features

- **Bulk Processing**: Grade 10, 20, or 100+ submissions at once
- **Assignment Templates**: Pre-built rubrics for Discussion Posts and Research Assignments
- **Smart Extraction**: Automatically extracts student names from Canvas filenames
- **CSV Export**: Download results in Canvas-importable CSV format
- **JSON Export**: Get detailed grading data as JSON
- **Progress Tracking**: Real-time progress bar and per-student status
- **Error Handling**: Identifies and flags problematic submissions
- **Late Detection**: Automatically flags late submissions from filename

---

## 🚀 Quick Start

### Step 1: Download Submissions from Canvas

1. Go to your Canvas course
2. Navigate to **Grades** → **Assignments**
3. Select an assignment
4. Click **Download Submissions** button
5. Canvas will download a `.zip` file containing all student submissions

**Example zip structure:**
```
submissions.zip
├── smith_john_123456_assignment1.txt
├── doe_jane_123457_assignment1.txt
├── johnson_bob_late_123458_assignment1.txt
└── ...
```

### Step 2: Open Batch Grading Interface

1. Click the extension icon in Chrome
2. Click **📦 Open Batch Grading Interface**
3. A new tab will open with the batch grading tool

### Step 3: Upload Zip File

1. **Drag and drop** the submissions.zip onto the upload zone, OR
2. **Click** the upload zone to browse and select the file
3. Wait for extraction (usually 2-5 seconds)
4. You'll see stats: number of submissions, students, file size

### Step 4: Select Assignment Type

Choose the type of assignment you're grading:

**💬 Discussion Post** - For:
- Forum discussions
- Reflection posts
- Peer engagement activities

**📝 Research Assignment** - For:
- Research papers
- Reports
- Analytical essays
- Case studies

Selecting a type loads a **pre-built rubric template** that you can customize.

### Step 5: Customize Grading Rubric (Optional)

The rubric template will appear. You can:
- Use it as-is
- Modify criteria
- Add institution-specific requirements
- Change feedback style
- Adjust point values

**Points Possible**: Set the maximum points (default: 10)

### Step 6: Start Grading

1. Click **🚀 Start Grading All Submissions**
2. Watch the progress bar
3. See each student graded in real-time
4. Wait for completion (2-3 seconds per student with API delay)

**Example timing:**
- 10 students: ~30 seconds
- 30 students: ~2 minutes
- 50 students: ~3-4 minutes

### Step 7: Download Results

When grading completes:

1. **Review Preview**: Expand "Preview Results" to see all grades
2. **Download CSV**: Click "📥 Download CSV (Canvas Import)"
3. **Download JSON**: (Optional) Get detailed data with full feedback

### Step 8: Import to Canvas

1. Go to Canvas **Gradebook**
2. Click **Import** button
3. Upload the `canvas-grades.csv` file
4. Map columns: Student → Student, Score → Score, Feedback → Comment
5. Import grades!

---

## 📋 Assignment Type Rubrics

### Discussion Post Rubric (Default)

```
Content Quality (4 pts)
- Demonstrates understanding
- Includes relevant examples
- Addresses all parts of prompt

Critical Thinking (3 pts)
- Original analysis/insight
- Makes connections to concepts
- Asks thoughtful questions

Engagement (2 pts)
- Responds to peers thoughtfully
- Contributes to discussion
- Respects diverse viewpoints

Writing Quality (1 pt)
- Clear and organized
- Proper grammar/spelling
- Appropriate length
```

### Research Assignment Rubric (Default)

```
Thesis & Argument (3 pts)
- Clear, focused thesis
- Logical argument structure
- Strong supporting evidence

Research & Sources (3 pts)
- Credible, relevant sources
- Proper citations (APA/MLA)
- Synthesizes perspectives

Analysis & Critical Thinking (2 pts)
- Deep analysis
- Original insights
- Addresses counterarguments

Organization & Writing (2 pts)
- Clear intro/body/conclusion
- Smooth transitions
- Professional academic writing
- Proper formatting
```

**💡 Tip**: Copy these templates and customize for your institution!

---

## 🔧 Installation Requirements

### Required: JSZip Library

The batch grading feature requires the JSZip library to extract student submissions.

**How to install:**

1. Download JSZip from:
   - https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
   - OR https://github.com/Stuk/jszip/releases

2. Save as `jszip.min.js` in:
   ```
   chrome-extension/lib/jszip.min.js
   ```

3. Reload the extension in Chrome

**Verify installation:**
- Open batch grading interface
- Try to upload a zip
- If JSZip is missing, you'll see an error with installation instructions

---

## 📊 CSV Format (Canvas Import)

The exported CSV has three columns:

```csv
Student,Score,Feedback
"John Smith",8.5,"Excellent analysis of the data..."
"Jane Doe",9.0,"Outstanding work! Your statistical..."
```

**Canvas Import Steps:**
1. Gradebook → Import
2. Upload `canvas-grades.csv`
3. Map: Student → Student Name
4. Map: Score → Assignment Score
5. Map: Feedback → Assignment Comment
6. Import!

---

## 🎯 Best Practices

### 1. Test with Small Batches First
- Start with 5-10 submissions
- Verify rubric is working correctly
- Adjust criteria if needed
- Then process full class

### 2. Customize Rubrics for Your Course
- Add specific learning outcomes
- Include course-specific requirements
- Adjust point distributions
- Specify citation style (APA, MLA, Chicago)

### 3. Review AI Feedback Before Importing
- Always preview results
- Spot-check a few random students
- Adjust scores if AI misunderstood context
- Edit CSV if needed before importing

### 4. Handle Rate Limits
- The extension waits 2 seconds between submissions
- For very large classes (100+), consider splitting into batches
- Monitor for API errors

### 5. Save Your Rubrics
- Create a document with your rubric templates
- Copy-paste into the interface each time
- Maintain consistency across semesters

---

## 🐛 Troubleshooting

### "JSZip library not found"
**Solution**: Download `jszip.min.js` and place in `chrome-extension/lib/` folder. See Installation Requirements above.

### "No valid submissions found in zip"
**Possible causes:**
- Empty zip file
- Submissions are in a subfolder
- Files are PDFs or images (currently only supports text)

**Solution**:
- Check zip contents
- Ensure text-based submissions (.txt, .html, .docx converted to text)

### "Worker returned 403 error"
**Cause**: API key or Worker URL not configured

**Solution**:
1. Open extension popup
2. Go to Configuration section
3. Save API key and Worker URL
4. Try batch grading again

### "Error grading [Student Name]"
**Possible causes:**
- Malformed submission content
- API timeout
- Network error

**Solution**:
- Check processing list for specific errors
- Re-grade individual student if needed
- Check Worker logs for details

### Grading is very slow
**Causes:**
- 2-second delay between submissions (by design to avoid rate limits)
- Large number of submissions

**Solutions**:
- This is normal! 30 students = ~2 minutes
- Run grading and do other work while waiting
- Split very large classes into multiple batches

---

## 🔒 Privacy & Data

### What data is sent to Claude API?
- Student submission text
- Grading rubric
- Point values
- Student name (for personalized feedback)

### What is NOT sent?
- Student IDs
- Canvas course information
- Previous grades
- Personal identifiable information beyond name

### Data retention:
- Claude API does not store conversation data for commercial API users
- Your Cloudflare Worker may log requests (check Worker settings)
- Extension does not save submissions locally after grading

### FERPA Compliance:
- Ensure you have rights to process student work with AI
- Review your institution's AI usage policies
- Inform students if AI is used in grading process
- Human review of AI grading is recommended

---

## 🆕 Future Enhancements

Planned features for v2.1+:

- [ ] **PDF Support**: Extract text from PDF submissions
- [ ] **Word Doc Support**: Handle .docx files
- [ ] **Parallel Processing**: Grade multiple students simultaneously
- [ ] **Rubric Library**: Save and manage custom rubrics
- [ ] **Canvas API Integration**: Auto-upload grades directly to Canvas
- [ ] **Grading Analytics**: Show grade distribution, common issues
- [ ] **Multi-language Support**: Grade submissions in other languages
- [ ] **Plagiarism Detection**: Flag similar submissions

---

## 💡 Tips for Different Assignment Types

### Grading Discussions
- Focus rubric on engagement and critical thinking
- Weight peer responses appropriately
- Include timeliness criteria
- Check for meaningful interaction, not just "I agree"

### Grading Research Papers
- Emphasize thesis clarity and evidence
- Require proper citations
- Check for analytical depth
- Grade structure and organization
- Allow higher point values (scale rubric to 100 points)

### Grading Short Responses
- Keep rubric simple (3-5 criteria)
- Lower point values (5-10 points total)
- Focus on understanding and application
- Quick feedback

### Grading Reflections
- Emphasize personal insight
- Value authenticity over formality
- Grade critical self-assessment
- Less emphasis on citations/sources

---

## 📞 Support & Feedback

**Issues?** Check the troubleshooting section above.

**Feature requests?** Update the TODO.md file in the repository.

**Questions?** Contact: dabagh_safaa@smc.edu

---

**Version**: 2.0.0
**Last Updated**: February 2026
**Author**: Safaa Dabagh
**Built with**: Claude API, JSZip, Chrome Extensions API
