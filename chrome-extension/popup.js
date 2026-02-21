// MAT300 Grading Assistant - Popup Logic

let currentDiscussion = null;
let currentGrading = null;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadConfiguration();
  await checkCanvasPage();
  setupEventListeners();
});

// Load saved API key and worker URL
async function loadConfiguration() {
  const result = await chrome.storage.local.get(['apiKey', 'workerUrl']);

  if (result.apiKey) {
    document.getElementById('api-key').value = result.apiKey;
  }

  if (result.workerUrl) {
    document.getElementById('worker-url').value = result.workerUrl;
  }
}

// Check if we're on a Canvas SpeedGrader page (any Canvas instance)
async function checkCanvasPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab.url && tab.url.includes('instructure.com') && tab.url.includes('speed_grader')) {
    // Show grading section
    document.getElementById('grading-section').classList.remove('hidden');
  } else {
    // Show message to navigate to Canvas
    const statusDiv = document.getElementById('status-message');
    statusDiv.textContent = '⚠️ Please navigate to a Canvas SpeedGrader page to use grading features';
    statusDiv.className = 'status-message info';
  }
}

// Set up all event listeners
function setupEventListeners() {
  // Configuration buttons
  document.getElementById('save-key').addEventListener('click', saveApiKey);
  document.getElementById('save-url').addEventListener('click', saveWorkerUrl);

  // Grading buttons
  document.getElementById('extract-btn').addEventListener('click', extractDiscussion);
  document.getElementById('grade-btn').addEventListener('click', gradeWithAI);
  document.getElementById('apply-to-canvas').addEventListener('click', applyToCanvas);
  document.getElementById('reset-btn').addEventListener('click', resetGrading);

  // Score dropdowns - update total when changed
  const scoreSelects = document.querySelectorAll('.score-select');
  scoreSelects.forEach(select => {
    select.addEventListener('change', updateTotalScore);
  });
}

// Save API key to storage
async function saveApiKey() {
  const apiKey = document.getElementById('api-key').value.trim();

  if (!apiKey) {
    showStatus('config-status', 'Please enter an API key', 'error');
    return;
  }

  if (!apiKey.startsWith('sk-ant-')) {
    showStatus('config-status', 'Invalid API key format. Should start with "sk-ant-"', 'error');
    return;
  }

  await chrome.storage.local.set({ apiKey });
  showStatus('config-status', '✅ API key saved successfully!', 'success');
}

// Save worker URL to storage
async function saveWorkerUrl() {
  const workerUrl = document.getElementById('worker-url').value.trim();

  if (!workerUrl) {
    showStatus('config-status', 'Please enter a worker URL', 'error');
    return;
  }

  if (!workerUrl.startsWith('https://')) {
    showStatus('config-status', 'Worker URL must start with https://', 'error');
    return;
  }

  await chrome.storage.local.set({ workerUrl });
  showStatus('config-status', '✅ Worker URL saved successfully!', 'success');
}

