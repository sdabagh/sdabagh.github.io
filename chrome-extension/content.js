// Canvas Discussion Grading Assistant - Content Script
// Runs on Canvas SpeedGrader pages (top frame AND iframes via all_frames)

const EXTENSION_VERSION = '1.2.0';
console.log('🤖 Canvas Grading Assistant v' + EXTENSION_VERSION + ' loaded (frame:', window === window.top ? 'top' : 'iframe', ')');

// Add visual indicator and extract button only in top frame
if (window === window.top) {
  addExtensionIndicator();
  addExtractButton();
}

function addExtensionIndicator() {
  if (document.getElementById('grading-assistant-indicator')) return;

  const indicator = document.createElement('div');
  indicator.id = 'grading-assistant-indicator';
  indicator.innerHTML = `
    <div style="
      position: fixed;
      top: 10px;
      right: 10px;
      background: linear-gradient(135deg, #2C5F7C, #3A7CA5);
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      z-index: 10000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      font-family: 'Segoe UI', sans-serif;
    ">
      📊 Grading Assistant Active
    </div>
  `;

  document.body.appendChild(indicator);

  setTimeout(() => {
    indicator.style.transition = 'opacity 0.5s';
    indicator.style.opacity = '0';
    setTimeout(() => indicator.remove(), 500);
  }, 3000);
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractDiscussion') {
    const data = extractDiscussionData();
    sendResponse({ success: true, data, isTopFrame: window === window.top });
    return true;
  }

  if (request.action === 'fillGrading') {
    const success = fillGradingForm(request.gradingData);
    sendResponse({ success });
    return true;
  }
});

// Extract discussion data from current frame context
function extractDiscussionData() {
  const data = {
    studentName: '',
    discussionTitle: '',
    initialPost: '',
    peerResponses: [],
    timestamps: [],
    postDates: [],
    allPosts: [],
    frameType: window === window.top ? 'top' : 'iframe'
  };

  try {
    // === STUDENT NAME (usually only in top frame SpeedGrader UI) ===
    const studentNameSelectors = [
      // New Canvas UI (2024+)
      '[data-testid="student-name"]',
      '[aria-label*="student"]',
      // Classic selectors
      '#students_selectmenu-button .ui-selectmenu-item-header',
      '.student_name',
      '#combo_box_container input',
      '.ui-selectmenu-item-header'
    ];

    for (const selector of studentNameSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        data.studentName = (el.value || el.textContent || '').trim();
        if (data.studentName) break;
      }
    }

    // Try extracting from "discussion posts for [Name]" text
    if (!data.studentName) {
      const bodyText = document.body.textContent;
      const match = bodyText.match(/discussion posts for ([A-Z][a-z]+ [A-Z][a-z]+)/);
      if (match) {
        data.studentName = match[1].trim();
        console.log('Grading Assistant: Extracted student name from text:', data.studentName);
      }
    }

    // Final fallback: look for any prominent name in header/top area
    if (!data.studentName) {
      const headers = document.querySelectorAll('header, [role="banner"], .header');
      for (const header of headers) {
        const text = header.textContent;
        const nameMatch = text.match(/\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/);
        if (nameMatch && nameMatch[1].split(' ').length === 2) {
          data.studentName = nameMatch[1];
          console.log('Grading Assistant: Extracted student name from header:', data.studentName);
          break;
        }
      }
    }

    // === DISCUSSION TITLE ===
    const titleSelectors = [
      '.discussion-title',
      'h1.discussion_topic_title',
      '.discussion-topic-title',
      '[data-testid="discussion-topic-title"]',
      '.title'
    ];

    for (const selector of titleSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        data.discussionTitle = el.textContent.trim();
        if (data.discussionTitle) break;
      }
    }

    // === CANVAS DISCUSSION REDESIGN (New Layout) ===
    // These selectors match Canvas's current discussion redesign
    const authorPosts = document.querySelectorAll('.student_context_card_trigger.author_post, .author_post');
    const userMessages = document.querySelectorAll('.userMessage');

    console.log(`Grading Assistant: Found ${authorPosts.length} author elements, ${userMessages.length} message elements`);

    if (userMessages.length > 0) {
      userMessages.forEach((msg, index) => {
        const text = msg.textContent.trim();
        if (!text) return;

        // Walk up DOM to find author name near this message
        let authorName = '';
        let timestamp = '';
        let container = msg;

        // Walk up to find a common parent that contains both author and message
        for (let i = 0; i < 15 && container; i++) {
          container = container.parentElement;
          if (!container) break;

          // Look for author element
          if (!authorName) {
            const authorEl = container.querySelector('.student_context_card_trigger.author_post, .author_post');
            if (authorEl) {
              // Get the text content - usually contains the student name
              const nameLink = authorEl.querySelector('a span.user_content, a');
              authorName = nameLink ? nameLink.textContent.trim() : authorEl.textContent.trim();
            }
          }

          // Look for timestamp
          if (!timestamp) {
            const timeEl = container.querySelector('time, [datetime], .discussion-pubdate, .timestamp');
            if (timeEl) {
              timestamp = timeEl.getAttribute('datetime') || timeEl.textContent.trim();
            }
          }

          // Stop if we found both or hit a major container
          if (authorName && timestamp) break;
          if (container.classList.contains('discussion-redesign-layout')) break;
        }

        data.allPosts.push({
          author: authorName,
          content: text.substring(0, 5000), // Limit length
          timestamp: timestamp,
          index: index
        });
      });
    }

    // === FALLBACK: Old Canvas Discussion Selectors ===
    if (data.allPosts.length === 0) {
      const oldEntries = document.querySelectorAll('.discussion_entry, .discussion-entry, .entry, .entry-content');

      oldEntries.forEach((entry, index) => {
        const messageEl = entry.querySelector('.message, .entry-content, p');
        if (messageEl) {
          const content = messageEl.textContent.trim();
          const timestampEl = entry.querySelector('.discussion-pubdate, .published, time, .date');
          const timestamp = timestampEl ? timestampEl.textContent.trim() : '';

          if (content) {
            data.allPosts.push({
              author: '',
              content: content.substring(0, 5000),
              timestamp: timestamp,
              index: index
            });
          }
        }
      });
    }

    // === NEW CANVAS UI: Try to extract from main content area ===
    if (data.allPosts.length === 0) {
      console.log('Grading Assistant: Trying new Canvas UI content extraction');
      // Look for post content in various possible containers
      const contentSelectors = [
        'article',
        '[role="article"]',
        '.discussion-content',
        '.post-content',
        'main [data-testid*="post"]',
        'main [data-testid*="discussion"]'
      ];

      for (const sel of contentSelectors) {
        const articles = document.querySelectorAll(sel);
        if (articles.length > 0) {
          console.log(`Grading Assistant: Found ${articles.length} articles with selector: ${sel}`);
          articles.forEach((article, index) => {
            const text = article.textContent.trim();
            if (text && text.length > 50) {
              // Try to find author within article
              const authorEl = article.querySelector('[data-testid*="author"], .author, header strong, h3, h4');
              const author = authorEl ? authorEl.textContent.trim() : '';

              data.allPosts.push({
                author: author,
                content: text.substring(0, 5000),
                timestamp: '',
                index: index
              });
            }
          });
          if (data.allPosts.length > 0) break;
        }
      }
    }

    // === FALLBACK: Try to access iframe from top frame ===
    if (data.allPosts.length === 0 && window === window.top) {
      const iframe = document.querySelector('#speedgrader_iframe');
      if (iframe) {
        try {
          if (iframe.contentDocument && iframe.contentDocument.body) {
            const bodyText = iframe.contentDocument.body.textContent.trim();
            if (bodyText.length > 50) {
              data.initialPost = bodyText.substring(0, 10000);
            }
          }
        } catch (e) {
          console.log('Grading Assistant: Cannot access iframe (cross-origin)');
        }
      }
    }

    console.log(`Grading Assistant: Extracted ${data.allPosts.length} posts from ${data.frameType} frame`);

  } catch (error) {
    console.error('Grading Assistant: Error extracting discussion data:', error);
  }

  return data;
}

