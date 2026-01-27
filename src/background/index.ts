// Background service worker for Brave Mind Mapper
import { HistoryEntry, StorageData } from '../utils/types';
import { extractDomain, isValidHistoryUrl } from '../utils/domainParser';
import { categorize } from '../utils/categorizer';

console.log('Brave Mind Mapper: Background service worker started');

// Message types
interface GetHistoryMessage {
  type: 'GET_HISTORY';
  options?: {
    startTime?: number;
    maxResults?: number;
  };
}

interface HistoryResponse {
  success: boolean;
  data?: HistoryEntry[];
  error?: string;
}

/**
 * Fetches browsing history from Chrome API
 */
async function fetchHistory(options?: {
  startTime?: number;
  maxResults?: number;
}): Promise<HistoryEntry[]> {
  const startTime = options?.startTime ?? 0;
  const maxResults = options?.maxResults ?? 5000;

  return new Promise((resolve, reject) => {
    chrome.history.search(
      {
        text: '',
        startTime: startTime,
        maxResults: maxResults,
      },
      results => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        const entries: HistoryEntry[] = results
          .filter(item => item.url && isValidHistoryUrl(item.url))
          .map(item => ({
            id: item.id || crypto.randomUUID(),
            url: item.url!,
            title: item.title || item.url!,
            domain: extractDomain(item.url!),
            visitTime: item.lastVisitTime || Date.now(),
            visitCount: item.visitCount || 1,
            category: categorize(item.url!, item.title || ''),
          }));

        resolve(entries);
      }
    );
  });
}

/**
 * Saves processed history to storage
 */
async function saveToStorage(entries: HistoryEntry[]): Promise<void> {
  const data: StorageData = {
    historyEntries: entries,
    lastUpdated: Date.now(),
  };

  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ historyData: data }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

// Listen for navigation events (for real-time updates in Phase 3)
chrome.webNavigation.onCompleted.addListener(details => {
  if (details.frameId === 0 && isValidHistoryUrl(details.url)) {
    console.log('Page visited:', details.url);
    // Phase 3: Incrementally update storage here
  }
});

// Message handler for communication with popup/mindmap pages
chrome.runtime.onMessage.addListener(
  (
    message: GetHistoryMessage,
    _sender,
    sendResponse: (response: HistoryResponse) => void
  ) => {
    if (message.type === 'GET_HISTORY') {
      // Handle async operation with IIFE
      (async () => {
        try {
          const entries = await fetchHistory(message.options);
          await saveToStorage(entries);
          sendResponse({ success: true, data: entries });
        } catch (error) {
          console.error('Error fetching history:', error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      })();

      // CRITICAL: Return true to indicate async response
      return true;
    }

    return false;
  }
);

export {};