// Extract discussion content from Canvas (searches all frames)
async function extractDiscussion() {
  try {
    showStatus('status-message', '🔍 Extracting discussion content...', 'info');

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Execute in ALL frames to find discussion content in iframes
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      function: extractCanvasDiscussion
    });

    // Combine results from all frames
    let combined = {
      studentName: '',
      discussionTitle: '',
      initialPost: '',
      peerResponses: [],
      allPosts: [],
      timestamps: []
    };

    let totalPostsFound = 0;

    for (const result of results) {
      if (!result || !result.result) continue;
      const data = result.result;

      // Take student name from whichever frame has it (usually top frame)
      if (data.studentName && !combined.studentName) {
        combined.studentName = data.studentName;
      }

      // Take discussion title from whichever frame has it
      if (data.discussionTitle && !combined.discussionTitle) {
        combined.discussionTitle = data.discussionTitle;
      }

      // Take posts from the frame that found the most (usually the iframe)
      if (data.allPosts && data.allPosts.length > combined.allPosts.length) {
        combined.allPosts = data.allPosts;
        totalPostsFound = data.allPosts.length;
      }

      // Fallback initial post
      if (data.initialPost && !combined.initialPost && combined.allPosts.length === 0) {
        combined.initialPost = data.initialPost;
      }
    }

    // Process allPosts to separate student's posts from peer responses
    if (combined.allPosts.length > 0) {
      if (combined.studentName) {
        // Try to match student name against post authors
        const nameParts = combined.studentName.toLowerCase().split(/[\s,]+/).filter(p => p.length > 2);

        const studentPosts = [];
        const peerPosts = [];

        combined.allPosts.forEach(post => {
          if (!post.author) {
            // Can't determine - add to peers
            peerPosts.push(post);
            return;
          }

          const authorLower = post.author.toLowerCase();
          const isStudent = nameParts.some(part => authorLower.includes(part));

          if (isStudent) {
            studentPosts.push(post);
          } else {
            peerPosts.push(post);
          }
        });

        // Student's first post is the initial post
        if (studentPosts.length > 0) {
          combined.initialPost = studentPosts[0].content;
          // Additional student posts are also included
          if (studentPosts.length > 1) {
            for (let i = 1; i < studentPosts.length; i++) {
              combined.peerResponses.push(`[${combined.studentName} - Reply ${i}]: ${studentPosts[i].content}`);
            }
          }
        }

        // Peer posts
        peerPosts.forEach(post => {
          const label = post.author ? `[${post.author}]` : '[Peer]';
          combined.peerResponses.push(`${label}: ${post.content}`);
        });
      } else {
        // No student name - first post is initial, rest are peers
        // Skip index 0 which is typically the instructor's prompt
        if (combined.allPosts.length > 1) {
          combined.initialPost = combined.allPosts[1].content;
          for (let i = 2; i < combined.allPosts.length; i++) {
            const post = combined.allPosts[i];
            const label = post.author ? `[${post.author}]` : `[Post ${i}]`;
            combined.peerResponses.push(`${label}: ${post.content}`);
          }
        } else {
          combined.initialPost = combined.allPosts[0].content;
        }
      }
    }

    if (!combined.initialPost && combined.allPosts.length === 0) {
      showStatus('status-message', '❌ No discussion content found. Make sure you\'re viewing a discussion in SpeedGrader.', 'error');
      return;
    }

    currentDiscussion = combined;

    // Update UI with extracted data
    document.getElementById('student-name').textContent = currentDiscussion.studentName || 'Unknown';
    document.getElementById('discussion-title').textContent = currentDiscussion.discussionTitle || 'Discussion';

    const previewDiv = document.getElementById('discussion-preview');
    const initialPreview = currentDiscussion.initialPost
      ? currentDiscussion.initialPost.substring(0, 500) + (currentDiscussion.initialPost.length > 500 ? '...' : '')
      : 'No initial post found';

    const peerCount = currentDiscussion.peerResponses?.length || 0;
    const peerPreview = peerCount > 0
      ? currentDiscussion.peerResponses.map((r, i) => `${i + 1}. ${r.substring(0, 200)}${r.length > 200 ? '...' : ''}`).join('<br><br>')
      : 'No peer responses found';

    previewDiv.innerHTML = `
      <strong>Initial Post:</strong><br>
      ${escapeHtml(initialPreview)}<br><br>
      <strong>Peer Responses (${peerCount}):</strong><br>
      ${escapeHtml(peerPreview).replace(/\n/g, '<br>')}
    `;

    // Show grade button
    document.getElementById('grade-btn').classList.remove('hidden');
    showStatus('status-message', `✅ Extracted ${totalPostsFound} discussion posts successfully!`, 'success');

  } catch (error) {
    console.error('Extract error:', error);
    showStatus('status-message', `❌ Error: ${error.message}`, 'error');
  }
}

