/* ============================================
   Adaptive Scaffolding Logic
   Dynamic Support Level Adjustment Algorithm
   Part of Safaa Dabagh's Dissertation Research
   ============================================ */

/**
 * ScaffoldingEngine Class
 * Determines and adjusts the level of cognitive scaffolding based on student performance
 *
 * Scaffolding Levels:
 * - Level 1: Minimal support (hints and prompts)
 * - Level 2: Moderate support (guided step-by-step questions)
 * - Level 3: Extensive support (worked examples and demonstrations)
 *
 * The engine uses multiple factors to determine appropriate support level:
 * - Number of attempts on current problem
 * - Time spent on task
 * - Recent performance history
 * - Topic difficulty
 * - Help request frequency
 * - Explicit student requests
 */

class ScaffoldingEngine {
    constructor() {
        this.currentLevel = 1; // Always start with minimal support
        this.history = []; // Track all scaffolding decisions
        this.performanceHistory = []; // Track problem outcomes
        this.levelChanges = 0; // Count of level adjustments
        this.sessionStartTime = Date.now();

        // Configurable thresholds (can be adjusted for research experiments)
        this.config = {
            // Attempt-based thresholds
            attemptsForLevel2: 2,  // Escalate to Level 2 after this many attempts
            attemptsForLevel3: 4,  // Escalate to Level 3 after this many attempts

            // Time-based thresholds (in seconds)
            timeForLevel2: 180,    // 3 minutes
            timeForLevel3: 300,    // 5 minutes

            // Proficiency thresholds (0-1 scale)
            lowProficiencyThreshold: 0.5,   // Below this = struggling
            highProficiencyThreshold: 0.75,  // Above this = doing well

            // Help frequency threshold (requests per minute)
            highHelpFrequency: 0.5,  // More than this = needs more support

            // De-escalation criteria
            successStreakForDeescalate: 2,  // Correct problems in a row to reduce support
            minTimeAtLevel: 120000,  // Must spend at least 2 min at a level before de-escalating

            // Topic difficulty modifiers
            topicDifficulty: {
                'easy': 0.8,    // Multiplier for easy topics
                'medium': 1.0,  // Baseline
                'hard': 1.3     // Escalate faster for hard topics
            }
        };

        console.log('[Scaffolding Engine] Initialized at Level 1');
    }

    /**
     * Main method: Determine appropriate scaffolding level
     * @param {Object} context - Current learning context
     * @returns {number} Scaffolding level (1, 2, or 3)
     */
    determineLevel(context) {
        // Log current state for research
        this.logDecision('START', context);

        // Check for explicit level requests first
        if (context.requestedLevel) {
            return this.handleExplicitRequest(context.requestedLevel, context);
        }

        // Calculate factors influencing scaffolding decision
        const factors = this.calculateFactors(context);

        // Apply decision algorithm
        const newLevel = this.applyDecisionAlgorithm(factors, context);

        // Check if we should change level
        if (newLevel !== this.currentLevel) {
            this.changeLevel(newLevel, factors, context);
        }

        // Log decision for research
        this.logDecision('DETERMINE', { ...context, factors, level: this.currentLevel });

        return this.currentLevel;
    }

    /**
     * Calculate factors that influence scaffolding decisions
     * @param {Object} context - Learning context
     * @returns {Object} Calculated factors
     */
    calculateFactors(context) {
        const factors = {};

        // Factor 1: Attempt count
        factors.attempts = context.attempts || 0;
        factors.attemptScore = this.scoreAttempts(factors.attempts);

        // Factor 2: Time on task
        const timeOnTask = context.timeOnTask ||
                          (Date.now() - (context.problemStartTime || Date.now())) / 1000;
        factors.timeOnTask = timeOnTask;
        factors.timeScore = this.scoreTime(timeOnTask);

        // Factor 3: Student proficiency
        factors.proficiency = context.studentProficiency || this.calculateProficiency();
        factors.proficiencyScore = this.scoreProficiency(factors.proficiency);

        // Factor 4: Help frequency
        factors.helpFrequency = context.helpFrequency || 0;
        factors.helpScore = this.scoreHelpFrequency(factors.helpFrequency);

        // Factor 5: Topic difficulty
        factors.topicDifficulty = context.topicDifficulty || 'medium';
        factors.difficultyMultiplier = this.config.topicDifficulty[factors.topicDifficulty] || 1.0;

        // Factor 6: Recent performance trend
        factors.recentTrend = this.calculateRecentTrend();
        factors.trendScore = this.scoreTrend(factors.recentTrend);

        // Factor 7: Time at current level
        factors.timeAtCurrentLevel = Date.now() - (this.lastLevelChange || this.sessionStartTime);

        // Calculate overall need for support (weighted combination)
        factors.supportNeed = this.calculateSupportNeed(factors);

        return factors;
    }

