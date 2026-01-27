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
