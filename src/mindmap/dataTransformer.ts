import { HistoryEntry, TreeNode } from '../utils/types';

/**
 * Markmap node structure (IPureNode compatible)
 */
export interface MarkmapNode {
  content: string;
  children: MarkmapNode[];
  payload?: {
    fold?: number;
    url?: string;
    visitCount?: number;
    lastVisit?: number;
  };
}

interface DomainGroup {
  domain: string;
  entries: HistoryEntry[];
  totalVisits: number;
  lastVisit: number;
}

/**
 * Groups history entries by domain
 */
function groupByDomain(entries: HistoryEntry[]): Map<string, DomainGroup> {
  const groups = new Map<string, DomainGroup>();

  for (const entry of entries) {
    const existing = groups.get(entry.domain);
    if (existing) {
      existing.entries.push(entry);
      existing.totalVisits += entry.visitCount;
      existing.lastVisit = Math.max(existing.lastVisit, entry.visitTime);
    } else {
      groups.set(entry.domain, {
        domain: entry.domain,
        entries: [entry],
        totalVisits: entry.visitCount,
        lastVisit: entry.visitTime,
      });
    }
  }

  return groups;
}

/**
 * Escapes HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Creates a clickable node content with embedded URL data
 */
function createLinkContent(title: string, url: string): string {
  const escapedTitle = escapeHtml(title);
  const truncatedTitle =
    escapedTitle.length > 60
      ? escapedTitle.substring(0, 57) + '...'
      : escapedTitle;
  return `<span class="mindmap-link" data-url="${escapeHtml(url)}">${truncatedTitle}</span>`;
}

/**
 * Transforms HistoryEntry[] to Markmap tree structure grouped by domain
 */
export function transformToMarkmap(entries: HistoryEntry[]): MarkmapNode {
  const domainGroups = groupByDomain(entries);

  // Sort domains by total visits (most visited first)
  const sortedDomains = Array.from(domainGroups.values()).sort(
    (a, b) => b.totalVisits - a.totalVisits
  );

  // Create domain children nodes
  const domainNodes: MarkmapNode[] = sortedDomains.map(group => {
    // Sort pages within domain by visit count, limit to 20
    const sortedPages = group.entries
      .sort((a, b) => b.visitCount - a.visitCount)
      .slice(0, 20);

    const pageNodes: MarkmapNode[] = sortedPages.map(entry => ({
      content: createLinkContent(entry.title || entry.url, entry.url),
      children: [],
      payload: {
        url: entry.url,
        visitCount: entry.visitCount,
        lastVisit: entry.visitTime,
      },
    }));

    // Auto-fold domains with many pages
    const shouldFold = pageNodes.length > 5 ? 1 : 0;

    return {
      content: `<strong>${escapeHtml(group.domain)}</strong> <small>(${group.entries.length} pages)</small>`,
      children: pageNodes,
      payload: {
        fold: shouldFold,
        visitCount: group.totalVisits,
        lastVisit: group.lastVisit,
      },
    };
  });

  // Root node
  return {
    content: `<strong>Browsing History</strong> <small>(${entries.length} pages)</small>`,
    children: domainNodes,
    payload: { fold: 0 },
  };
}

/**
 * Creates an empty state tree when no history is available
 */
export function createEmptyTree(): MarkmapNode {
  return {
    content: '<strong>Browsing History</strong>',
    children: [
      {
        content: '<em>No browsing history found</em>',
        children: [],
      },
    ],
  };
}

// ========== D3 Tree Format ==========

let nodeIdCounter = 0;
const generateNodeId = (): string => `node-${++nodeIdCounter}`;

function truncateText(text: string, maxLength: number): string {
  return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
}

/**
 * Transforms HistoryEntry[] to D3-compatible tree structure
 */
export function transformToD3Tree(entries: HistoryEntry[]): TreeNode {
  nodeIdCounter = 0;

  const domainGroups = groupByDomain(entries);
  const sortedDomains = Array.from(domainGroups.values()).sort(
    (a, b) => b.totalVisits - a.totalVisits
  );

  const domainNodes: TreeNode[] = sortedDomains.map(group => {
    const pageNodes: TreeNode[] = group.entries
      .sort((a, b) => b.visitCount - a.visitCount)
      .slice(0, 20)
      .map(entry => ({
        id: generateNodeId(),
        name: truncateText(entry.title || entry.url, 50),
        data: {
          url: entry.url,
          visitCount: entry.visitCount,
          lastVisit: entry.visitTime,
          category: entry.category,
          isLeaf: true,
        },
      }));

    // Pre-collapse domains with many children
    const shouldCollapse = pageNodes.length > 5;

    return {
      id: generateNodeId(),
      name: `${group.domain} (${group.entries.length})`,
      children: shouldCollapse ? undefined : pageNodes,
      _children: shouldCollapse ? pageNodes : undefined,
      data: {
        visitCount: group.totalVisits,
        lastVisit: group.lastVisit,
        isLeaf: false,
      },
    };
  });

  return {
    id: generateNodeId(),
    name: `Browsing History (${entries.length} pages)`,
    children: domainNodes,
    data: { isLeaf: false },
  };
}

/**
 * Creates an empty D3 tree when no history is available
 */
export function createEmptyD3Tree(): TreeNode {
  return {
    id: 'root',
    name: 'Browsing History',
    children: [
      {
        id: 'empty',
        name: 'No browsing history found',
        data: { isLeaf: true },
      },
    ],
    data: { isLeaf: false },
  };
}