    /**
     * Score attempt count (0-1, higher = more support needed)
     */
    scoreAttempts(attempts) {
        if (attempts === 0) return 0;
        if (attempts <= 1) return 0.2;
        if (attempts <= 2) return 0.5;
        if (attempts <= 3) return 0.7;
        return 1.0;
    }

    /**
     * Score time on task (0-1, higher = more support needed)
     */
    scoreTime(seconds) {
        if (seconds < 60) return 0;
        if (seconds < 120) return 0.2;
        if (seconds < 180) return 0.5;
        if (seconds < 300) return 0.7;
        return 1.0;
    }

    /**
     * Score proficiency (0-1, higher = more support needed)
     * Inverted: low proficiency = high support need
     */
    scoreProficiency(proficiency) {
        return 1 - proficiency;
    }

    /**
     * Score help frequency (0-1, higher = more support needed)
     */
    scoreHelpFrequency(frequency) {
        if (frequency === 0) return 0;
        if (frequency < 0.2) return 0.3;
        if (frequency < 0.5) return 0.6;
        return 1.0;
    }

    /**
     * Score recent trend (0-1, higher = more support needed)
     * Negative trend (declining performance) = more support
     */
    scoreTrend(trend) {
        if (trend > 0.2) return 0;     // Improving
        if (trend > -0.2) return 0.4;  // Stable
        return 0.8;                     // Declining
    }

    /**
     * Calculate overall support need (weighted combination of factors)
     * Returns 0-1 score where higher = more support needed
     */
    calculateSupportNeed(factors) {
        const weights = {
            attempts: 0.25,
            time: 0.15,
            proficiency: 0.30,
            help: 0.15,
            trend: 0.15
        };

        const weightedSum =
            (factors.attemptScore * weights.attempts) +
            (factors.timeScore * weights.time) +
            (factors.proficiencyScore * weights.proficiency) +
            (factors.helpScore * weights.help) +
            (factors.trendScore * weights.trend);

        // Apply difficulty multiplier
        return Math.min(1.0, weightedSum * factors.difficultyMultiplier);
    }

    /**
     * Apply decision algorithm to determine new level
     * @param {Object} factors - Calculated factors
     * @param {Object} context - Learning context
     * @returns {number} New scaffolding level (1, 2, or 3)
     */
    applyDecisionAlgorithm(factors, context) {
        const { supportNeed, attempts, timeOnTask, proficiency } = factors;

        // Rule-based decision tree with fuzzy boundaries

        // ESCALATION RULES
        // Rule 1: Explicit criteria - attempts
        if (attempts >= this.config.attemptsForLevel3) {
            return 3; // Many attempts = need worked example
        }
        if (attempts >= this.config.attemptsForLevel2 && this.currentLevel === 1) {
            return 2; // Some attempts = need guidance
        }

        // Rule 2: Explicit criteria - time
        if (timeOnTask >= this.config.timeForLevel3) {
            return 3; // Long time stuck = need example
        }
        if (timeOnTask >= this.config.timeForLevel2 && this.currentLevel === 1) {
            return 2; // Moderate time = need guidance
        }

        // Rule 3: Low proficiency + struggling
        if (proficiency < this.config.lowProficiencyThreshold) {
            if (supportNeed > 0.7) return 3;
            if (supportNeed > 0.4 && this.currentLevel === 1) return 2;
        }

        // Rule 4: Overall support need threshold
        if (supportNeed > 0.7) {
            return Math.min(3, this.currentLevel + 1); // Escalate one level
        }
        if (supportNeed > 0.5 && this.currentLevel === 1) {
            return 2; // Moderate need from Level 1 → Level 2
        }

        // DE-ESCALATION RULES
        // Rule 5: Student is doing well - reduce scaffolding
        if (this.shouldDeescalate(factors)) {
            return Math.max(1, this.currentLevel - 1); // Reduce one level
        }

        // Rule 6: Maintain current level
        return this.currentLevel;
    }

