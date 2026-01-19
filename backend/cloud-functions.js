/**
 * Firebase Cloud Functions
 * AI-Powered Statistics Learning Platform
 *
 * Main functions:
 * - chatWithAI: Process student questions and return scaffolded responses
 * - logInteraction: Log all AI interactions for research
 * - calculateProficiency: Update student proficiency scores
 * - getAnalytics: Fetch research analytics data
 */

const corsOptions = {
  // or if you need to match exact subdomains:
   origin: [
     /^https:\/\/[a-z0-9-]+\.sofiadabagh383\.workers\.dev$/,
     'https://sdabagh.github.io'
   ]
};
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Anthropic = require('@anthropic-ai/sdk');
const cors = require('cors')(corsOptions);
const CryptoJS = require('crypto-js');

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: functions.config().anthropic.key,
});

// Encryption key for sensitive data
const ENCRYPTION_KEY = functions.config().encryption.key;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Encrypt sensitive text before storing
 */
function encrypt(text) {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

/**
 * Decrypt sensitive text when needed
 */
function decrypt(encryptedText) {
  const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Build system prompt based on scaffolding level and context
 */
function buildSystemPrompt(level, moduleId, proficiency) {
  const basePrompt = `You are an AI teaching assistant for an introductory statistics course. Your role is to help students learn through cognitive scaffolding.

CORE PRINCIPLES:
- Never give direct answers to practice problems or quizzes
- Always reference course material
- Ask questions to promote thinking
- Check for understanding
- Connect procedures to concepts

Current student proficiency: ${proficiency >= 0.75 ? 'strong' : proficiency >= 0.5 ? 'developing' : 'struggling'}
Current module: ${getModuleName(moduleId)}`;

  const levelPrompts = {
    1: `\n\nSCAFFOLDING LEVEL 1: MINIMAL SUPPORT (HINTS)
- Give brief hints without revealing solutions
- Ask guiding questions
- Point to relevant formulas or concepts
- Keep responses to 2-3 sentences
Example: "Think about the formula for standard deviation we learned in Lesson 2. What do you need to calculate first?"`,

    2: `\n\nSCAFFOLDING LEVEL 2: MODERATE SUPPORT (GUIDED QUESTIONS)
- Break problem into steps
- Ask specific questions for each step
- Provide partial information
- Check understanding after each step
Example: "Let's work through this step by step:
1. First, identify your sample mean and standard deviation
2. Then, determine if this is a z-test or t-test
3. Calculate the test statistic
Start with step 1 - what are your values?"`,

    3: `\n\nSCAFFOLDING LEVEL 3: EXTENSIVE SUPPORT (WORKED EXAMPLES)
- Show complete worked example with different numbers
- Explain reasoning at each step
- Then guide student to apply same process
Example: "Let me show you a similar example first:
Example: Find 95% CI for mean with x̄=50, s=8, n=25
Step 1: Formula is x̄ ± t*(s/√n)
Step 2: Find t* with df=24, α=0.05 → t*=2.064
Step 3: Calculate margin: 2.064 × (8/√25) = 3.302
Step 4: CI = 50 ± 3.302 = (46.698, 53.302)

Now apply these same steps to your problem. What's your x̄, s, and n?"`
  };

  return basePrompt + (levelPrompts[level] || levelPrompts[1]);
}

/**
 * Get module name from ID
 */
function getModuleName(moduleId) {
  const modules = {
    'module-01': 'Introduction to Statistics & Data',
    'module-02': 'Descriptive Statistics',
    'module-03': 'Probability Basics',
    'module-04': 'Discrete Probability Distributions',
    'module-05': 'Continuous Probability Distributions',
    'module-06': 'Sampling Distributions',
    'module-07': 'Confidence Intervals & Sample Size',
    'module-08': 'Hypothesis Testing',
    'module-09': 'Hypothesis Testing for Two Populations',
    'module-10': 'Analysis of Variance (ANOVA)',
    'module-11': 'Simple Linear Regression',
    'module-12': 'Chi-Square Tests'
  };
  return modules[moduleId] || 'Statistics';
}

// ============================================================================
// MAIN CLOUD FUNCTIONS
// ============================================================================

/**
 * Chat with AI - Main function for AI tutoring
 *
 * Input: {
 *   messages: [{ role: 'user', content: 'question' }],
 *   context: { module, lesson, scaffoldingLevel, proficiency }
 * }
 *
 * Output: {
 *   response: 'AI response text',
 *   scaffoldingLevel: 2,
 *   success: true
 * }
 */
exports.chatWithAI = functions
  .runWith({
    timeoutSeconds: 60,
    memory: '512MB'
  })
  .https.onCall(async (data, context) => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const userId = context.auth.uid;
    const { messages, context: studentContext } = data;

    try {
      // Extract context
      const {
        module = 'module-01',
        lesson = '',
        scaffoldingLevel = 1,
        proficiency = 0.5,
        problemNumber = null
      } = studentContext;

      // Build system prompt
      const systemPrompt = buildSystemPrompt(scaffoldingLevel, module, proficiency);

      // Call Claude API
      const startTime = Date.now();
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307', // Fast and cost-effective
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages
      });

      const responseTime = Date.now() - startTime;
      const aiResponse = response.content[0].text;

      // Log interaction to Firestore
      await logInteractionToFirestore({
        userId,
        module,
        lesson,
        problemNumber,
        scaffoldingLevel,
        proficiency,
        userMessage: messages[messages.length - 1].content,
        aiResponse,
        responseTime
      });

      return {
        response: aiResponse,
        scaffoldingLevel,
        success: true,
        responseTime
      };

    } catch (error) {
      console.error('Error in chatWithAI:', error);

      // Log error
      await db.collection('errors').add({
        userId,
        function: 'chatWithAI',
        error: error.message,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      throw new functions.https.HttpsError(
        'internal',
        'Error processing AI request',
        error.message
      );
    }
  });

/**
 * Log interaction to Firestore (helper)
 */
async function logInteractionToFirestore(data) {
  const {
    userId,
    module,
    lesson,
    problemNumber,
    scaffoldingLevel,
    proficiency,
    userMessage,
    aiResponse,
    responseTime
  } = data;

  // Get current session
  const sessionId = await getCurrentSessionId(userId);

  // Encrypt sensitive data
  const encryptedUserMessage = encrypt(userMessage);
  const encryptedAIResponse = encrypt(aiResponse);

  await db.collection('interactions').add({
    userId,
    sessionId,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    module,
    lesson,
    context: problemNumber ? `practice_problem_${problemNumber}` : 'general_question',
    scaffoldingLevel,
    studentMessage: encryptedUserMessage,
    aiResponse: encryptedAIResponse,
    responseTimeMs: responseTime,
    studentProficiency: proficiency
  });

  // Update session interaction count
  await db.collection('sessions').doc(sessionId).update({
    totalInteractions: admin.firestore.FieldValue.increment(1),
    lastInteraction: admin.firestore.FieldValue.serverTimestamp()
  });
}

/**
 * Get or create current session for user
 */
async function getCurrentSessionId(userId) {
  // Check for active session (last 2 hours)
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

  const activeSessions = await db.collection('sessions')
    .where('userId', '==', userId)
    .where('lastInteraction', '>=', twoHoursAgo)
    .orderBy('lastInteraction', 'desc')
    .limit(1)
    .get();

  if (!activeSessions.empty) {
    return activeSessions.docs[0].id;
  }

  // Create new session
  const newSession = await db.collection('sessions').add({
    userId,
    startTime: admin.firestore.FieldValue.serverTimestamp(),
    lastInteraction: admin.firestore.FieldValue.serverTimestamp(),
    modulesVisited: [],
    totalInteractions: 0
  });

  return newSession.id;
}

/**
 * Record Assessment Score
 *
 * Input: {
 *   module: 'module-07',
 *   assessmentType: 'pre' | 'post' | 'quiz',
 *   responses: [...],
 *   score: 0.85,
 *   timeSpent: 420
 * }
 */
exports.recordAssessment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const { module, assessmentType, responses, score, timeSpent } = data;

  try {
    // Check if assessment already exists
    const existingQuery = await db.collection('assessments')
      .where('userId', '==', userId)
      .where('module', '==', module)
      .where('assessmentType', '==', assessmentType)
      .get();

    let attemptNumber = 1;
    if (!existingQuery.empty) {
      // Get max attempt number
      const attempts = existingQuery.docs.map(doc => doc.data().attemptNumber || 1);
      attemptNumber = Math.max(...attempts) + 1;
    }

    // Record assessment
    await db.collection('assessments').add({
      userId,
      module,
      assessmentType,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      responses,
      score,
      timeSpent,
      attemptNumber
    });

    // Update performance record
    await updatePerformance(userId, module, assessmentType, score);

    return { success: true, attemptNumber };

  } catch (error) {
    console.error('Error recording assessment:', error);
    throw new functions.https.HttpsError('internal', 'Error recording assessment');
  }
});

