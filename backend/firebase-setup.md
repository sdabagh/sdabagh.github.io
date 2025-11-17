# Firebase Setup Guide
## Backend Infrastructure for Dissertation Research Platform

**Project**: AI-Powered Statistics Learning Platform
**Author**: Safaa Dabagh
**Last Updated**: November 17, 2025

---

## Overview

This guide walks through setting up Firebase for your dissertation research platform, including:
- User authentication (anonymous for research)
- Firestore database for research data
- Cloud Functions for Claude API integration
- Analytics and research dashboards
- Security rules for data protection

---

## Prerequisites

- Google account
- Node.js installed (v18 or higher)
- Firebase CLI installed: `npm install -g firebase-tools`
- Anthropic API key for Claude
- UCLA IRB approval number (before production)

---

## Part 1: Firebase Project Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Project name: `statistics-learning-platform` (or your choice)
4. **Disable Google Analytics** for now (enable later with IRB approval)
5. Click **"Create project"**

### Step 2: Enable Required Services

#### A. Enable Authentication
1. In Firebase Console, go to **Build → Authentication**
2. Click **"Get started"**
3. Enable **Anonymous** sign-in:
   - Click **"Anonymous"** from sign-in methods
   - Toggle **"Enable"**
   - Click **"Save"**

**Why Anonymous?**
- Research participants don't need accounts
- Maintains privacy
- Auto-generates unique IDs for tracking
- IRB-compliant (no PII collected)