// Escape HTML to prevent XSS in preview
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Content script function to extract Canvas discussion data
// This runs inside each frame (top + iframes) via chrome.scripting.executeScript
function extractCanvasDiscussion() {
  try {
    const data = {
      studentName: '',
      discussionTitle: '',
      initialPost: '',
      peerResponses: [],
      allPosts: [],
      timestamps: [],
      frameType: window === window.top ? 'top' : 'iframe'
    };

    // === STUDENT NAME (SpeedGrader UI - usually top frame) ===
    const studentNameSelectors = [
      '#students_selectmenu-button .ui-selectmenu-item-header',
      '.student_name',
      '[data-testid="student-name"]',
      '.ui-selectmenu-item-header'
    ];

    for (const sel of studentNameSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        data.studentName = (el.value || el.textContent || '').trim();
        if (data.studentName) break;
      }
    }

    // === DISCUSSION TITLE ===
    const titleSelectors = [
      '.discussion-title',
      'h1.discussion_topic_title',
      '.discussion-topic-title',
      '[data-testid="discussion-topic-title"]'
    ];

    for (const sel of titleSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        data.discussionTitle = el.textContent.trim();
        if (data.discussionTitle) break;
      }
    }

    // === CANVAS DISCUSSION REDESIGN (Current Layout) ===
    const userMessages = document.querySelectorAll('.userMessage');

    if (userMessages.length > 0) {
      userMessages.forEach(function(msg, index) {
        const text = msg.textContent.trim();
        if (!text) return;

        // Walk up DOM tree to find author and timestamp
        var authorName = '';
        var timestamp = '';
        var container = msg;

        for (var i = 0; i < 15 && container; i++) {
          container = container.parentElement;
          if (!container) break;

          // Look for author
          if (!authorName) {
            var authorEl = container.querySelector('.student_context_card_trigger.author_post, .author_post');
            if (authorEl) {
              var nameLink = authorEl.querySelector('a span.user_content, a span, a');
              authorName = nameLink ? nameLink.textContent.trim() : authorEl.textContent.trim();
            }
          }

          // Look for timestamp
          if (!timestamp) {
            var timeEl = container.querySelector('time, [datetime], .discussion-pubdate');
            if (timeEl) {
              timestamp = timeEl.getAttribute('datetime') || timeEl.textContent.trim();
            }
          }

          if (authorName && timestamp) break;
          if (container.classList && container.classList.contains('discussion-redesign-layout')) break;
        }

        data.allPosts.push({
          author: authorName,
          content: text.substring(0, 5000),
          timestamp: timestamp,
          index: index
        });
      });
    }

    // === FALLBACK: Old Canvas Discussion Selectors ===
    if (data.allPosts.length === 0) {
      var entries = document.querySelectorAll('.discussion_entry, .discussion-entry, .entry');
      entries.forEach(function(entry, index) {
        var messageEl = entry.querySelector('.message, .entry-content');
        if (messageEl) {
          var content = messageEl.textContent.trim();
          var timestampEl = entry.querySelector('.discussion-pubdate, .published, time');
          var ts = timestampEl ? timestampEl.textContent.trim() : '';

          if (content) {
            data.allPosts.push({
              author: '',
              content: content.substring(0, 5000),
              timestamp: ts,
              index: index
            });
          }
        }
      });
    }

    // === LAST RESORT: Get iframe body text from top frame ===
    if (data.allPosts.length === 0 && window === window.top) {
      var iframe = document.querySelector('#speedgrader_iframe');
      if (iframe) {
        try {
          if (iframe.contentDocument && iframe.contentDocument.body) {
            var bodyText = iframe.contentDocument.body.textContent.trim();
            if (bodyText.length > 50) {
              data.initialPost = bodyText.substring(0, 10000);
            }
          }
        } catch (e) {
          // Cross-origin iframe
        }
      }
    }

    return data;

  } catch (error) {
    return { error: error.message, allPosts: [], frameType: 'unknown' };
  }
}

