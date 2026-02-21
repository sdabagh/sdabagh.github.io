// MAT300 Grading Assistant - Background Service Worker

console.log('MAT300 Grading Assistant background service worker loaded');

// Install event
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Extension installed');
    // Could open welcome page or setup instructions
  } else if (details.reason === 'update') {
    console.log('Extension updated');
  }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getConfig') {
    chrome.storage.local.get(['apiKey', 'workerUrl'], (result) => {
      sendResponse(result);
    });
    return true; // Keep message channel open for async response
  }

  if (request.action === 'saveConfig') {
    chrome.storage.local.set(request.config, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Optional: Add context menu item for quick access
chrome.contextMenus.create({
  id: 'mat300-grade',
  title: 'Grade with MAT300 Assistant',
  contexts: ['selection'],
  documentUrlPatterns: ['https://smc.instructure.com/*']
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'mat300-grade') {
    // Open popup or trigger grading action
    chrome.action.openPopup();
  }
});
