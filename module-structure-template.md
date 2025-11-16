# Module Structure Template
## For Free Statistics Learning Platform

**Course**: Introduction to Statistics
**Platform**: sdabagh.github.io/learn/
**Purpose**: Dissertation research + free education

---

## Standard Module Structure

Each module follows this consistent structure to support both learning and research:

### 1. Module Overview Page
```
├── Module Title & Number
├── Learning Objectives (3-5 clear goals)
├── Why This Matters (real-world relevance)
├── Time Estimate (how long to complete)
├── Prerequisites (what students should know first)
├── Module Roadmap (visual progress tracker)
└── Get Started Button
```

### 2. Pre-Assessment (5-7 questions)
```
├── Purpose: Measure baseline knowledge
├── Anonymous (for research)
├── Not graded (low stakes)
├── Used to adapt AI scaffolding
└── Results saved for pre/post comparison
```

### 3. Lesson Pages (3-5 lessons per module)
Each lesson includes:
```
├── Lesson Title & Objectives
├── Video Lesson (5-10 min, embedded YouTube or created)
├── Written Explanation (for different learning styles)
├── Interactive Example (Desmos, simulation, etc.)
├── Practice Problems (3-5 with hints available)
├── AI Tutor Access (chat button, context-aware)
├── Check Your Understanding (2-3 quick questions)
└── Next Lesson Button
```

### 4. Practice & Review
```
├── Additional Practice Problems (10-15 mixed)
├── Solutions Available (with detailed explanations)
├── Common Mistakes Section
├── Real-World Applications
└── AI Tutor for Help
```

### 5. Module Quiz (10-12 questions)
```
├── Purpose: Measure learning gains
├── Auto-graded (immediate feedback)
├── Multiple attempts allowed
├── Scaffolded feedback (based on AI system)
├── Passing score: 70%
└── Certificate upon completion
```

### 6. Post-Assessment (Same as pre-assessment)
```
├── Identical questions to pre-assessment
├── Measures learning gains
├── Research data: compare pre/post scores
└── Shows student their progress
```

### 7. Reflection & Next Steps
```
├── Self-Assessment (confidence, effort, understanding)
├── What Was Most Helpful? (research data)
├── Next Module Preview
└── Share Progress (social encouragement)
```

---

## File Naming Convention

```
/learn/intro-stats/
├── index.html                          # Course home
├── module-01/
│   ├── index.html                      # Module 1 overview
│   ├── pre-assessment.html             # Pre-test
│   ├── lesson-01-what-is-stats.html   # Lesson 1
│   ├── lesson-02-types-of-data.html   # Lesson 2
│   ├── lesson-03-data-collection.html # Lesson 3
│   ├── practice.html                   # Practice problems
│   ├── quiz.html                       # Module quiz
│   ├── post-assessment.html            # Post-test
│   └── complete.html                   # Completion page
├── module-02/
│   └── [same structure]
└── resources/
    ├── videos/
    ├── datasets/
    └── supplements/
```

---

## Learning Objectives Format

Use Bloom's Taxonomy - measurable verbs:

**Remember/Understand:**
- Define, Identify, Describe, Explain, Summarize

**Apply/Analyze:**
- Calculate, Solve, Classify, Compare, Interpret

**Evaluate/Create:**
- Judge, Critique, Design, Construct, Formulate

**Example:**
```
By the end of this module, you will be able to:
1. Define statistics and explain its importance in everyday life [Understand]
2. Identify different types of data (quantitative, qualitative, discrete, continuous) [Apply]
3. Evaluate different data collection methods for bias [Analyze]
4. Design a simple survey to collect meaningful data [Create]
```

---

## Assessment Design Principles

### Pre/Post Assessments
- **Same questions** (to measure growth)
- **Low stakes** (no penalty for not knowing)
- **5-7 questions** (quick, not overwhelming)
- **Cover key concepts** (not every detail)
- **Multiple choice or short answer** (easy to auto-grade)

### Module Quizzes
- **10-12 questions** (substantial but doable)
- **Mixed difficulty** (easy, medium, hard)
- **Multiple attempts** (focus on learning, not gatekeeping)
- **Immediate feedback** (with explanations)
- **Passing: 70%** (demonstrates competency)

### Question Types
1. **Multiple Choice** (easiest to grade, good for concepts)
2. **True/False** (test misconceptions)
3. **Fill in the Blank** (recall of terms/values)
4. **Matching** (connect concepts)
5. **Short Calculation** (apply formulas)
6. **Interpretation** (analyze results)

---

## Interactive Elements

