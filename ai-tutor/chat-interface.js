/* ============================================
   AI Tutor Chat Interface JavaScript
   Part of Safaa Dabagh's Dissertation Research
   ============================================ */

// DEMO MODE - Set to false when API is ready
const DEMO_MODE = true;

// Global state
let conversationHistory = [];
let conversationContext = {
    module: 'module-07',
    lesson: null,
    problemNumber: null,
    attempts: 0,
    startTime: Date.now(),
    studentProficiency: 0.7, // 0-1 scale, default to medium
    helpFrequency: 0,
    interactionCount: 0
};

let scaffoldingEngine;
let currentUserId = generateUserId();

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeChat();
    attachEventListeners();
    scaffoldingEngine = new ScaffoldingEngine();

    console.log('[AI Tutor] Initialized in DEMO MODE:', DEMO_MODE);
    console.log('[User ID]', currentUserId);
});

function initializeChat() {
    // Load conversation history from localStorage if exists
    const savedHistory = localStorage.getItem(`chat_history_${currentUserId}`);
    if (savedHistory) {
        conversationHistory = JSON.parse(savedHistory);
        renderSavedMessages();
    }

    // Load context from localStorage
    const savedContext = localStorage.getItem(`chat_context_${currentUserId}`);
    if (savedContext) {
        conversationContext = JSON.parse(savedContext);
        updateModuleSelector();
    }

    // Update scaffolding indicator
    updateScaffoldingIndicator(scaffoldingEngine.currentLevel);
}

function generateUserId() {
    // Check if user already has an ID
    let userId = localStorage.getItem('ai_tutor_user_id');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('ai_tutor_user_id', userId);
    }
    return userId;
}

// ============================================
// Event Listeners
// ============================================

function attachEventListeners() {
    // Chat form submission
    const chatForm = document.getElementById('chat-form');
    chatForm.addEventListener('submit', handleSendMessage);

    // Input character counter
    const chatInput = document.getElementById('chat-input');
    chatInput.addEventListener('input', updateCharacterCount);

    // Auto-resize textarea
    chatInput.addEventListener('input', autoResizeTextarea);

    // Enter to send (Shift+Enter for new line)
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    });

    // Quick action buttons
    const quickActionButtons = document.querySelectorAll('.quick-action-btn');
    quickActionButtons.forEach(btn => {
        btn.addEventListener('click', handleQuickAction);
    });

    // Clear chat button
    const clearChatButton = document.getElementById('clear-chat-button');
    clearChatButton.addEventListener('click', handleClearChat);

    // Help button
    const helpButton = document.getElementById('help-button');
    helpButton.addEventListener('click', () => showModal('help-modal'));

    // Privacy link
    const privacyLink = document.getElementById('privacy-link');
    privacyLink.addEventListener('click', (e) => {
        e.preventDefault();
        showModal('privacy-modal');
    });

    // Modal close buttons
    const modalCloseButtons = document.querySelectorAll('.modal-close');
    modalCloseButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            closeModal(e.target.closest('.modal').id);
        });
    });

    // Close modal on outside click
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    // Module selector
    const moduleSelect = document.getElementById('module-select');
    moduleSelect.addEventListener('change', handleModuleChange);
}

// ============================================
// Message Handling
// ============================================