/**
 * Update student performance metrics
 */
async function updatePerformance(userId, module, assessmentType, score) {
  const perfRef = db.collection('performance').doc(userId);
  const perfDoc = await perfRef.get();

  if (!perfDoc.exists) {
    // Create new performance document
    await perfRef.set({
      overallProficiency: score,
      moduleScores: { [module]: score },
      quizScores: assessmentType === 'quiz' ? { [module]: score } : {},
      learningGains: {},
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
  } else {
    // Update existing
    const currentData = perfDoc.data();
    const moduleScores = currentData.moduleScores || {};
    moduleScores[module] = score;

    // Calculate overall proficiency (average of all module scores)
    const scores = Object.values(moduleScores);
    const overallProficiency = scores.reduce((a, b) => a + b, 0) / scores.length;

    const updates = {
      overallProficiency,
      [`moduleScores.${module}`]: score,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };

    if (assessmentType === 'quiz') {
      updates[`quizScores.${module}`] = score;
    }

    // Calculate learning gain if we have both pre and post
    if (assessmentType === 'post') {
      const preAssessment = await db.collection('assessments')
        .where('userId', '==', userId)
        .where('module', '==', module)
        .where('assessmentType', '==', 'pre')
        .limit(1)
        .get();

      if (!preAssessment.empty) {
        const preScore = preAssessment.docs[0].data().score;
        const gain = score - preScore;
        updates[`learningGains.${module}`] = {
          pre: preScore,
          post: score,
          gain: gain
        };
      }
    }

    await perfRef.update(updates);
  }
}

/**
 * Record Scaffolding Event
 *
 * Input: {
 *   eventType: 'escalation' | 'deescalation',
 *   fromLevel: 1,
 *   toLevel: 2,
 *   triggerFactors: { attempts: 3, timeOnTask: 245, ... }
 * }
 */
exports.recordScaffoldingEvent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const sessionId = await getCurrentSessionId(userId);

  await db.collection('scaffolding_events').add({
    userId,
    sessionId,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    ...data
  });

  return { success: true };
});

