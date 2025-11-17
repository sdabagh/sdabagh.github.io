# AI Tutor Chat Interface

**Part of Safaa Dabagh's Dissertation Research**
*AI-Powered Cognitive Scaffolding for Statistics Education*

---

## Overview

This directory contains a complete AI tutoring system with adaptive cognitive scaffolding for the introductory statistics learning platform. The system provides three levels of support based on student performance and needs.

## Components

### 1. **chat-interface.html** (254 lines)
Standalone chat interface that can be used independently or embedded in module pages.

**Features:**
- Clean, professional chat UI
- Message history with timestamps
- Scaffolding level indicator (visual display)
- Module context selector
- Quick action buttons (Hint, Explain, Example)
- Help and privacy modals
- Full accessibility support (ARIA labels, keyboard navigation)

**Usage:**
```html
<!-- Standalone -->
<iframe src="/ai-tutor/chat-interface.html"></iframe>

<!-- Or open directly -->
window.open('/ai-tutor/chat-interface.html', 'AI Tutor');
```

### 2. **chat-styles.css** (836 lines)
Complete styling system matching the main site design.

**Features:**
- Mobile-first responsive design
- Matches main site color scheme (blue #2C5F7C, terracotta #D97D54)
- Smooth animations (fade-in messages, typing indicator)
- Custom scrollbar styling
- High contrast mode support
- Reduced motion support
- Print-optimized styles

**Design System:**
- Message bubbles (user right-aligned blue, AI left-aligned white)
- Scaffolding level indicator with pulsing active dots
- Quick action buttons with hover effects
- Modal overlays for help/privacy
- Character counter with warning states

### 3. **chat-interface.js** (669 lines)
Core chat functionality and API integration.

**Key Functions:**
- `sendMessage()` - Handle user input and get AI responses
- `displayMessage()` - Render messages with formatting
- `getAIResponse()` - Call Claude API (or demo mode)
- `updateScaffoldingIndicator()` - Update visual level display
- `logInteraction()` - Log data for research
- `handleQuickAction()` - Process hint/explain/example buttons

**Demo Mode:**
- `DEMO_MODE = true` by default
- Returns realistic canned responses for testing
- Simulates API delay (1.5-2.5 seconds)
- No API key required for development

**Production Mode:**
- Set `DEMO_MODE = false`
- Calls Firebase Cloud Function `/api/chat`
- Integrates with Claude API
- Logs to Firestore for research

**Storage:**
- Conversation history in localStorage
- Context tracking (module, attempts, time)
- Anonymous user ID generation
- Research data logging

### 4. **system-prompts.js** (580 lines)
Comprehensive system prompts for Claude API with scaffolding levels.

**Structure:**
- **Base prompt**: Core persona and principles for AI tutor
- **Level 1 prompt**: Minimal support (hints and tips)
- **Level 2 prompt**: Moderate support (guided questions)
- **Level 3 prompt**: Extensive support (worked examples)
- **Module context**: All 12 modules with topics, key terms, misconceptions

**buildSystemPrompt() Function:**
```javascript
SYSTEM_PROMPTS.buildSystemPrompt(level, moduleId, proficiency)
```
Combines base + level-specific + module context + student proficiency into a complete system prompt for Claude API.

**Example prompts include:**
- Pedagogical approach for each level
- What to do / what not to do
- Example responses for each level
- Module-specific content and common misconceptions

### 5. **scaffolding-logic.js** (577 lines)
Adaptive scaffolding engine that determines support levels.

**ScaffoldingEngine Class:**
```javascript
const engine = new ScaffoldingEngine();
const level = engine.determineLevel(context);
engine.trackOutcome(successful);
```

**Decision Factors:**
- Number of attempts on problem
- Time spent on task
- Student proficiency (0-1 scale)
- Help request frequency
- Topic difficulty (easy/medium/hard)
- Recent performance trend

**Algorithm:**
- Starts at Level 1 (minimal support)
- Escalates based on:
  - Attempts (2+ → Level 2, 4+ → Level 3)
  - Time (3 min → Level 2, 5 min → Level 3)
  - Low proficiency + struggles
  - Overall support need score > thresholds
- De-escalates when:
  - Student has 2+ consecutive successes
  - High proficiency (>75%)
  - Sufficient time at current level

**Research Features:**
- Complete logging of all decisions
- Performance tracking
- Export methods for data analysis
- Configurable thresholds for experiments

**Methods:**
- `determineLevel(context)` - Main decision algorithm
- `trackOutcome(successful)` - Record problem results
- `shouldEscalate()` / `shouldDeescalate()` - Level change logic
- `calculateProficiency()` - Compute student proficiency from history
- `getSummary()` - Statistics for research
- `exportForResearch()` - Full data export

---

## Integration with Learning Platform

### Embedding in Module Pages

Add to any module lesson or practice page:

```html
<!-- In module lesson HTML -->
<button id="open-tutor-btn">Ask AI Tutor</button>

<script src="/ai-tutor/system-prompts.js"></script>
<script src="/ai-tutor/scaffolding-logic.js"></script>
<script src="/ai-tutor/chat-interface.js"></script>
<script>
// Set context for current module
window.AITutor.setContext({
    module: 'module-07',
    lesson: 'lesson-02',
    problemNumber: 5,
    topicDifficulty: 'medium'
});

// Open chat interface
document.getElementById('open-tutor-btn').addEventListener('click', () => {
    window.open('/ai-tutor/chat-interface.html', 'AI Tutor', 'width=400,height=600');
});
</script>
```

### Setting Up Production API

1. **Create Firebase Cloud Function** (`/api/chat`):
```javascript
exports.chat = functions.https.onRequest(async (req, res) => {
    const { messages, systemPrompt, userId, scaffoldingLevel } = req.body;

    // Call Claude API
    const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages
    });

    // Log to Firestore for research
    await db.collection('interactions').add({
        userId,
        scaffoldingLevel,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        // ... other data
    });

    res.json({ response: response.content[0].text });
});
```

2. **Update chat-interface.js**:
```javascript
const DEMO_MODE = false; // Enable production mode
```

3. **Set environment variables**:
```
ANTHROPIC_API_KEY=your_key_here
FIREBASE_PROJECT_ID=your_project_id
```

---

## Research Data Collection

### Data Points Logged

Every interaction logs:
- User message and AI response
- Scaffolding level at time of interaction
- Module and lesson context
- Timestamp and session duration
- Student proficiency score
- Scaffolding decision factors
- Level changes and reasons

### Privacy & Ethics

- Anonymous user IDs (no personal information)
- Data encrypted in transit and at rest
- IRB approval required before participant recruitment
- Privacy notice displayed to all users
- Voluntary participation
- Data used only for educational research

### Accessing Research Data

```javascript
// Get current session summary
const summary = scaffoldingEngine.getSummary();

// Export all data for analysis
const data = scaffoldingEngine.exportForResearch();

// Download as JSON
const dataStr = JSON.stringify(data, null, 2);
const blob = new Blob([dataStr], { type: 'application/json' });
// ... download blob
```

---

## Development & Testing

### Local Development

1. Open `chat-interface.html` in browser directly
2. Demo mode active by default (no API needed)
3. Test all features with canned responses
4. Check console for research data logs

### Testing Scaffolding Logic

```javascript
// Create test context
const context = {
    module: 'module-07',
    attempts: 3,
    timeOnTask: 240,
    studentProficiency: 0.6,
    topicDifficulty: 'hard'
};

// Test decision
const level = scaffoldingEngine.determineLevel(context);
console.log('Scaffolding level:', level); // Should be 2 or 3

// Simulate outcomes
scaffoldingEngine.trackOutcome(true);  // Success
scaffoldingEngine.trackOutcome(false); // Failure

// Check proficiency update
console.log('Proficiency:', scaffoldingEngine.calculateProficiency());
```

### Customizing Thresholds

Adjust in `scaffolding-logic.js`:

```javascript
this.config = {
    attemptsForLevel2: 2,  // Change to 3 for less escalation
    attemptsForLevel3: 4,  // Change to 5 for less escalation
    timeForLevel2: 180,    // Seconds before Level 2
    // ... etc
};
```

---

## File Sizes

- **chat-interface.html**: 14K
- **chat-styles.css**: 16K
- **chat-interface.js**: 25K
- **system-prompts.js**: 24K
- **scaffolding-logic.js**: 19K

**Total**: ~98K (minified would be ~40-50K)

---

## Technology Stack

- **Frontend**: Pure HTML/CSS/JavaScript (no framework dependencies)
- **API**: Claude API (Anthropic)
- **Database**: Firebase Firestore (planned)
- **Authentication**: Firebase Auth (planned)
- **Hosting**: GitHub Pages (static) + Firebase Functions (API)

---

## Browser Compatibility

- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅
- Mobile browsers ✅

---

## Accessibility

- WCAG 2.1 AA compliant
- Screen reader support (ARIA labels)
- Keyboard navigation
- High contrast mode support
- Reduced motion support
- Semantic HTML

---

## Future Enhancements

1. **Voice Input**: Speech-to-text for mobile users
2. **LaTeX Rendering**: Full mathematical notation with KaTeX
3. **Code Highlighting**: Syntax highlighting for R/Python examples
4. **Conversation Export**: Download chat history as PDF
5. **Multi-language Support**: Spanish translation for accessibility
6. **Offline Mode**: Service worker for offline access
7. **Mobile App**: React Native wrapper for app stores
8. **Analytics Dashboard**: Real-time scaffolding effectiveness metrics

---

## Research Questions Addressed

This AI tutor system is designed to investigate:

1. **RQ1**: How does adaptive scaffolding affect learning outcomes?
2. **RQ2**: Which scaffolding level is most effective for different topics?
3. **RQ3**: How do students with different proficiency levels use the tutor?
4. **RQ4**: What factors predict when students need more/less support?

---

## Contact

**Researcher**: Safaa Dabagh
**Email**: dabagh_safaa@smc.edu
**Affiliation**: UCLA Department of Statistics (PhD Candidate)
**Advisors**: Prof. Mark Handcock & Prof. Guang Cheng

---

## License

This code is part of a dissertation research project. For academic use, please cite:

> Dabagh, S. (2027). *AI-Powered Cognitive Scaffolding for Introductory Statistics: A Mixed-Methods Study*. UCLA.

---

**Last Updated**: November 17, 2025
**Version**: 1.0 - Initial Implementation
