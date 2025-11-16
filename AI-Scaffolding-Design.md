# AI-Powered Cognitive Scaffolding System
## Design Documentation for Dissertation Research

**Author**: Safaa Dabagh
**Advisors**: Prof. Mark Handcock, Prof. Guang Cheng
**Date**: November 2025
**Purpose**: Dissertation research on AI-powered cognitive scaffolding for statistics education

---

## 1. Scaffolding Levels Framework

### Overview
This system provides **adaptive cognitive scaffolding** that adjusts based on student need. Unlike traditional AI tutors that simply answer questions, this system provides progressive support designed to promote learning and metacognition.

### Four Scaffolding Levels

#### Level 1: Minimal Scaffold (Socratic Prompting)
**Purpose**: Encourage independent thinking and problem-solving
**When to use**: Initial student question, or when student shows good understanding
**Strategy**: Ask guiding questions without giving answers

**Characteristics**:
- Socratic questioning
- Activate prior knowledge
- Encourage metacognition ("What do you know so far?")
- No direct answers or formulas
- Help student identify what they need to figure out

**Example**:
```
Student: "I don't understand how to calculate standard deviation"

Level 1 Response:
"Let's think about what standard deviation measures. What does the word
'deviation' suggest to you? And when we talk about data being 'spread out'
versus 'clustered together,' which would have a larger standard deviation?"
```

---

#### Level 2: Moderate Scaffold (Structured Guidance)
**Purpose**: Break problem into steps without solving it
**When to use**: Student struggling after Level 1, or moderately complex problem
**Strategy**: Provide structure and hints for each step

**Characteristics**:
- Break problem into manageable steps
- Give hints for each step
- Provide conceptual explanations
- Use analogies and examples
- Still require student to do calculations

**Example**:
```
Student: "I'm still confused about standard deviation"

Level 2 Response:
"Standard deviation measures how spread out data is from the mean.
Let's break this into steps:

Step 1: Find the mean (average) of your data
Step 2: Find how far each data point is from the mean (deviations)
Step 3: Square those deviations
Step 4: Find the average of those squared deviations (variance)
Step 5: Take the square root

Can you try Step 1 with your data and tell me what mean you get?"
```

---

#### Level 3: Extensive Scaffold (Worked Example)
**Purpose**: Show complete process with explanation
**When to use**: Student still struggling, or completely stuck
**Strategy**: Work through similar example step-by-step

**Characteristics**:
- Complete worked example with different numbers
- Detailed explanation of each step
- Highlight key concepts
- Connect to broader understanding
- Student still needs to apply to their problem

**Example**:
```
Student: "I tried but I'm still lost"

Level 3 Response:
"Let me show you with an example, then you can apply it to your problem.

Example data: [2, 4, 6, 8, 10]

Step 1 - Find the mean:
(2 + 4 + 6 + 8 + 10) ÷ 5 = 30 ÷ 5 = 6

Step 2 - Find deviations from mean:
2 - 6 = -4
4 - 6 = -2
6 - 6 = 0
8 - 6 = 2
10 - 6 = 4

Step 3 - Square the deviations:
(-4)² = 16
(-2)² = 4
(0)² = 0
(2)² = 4
(4)² = 16

Step 4 - Find average of squared deviations (variance):
(16 + 4 + 0 + 4 + 16) ÷ 5 = 40 ÷ 5 = 8

Step 5 - Take square root:
√8 ≈ 2.83

Now try these same steps with your data: [your data here]"
```

---

#### Level 4: Direct Instruction (Complete Solution)
**Purpose**: Provide complete solution when student is blocked
**When to use**: Student tried all levels, or critical misconception detected
**Strategy**: Give complete solution with thorough explanation

**Characteristics**:
- Complete solution to actual problem
- Detailed conceptual explanation
- Address misconceptions
- Provide additional resources
- Suggest practice problems

