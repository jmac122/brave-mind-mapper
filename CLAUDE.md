# CLAUDE.md - Brave Mind Mapper Development Guide

## Project Overview

**Brave Mind Mapper** is a browser extension for Brave (Chrome-compatible) that automatically creates interactive mind maps from the user's browsing history. The extension organizes browsing data by **domain/website** and **auto-detected topic/category**, providing users with a visual understanding of their browsing patterns.

## Core Requirements

### Functional Requirements

1. **Browsing History Access**
   - Use Chrome/Brave `history` API to access browsing history
   - Track new page visits in real-time via `webNavigation` or `tabs` API
   - Store processed history data in `chrome.storage.local`

2. **Mind Map Organization** (Dual-hierarchy approach)
   - **By Domain**: Group pages under their parent domain (e.g., github.com → all GitHub pages)
   - **By Topic/Category**: Auto-categorize pages using URL patterns, page titles, and optional content analysis
   - Allow users to toggle between views or see a combined view

3. **Mind Map Visualization**
   - Use **Markmap** library for rendering (lightweight, purpose-built for mind maps)
   - Interactive: zoom, pan, expand/collapse nodes
   - Click on nodes to open the original URL

4. **Update Modes**
   - **On-demand**: User clicks extension icon or button to generate/refresh mind map
   - **Real-time**: Background script tracks navigation, updates mind map data incrementally


### Non-Functional Requirements

- **Privacy-first**: All data processing happens locally, no external API calls for categorization
- **Performance**: Must handle 10,000+ history entries without lag
- **Bundle size**: Keep extension under 500KB for fast loading
- **Browser compatibility**: Manifest V3, works on Brave and Chrome

## Technical Architecture

### Directory Structure

```
brave-mind-mapper/
├── CLAUDE.md              # This file - development instructions
├── README.md              # User-facing documentation
├── package.json           # NPM dependencies and scripts
├── manifest.json          # Extension manifest (V3)
├── webpack.config.js      # Build configuration
├── public/
│   └── icons/             # Extension icons (16, 48, 128px)
├── src/
│   ├── background/
│   │   ├── index.ts       # Service worker entry point
│   │   ├── historyTracker.ts  # Real-time history monitoring
│   │   └── storage.ts     # Chrome storage utilities
│   ├── popup/
│   │   ├── index.html     # Popup HTML
│   │   ├── index.tsx      # Popup React entry
│   │   └── App.tsx        # Main popup component
│   ├── mindmap/
│   │   ├── index.html     # Full-page mind map view
│   │   ├── index.tsx      # Mind map page entry
│   │   ├── MindMapView.tsx    # Markmap wrapper component
│   │   └── dataTransformer.ts # Convert history to markmap format
│   ├── utils/
│   │   ├── categorizer.ts # Topic/category detection logic
│   │   ├── domainParser.ts    # URL parsing utilities
│   │   └── types.ts       # TypeScript interfaces
│   └── styles/
│       └── globals.css    # Shared styles
└── dist/                  # Build output (gitignored)
```


### Technology Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Language | TypeScript | Type safety, better DX |
| UI Framework | React 18 | Component reuse, hooks |
| Mind Map | Markmap | Lightweight, D3-based, easy API |
| Bundler | Webpack 5 | Chrome extension support |
| Styling | Tailwind CSS | Utility-first, small bundle |
| Storage | chrome.storage.local | Persist data across sessions |

### Key Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "markmap-view": "^0.17.0",
    "markmap-lib": "^0.17.0"
  },
  "devDependencies": {
    "@types/chrome": "^0.0.260",
    "@types/react": "^18.2.0",
    "typescript": "^5.3.0",
    "webpack": "^5.90.0",
    "webpack-cli": "^5.1.0",
    "tailwindcss": "^3.4.0"
  }
}
```

## Implementation Roadmap

### Phase 1: Foundation (MVP)
1. Set up project with Webpack + TypeScript + React
2. Create manifest.json with required permissions
3. Build basic popup UI with "Generate Mind Map" button
4. Implement history fetching using `chrome.history.search()`
5. Transform history data into Markmap-compatible format
6. Render basic mind map grouped by domain

### Phase 2: Categorization
1. Implement URL-based category detection (patterns for social, news, shopping, dev, etc.)
2. Add title-based keyword extraction for topic inference
3. Create dual-view toggle (by domain vs by category)
4. Add category color coding

### Phase 3: Real-time Updates
1. Implement background service worker
2. Listen to `chrome.webNavigation.onCompleted` events
3. Incrementally update stored data
4. Add badge counter for new pages since last view
5. Implement efficient diff-based mind map updates

### Phase 4: Polish
1. Add time-range filters (today, week, month, all)
2. Implement search/filter within mind map
3. Add export options (PNG, SVG, Markdown)
4. Create options page for customization
5. Performance optimization for large histories


## Data Structures

### HistoryEntry (stored)
```typescript
interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  domain: string;
  visitTime: number;
  visitCount: number;
  category: Category;
}

