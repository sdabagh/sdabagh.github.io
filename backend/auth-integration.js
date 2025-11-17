/**
 * Authentication Integration
 * Connects Firebase Authentication with the learning platform
 *
 * Features:
 * - Anonymous authentication for privacy
 * - Session management
 * - Consent tracking
 * - Study group assignment
 */

class FirebaseAuthManager {
  constructor() {
    this.currentUser = null;
    this.userData = null;
    this.sessionId = null;
    this.consentGiven = false;

    // Initialize on page load
    this.init();
  }

  /**
   * Initialize authentication
   */
  async init() {
    // Wait for Firebase to load
    if (typeof firebase === 'undefined') {
      console.error('[AUTH] Firebase not loaded');
      return;
    }

    // Listen for auth state changes
    firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        console.log('[AUTH] User signed in:', user.uid);
        this.currentUser = user;
        await this.loadUserData();
        await this.ensureSession();

        // Check if consent needed
        if (!this.consentGiven && !this.hasSeenConsentModal()) {
          this.showConsentModal();
        }
      } else {
        console.log('[AUTH] No user, signing in anonymously');
        await this.signInAnonymously();
      }
    });
  }

  /**
   * Sign in anonymously
   */
  async signInAnonymously() {
    try {
      const result = await firebase.auth().signInAnonymously();
      this.currentUser = result.user;
      console.log('[AUTH] Anonymous sign-in successful:', result.user.uid);

      // Create user document
      await this.createUserDocument();

    } catch (error) {
      console.error('[AUTH] Sign-in error:', error);
      this.showError('Unable to initialize session. Please refresh the page.');
    }
  }

  /**
   * Create user document in Firestore
   */
  async createUserDocument() {
    const uid = this.currentUser.uid;
    const userRef = firebase.firestore().collection('users').doc(uid);

    try {
      const doc = await userRef.get();

      if (!doc.exists) {
        const userData = {
          anonymousId: this.generateAnonymousId(),
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          consentGiven: false,
          studyGroup: this.assignStudyGroup(),
          lastActive: firebase.firestore.FieldValue.serverTimestamp(),
          modulesStarted: [],
          modulesCompleted: []
        };

        await userRef.set(userData);
        this.userData = userData;
        console.log('[AUTH] User document created:', userData.anonymousId);
      }
    } catch (error) {
      console.error('[AUTH] Error creating user document:', error);
    }
  }

  /**
   * Load user data from Firestore
   */
  async loadUserData() {
    const uid = this.currentUser.uid;
    const userRef = firebase.firestore().collection('users').doc(uid);

    try {
      const doc = await userRef.get();

      if (doc.exists) {
        this.userData = doc.data();
        this.consentGiven = this.userData.consentGiven || false;

        // Update last active
        await userRef.update({
          lastActive: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('[AUTH] User data loaded:', this.userData.anonymousId);
      } else {
        await this.createUserDocument();
      }
    } catch (error) {
      console.error('[AUTH] Error loading user data:', error);
    }
  }

  /**
   * Ensure active session exists
   */
  async ensureSession() {
    const uid = this.currentUser.uid;

    // Check for active session (within last 2 hours)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    try {
      const activeSessionQuery = await firebase.firestore()
        .collection('sessions')
        .where('userId', '==', uid)
        .where('lastInteraction', '>=', twoHoursAgo)
        .orderBy('lastInteraction', 'desc')
        .limit(1)
        .get();

      if (!activeSessionQuery.empty) {
        // Use existing session
        this.sessionId = activeSessionQuery.docs[0].id;
        console.log('[SESSION] Active session found:', this.sessionId);

        // Update last interaction
        await firebase.firestore().collection('sessions').doc(this.sessionId).update({
          lastInteraction: firebase.firestore.FieldValue.serverTimestamp()
        });

      } else {
        // Create new session
        await this.createNewSession();
      }
    } catch (error) {
      console.error('[SESSION] Error ensuring session:', error);
    }
  }

  /**
   * Create new session
   */
  async createNewSession() {
    const uid = this.currentUser.uid;

    try {
      const sessionRef = await firebase.firestore().collection('sessions').add({
        userId: uid,
        startTime: firebase.firestore.FieldValue.serverTimestamp(),
        lastInteraction: firebase.firestore.FieldValue.serverTimestamp(),
        modulesVisited: [],
        totalInteractions: 0,
        userAgent: navigator.userAgent,
        referrer: document.referrer || 'direct'
      });

      this.sessionId = sessionRef.id;
      console.log('[SESSION] New session created:', this.sessionId);

    } catch (error) {
      console.error('[SESSION] Error creating session:', error);
    }
  }

  /**
   * Record consent
   */
  async recordConsent() {
    if (!this.currentUser) {
      console.error('[AUTH] No user to record consent');
      return;
    }

    const uid = this.currentUser.uid;

    try {
      await firebase.firestore().collection('users').doc(uid).update({
        consentGiven: true,
        consentTimestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      this.consentGiven = true;
      localStorage.setItem('consentShown', 'true');
      console.log('[AUTH] Consent recorded');

    } catch (error) {
      console.error('[AUTH] Error recording consent:', error);
    }
  }

  /**
   * Decline consent
   */
  async declineConsent() {
    localStorage.setItem('consentShown', 'true');
    localStorage.setItem('consentDeclined', 'true');
    this.consentGiven = false;

    // Note: User can still use platform, but data won't be used for research
    console.log('[AUTH] Consent declined - data will not be used for research');
  }

  /**
   * Generate anonymous participant ID
   */
  generateAnonymousId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = 'P_'; // P for Participant
    for (let i = 0; i < 8; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  /**
   * Assign study group (for research randomization)
   */
  assignStudyGroup() {
    // For pilot: all in "pilot" group
    // For full study: randomly assign to "control" or "treatment"

    const isPilot = true; // Set to false for full study

    if (isPilot) {
      return 'pilot';
    }

    // Random assignment (50/50)
    return Math.random() < 0.5 ? 'control' : 'treatment';
  }

  /**
   * Check if consent modal has been shown
   */
  hasSeenConsentModal() {
    return localStorage.getItem('consentShown') === 'true';
  }

  /**
   * Show consent modal
   */
  showConsentModal() {
    // Check if consent modal exists in DOM
    const modal = document.getElementById('consent-modal');
    if (modal) {
      modal.style.display = 'flex';

      // Set up consent buttons
      const acceptBtn = document.getElementById('consent-accept');
      const declineBtn = document.getElementById('consent-decline');

      if (acceptBtn) {
        acceptBtn.onclick = async () => {
          await this.recordConsent();
          modal.style.display = 'none';
        };
      }

      if (declineBtn) {
        declineBtn.onclick = async () => {
          await this.declineConsent();
          modal.style.display = 'none';
        };
      }
    } else {
      console.warn('[AUTH] Consent modal not found in DOM');
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    // Create error toast or alert
    alert(message);
  }

  /**
   * Get current user ID
   */
  getUserId() {
    return this.currentUser ? this.currentUser.uid : null;
  }

  /**
   * Get anonymous ID
   */
  getAnonymousId() {
    return this.userData ? this.userData.anonymousId : null;
  }

  /**
   * Get session ID
   */
  getSessionId() {
    return this.sessionId;
  }

  /**
   * Get study group
   */
  getStudyGroup() {
    return this.userData ? this.userData.studyGroup : null;
  }

  /**
   * Is user in treatment group?
   */
  isTreatmentGroup() {
    return this.getStudyGroup() === 'treatment';
  }

  /**
   * Record module visit
   */
  async recordModuleVisit(moduleId) {
    if (!this.currentUser) return;

    const uid = this.currentUser.uid;

    try {
      // Add to user's modules visited
      await firebase.firestore().collection('users').doc(uid).update({
        modulesStarted: firebase.firestore.FieldValue.arrayUnion(moduleId)
      });

      // Add to current session
      if (this.sessionId) {
        await firebase.firestore().collection('sessions').doc(this.sessionId).update({
          modulesVisited: firebase.firestore.FieldValue.arrayUnion(moduleId)
        });
      }

      console.log('[TRACKING] Module visit recorded:', moduleId);

    } catch (error) {
      console.error('[TRACKING] Error recording module visit:', error);
    }
  }

  /**
   * Record module completion
   */
  async recordModuleCompletion(moduleId) {
    if (!this.currentUser) return;

    const uid = this.currentUser.uid;

    try {
      await firebase.firestore().collection('users').doc(uid).update({
        modulesCompleted: firebase.firestore.FieldValue.arrayUnion(moduleId)
      });

      console.log('[TRACKING] Module completion recorded:', moduleId);

    } catch (error) {
      console.error('[TRACKING] Error recording module completion:', error);
    }
  }

  /**
   * End current session
   */
  async endSession() {
    if (!this.sessionId) return;

    try {
      await firebase.firestore().collection('sessions').doc(this.sessionId).update({
        endTime: firebase.firestore.FieldValue.serverTimestamp()
      });

      console.log('[SESSION] Session ended:', this.sessionId);
      this.sessionId = null;

    } catch (error) {
      console.error('[SESSION] Error ending session:', error);
    }
  }
}

// Initialize globally
window.firebaseAuthManager = new FirebaseAuthManager();

// Auto-end session on page unload
window.addEventListener('beforeunload', () => {
  if (window.firebaseAuthManager) {
    window.firebaseAuthManager.endSession();
  }
});

// Track page visibility for session management
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Page hidden - could end session after timeout
    console.log('[SESSION] Page hidden');
  } else {
    // Page visible - ensure session is active
    console.log('[SESSION] Page visible');
    if (window.firebaseAuthManager) {
      window.firebaseAuthManager.ensureSession();
    }
  }
});
