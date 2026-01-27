/**
 * URL parsing utilities for extracting domains and validating URLs
 */

/**
 * Extracts the domain from a URL, removing www. prefix for cleaner grouping
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

/**
 * Checks if a URL should be included in history (filters out browser internal pages)
 */
export function isValidHistoryUrl(url: string): boolean {
  if (!url) return false;

  const excludedProtocols = [
    'chrome://',
    'chrome-extension://',
    'brave://',
    'about:',
    'edge://',
    'file://',
    'data:',
    'javascript:',
  ];

  return !excludedProtocols.some(protocol => url.startsWith(protocol));
}

/**
 * Extracts a readable path for display, truncating if too long
 */
export function extractPath(url: string): string {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname + urlObj.search;
    return path.length > 50 ? path.substring(0, 47) + '...' : path;
  } catch {
    return '';
  }
}