/**
 * Get Research Analytics
 * Admin-only function to fetch aggregated research data
 *
 * Input: {
 *   dataType: 'interactions' | 'performance' | 'scaffolding',
 *   filters: { startDate, endDate, module, etc. }
 * }
 */
exports.getResearchAnalytics = functions.https.onCall(async (data, context) => {
  // TODO: Add admin check
  // if (!context.auth || !context.auth.token.admin) {
  //   throw new functions.https.HttpsError('permission-denied', 'Admin only');
  // }

  const { dataType, filters = {} } = data;

  try {
    switch (dataType) {
      case 'interactions':
        return await getInteractionAnalytics(filters);

      case 'performance':
        return await getPerformanceAnalytics(filters);

      case 'scaffolding':
        return await getScaffoldingAnalytics(filters);

      case 'summary':
        return await getOverallSummary(filters);

      default:
        throw new Error('Invalid data type');
    }
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw new functions.https.HttpsError('internal', 'Error fetching analytics');
  }
});

/**
 * Get interaction analytics
 */
async function getInteractionAnalytics(filters) {
  let query = db.collection('interactions');

  if (filters.startDate) {
    query = query.where('timestamp', '>=', new Date(filters.startDate));
  }
  if (filters.endDate) {
    query = query.where('timestamp', '<=', new Date(filters.endDate));
  }
  if (filters.module) {
    query = query.where('module', '==', filters.module);
  }

  const snapshot = await query.get();

  // Aggregate data
  const totalInteractions = snapshot.size;
  const levelCounts = { 1: 0, 2: 0, 3: 0 };
  const moduleBreakdown = {};
  let totalResponseTime = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    levelCounts[data.scaffoldingLevel]++;
    moduleBreakdown[data.module] = (moduleBreakdown[data.module] || 0) + 1;
    totalResponseTime += data.responseTimeMs || 0;
  });

  return {
    totalInteractions,
    levelDistribution: {
      level1: levelCounts[1],
      level2: levelCounts[2],
      level3: levelCounts[3]
    },
    moduleBreakdown,
    averageResponseTime: totalResponseTime / totalInteractions
  };
}