    /**
     * Determine if we should de-escalate (reduce support)
     * @param {Object} factors - Current factors
     * @returns {boolean} True if should de-escalate
     */
    shouldDeescalate(factors) {
        // Don't de-escalate too quickly
        if (factors.timeAtCurrentLevel < this.config.minTimeAtLevel) {
            return false;
        }

        // De-escalate if student is doing well
        const recentSuccesses = this.getRecentSuccessStreak();
        const isDoingWell =
            factors.proficiency > this.config.highProficiencyThreshold &&
            recentSuccesses >= this.config.successStreakForDeescalate &&
            factors.supportNeed < 0.3;

        return isDoingWell && this.currentLevel > 1;
    }

    /**
     * Handle explicit student request for specific level
     * @param {number} requestedLevel - Level student requested
     * @param {Object} context - Context
     * @returns {number} Scaffolding level
     */
    handleExplicitRequest(requestedLevel, context) {
        // Honor student's request (they know what they need)
        // But log it as an explicit request for research
        this.logDecision('EXPLICIT_REQUEST', {
            requestedLevel,
            previousLevel: this.currentLevel,
            context
        });

        this.changeLevel(requestedLevel, { explicitRequest: true }, context);
        return requestedLevel;
    }

    /**
     * Change scaffolding level
     * @param {number} newLevel - New level to set
     * @param {Object} factors - Factors that led to this decision
     * @param {Object} context - Current context
     */
    changeLevel(newLevel, factors, context) {
        const oldLevel = this.currentLevel;

        if (newLevel === oldLevel) return; // No change

        this.currentLevel = newLevel;
        this.lastLevelChange = Date.now();
        this.levelChanges++;

        const direction = newLevel > oldLevel ? 'ESCALATE' : 'DE-ESCALATE';

        console.log(`[Scaffolding] ${direction}: Level ${oldLevel} → Level ${newLevel}`);
        console.log('[Factors]', factors);

        // Log for research
        this.logDecision('LEVEL_CHANGE', {
            oldLevel,
            newLevel,
            direction,
            factors,
            context,
            timestamp: Date.now()
        });
    }

    /**
     * Track outcome of student interaction
     * @param {boolean} successful - Whether student succeeded
     * @param {Object} metadata - Additional data
     */
    trackOutcome(successful, metadata = {}) {
        const outcome = {
            successful,
            level: this.currentLevel,
            timestamp: Date.now(),
            ...metadata
        };

        this.performanceHistory.push(outcome);

        // Keep only recent history (last 20 problems)
        if (this.performanceHistory.length > 20) {
            this.performanceHistory.shift();
        }

        console.log('[Scaffolding] Outcome tracked:', outcome);
    }

    /**
     * Calculate student proficiency from performance history
     * @returns {number} Proficiency score (0-1)
     */
    calculateProficiency() {
        if (this.performanceHistory.length === 0) {
            return 0.7; // Default to medium proficiency
        }

        // Weight recent performance more heavily
        let weightedSum = 0;
        let weightTotal = 0;

        this.performanceHistory.forEach((outcome, index) => {
            const recencyWeight = index + 1; // More recent = higher weight
            weightedSum += (outcome.successful ? 1 : 0) * recencyWeight;
            weightTotal += recencyWeight;
        });

        return weightedSum / weightTotal;
    }

    /**
     * Calculate trend in recent performance
     * @returns {number} Trend score (-1 to 1, positive = improving)
     */
    calculateRecentTrend() {
        if (this.performanceHistory.length < 4) {
            return 0; // Not enough data
        }

        // Compare recent half to earlier half
        const halfPoint = Math.floor(this.performanceHistory.length / 2);
        const recent = this.performanceHistory.slice(halfPoint);
        const earlier = this.performanceHistory.slice(0, halfPoint);

        const recentSuccess = recent.filter(o => o.successful).length / recent.length;
        const earlierSuccess = earlier.filter(o => o.successful).length / earlier.length;

        return recentSuccess - earlierSuccess;
    }

