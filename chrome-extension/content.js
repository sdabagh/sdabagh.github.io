// MAT300 Grading Assistant - Content Script
// Runs on Canvas SpeedGrader pages (top frame AND iframes via all_frames)

console.log('MAT300 Grading Assistant content script loaded (frame:', window === window.top ? 'top' : 'iframe', ')');

// Add visual indicator only in top frame
if (window === window.top) {
  addExtensionIndicator();
}

function addExtensionIndicator() {
  if (document.getElementById('mat300-indicator')) return;

  const indicator = document.createElement('div');
  indicator.id = 'mat300-indicator';
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
      📊 MAT300 Assistant Active
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
      '#students_selectmenu-button .ui-selectmenu-item-header',
      '.student_name',
      '[data-testid="student-name"]',
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

    console.log(`MAT300: Found ${authorPosts.length} author elements, ${userMessages.length} message elements`);

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
          console.log('MAT300: Cannot access iframe (cross-origin)');
        }
      }
    }

    console.log(`MAT300: Extracted ${data.allPosts.length} posts from ${data.frameType} frame`);

  } catch (error) {
    console.error('MAT300: Error extracting discussion data:', error);
  }

  return data;
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
      console.log('MAT300: Rubric container found');
    }

    return true;

  } catch (error) {
    console.error('MAT300: Error filling grading form:', error);
    return false;
  }
}