### Embedded Tools
```html
<!-- Desmos Calculator -->
<iframe src="https://www.desmos.com/calculator/..."
        width="100%" height="400px"></iframe>

<!-- GeoGebra Applet -->
<iframe src="https://www.geogebra.org/material/iframe/id/..."
        width="100%" height="600px"></iframe>

<!-- YouTube Video -->
<iframe src="https://www.youtube.com/embed/VIDEO_ID"
        width="100%" height="400px"></iframe>
```

### Self-Check Questions
```javascript
// Simple JavaScript quiz
<div class="self-check">
  <p><strong>Quick Check:</strong> What type of data is "shoe size"?</p>
  <button onclick="checkAnswer('discrete')">Discrete</button>
  <button onclick="checkAnswer('continuous')">Continuous</button>
  <button onclick="checkAnswer('categorical')">Categorical</button>
  <div id="feedback"></div>
</div>

<script>
function checkAnswer(answer) {
  const feedback = document.getElementById('feedback');
  if (answer === 'discrete') {
    feedback.innerHTML = '✅ Correct! Shoe sizes are discrete (countable values).';
  } else {
    feedback.innerHTML = '❌ Try again. Think about whether shoe sizes are countable or measurable.';
  }
}
</script>
```

---

## Content Development Checklist

For each module:

- [ ] Define 3-5 clear learning objectives
- [ ] Write module overview with real-world relevance
- [ ] Create pre-assessment (5-7 questions)
- [ ] Develop 3-5 lesson pages with:
  - [ ] Video lesson (embed or create)
  - [ ] Written explanation
  - [ ] Interactive example
  - [ ] Practice problems (3-5 per lesson)
  - [ ] Self-check questions
- [ ] Create practice problem set (10-15 problems)
- [ ] Write detailed solutions
- [ ] Build module quiz (10-12 questions)
- [ ] Create post-assessment (same as pre)
- [ ] Add reflection questions
- [ ] Test all links and interactives
- [ ] Review for accessibility (alt text, headings, contrast)
- [ ] Proofread for errors

---

## Example: Module 1 Outline

**Module 1: Introduction to Statistics & Data**

**Learning Objectives:**
1. Explain what statistics is and why it matters
2. Distinguish between descriptive and inferential statistics
3. Identify and classify different types of data
4. Evaluate data collection methods for potential bias
5. Interpret basic data visualizations

**Lessons:**
1. What is Statistics? (Why we study it, real-world examples)
2. Types of Data (Quantitative vs. Qualitative, Discrete vs. Continuous)
3. Data Collection Methods (Surveys, experiments, observational studies)
4. Introduction to Data Visualization (Bar charts, histograms, etc.)

**Practice:**
- Classify 20 different data examples
- Critique 5 survey questions
- Create basic visualizations from given data

**Quiz Topics:**
- Define statistics
- Identify data types
- Recognize bias in collection methods
- Read and interpret charts

---

## Research Data Collection Points

Track at each module:
```javascript
{
  student_id: "anonymous_xyz",
  module_number: 1,
  start_time: "timestamp",
  completion_time: "timestamp",
  time_spent_minutes: 45,

  pre_assessment: {
    score: 3,
    total: 7,
    answers: [...]
  },

  lesson_engagement: {
    lesson_1: {viewed: true, time_spent: 12},
    lesson_2: {viewed: true, time_spent: 15},
    lesson_3: {viewed: true, time_spent: 10},
    lesson_4: {viewed: false, time_spent: 0}
  },

  practice_attempts: 8,
  ai_tutor_interactions: 3,

  quiz_attempts: [
    {attempt: 1, score: 6, time: "timestamp"},
    {attempt: 2, score: 9, time: "timestamp"}
  ],

  post_assessment: {
    score: 6,
    total: 7,
    answers: [...]
  },

  learning_gain: 3, // post - pre

  reflection: {
    confidence_before: 2,
    confidence_after: 4,
    most_helpful: "practice_problems",
    struggled_with: "data_types"
  }
}
```

---

## Accessibility Standards

All modules must meet:
- **WCAG 2.1 AA** compliance
- **Keyboard navigation** (no mouse required)
- **Screen reader compatible** (proper headings, alt text, ARIA labels)
- **Color contrast** (4.5:1 for text)
- **Captions** (all video content)
- **Transcripts** (for audio/video)
- **Readable fonts** (minimum 16px, clear typeface)
- **Simple language** (avoid jargon, define terms)

---

## Next Steps

1. ✅ Module structure template (this document)
2. ⏳ Build Module 1 complete content
3. ⏳ Create assessment questions
4. ⏳ Curate/create video lessons
5. ⏳ Add interactive examples
6. ⏳ Test with pilot users
7. ⏳ Iterate based on feedback

---

**This template ensures consistency, research validity, and excellent learning experience across all modules.**