// Add "Extract Discussion" button to Canvas page (persistent)
function addExtractButton() {
  let buttonCheckInterval;

  function createButton() {
    // Check if button already exists
    if (document.getElementById('grading-assistant-extract-btn')) return;

    const button = document.createElement('button');
    button.id = 'grading-assistant-extract-btn';
    button.innerHTML = '🤖 Extract & Grade';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #2C5F7C, #3A7CA5);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-family: 'Segoe UI', sans-serif;
      transition: all 0.2s ease;
    `;

    button.onmouseover = () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
    };

    button.onmouseout = () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    };

    button.onclick = () => {
      // Extract data and show in console
      button.innerHTML = '⏳ Extracting...';
      button.disabled = true;

      const data = extractDiscussionData();
      console.log('=== EXTRACTED DATA ===', data);

      // Show alert with extraction results
      const postCount = data.allPosts.length;
      const studentName = data.studentName || 'Unknown';
      alert(`Extracted:\n\nStudent: ${studentName}\nPosts found: ${postCount}\n\nCheck console for full data`);

      button.innerHTML = '🤖 Extract & Grade';
      button.disabled = false;
    };

    document.body.appendChild(button);
    console.log('Grading Assistant: Button injected');
  }

  // Initial button creation
  setTimeout(createButton, 1000);

  // Re-inject button if it gets removed (Canvas SPA behavior)
  buttonCheckInterval = setInterval(() => {
    if (!document.getElementById('grading-assistant-extract-btn') && document.body) {
      console.log('Grading Assistant: Button removed, re-injecting...');
      createButton();
    }
  }, 2000);

  // Also use MutationObserver for immediate re-injection
  const observer = new MutationObserver(() => {
    if (!document.getElementById('grading-assistant-extract-btn') && document.body) {
      createButton();
    }
  });

  // Observe body for child removals
  if (document.body) {
    observer.observe(document.body, { childList: true });
  }
}

// Fill Canvas grading form with AI-generated grades
function fillGradingForm(gradingData) {
  try {
    // Fill total score in grade input
    const gradeInput = document.querySelector(
      '#grading-box-extended input[name="submission[score]"], ' +
      '#grade_container input[type="text"], ' +
      'input[name="grade"]'
    );

    if (gradeInput) {
      gradeInput.value = gradingData.totalScore;
      gradeInput.dispatchEvent(new Event('input', { bubbles: true }));
      gradeInput.dispatchEvent(new Event('change', { bubbles: true }));
      gradeInput.dispatchEvent(new Event('blur', { bubbles: true }));
    }

    // Fill feedback comment
    const commentBox = document.querySelector(
      '#speed_grader_comment_textarea, ' +
      '.comment_textarea, ' +
      'textarea[name="comment"]'
    );

    if (commentBox) {
      commentBox.value = gradingData.feedback;
      commentBox.dispatchEvent(new Event('input', { bubbles: true }));
      commentBox.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Try to fill rubric if available
    const rubricContainer = document.querySelector('.rubric_container, .rubric-assessment');
    if (rubricContainer) {
      console.log('Grading Assistant: Rubric container found');
    }

    return true;

  } catch (error) {
    console.error('Grading Assistant: Error filling grading form:', error);
    return false;
  }
}
