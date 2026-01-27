// Background service worker for Brave Mind Mapper
// This handles real-time history tracking

console.log('Brave Mind Mapper: Background service worker started');

// Listen for navigation events
chrome.webNavigation.onCompleted.addListener((details) => {
  // Only track main frame navigations
  if (details.frameId === 0) {
    console.log('Page visited:', details.url);
    // TODO: Process and store history entry
  }
});

// Listen for messages from popup/mindmap
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_HISTORY') {
    // TODO: Return processed history
    sendResponse({ success: true, data: [] });
  }
  return true; // Keep channel open for async response
});

export {};