async function handleSendMessage(e) {
    e.preventDefault();

    const chatInput = document.getElementById('chat-input');
    const userText = chatInput.value.trim();

    if (!userText) return;

    // Clear input and reset height
    chatInput.value = '';
    chatInput.style.height = 'auto';
    updateCharacterCount();

    // Display user message
    displayMessage('user', userText);

    // Update context
    conversationContext.attempts++;
    conversationContext.interactionCount++;
    conversationContext.helpFrequency = conversationContext.interactionCount /
        ((Date.now() - conversationContext.startTime) / 60000); // per minute

    // Show typing indicator
    showTypingIndicator();

    // Determine scaffolding level
    const scaffoldingLevel = scaffoldingEngine.determineLevel(conversationContext);
    updateScaffoldingIndicator(scaffoldingLevel);

    // Get AI response
    try {
        const response = await getAIResponse(userText, scaffoldingLevel);

        // Hide typing indicator
        hideTypingIndicator();

        // Display AI response
        displayMessage('ai', response.text);

        // Update scaffolding engine based on interaction
        if (response.successful !== undefined) {
            scaffoldingEngine.trackOutcome(response.successful);
        }

        // Log interaction for research
        logInteraction({
            userId: currentUserId,
            timestamp: Date.now(),
            module: conversationContext.module,
            userMessage: userText,
            aiResponse: response.text,
            scaffoldingLevel: scaffoldingLevel,
            context: { ...conversationContext },
            sessionDuration: Date.now() - conversationContext.startTime
        });

    } catch (error) {
        console.error('[Error] AI Response failed:', error);
        hideTypingIndicator();
        displayMessage('ai', 'I apologize, but I\'m having trouble responding right now. Please try again in a moment.');
    }

    // Save conversation
    saveConversation();
}

async function getAIResponse(userMessage, scaffoldingLevel) {
    if (DEMO_MODE) {
        // Demo mode: return canned responses
        return getDemoResponse(userMessage, scaffoldingLevel);
    } else {
        // Production mode: call Claude API via Firebase Function
        return await callClaudeAPI(userMessage, scaffoldingLevel);
    }
}

function getDemoResponse(userMessage, scaffoldingLevel) {
    // Simulate API delay
    return new Promise((resolve) => {
        setTimeout(() => {
            const responses = DEMO_RESPONSES[scaffoldingLevel] || DEMO_RESPONSES[1];

            // Simple keyword matching for more relevant responses
            let responseText;
            const lowerMessage = userMessage.toLowerCase();

            if (lowerMessage.includes('mean') || lowerMessage.includes('average')) {
                responseText = responses.mean || responses.default;
            } else if (lowerMessage.includes('deviation') || lowerMessage.includes('spread')) {
                responseText = responses.deviation || responses.default;
            } else if (lowerMessage.includes('confidence') || lowerMessage.includes('interval')) {
                responseText = responses.confidence || responses.default;
            } else if (lowerMessage.includes('hypothesis') || lowerMessage.includes('test')) {
                responseText = responses.hypothesis || responses.default;
            } else {
                responseText = responses.default;
            }

            resolve({
                text: responseText,
                scaffoldingLevel: scaffoldingLevel,
                successful: Math.random() > 0.3 // 70% success rate in demo
            });
        }, 1500 + Math.random() * 1000); // 1.5-2.5 second delay
    });
}

async function callClaudeAPI(userMessage, scaffoldingLevel) {
    // Build system prompt
    const systemPrompt = SYSTEM_PROMPTS.buildSystemPrompt(
        scaffoldingLevel,
        conversationContext.module,
        conversationContext.studentProficiency
    );

    // Prepare messages
    const messages = [
        ...conversationHistory.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.text
        })),
        {
            role: 'user',
            content: userMessage
        }
    ];

    try {
        // Call Firebase Cloud Function (to be implemented)
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: messages,
                systemPrompt: systemPrompt,
                userId: currentUserId,
                scaffoldingLevel: scaffoldingLevel
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        return {
            text: data.response,
            scaffoldingLevel: scaffoldingLevel,
            successful: data.successful
        };

    } catch (error) {
        console.error('[API Error]', error);
        throw error;
    }
}

// ============================================
// Quick Actions
// ============================================

function handleQuickAction(e) {
    const action = e.currentTarget.dataset.action;

    let messageText = '';
    let forceLevel = null;

    switch (action) {
        case 'hint':
            messageText = 'Can you give me a hint to help me solve this?';
            forceLevel = 1;
            break;
        case 'explain':
            messageText = 'Can you explain this step-by-step?';
            forceLevel = 2;
            break;
        case 'example':
            messageText = 'Can you show me a worked example?';
            forceLevel = 3;
            break;
    }

    if (messageText) {
        // Set input value and trigger send
        const chatInput = document.getElementById('chat-input');
        chatInput.value = messageText;

        // Force scaffolding level if specified
        if (forceLevel) {
            scaffoldingEngine.currentLevel = forceLevel;
        }

        // Trigger send
        const chatForm = document.getElementById('chat-form');
        chatForm.dispatchEvent(new Event('submit'));
    }
}