#### B. Enable Firestore Database
1. Go to **Build → Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (we'll add security rules later)
4. Select location: **us-central** (or closest to your participants)
5. Click **"Enable"**

#### C. Enable Cloud Functions
1. Go to **Build → Functions**
2. Click **"Get started"**
3. This will set up Firebase Functions in your project

### Step 3: Install Firebase CLI and Initialize

```bash
# Login to Firebase
firebase login

# Navigate to your project directory
cd /home/user/sdabagh.github.io

# Initialize Firebase
firebase init

# Select these features (use spacebar to select):
# [x] Firestore
# [x] Functions
# [x] Hosting

# Choose existing project: statistics-learning-platform

# Firestore setup:
# - Rules file: firestore.rules
# - Indexes file: firestore.indexes.json

# Functions setup:
# - Language: JavaScript (or TypeScript if you prefer)
# - ESLint: Yes
# - Install dependencies: Yes

# Hosting setup:
# - Public directory: . (current directory)
# - Single-page app: No
# - GitHub auto-deploys: No (we're using manual deploy)
```

This creates:
```
/home/user/sdabagh.github.io/
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
└── functions/
    ├── package.json
    ├── index.js
    └── node_modules/
```

---

## Part 2: Firestore Database Schema

### Collections Structure

```
users/
  {userId}/
    - anonymousId: string (auto-generated)
    - createdAt: timestamp
    - consentGiven: boolean
    - studyGroup: string ("control" | "treatment" | "pilot")
    - demographicData: object (optional, IRB-approved only)
    - lastActive: timestamp

sessions/
  {sessionId}/
    - userId: string (reference to users)
    - startTime: timestamp
    - endTime: timestamp
    - duration: number (seconds)
    - modulesVisited: array
    - totalInteractions: number

interactions/
  {interactionId}/
    - userId: string
    - sessionId: string
    - timestamp: timestamp
    - module: string (e.g., "module-07")
    - lesson: string (e.g., "lesson-02")
    - context: string (e.g., "practice_problem_5")
    - scaffoldingLevel: number (1, 2, or 3)
    - studentMessage: string (encrypted)
    - aiResponse: string (encrypted)
    - responseTimeMs: number
    - escalationCount: number
    - studentProficiency: number (0-1)
    - problemDifficulty: string ("easy" | "medium" | "hard")
    - outcome: string ("understood" | "still_confused" | "abandoned")

assessments/
  {assessmentId}/
    - userId: string
    - module: string
    - assessmentType: string ("pre" | "post" | "quiz")
    - timestamp: timestamp
    - responses: array
    - score: number (0-1)
    - timeSpent: number (seconds)
    - attemptNumber: number

performance/
  {userId}/
    - overallProficiency: number (0-1)
    - moduleScores: object { module-01: 0.85, module-02: 0.72, ... }
    - quizScores: object
    - practicePerformance: object
    - learningGains: object { module-01: { pre: 0.4, post: 0.8, gain: 0.4 }, ... }
    - lastUpdated: timestamp

scaffolding_events/
  {eventId}/
    - userId: string
    - sessionId: string
    - timestamp: timestamp
    - eventType: string ("escalation" | "deescalation" | "level_change")
    - fromLevel: number
    - toLevel: number
    - triggerFactors: object { attempts: 3, timeOnTask: 245, proficiency: 0.55, ... }
    - context: object

research_metadata/
  study_info/
    - startDate: timestamp
    - phases: array ["pilot", "launch", "data_collection", "analysis"]
    - currentPhase: string
    - participantCount: number
    - irbApprovalNumber: string
```

### Indexes (for query performance)

```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "interactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "interactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "module", "order": "ASCENDING" },
        { "fieldPath": "scaffoldingLevel", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "assessments",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "module", "order": "ASCENDING" },
        { "fieldPath": "assessmentType", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

## Part 3: Security Rules

### Firestore Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Users collection
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow create: if isAuthenticated();
      allow update: if isOwner(userId);
      allow delete: if false; // No deleting users (data retention for research)
    }

    // Sessions collection
    match /sessions/{sessionId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow delete: if false;
    }

    // Interactions collection
    match /interactions/{interactionId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isAuthenticated();
      allow update: if false; // Interactions are immutable
      allow delete: if false;
    }

    // Assessments collection
    match /assessments/{assessmentId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isAuthenticated();
      allow update: if isOwner(resource.data.userId); // Allow updating attemptNumber
      allow delete: if false;
    }

    // Performance collection
    match /performance/{userId} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId);
    }

    // Scaffolding events
    match /scaffolding_events/{eventId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isAuthenticated();
      allow update: if false;
      allow delete: if false;
    }

    // Research metadata (admin only)
    match /research_metadata/{document=**} {
      allow read: if isAuthenticated(); // All can read study info
      allow write: if false; // Only admin via Firebase Console
    }
  }
}
```

### Deploy Security Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules
```

---

## Part 4: Cloud Functions Setup

### Install Dependencies

```bash
cd functions
npm install --save @anthropic-ai/sdk
npm install --save firebase-admin
npm install --save firebase-functions
npm install --save cors
npm install --save crypto-js  # For encryption
```

### Environment Configuration

```bash
# Set Anthropic API key
firebase functions:config:set anthropic.key="YOUR_ANTHROPIC_API_KEY"

# Set encryption key for sensitive data
firebase functions:config:set encryption.key="YOUR_RANDOM_32_CHAR_KEY"

# View config
firebase functions:config:get
```

### Main Cloud Function (functions/index.js)

See separate file: `cloud-functions.js`

### Deploy Cloud Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:chatWithAI
```

---

## Part 5: Web App Configuration

### Add Firebase to Your Web App

1. In Firebase Console, go to **Project settings** (gear icon)
2. Under **"Your apps"**, click **Web** icon (</>)
3. Register app name: `Statistics Learning Platform`
4. Copy the Firebase SDK configuration

Create `/home/user/sdabagh.github.io/firebase-config.js`:

```javascript
// Firebase Configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const functions = firebase.functions();

// Export for use in other files
window.firebaseAuth = auth;
window.firebaseDB = db;
window.firebaseFunctions = functions;
```

### Add Firebase SDK to HTML

Add to `<head>` of all HTML pages:

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-functions-compat.js"></script>

<!-- Your Firebase Config -->
<script src="/firebase-config.js"></script>
```

---

## Part 6: Anonymous Authentication Implementation

### Auto Sign-In on Page Load

```javascript
// auth-manager.js

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.initAuth();
  }

  async initAuth() {
    // Check if already signed in
    firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        // User is signed in
        this.currentUser = user;
        await this.ensureUserDocument(user.uid);
      } else {
        // No user, sign in anonymously
        await this.signInAnonymously();
      }
    });
  }

  async signInAnonymously() {
    try {
      const result = await firebase.auth().signInAnonymously();
      this.currentUser = result.user;
      await this.createUserDocument(result.user.uid);
      console.log('[AUTH] Anonymous sign-in successful:', result.user.uid);
    } catch (error) {
      console.error('[AUTH] Error signing in:', error);
    }
  }

  async createUserDocument(uid) {
    const userRef = firebase.firestore().collection('users').doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      await userRef.set({
        anonymousId: this.generateAnonymousId(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        consentGiven: false, // Must explicitly consent
        studyGroup: this.assignStudyGroup(),
        lastActive: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  async ensureUserDocument(uid) {
    // Update last active
    await firebase.firestore().collection('users').doc(uid).update({
      lastActive: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  generateAnonymousId() {
    // Generate readable anonymous ID (e.g., "Participant_A7B3C9")
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = 'Participant_';
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  assignStudyGroup() {
    // Randomly assign to control or treatment
    // For pilot: all in "pilot" group
    return 'pilot'; // Change to random for full study
  }

  async recordConsent() {
    if (this.currentUser) {
      await firebase.firestore().collection('users').doc(this.currentUser.uid).update({
        consentGiven: true,
        consentTimestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  getUserId() {
    return this.currentUser ? this.currentUser.uid : null;
  }
}

// Initialize globally
window.authManager = new AuthManager();
```

---

## Part 7: Deployment

### Deploy to Firebase Hosting

```bash
# Build production version (if needed)
# (Your site is static HTML, so no build step needed)

# Deploy everything
firebase deploy

# Or deploy specific parts
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
```

### Custom Domain (Optional)

1. Go to **Hosting → Add custom domain**
2. Enter your domain: `stats.safaadabagh.com`
3. Follow DNS configuration steps
4. Firebase will provision SSL certificate automatically

---

## Part 8: Testing

### Test Authentication

```javascript
// In browser console
firebase.auth().currentUser
// Should show user object after anonymous sign-in
```

### Test Firestore Write

```javascript
// Test writing to Firestore
firebase.firestore().collection('test').add({
  message: 'Hello from test',
  timestamp: firebase.firestore.FieldValue.serverTimestamp()
});
```

### Test Cloud Function

```javascript
// Test AI chat function
const chatFunction = firebase.functions().httpsCallable('chatWithAI');
chatFunction({
  messages: [{ role: 'user', content: 'What is a mean?' }],
  context: { module: 'module-02', level: 1 }
}).then(result => {
  console.log('AI Response:', result.data);
});
```

---

## Part 9: Monitoring & Analytics

### Firebase Console Monitoring

1. **Authentication**: View active users
2. **Firestore**: Monitor reads/writes
3. **Functions**: Check execution logs, errors
4. **Performance**: Response times, success rates

### Enable Firebase Analytics (After IRB Approval)

```bash
# Enable analytics
firebase analytics:enable

# Set user properties for research
firebase.analytics().setUserProperties({
  study_group: 'treatment',
  module_started: 'module-07'
});

# Log custom events
firebase.analytics().logEvent('lesson_completed', {
  module: 'module-07',
  lesson: 'lesson-02',
  score: 0.85
});
```

---

## Part 10: Cost Estimation

### Firebase Free Tier (Spark Plan)

**Sufficient for pilot study (<100 users):**
- Firestore: 50K reads/day, 20K writes/day, 1GB storage
- Functions: 125K invocations/month, 40K GB-seconds
- Hosting: 10GB storage, 360MB/day transfer
- Authentication: Unlimited

### Paid Tier (Blaze Plan)

**Needed for full study (>100 users):**

**Firestore:**
- $0.06 per 100K reads
- $0.18 per 100K writes
- $0.18/GB storage/month

**Cloud Functions:**
- $0.40 per million invocations
- $0.0000025 per GB-second

**Estimated costs for 200 students:**
- Firestore: ~$5-10/month
- Functions: ~$10-20/month (depends on AI API calls)
- **Total: ~$15-30/month**

**Anthropic Claude API:**
- Haiku model: ~$0.25 per 1M input tokens, ~$1.25 per 1M output tokens
- Estimated: 200 students × 50 conversations × 500 tokens avg = 5M tokens
- **Cost: ~$5-10 for entire study**

---

## Security Checklist

Before going to production:

- [ ] Enable Firestore security rules (no test mode)
- [ ] Add encryption for sensitive data
- [ ] Set up Firebase App Check (prevent abuse)
- [ ] Enable audit logging
- [ ] Set up backup policies
- [ ] Configure budget alerts
- [ ] Review IAM permissions
- [ ] Add rate limiting to Cloud Functions
- [ ] Test with IRB-approved consent flow
- [ ] Document data retention policy
- [ ] Set up participant data export capability

---

## Troubleshooting

### Common Issues

**1. "Permission denied" in Firestore**
- Check security rules
- Verify user is authenticated
- Check field paths in rules

**2. Cloud Function timeout**
- Increase timeout in functions config
- Check Claude API response time
- Optimize function code

**3. CORS errors**
- Ensure CORS is enabled in Cloud Function
- Check allowed origins

**4. High costs**
- Enable budget alerts
- Check for infinite loops
- Monitor read/write patterns
- Use caching where appropriate

---

## Next Steps

1. ✅ Complete Firebase setup
2. ⏳ Implement authentication in web app
3. ⏳ Deploy Cloud Functions
4. ⏳ Test with sample interactions
5. ⏳ Build analytics dashboard
6. ⏳ IRB approval
7. ⏳ Pilot study with 10-20 users
8. ⏳ Full study launch

---

**Setup Guide Version**: 1.0
**Last Updated**: November 17, 2025
**Contact**: dabagh_safaa@smc.edu