type Category = 
  | 'social'      // Facebook, Twitter, Reddit, etc.
  | 'news'        // CNN, BBC, news sites
  | 'shopping'    // Amazon, eBay, etc.
  | 'development' // GitHub, StackOverflow, docs
  | 'entertainment' // YouTube, Netflix, Spotify
  | 'productivity'  // Google Docs, Notion, etc.
  | 'reference'   // Wikipedia, documentation
  | 'email'       // Gmail, Outlook
  | 'other';
```

### MindMapNode (for Markmap)
```typescript
interface MindMapNode {
  content: string;      // Node label
  children?: MindMapNode[];
  payload?: {
    url?: string;
    visitCount?: number;
    lastVisit?: number;
  };
}
```


## Categorization Rules

Use domain patterns and title keywords to categorize:

```typescript
const CATEGORY_PATTERNS: Record<Category, RegExp[]> = {
  social: [
    /facebook\.com/, /twitter\.com/, /x\.com/, /reddit\.com/,
    /instagram\.com/, /linkedin\.com/, /tiktok\.com/
  ],
  news: [
    /cnn\.com/, /bbc\.com/, /nytimes\.com/, /reuters\.com/,
    /news\.google\.com/, /apnews\.com/
  ],
  shopping: [
    /amazon\./, /ebay\.com/, /walmart\.com/, /target\.com/,
    /etsy\.com/, /shopify\.com/
  ],
  development: [
    /github\.com/, /gitlab\.com/, /stackoverflow\.com/,
    /dev\.to/, /medium\.com/, /npmjs\.com/, /docs\./
  ],
  entertainment: [
    /youtube\.com/, /netflix\.com/, /spotify\.com/,
    /twitch\.tv/, /hulu\.com/, /disneyplus\.com/
  ],
  productivity: [
    /docs\.google\.com/, /notion\.so/, /trello\.com/,
    /asana\.com/, /slack\.com/, /figma\.com/
  ],
  reference: [
    /wikipedia\.org/, /wikimedia\.org/, /britannica\.com/
  ],
  email: [
    /mail\.google\.com/, /outlook\.live\.com/, /mail\.yahoo\.com/
  ]
};
```


## Chrome Extension APIs Reference

### Required Permissions (manifest.json)
```json
{
  "permissions": [
    "history",      // Access browsing history
    "storage",      // Persist data
    "tabs",         // Get current tab info
    "webNavigation" // Real-time navigation events
  ]
}
```

### Key API Usage

```typescript
// Fetch history
chrome.history.search({
  text: '',           // Empty = all history
  startTime: 0,       // Unix timestamp
  maxResults: 10000   // Adjust as needed
}, (results) => { /* process */ });

// Real-time tracking
chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId === 0) { // Main frame only
    // Process new page visit
  }
});

// Storage
chrome.storage.local.set({ historyData: data });
chrome.storage.local.get(['historyData'], (result) => { /* use */ });
```

## Development Commands

```bash
# Install dependencies
npm install

# Development build with watch
npm run dev

# Production build
npm run build

# Load extension in Brave
# 1. Go to brave://extensions
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the dist/ folder
```


## Testing Checklist

- [ ] Extension loads without errors
- [ ] Popup opens and displays UI
- [ ] History is fetched correctly
- [ ] Mind map renders with domains as nodes
- [ ] Nodes are clickable and open URLs
- [ ] Categories are assigned correctly
- [ ] Real-time updates work when browsing
- [ ] Data persists across browser restarts
- [ ] Performance is acceptable with 5000+ history items

## Common Gotchas

1. **Manifest V3**: Use service workers, not background pages
2. **CSP**: Markmap may need inline styles; adjust CSP in manifest
3. **Async in service workers**: Service workers can be terminated; use `chrome.storage` not in-memory state
4. **History API limits**: `maxResults` caps at 10000; use pagination for more

## Getting Started for Claude Code

When you start working on this project:

1. **First, run `npm install`** to set up dependencies
2. **Start with Phase 1** - get the basic popup and history fetching working
3. **Test frequently** by loading the extension in Brave
4. **Commit after each working milestone**

### Priority Order for Implementation
1. `manifest.json` - Define extension structure
2. `webpack.config.js` - Build setup
3. `src/popup/` - Basic popup UI
4. `src/utils/domainParser.ts` - URL parsing
5. `src/mindmap/dataTransformer.ts` - History → Markmap
6. `src/mindmap/MindMapView.tsx` - Render mind map
7. `src/background/` - Real-time tracking
8. `src/utils/categorizer.ts` - Topic detection

Good luck! This is a well-scoped project that should result in a genuinely useful browser extension.

---

## Agent attribution — MANDATORY (applies repo-wide)

**NO AGENT ATTRIBUTION IN ANY COMMIT, PR, OR SUMMARY, EVER.** Do not include
"Co-Authored-By: Claude", "Generated with Claude Code", "🤖 Generated with…",
"Made with Opus/Sonnet/Haiku", "Anthropic", "AI-assisted", or any equivalent
attribution trailer, footer, sign-off, or inline mention in:

- commit messages (subject, body, or trailers),
- PR titles, descriptions, or comments,
- changelog / HANDOFF / status / session-report entries,
- tag messages, release notes, or any other artifact under version control.

Write commits and summaries as if a human authored them. If a tool, template,
or default behavior tries to append attribution, strip it before committing.
No exceptions.