    /**
     * Get current success streak
     * @returns {number} Number of consecutive successes
     */
    getRecentSuccessStreak() {
        let streak = 0;
        for (let i = this.performanceHistory.length - 1; i >= 0; i--) {
            if (this.performanceHistory[i].successful) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }

    /**
     * Log scaffolding decision for research
     * @param {string} eventType - Type of event
     * @param {Object} data - Event data
     */
    logDecision(eventType, data) {
        const logEntry = {
            eventType,
            timestamp: Date.now(),
            currentLevel: this.currentLevel,
            ...data
        };

        this.history.push(logEntry);

        // Also log to console for development
        console.log(`[Scaffolding Decision] ${eventType}`, logEntry);

        // In production, send to research database
        // this.sendToDatabase(logEntry);
    }

    /**
     * Reset scaffolding engine (new session or student request)
     */
    reset() {
        console.log('[Scaffolding] Engine reset');

        this.currentLevel = 1;
        this.history = [];
        this.performanceHistory = [];
        this.levelChanges = 0;
        this.sessionStartTime = Date.now();
        this.lastLevelChange = null;
    }

    /**
     * Get summary statistics for research
     * @returns {Object} Summary data
     */
    getSummary() {
        const proficiency = this.calculateProficiency();
        const trend = this.calculateRecentTrend();

        return {
            currentLevel: this.currentLevel,
            totalLevelChanges: this.levelChanges,
            totalInteractions: this.history.length,
            proficiency: proficiency,
            trend: trend,
            successRate: this.performanceHistory.filter(o => o.successful).length /
                         (this.performanceHistory.length || 1),
            sessionDuration: Date.now() - this.sessionStartTime,
            levelDistribution: {
                level1: this.history.filter(h => h.currentLevel === 1).length,
                level2: this.history.filter(h => h.currentLevel === 2).length,
                level3: this.history.filter(h => h.currentLevel === 3).length
            }
        };
    }

    /**
     * Export full history for research analysis
     * @returns {Object} Complete engine state and history
     */
    exportForResearch() {
        return {
            config: this.config,
            summary: this.getSummary(),
            history: this.history,
            performanceHistory: this.performanceHistory,
            exportTimestamp: Date.now()
        };
    }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Topic Difficulty Classifier
 * Determines difficulty level of a statistics topic
 * (Could be enhanced with machine learning in future)
 */
function classifyTopicDifficulty(moduleId, lessonId) {
    // Difficulty ratings based on typical student performance
    const difficultyMap = {
        // Module 1: Intro - mostly easy
        'module-01': 'easy',

        // Module 2: Descriptive stats - medium
        'module-02': 'medium',

        // Module 3: Probability - medium to hard
        'module-03': 'hard',

        // Module 4: Discrete distributions - hard
        'module-04': 'hard',

        // Module 5: Normal distribution - medium
        'module-05': 'medium',

        // Module 6: Sampling distributions - hard
        'module-06': 'hard',

        // Module 7: Confidence intervals - medium
        'module-07': 'medium',

        // Module 8: Hypothesis testing - hard
        'module-08': 'hard',

        // Module 9: Two-sample tests - hard
        'module-09': 'hard',

        // Module 10: ANOVA - hard
        'module-10': 'hard',

        // Module 11: Regression - medium
        'module-11': 'medium',

        // Module 12: Chi-square - medium
        'module-12': 'medium'
    };

    return difficultyMap[moduleId] || 'medium';
}

/**
 * Create scaffolding context from module page
 * Helper for integrating engine into module pages
 */
function createScaffoldingContext(moduleId, lessonId, problemNumber) {
    return {
        module: moduleId,
        lesson: lessonId,
        problemNumber: problemNumber,
        topicDifficulty: classifyTopicDifficulty(moduleId, lessonId),
        attempts: 0,
        problemStartTime: Date.now(),
        studentProficiency: parseFloat(localStorage.getItem('student_proficiency') || '0.7'),
        helpFrequency: 0,
        interactionCount: 0
    };
}

// Make available globally
if (typeof window !== 'undefined') {
    window.ScaffoldingEngine = ScaffoldingEngine;
    window.classifyTopicDifficulty = classifyTopicDifficulty;
    window.createScaffoldingContext = createScaffoldingContext;
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ScaffoldingEngine,
        classifyTopicDifficulty,
        createScaffoldingContext
    };
}