// ============================================
// Display Functions
// ============================================

function displayMessage(role, text) {
    const messagesContainer = document.getElementById('chat-messages');

    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${role}`;

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    avatarDiv.textContent = role === 'user' ? 'You' : 'AI';
    avatarDiv.setAttribute('aria-hidden', 'true');

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.innerHTML = formatMessageText(text);

    const timestampDiv = document.createElement('div');
    timestampDiv.className = 'message-timestamp';
    timestampDiv.textContent = formatTimestamp(new Date());

    contentDiv.appendChild(textDiv);
    contentDiv.appendChild(timestampDiv);

    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);

    messagesContainer.appendChild(messageDiv);

    // Scroll to bottom
    scrollToBottom();

    // Add to conversation history
    conversationHistory.push({
        role: role,
        text: text,
        timestamp: Date.now()
    });
}

function formatMessageText(text) {
    // Convert markdown-style formatting to HTML
    let formatted = text;

    // Bold: **text** or __text__
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/__(.+?)__/g, '<strong>$1</strong>');

    // Italic: *text* or _text_
    formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/_(.+?)_/g, '<em>$1</em>');

    // Code: `code`
    formatted = formatted.replace(/`(.+?)`/g, '<code>$1</code>');

    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');

    // Convert lists (simple version)
    formatted = formatted.replace(/^- (.+)$/gm, '<li>$1</li>');
    formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    formatted = formatted.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');

    return formatted;
}

function formatTimestamp(date) {
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) { // Less than 1 minute
        return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
        const minutes = Math.floor(diff / 60000);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diff < 86400000) { // Less than 1 day
        const hours = Math.floor(diff / 3600000);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    }
}

function showTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    indicator.style.display = 'flex';
    scrollToBottom();
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    indicator.style.display = 'none';
}

function scrollToBottom() {
    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function renderSavedMessages() {
    conversationHistory.forEach(msg => {
        displayMessage(msg.role, msg.text);
    });
}

// ============================================
// Scaffolding Indicator
// ============================================

function updateScaffoldingIndicator(level) {
    const indicator = document.getElementById('scaffolding-indicator');
    const dots = indicator.querySelectorAll('.dot');
    const description = indicator.querySelector('.scaffolding-description');

    // Remove all active classes
    dots.forEach(dot => dot.classList.remove('active'));

    // Update class on container
    indicator.className = `scaffolding-level-${level}`;

    // Activate appropriate dots
    for (let i = 0; i < level; i++) {
        dots[i].classList.add('active');
    }

    // Update description
    const descriptions = {
        1: 'Hints & Tips',
        2: 'Guided Questions',
        3: 'Worked Examples'
    };
    description.textContent = descriptions[level] || descriptions[1];
}

// ============================================
// UI Helpers
// ============================================

function updateCharacterCount() {
    const chatInput = document.getElementById('chat-input');
    const counter = document.getElementById('char-counter');
    const charCount = chatInput.value.length;

    counter.textContent = charCount;
    counter.parentElement.classList.toggle('warning', charCount > 1800);
    counter.parentElement.classList.toggle('error', charCount >= 2000);
}

function autoResizeTextarea() {
    const chatInput = document.getElementById('chat-input');
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
}

function handleClearChat() {
    if (confirm('Are you sure you want to clear this conversation? This cannot be undone.')) {
        // Clear messages (keep welcome message)
        const messagesContainer = document.getElementById('chat-messages');
        const welcomeMessage = messagesContainer.querySelector('.welcome-message');
        messagesContainer.innerHTML = '';
        messagesContainer.appendChild(welcomeMessage);

        // Reset conversation history
        conversationHistory = [];

        // Reset context
        conversationContext = {
            module: document.getElementById('module-select').value,
            lesson: null,
            problemNumber: null,
            attempts: 0,
            startTime: Date.now(),
            studentProficiency: 0.7,
            helpFrequency: 0,
            interactionCount: 0
        };

        // Reset scaffolding
        scaffoldingEngine.reset();
        updateScaffoldingIndicator(1);

        // Clear localStorage
        localStorage.removeItem(`chat_history_${currentUserId}`);
        localStorage.removeItem(`chat_context_${currentUserId}`);

        console.log('[Chat] Conversation cleared');
    }
}

function handleModuleChange(e) {
    conversationContext.module = e.target.value;
    conversationContext.lesson = null;
    conversationContext.problemNumber = null;
    saveConversation();

    console.log('[Context] Module changed to:', conversationContext.module);
}

function updateModuleSelector() {
    const moduleSelect = document.getElementById('module-select');
    moduleSelect.value = conversationContext.module;
}

// ============================================
// Modal Functions
// ============================================

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Focus first focusable element
    const firstFocusable = modal.querySelector('button, a, input, textarea');
    if (firstFocusable) {
        firstFocusable.focus();
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// ============================================
// Storage Functions
// ============================================

function saveConversation() {
    localStorage.setItem(`chat_history_${currentUserId}`, JSON.stringify(conversationHistory));
    localStorage.setItem(`chat_context_${currentUserId}`, JSON.stringify(conversationContext));
}

// ============================================
// Research Data Logging
// ============================================

function logInteraction(data) {
    // Console logging for development
    console.log('[RESEARCH DATA]', data);

    // Store in localStorage (for development)
    const interactionKey = `interaction_${data.timestamp}`;
    localStorage.setItem(interactionKey, JSON.stringify(data));

    // In production, send to Firebase Firestore
    if (!DEMO_MODE) {
        sendToFirestore(data);
    }
}

async function sendToFirestore(data) {
    try {
        // Firebase integration to be implemented
        const response = await fetch('/api/log-interaction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            console.error('[Logging Error] Failed to send data to Firestore');
        }
    } catch (error) {
        console.error('[Logging Error]', error);
    }
}

// ============================================
// Demo Mode Responses
// ============================================

const DEMO_RESPONSES = {
    1: { // Level 1: Hints
        default: "Let's think about this step by step. What's the first thing we need to identify in this problem?",
        mean: "Think about what the mean represents. What formula did we learn for calculating the average of a data set?",
        deviation: "Standard deviation measures spread. What's the relationship between variance and standard deviation?",
        confidence: "For confidence intervals, we need three things: the sample statistic, the critical value, and the standard error. Which one are we working with here?",
        hypothesis: "In hypothesis testing, always start by identifying your null and alternative hypotheses. What claim are we testing?"
    },
    2: { // Level 2: Guided Questions
        default: "Great question! Let's break this down together:\n\n1. What type of data do we have here?\n2. What are we trying to find or calculate?\n3. Which formulas or methods apply to this situation?\n\nStart with question 1 - what do you think?",
        mean: "Let's work through calculating the mean:\n\n1. First, what are the data values we're working with?\n2. How do we calculate the sum of these values?\n3. How many values do we have?\n4. What operation combines these to give us the mean?\n\nCan you answer the first question?",
        deviation: "To find the standard deviation, we'll follow these steps:\n\n1. Calculate the mean of the data\n2. Find the deviation of each value from the mean\n3. Square each deviation\n4. Find the average of squared deviations (variance)\n5. Take the square root\n\nWhere are you getting stuck?",
        confidence: "For a confidence interval, let's identify:\n\n1. What parameter are we estimating? (mean, proportion, etc.)\n2. What's our confidence level? (90%, 95%, 99%?)\n3. Do we know the population standard deviation?\n4. What's our sample size?\n\nCan you tell me about question 1?",
        hypothesis: "Let's set up the hypothesis test:\n\n1. State the null hypothesis (H₀) - usually the status quo\n2. State the alternative hypothesis (Hₐ) - what we're testing for\n3. Determine the significance level (α)\n4. Identify the test statistic to use\n\nWhat would you say for step 1?"
    },
    3: { // Level 3: Worked Examples
        default: "Let me show you a similar example first, then you can apply the same approach to your problem.\n\n**Example Problem**: [Similar problem statement]\n\n**Solution**:\nStep 1: [First step with explanation]\nStep 2: [Second step with explanation]\nStep 3: [Third step with explanation]\n\n**Answer**: [Final answer]\n\nNow, can you identify which parts of this example apply to your problem?",
        mean: "Let me show you how to calculate the mean with a complete example:\n\n**Example**: Find the mean of the data set: {4, 7, 9, 12, 18}\n\n**Step 1**: Add all values together\n4 + 7 + 9 + 12 + 18 = 50\n\n**Step 2**: Count the number of values\nn = 5 values\n\n**Step 3**: Divide the sum by the count\nMean = 50 ÷ 5 = 10\n\n**Answer**: The mean is 10\n\nNow apply these same three steps to your data!",
        deviation: "Here's a complete example of finding standard deviation:\n\n**Example**: Find the standard deviation of {2, 4, 6, 8, 10}\n\n**Step 1**: Calculate the mean\nMean = (2+4+6+8+10)/5 = 30/5 = 6\n\n**Step 2**: Find deviations from mean\n2-6=-4, 4-6=-2, 6-6=0, 8-6=2, 10-6=4\n\n**Step 3**: Square the deviations\n(-4)²=16, (-2)²=4, 0²=0, 2²=4, 4²=16\n\n**Step 4**: Find the variance (average of squared deviations)\nVariance = (16+4+0+4+16)/5 = 40/5 = 8\n\n**Step 5**: Take the square root\nStandard deviation = √8 ≈ 2.83\n\n**Answer**: s ≈ 2.83\n\nNow follow these same steps with your data!",
        confidence: "Let me demonstrate a confidence interval calculation:\n\n**Example**: A sample of 36 students has a mean score of 78 with a standard deviation of 12. Find the 95% confidence interval for the population mean.\n\n**Step 1**: Identify what we know\n- Sample mean (x̄) = 78\n- Sample std dev (s) = 12\n- Sample size (n) = 36\n- Confidence level = 95%\n\n**Step 2**: Find the critical value\nFor 95% confidence, z* = 1.96\n\n**Step 3**: Calculate standard error\nSE = s/√n = 12/√36 = 12/6 = 2\n\n**Step 4**: Calculate margin of error\nME = z* × SE = 1.96 × 2 = 3.92\n\n**Step 5**: Build the interval\nCI = x̄ ± ME = 78 ± 3.92 = (74.08, 81.92)\n\n**Answer**: We are 95% confident the population mean is between 74.08 and 81.92.\n\nNow apply this process to your problem!",
        hypothesis: "Here's a complete hypothesis test example:\n\n**Example**: Test if the mean height is greater than 65 inches (α = 0.05)\nSample: n=25, x̄=67, s=4\n\n**Step 1**: State hypotheses\nH₀: μ = 65 (population mean equals 65)\nHₐ: μ > 65 (population mean is greater than 65)\n\n**Step 2**: Set significance level\nα = 0.05\n\n**Step 3**: Calculate test statistic\nt = (x̄ - μ₀)/(s/√n) = (67-65)/(4/√25) = 2/(4/5) = 2/0.8 = 2.5\n\n**Step 4**: Find critical value\ndf = n-1 = 24, one-tailed test at α=0.05: t* = 1.711\n\n**Step 5**: Make decision\nSince t=2.5 > 1.711, we reject H₀\n\n**Conclusion**: There is sufficient evidence to conclude the mean height is greater than 65 inches.\n\nNow follow these steps for your hypothesis test!"
    }
};

// ============================================
// Export for embedding
// ============================================

// Make functions available globally for embedding in modules
window.AITutor = {
    setContext: function(context) {
        Object.assign(conversationContext, context);
        updateModuleSelector();
        saveConversation();
    },
    getContext: function() {
        return { ...conversationContext };
    },
    resetScaffolding: function() {
        scaffoldingEngine.reset();
        updateScaffoldingIndicator(1);
    }
};