**Example**:
```
Student: "I've tried but I really can't get it"

Level 4 Response:
"I see you're working hard on this. Let me solve your specific problem
and explain each part:

Your data: [5, 7, 9, 11, 13]

[Complete solution with their actual data]

Key concepts:
- Standard deviation tells us the typical distance of data from the mean
- Larger SD = more spread out data
- We square deviations to make them positive and emphasize larger differences
- Taking square root brings us back to original units

This is a challenging concept! Would you like to:
1. Try a similar practice problem?
2. Watch a video explanation?
3. Learn about when we use standard deviation in real life?"
```

---

## 2. Adaptive Scaffolding Logic

### Decision Tree for Scaffold Selection

```
Student asks question
    ↓
[Start with Level 1]
    ↓
Did student make progress? → YES → Continue Level 1
    ↓ NO
Has student tried? → NO → Stay Level 1 (encourage attempt)
    ↓ YES
[Move to Level 2]
    ↓
Can student complete with hints? → YES → Success!
    ↓ NO
Shows conceptual confusion? → YES → [Move to Level 3]
    ↓ NO
Just needs answer? → YES → [Move to Level 4]
```

### Context Tracking

The system tracks:
- **Student's current understanding** (based on conversation)
- **Attempts made** (how many times they've tried)
- **Misconceptions identified** (specific confusion points)
- **Emotional state** (frustration, confidence)
- **Previous scaffold level** (avoid repeating ineffective strategies)

---

## 3. Statistics-Specific Scaffolding Strategies

### Common Student Struggles & Scaffolding Approaches

#### Conceptual Understanding
**Problem**: Student doesn't understand *why* we use a method
**Scaffold**:
- Level 1: "Why might we need to measure spread?"
- Level 2: "Think about comparing two classes with same average..."
- Level 3: Real-world example with visualization
- Level 4: Complete conceptual explanation + applications

#### Procedural Skills
**Problem**: Student doesn't know *how* to calculate
**Scaffold**:
- Level 1: "What's the first step in any statistical calculation?"
- Level 2: Break into numbered steps
- Level 3: Worked example
- Level 4: Complete solution with formula

#### Interpretation
**Problem**: Student calculated correctly but can't interpret
**Scaffold**:
- Level 1: "What does this number tell us about the data?"
- Level 2: "Compare to other possible values..."
- Level 3: Example interpretation with similar problem
- Level 4: Full interpretation + context

#### Common Misconceptions
- Confusing mean, median, mode
- Thinking correlation = causation
- Misunderstanding p-values
- Confusing population vs. sample

**Scaffold approach**: Directly address with Level 3/4, don't let persist

---

## 4. Trustworthy AI Considerations (Prof. Cheng)

### Fairness
- **Language accessibility**: Adjust reading level based on student
- **Cultural context**: Use diverse examples
- **Prior knowledge**: Don't assume background
- **Error handling**: Gracefully handle misconceptions

### Explainability
- **Transparency**: "I'm giving you hints rather than answers because..."
- **Scaffold reasoning**: "I think you're ready for a worked example because..."
- **Process visibility**: Show why each step matters

### Reliability
- **Mathematical accuracy**: All calculations verified
- **Consistent pedagogy**: Same scaffolding logic for all students
- **Quality monitoring**: Flag uncertain responses for review

### Privacy & Ethics
- **No personal data in prompts**: Anonymous student IDs only
- **Conversation logging**: Transparent about what's saved
- **Opt-out option**: Students can use without data collection

---

## 5. System Prompts for Claude API

### Base System Prompt (All Levels)

```
You are an AI tutor for introductory statistics, designed to provide
cognitive scaffolding rather than direct answers. Your goal is to help
students learn by guiding their thinking, not by solving problems for them.

Core Principles:
1. Promote independent thinking and problem-solving
2. Adjust support level based on student need
3. Be encouraging and patient
4. Use clear, accessible language
5. Connect concepts to real-world contexts
6. Address misconceptions directly

Current scaffolding level: [LEVEL]
Student context: [CONTEXT]
Previous conversation: [HISTORY]

Respond according to the scaffolding level guidelines provided.
```

### Level 1 Prompt Addition
```
SCAFFOLDING LEVEL: Minimal (Socratic Prompting)

Do NOT:
- Give formulas or answers
- Solve the problem
- Provide step-by-step instructions

DO:
- Ask guiding questions
- Activate prior knowledge
- Encourage reflection ("What do you already know?")
- Help identify what they need to figure out
- Be brief and focused
```

### Level 2 Prompt Addition
```
SCAFFOLDING LEVEL: Moderate (Structured Guidance)

Do NOT:
- Solve their specific problem
- Give the final answer

DO:
- Break problem into clear steps
- Give hints for each step
- Explain concepts briefly
- Use analogies where helpful
- Let student do calculations
- Ask them to complete each step before moving forward
```

### Level 3 Prompt Addition
```
SCAFFOLDING LEVEL: Extensive (Worked Example)

Do NOT:
- Use their exact problem (use similar example)
- Skip explanation of concepts

DO:
- Work through complete similar example
- Explain every step in detail
- Highlight key concepts
- Show calculations
- Then prompt student to try with their data
- Be thorough but clear
```

### Level 4 Prompt Addition
```
SCAFFOLDING LEVEL: Direct Instruction

Do NOT:
- Be condescending
- Overwhelm with too much info

DO:
- Solve their actual problem completely
- Explain each step thoroughly
- Address visible misconceptions
- Provide additional resources
- Suggest practice opportunities
- Be encouraging about their effort
```

---

## 6. Implementation Architecture

### Technology Stack
```
Frontend: HTML, CSS, JavaScript
API: Claude API (Anthropic)
Backend: Firebase Functions (serverless)
Database: Firestore (conversation logs)
Auth: Firebase Auth (anonymous or email)
Hosting: GitHub Pages + Firebase
```

### Data Flow
```
Student types question
    ↓
[Frontend validates input]
    ↓
[Determine scaffold level based on context]
    ↓
[Build prompt with system instructions + level + context]
    ↓
[Send to Claude API]
    ↓
[Receive response]
    ↓
[Log conversation to Firestore]
    ↓
[Display to student]
    ↓
[Update context tracking]
```

### Conversation Context Structure
```javascript
{
  sessionId: "anonymous_xyz",
  conversationId: "conv_123",
  messages: [
    {
      role: "user",
      content: "How do I calculate standard deviation?",
      timestamp: "2025-11-15T10:30:00Z"
    },
    {
      role: "assistant",
      content: "...",
      scaffoldLevel: 1,
      timestamp: "2025-11-15T10:30:02Z"
    }
  ],
  studentContext: {
    currentTopic: "standard_deviation",
    attemptCount: 1,
    identifiedMisconceptions: [],
    emotionalState: "confused",
    lastScaffoldLevel: 1
  }
}
```

---

## 7. Research Data Collection

### What We Track
1. **Scaffold effectiveness**: Which levels lead to learning?
2. **Transition patterns**: When do students need more/less support?
3. **Topic difficulty**: Which concepts require more scaffolding?
4. **Demographic differences**: Does scaffolding work equally for all?
5. **Conversation patterns**: What makes effective tutoring dialogue?

### Metrics
- Time to problem resolution
- Number of scaffold level transitions
- Student self-efficacy ratings (pre/post)
- Concept mastery (quiz scores)
- Return engagement (do they come back?)

---

## 8. Next Steps for Implementation

1. ✅ Design scaffolding framework (this document)
2. ⏳ Write complete Claude API prompts
3. ⏳ Build chat interface (HTML/CSS/JS)
4. ⏳ Implement context tracking logic
5. ⏳ Set up Firebase backend
6. ⏳ Create logging system
7. ⏳ Test with example conversations
8. ⏳ Pilot with small group
9. ⏳ Iterate based on feedback

---

**This framework forms the foundation of your dissertation research on AI-powered cognitive scaffolding for statistics education.**
