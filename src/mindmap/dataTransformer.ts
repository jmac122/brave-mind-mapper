import { HistoryEntry, TreeNode, Category, StatsData, ViewMode } from '../utils/types';

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

// ========== Category Grouping ==========

const categoryLabels: Record<Category, string> = {
  social: 'Social Media',
  news: 'News',
  shopping: 'Shopping',
  development: 'Development',
  entertainment: 'Entertainment',
  productivity: 'Productivity',
  reference: 'Reference',
  email: 'Email',
  other: 'Other',
};

interface CategoryGroup {
  category: Category;
  entries: HistoryEntry[];
  totalVisits: number;
  lastVisit: number;
}

function groupByCategory(entries: HistoryEntry[]): Map<Category, CategoryGroup> {
  const groups = new Map<Category, CategoryGroup>();

  for (const entry of entries) {
    const category = entry.category || 'other';
    const existing = groups.get(category);
    if (existing) {
      existing.entries.push(entry);
      existing.totalVisits += entry.visitCount;
      existing.lastVisit = Math.max(existing.lastVisit, entry.visitTime);
    } else {
      groups.set(category, {
        category,
        entries: [entry],
        totalVisits: entry.visitCount,
        lastVisit: entry.visitTime,
      });
    }
  }

  return groups;
}

/**
 * Transforms HistoryEntry[] to D3 tree grouped by category
 */
export function transformToD3TreeByCategory(entries: HistoryEntry[]): TreeNode {
  nodeIdCounter = 0;

  const categoryGroups = groupByCategory(entries);
  const sortedCategories = Array.from(categoryGroups.values()).sort(
    (a, b) => b.totalVisits - a.totalVisits
  );

  const categoryNodes: TreeNode[] = sortedCategories.map(group => {
    // Group entries by domain within category
    const domainMap = new Map<string, HistoryEntry[]>();
    for (const entry of group.entries) {
      const existing = domainMap.get(entry.domain) || [];
      existing.push(entry);
      domainMap.set(entry.domain, existing);
    }

    const domainNodes: TreeNode[] = Array.from(domainMap.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 15)
      .map(([domain, domainEntries]) => {
        const pageNodes: TreeNode[] = domainEntries
          .sort((a, b) => b.visitCount - a.visitCount)
          .slice(0, 10)
          .map(entry => ({
            id: generateNodeId(),
            name: truncateText(entry.title || entry.url, 45),
            data: {
              url: entry.url,
              visitCount: entry.visitCount,
              lastVisit: entry.visitTime,
              category: entry.category,
              isLeaf: true,
            },
          }));

        const shouldCollapse = pageNodes.length > 3;

        return {
          id: generateNodeId(),
          name: `${domain} (${domainEntries.length})`,
          children: shouldCollapse ? undefined : pageNodes,
          _children: shouldCollapse ? pageNodes : undefined,
          data: {
            visitCount: domainEntries.reduce((sum, e) => sum + e.visitCount, 0),
            lastVisit: Math.max(...domainEntries.map(e => e.visitTime)),
            isLeaf: false,
          },
        };
      });

    const shouldCollapseCategory = domainNodes.length > 5;

    return {
      id: generateNodeId(),
      name: `${categoryLabels[group.category]} (${group.entries.length})`,
      children: shouldCollapseCategory ? undefined : domainNodes,
      _children: shouldCollapseCategory ? domainNodes : undefined,
      data: {
        category: group.category,
        visitCount: group.totalVisits,
        lastVisit: group.lastVisit,
        isLeaf: false,
      },
    };
  });

  return {
    id: generateNodeId(),
    name: `Browsing History (${entries.length} pages)`,
    children: categoryNodes,
    data: { isLeaf: false },
  };
}

/**
 * Transform based on view mode
 */
export function transformToD3TreeByMode(entries: HistoryEntry[], mode: ViewMode): TreeNode {
  if (mode === 'category') {
    return transformToD3TreeByCategory(entries);
  }
  return transformToD3Tree(entries);
}

// ========== Stats Computation ==========

/**
 * Compute statistics from history entries
 */
export function computeStats(entries: HistoryEntry[]): StatsData {
  const domainGroups = groupByDomain(entries);

  // Category counts
  const categoryCounts: Record<Category, number> = {
    social: 0,
    news: 0,
    shopping: 0,
    development: 0,
    entertainment: 0,
    productivity: 0,
    reference: 0,
    email: 0,
    other: 0,
  };

  let totalVisits = 0;
  for (const entry of entries) {
    const category = entry.category || 'other';
    categoryCounts[category]++;
    totalVisits += entry.visitCount;
  }

  // Top domains
  const topDomains = Array.from(domainGroups.values())
    .sort((a, b) => b.totalVisits - a.totalVisits)
    .slice(0, 10)
    .map(group => ({
      domain: group.domain,
      count: group.entries.length,
      visits: group.totalVisits,
    }));

  // Recent activity
  const recentActivity = [...entries]
    .sort((a, b) => b.visitTime - a.visitTime)
    .slice(0, 10)
    .map(entry => ({
      title: entry.title || entry.url,
      url: entry.url,
      time: entry.visitTime,
    }));

  return {
    totalPages: entries.length,
    totalDomains: domainGroups.size,
    totalVisits,
    categoryCounts,
    topDomains,
    recentActivity,
  };
}

// ========== Search Filtering ==========

/**
 * Filter tree nodes by search query
 */
export function filterTreeBySearch(root: TreeNode, query: string): TreeNode | null {
  if (!query.trim()) return root;

  const lowerQuery = query.toLowerCase();

  function matchesQuery(node: TreeNode): boolean {
    if (node.name.toLowerCase().includes(lowerQuery)) return true;
    if (node.data?.url?.toLowerCase().includes(lowerQuery)) return true;
    return false;
  }

  function filterNode(node: TreeNode): TreeNode | null {
    // Check if this node matches
    const nodeMatches = matchesQuery(node);

    // Get all children (visible and collapsed)
    const allChildren = [...(node.children || []), ...(node._children || [])];

    // Filter children recursively
    const filteredChildren = allChildren
      .map(child => filterNode(child))
      .filter((child): child is TreeNode => child !== null);

    // If this node matches or has matching children, include it
    if (nodeMatches || filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren.length > 0 ? filteredChildren : undefined,
        _children: undefined, // Expand all matched nodes
      };
    }

    return null;
  }

  return filterNode(root);
}

/**
 * Count visible nodes in tree
 */
export function countTreeNodes(root: TreeNode | null): number {
  if (!root) return 0;

  let count = 1;
  if (root.children) {
    for (const child of root.children) {
      count += countTreeNodes(child);
    }
  }
  return count;
}

// ========== Visit Count Filtering ==========

export type VisitCountRange = 'all' | '1' | '2-5' | '6-10' | '10+';

function isInVisitRange(visitCount: number, range: VisitCountRange): boolean {
  switch (range) {
    case 'all':
      return true;
    case '1':
      return visitCount === 1;
    case '2-5':
      return visitCount >= 2 && visitCount <= 5;
    case '6-10':
      return visitCount >= 6 && visitCount <= 10;
    case '10+':
      return visitCount > 10;
    default:
      return true;
  }
}

/**
 * Filter history entries by visit count range
 */
export function filterEntriesByVisitCount(
  entries: HistoryEntry[],
  range: VisitCountRange
): HistoryEntry[] {
  if (range === 'all') return entries;
  return entries.filter(entry => isInVisitRange(entry.visitCount, range));
}