/**
 * Get performance analytics
 */
async function getPerformanceAnalytics(filters) {
  const snapshot = await db.collection('performance').get();

  const proficiencyScores = [];
  const learningGains = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    proficiencyScores.push(data.overallProficiency);

    if (data.learningGains) {
      Object.values(data.learningGains).forEach(gain => {
        if (gain.gain !== undefined) {
          learningGains.push(gain.gain);
        }
      });
    }
  });

  return {
    totalStudents: snapshot.size,
    averageProficiency: proficiencyScores.reduce((a, b) => a + b, 0) / proficiencyScores.length,
    averageLearningGain: learningGains.reduce((a, b) => a + b, 0) / learningGains.length,
    proficiencyDistribution: {
      struggling: proficiencyScores.filter(p => p < 0.5).length,
      developing: proficiencyScores.filter(p => p >= 0.5 && p < 0.75).length,
      strong: proficiencyScores.filter(p => p >= 0.75).length
    }
  };
}

/**
 * Get scaffolding analytics
 */
async function getScaffoldingAnalytics(filters) {
  const snapshot = await db.collection('scaffolding_events').get();

  const escalations = [];
  const deescalations = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.eventType === 'escalation') {
      escalations.push(data);
    } else if (data.eventType === 'deescalation') {
      deescalations.push(data);
    }
  });

  return {
    totalEvents: snapshot.size,
    escalationCount: escalations.length,
    deescalationCount: deescalations.length,
    escalationRate: escalations.length / snapshot.size
  };
}

/**
 * Get overall summary
 */
async function getOverallSummary(filters) {
  const [interactions, performance, scaffolding, users, sessions] = await Promise.all([
    getInteractionAnalytics(filters),
    getPerformanceAnalytics(filters),
    getScaffoldingAnalytics(filters),
    db.collection('users').get(),
    db.collection('sessions').get()
  ]);

  return {
    overview: {
      totalUsers: users.size,
      totalSessions: sessions.size,
      totalInteractions: interactions.totalInteractions
    },
    interactions,
    performance,
    scaffolding,
    timestamp: new Date().toISOString()
  };
}

/**
 * Scheduled function to clean up old sessions
 * Runs daily at midnight
 */
exports.cleanupOldSessions = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const oldSessions = await db.collection('sessions')
      .where('lastInteraction', '<', thirtyDaysAgo)
      .get();

    const batch = db.batch();
    oldSessions.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Cleaned up ${oldSessions.size} old sessions`);
  });

/**
 * Export user data (GDPR compliance)
 *
 * Input: { userId: 'xxx' }
 * Output: Complete user data package
 */
exports.exportUserData = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = data.userId || context.auth.uid;

  // Verify user can only export their own data (or admin)
  if (userId !== context.auth.uid) {
    // TODO: Check if user is admin
    throw new functions.https.HttpsError('permission-denied', 'Can only export your own data');
  }

  try {
    // Fetch all user data
    const [user, sessions, interactions, assessments, performance] = await Promise.all([
      db.collection('users').doc(userId).get(),
      db.collection('sessions').where('userId', '==', userId).get(),
      db.collection('interactions').where('userId', '==', userId).get(),
      db.collection('assessments').where('userId', '==', userId).get(),
      db.collection('performance').doc(userId).get()
    ]);

    // Decrypt interactions
    const decryptedInteractions = interactions.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        studentMessage: decrypt(data.studentMessage),
        aiResponse: decrypt(data.aiResponse),
        timestamp: data.timestamp.toDate().toISOString()
      };
    });

    return {
      user: user.exists ? user.data() : null,
      sessions: sessions.docs.map(doc => doc.data()),
      interactions: decryptedInteractions,
      assessments: assessments.docs.map(doc => doc.data()),
      performance: performance.exists ? performance.data() : null,
      exportedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error exporting user data:', error);
    throw new functions.https.HttpsError('internal', 'Error exporting data');
  }
});
