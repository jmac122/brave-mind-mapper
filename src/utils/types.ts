// Category types for browsing history
export type Category =
  | 'social'
  | 'news'
  | 'shopping'
  | 'development'
  | 'entertainment'
  | 'productivity'
  | 'reference'
  | 'email'
  | 'other';

// Stored history entry
export interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  domain: string;
  visitTime: number;
  visitCount: number;
  category: Category;
}

// Mind map node structure (for Markmap)
export interface MindMapNode {
  content: string;
  children?: MindMapNode[];
  payload?: {
    url?: string;
    visitCount?: number;
    lastVisit?: number;
  };
}

// Storage schema
export interface StorageData {
  historyEntries: HistoryEntry[];
  lastUpdated: number;
}

// D3 Tree Types

/**
 * D3-compatible tree node structure
 */
export interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
  _children?: TreeNode[]; // Collapsed children (D3 convention)
  data?: {
    url?: string;
    visitCount?: number;
    lastVisit?: number;
    category?: Category;
    isLeaf?: boolean;
  };
}

/**
 * Layout orientation
 */
export type TreeOrientation = 'horizontal' | 'vertical';

/**
 * Tree visualization configuration
 */
export interface TreeConfig {
  orientation: TreeOrientation;
  nodeWidth: number;
  nodeHeight: number;
  duration: number;
  maxLabelLength: number;
  depthColors: string[];
  showMinimap: boolean;
  highlightRecent: boolean;
  recentThresholdMs: number;
}

/**
 * View mode - by domain or by category
 */
export type ViewMode = 'domain' | 'category';

/**
 * Stats data computed from history entries
 */
export interface StatsData {
  totalPages: number;
  totalDomains: number;
  totalVisits: number;
  categoryCounts: Record<Category, number>;
  topDomains: Array<{ domain: string; count: number; visits: number }>;
  recentActivity: Array<{ title: string; url: string; time: number }>;
}