// Grade discussion using AI
async function gradeWithAI() {
  try {
    const config = await chrome.storage.local.get(['apiKey', 'workerUrl']);

    if (!config.apiKey || !config.workerUrl) {
      showStatus('status-message', '❌ Please configure API key and worker URL first', 'error');
      return;
    }

    if (!currentDiscussion) {
      showStatus('status-message', '❌ Please extract discussion content first', 'error');
      return;
    }

    // Show loading state
    document.getElementById('grading-progress').classList.remove('hidden');
    document.getElementById('grade-btn').disabled = true;

    // Format discussion content for the worker
    const formattedContent = [
      '**Initial Post:**',
      currentDiscussion.initialPost || '(No initial post found)',
      '',
      '**Peer Responses:**',
      currentDiscussion.peerResponses.length > 0
        ? currentDiscussion.peerResponses.join('\n\n')
        : '(No peer responses found)'
    ].join('\n');

    // Call Cloudflare Worker API
    const response = await fetch(config.workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apiKey: config.apiKey,
        discussion: {
          studentName: currentDiscussion.studentName,
          discussionTitle: currentDiscussion.discussionTitle,
          content: formattedContent
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const grading = await response.json();
    currentGrading = grading;

    // Hide loading, show results
    document.getElementById('grading-progress').classList.add('hidden');
    document.getElementById('grading-results').classList.remove('hidden');

    // Populate grading results
    populateGradingResults(grading);

    showStatus('status-message', '✅ AI grading complete! Review and adjust as needed.', 'success');

  } catch (error) {
    console.error('Grading error:', error);
    document.getElementById('grading-progress').classList.add('hidden');
    document.getElementById('grade-btn').disabled = false;
    showStatus('status-message', `❌ Error: ${error.message}`, 'error');
  }
}

// Populate grading results in UI
function populateGradingResults(grading) {
  document.getElementById('score-initial').value = grading.scores.initialPost;
  document.getElementById('score-peers').value = grading.scores.peerResponses;
  document.getElementById('score-clarity').value = grading.scores.clarity;
  document.getElementById('score-participation').value = grading.scores.participation;
  document.getElementById('score-timeliness').value = grading.scores.timeliness;

  document.getElementById('reasoning-initial').textContent = grading.reasoning.initialPost;
  document.getElementById('reasoning-peers').textContent = grading.reasoning.peerResponses;
  document.getElementById('reasoning-clarity').textContent = grading.reasoning.clarity;
  document.getElementById('reasoning-participation').textContent = grading.reasoning.participation;
  document.getElementById('reasoning-timeliness').textContent = grading.reasoning.timeliness;

  document.getElementById('feedback-comment').value = grading.feedbackComment;

  updateTotalScore();
}

// Update total score display
function updateTotalScore() {
  const initial = parseInt(document.getElementById('score-initial').value) || 0;
  const peers = parseInt(document.getElementById('score-peers').value) || 0;
  const clarity = parseInt(document.getElementById('score-clarity').value) || 0;
  const participation = parseInt(document.getElementById('score-participation').value) || 0;
  const timeliness = parseInt(document.getElementById('score-timeliness').value) || 0;

  const total = initial + peers + clarity + participation + timeliness;
  document.getElementById('total-score').textContent = total;
}

// Apply grades to Canvas
async function applyToCanvas() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const gradingData = {
      scores: {
        initialPost: parseInt(document.getElementById('score-initial').value),
        peerResponses: parseInt(document.getElementById('score-peers').value),
        clarity: parseInt(document.getElementById('score-clarity').value),
        participation: parseInt(document.getElementById('score-participation').value),
        timeliness: parseInt(document.getElementById('score-timeliness').value)
      },
      feedback: document.getElementById('feedback-comment').value,
      totalScore: parseInt(document.getElementById('total-score').textContent)
    };

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: fillCanvasGradingForm,
      args: [gradingData]
    });

    showStatus('status-message', '✅ Grades applied to Canvas! Please review before submitting.', 'success');

  } catch (error) {
    console.error('Apply error:', error);
    showStatus('status-message', `❌ Error: ${error.message}`, 'error');
  }
}

// Content script function to fill Canvas grading form
function fillCanvasGradingForm(gradingData) {
  try {
    const gradeInput = document.querySelector('#grading-box-extended input[name="submission[score]"], #grade_container input[type="text"]');
    if (gradeInput) {
      gradeInput.value = gradingData.totalScore;
      gradeInput.dispatchEvent(new Event('input', { bubbles: true }));
      gradeInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const commentBox = document.querySelector('#speed_grader_comment_textarea, .comment_textarea');
    if (commentBox) {
      commentBox.value = gradingData.feedback;
      commentBox.dispatchEvent(new Event('input', { bubbles: true }));
      commentBox.dispatchEvent(new Event('change', { bubbles: true }));
    }

    return true;
  } catch (error) {
    return false;
  }
}

// Reset grading state
function resetGrading() {
  currentDiscussion = null;
  currentGrading = null;

  document.getElementById('grading-results').classList.add('hidden');
  document.getElementById('grade-btn').classList.add('hidden');
  document.getElementById('grade-btn').disabled = false;
  document.getElementById('discussion-preview').innerHTML = 'Click "Extract Discussion" to load content from Canvas';

  showStatus('status-message', '🔄 Reset complete. Extract a new discussion to grade.', 'info');
}

// Show status message
function showStatus(elementId, message, type = 'info') {
  const statusDiv = document.getElementById(elementId);
  statusDiv.textContent = message;
  statusDiv.className = `status-message ${type}`;

  if (type === 'success' || type === 'error') {
    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = 'status-message';
    }, 5000);
  }
}
