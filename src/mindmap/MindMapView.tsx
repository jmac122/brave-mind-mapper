import React, { useEffect, useState, useCallback, useRef } from 'react';
import { HistoryEntry, TreeNode, TreeOrientation, ViewMode, StatsData } from '../utils/types';
import {
  transformToD3TreeByMode,
  createEmptyD3Tree,
  computeStats,
  filterTreeBySearch,
  countTreeNodes,
  filterEntriesByVisitCount,
  VisitCountRange,
  autoCollapseLargeTree,
  expandAllNodes,
  collapseAllNodes,
} from './dataTransformer';
import D3TreeView, { D3TreeViewRef } from './components/D3TreeView';
import SearchFilter from './components/SearchFilter';
import StatsPanel from './components/StatsPanel';
import ExportMenu from './components/ExportMenu';
import VisitCountFilter from './components/VisitCountFilter';

type TimeRange = 'today' | 'week' | 'month' | 'all';

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'all', label: 'All Time' },
];

function getStartTime(range: TimeRange): number {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  switch (range) {
    case 'today':
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today.getTime();
    case 'week':
      return now - 7 * day;
    case 'month':
      return now - 30 * day;
    case 'all':
    default:
      return 0;
  }
}

const MindMapView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [filteredData, setFilteredData] = useState<TreeNode | null>(null);
  const [rawEntries, setRawEntries] = useState<HistoryEntry[]>([]);
  const [entryCount, setEntryCount] = useState(0);
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [orientation, setOrientation] = useState<TreeOrientation>('horizontal');
  const [viewMode, setViewMode] = useState<ViewMode>('domain');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [filteredCount, setFilteredCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [visitCountRange, setVisitCountRange] = useState<VisitCountRange>('all');

  const treeViewRef = useRef<D3TreeViewRef>(null);

  const fetchHistoryData = useCallback(async (range: TimeRange): Promise<HistoryEntry[]> => {
    const startTime = getStartTime(range);

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { type: 'GET_HISTORY', options: { startTime, maxResults: 5000 } },
        response => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (response?.success && response.data) {
            resolve(response.data);
          } else {
            reject(new Error(response?.error || 'Failed to fetch history'));
          }
        }
      );
    });
  }, []);

  // Helper to rebuild tree from entries with current filters
  const rebuildTree = useCallback(
    (entries: HistoryEntry[], mode: ViewMode, visitRange: VisitCountRange) => {
      const filteredByVisits = filterEntriesByVisitCount(entries, visitRange);
      let data =
        filteredByVisits.length > 0
          ? transformToD3TreeByMode(filteredByVisits, mode)
          : createEmptyD3Tree();

      // Auto-collapse if too many domains (>25)
      data = autoCollapseLargeTree(data, 25);

      setTreeData(data);
      setFilteredData(data);
      setStats(computeStats(filteredByVisits));
      setTotalCount(countTreeNodes(data));
      setFilteredCount(countTreeNodes(data));
      setSearchQuery('');
      setEntryCount(filteredByVisits.length);
    },
    []
  );

  const loadData = useCallback(
    async (range: TimeRange, mode: ViewMode = viewMode, visitRange: VisitCountRange = visitCountRange) => {
      setLoading(true);
      setError(null);
      try {
        const historyEntries = await fetchHistoryData(range);
        setRawEntries(historyEntries);

        rebuildTree(historyEntries, mode, visitRange);
      } catch (err) {
        console.error('Failed to load mind map:', err);
        setError(err instanceof Error ? err.message : 'Failed to load mind map');
      }
      setLoading(false);
    },
    [fetchHistoryData, viewMode, visitCountRange, rebuildTree]
  );

  useEffect(() => {
    loadData(timeRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle search
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (!treeData) return;

      if (!query.trim()) {
        setFilteredData(treeData);
        setFilteredCount(totalCount);
        return;
      }

      const filtered = filterTreeBySearch(treeData, query);
      setFilteredData(filtered);
      setFilteredCount(countTreeNodes(filtered));
    },
    [treeData, totalCount]
  );

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    loadData(range);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    // Re-transform existing data with new mode and current visit filter
    if (rawEntries.length > 0) {
      rebuildTree(rawEntries, mode, visitCountRange);
    }
  };

  const handleVisitCountChange = (range: VisitCountRange) => {
    setVisitCountRange(range);
    // Rebuild tree with new visit count filter
    if (rawEntries.length > 0) {
      rebuildTree(rawEntries, viewMode, range);
    }
  };

  const handleOrientationToggle = () => {
    setOrientation(prev => (prev === 'horizontal' ? 'vertical' : 'horizontal'));
  };

  const handleExpandAll = () => {
    if (!treeData) return;
    const expanded = expandAllNodes(treeData);
    setTreeData(expanded);
    setFilteredData(expanded);
    setTotalCount(countTreeNodes(expanded));
    setFilteredCount(countTreeNodes(expanded));
  };

  const handleCollapseAll = () => {
    if (!treeData) return;
    const collapsed = collapseAllNodes(treeData);
    setTreeData(collapsed);
    setFilteredData(collapsed);
    setTotalCount(countTreeNodes(collapsed));
    setFilteredCount(countTreeNodes(collapsed));
  };

  const handleRefresh = () => {
    loadData(timeRange);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '=':
          case '+':
            e.preventDefault();
            treeViewRef.current?.zoomIn();
            break;
          case '-':
            e.preventDefault();
            treeViewRef.current?.zoomOut();
            break;
          case '0':
            e.preventDefault();
            treeViewRef.current?.resetZoom();
            break;
          case '1':
            e.preventDefault();
            treeViewRef.current?.fitToView();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f9fafb',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'white',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Left side: Title and search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              🧠 Mind Mapper
            </h1>
            {entryCount > 0 && (
              <p
                style={{
                  margin: '4px 0 0 0',
                  fontSize: '12px',
                  color: '#6b7280',
                }}
              >
                {entryCount} pages loaded
              </p>
            )}
          </div>

          {/* Search */}
          <SearchFilter
            onSearch={handleSearch}
            resultCount={searchQuery ? filteredCount : undefined}
            totalCount={searchQuery ? totalCount : undefined}
          />
        </div>

        {/* Right side: Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Time range buttons */}
          <div
            style={{
              display: 'flex',
              borderRadius: '6px',
              overflow: 'hidden',
              border: '1px solid #e5e7eb',
            }}
          >
            {TIME_RANGES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleTimeRangeChange(value)}
                disabled={loading}
                style={{
                  padding: '6px 12px',
                  backgroundColor: timeRange === value ? '#4F46E5' : 'white',
                  color: timeRange === value ? 'white' : '#374151',
                  border: 'none',
                  borderRight: value !== 'all' ? '1px solid #e5e7eb' : 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: timeRange === value ? 500 : 400,
                  transition: 'background-color 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* View mode toggle */}
          <div
            style={{
              display: 'flex',
              borderRadius: '6px',
              overflow: 'hidden',
              border: '1px solid #e5e7eb',
            }}
          >
            <button
              onClick={() => handleViewModeChange('domain')}
              disabled={loading}
              style={{
                padding: '6px 12px',
                backgroundColor: viewMode === 'domain' ? '#7C3AED' : 'white',
                color: viewMode === 'domain' ? 'white' : '#374151',
                border: 'none',
                borderRight: '1px solid #e5e7eb',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: viewMode === 'domain' ? 500 : 400,
              }}
            >
              🌐 Domain
            </button>
            <button
              onClick={() => handleViewModeChange('category')}
              disabled={loading}
              style={{
                padding: '6px 12px',
                backgroundColor: viewMode === 'category' ? '#7C3AED' : 'white',
                color: viewMode === 'category' ? 'white' : '#374151',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: viewMode === 'category' ? 500 : 400,
              }}
            >
              📂 Category
            </button>
          </div>

          {/* Visit count filter */}
          <VisitCountFilter
            value={visitCountRange}
            onChange={handleVisitCountChange}
            disabled={loading}
          />

          {/* Expand/Collapse All buttons */}
          <div
            style={{
              display: 'flex',
              borderRadius: '6px',
              overflow: 'hidden',
              border: '1px solid #e5e7eb',
            }}
          >
            <button
              onClick={handleExpandAll}
              disabled={loading}
              title="Expand all domains"
              style={{
                padding: '6px 10px',
                backgroundColor: 'white',
                color: '#374151',
                border: 'none',
                borderRight: '1px solid #e5e7eb',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '13px',
              }}
            >
              ⊞ Expand
            </button>
            <button
              onClick={handleCollapseAll}
              disabled={loading}
              title="Collapse all domains"
              style={{
                padding: '6px 10px',
                backgroundColor: 'white',
                color: '#374151',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '13px',
              }}
            >
              ⊟ Collapse
            </button>
          </div>

          {/* Orientation toggle */}
          <button
            onClick={handleOrientationToggle}
            disabled={loading}
            title={`Switch to ${orientation === 'horizontal' ? 'vertical' : 'horizontal'} layout`}
            style={{
              padding: '6px 12px',
              backgroundColor: '#6366F1',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            {orientation === 'horizontal' ? '↓ Vertical' : '→ Horizontal'}
          </button>

          {/* Minimap toggle */}
          <button
            onClick={() => setShowMinimap(!showMinimap)}
            title={showMinimap ? 'Hide Minimap' : 'Show Minimap'}
            style={{
              padding: '6px 12px',
              backgroundColor: showMinimap ? '#0891b2' : '#e5e7eb',
              color: showMinimap ? 'white' : '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            🗺️
          </button>

          {/* Stats button */}
          <button
            onClick={() => setShowStats(true)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            📊 Stats
          </button>

          {/* Export menu */}
          <ExportMenu
            svgElement={treeViewRef.current?.svgElement || null}
            gElement={treeViewRef.current?.gElement || null}
            filename={`browsing-history-${timeRange}`}
          />

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            style={{
              padding: '6px 12px',
              backgroundColor: loading ? '#9ca3af' : '#4F46E5',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            borderBottom: '1px solid #fecaca',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          ⚠️ Error: {error}
        </div>
      )}

      {/* Tree visualization */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {loading && !treeData && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              zIndex: 10,
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '32px',
                  marginBottom: '12px',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              >
                🧠
              </div>
              <div style={{ color: '#4F46E5', fontWeight: 500 }}>Loading browsing history...</div>
            </div>
          </div>
        )}

        {filteredData && (
          <D3TreeView
            ref={treeViewRef}
            data={filteredData}
            orientation={orientation}
            showMinimap={showMinimap}
          />
        )}

        {/* No results message */}
        {searchQuery && filteredCount === 0 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: '#6b7280',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
            <div style={{ fontSize: '16px', fontWeight: 500 }}>No results found</div>
            <div style={{ fontSize: '13px', marginTop: '4px' }}>
              Try a different search term
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '8px 16px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: 'white',
          fontSize: '12px',
          color: '#6b7280',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>
          Scroll to zoom • Drag to pan • Click nodes to expand/collapse • Click links to open pages
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#fbbf24',
              boxShadow: '0 0 4px rgba(251, 191, 36, 0.6)',
            }}
          />
          Recently visited (last hour)
        </span>
      </div>

      {/* Stats Panel */}
      <StatsPanel
        stats={stats}
        isOpen={showStats}
        onClose={() => setShowStats(false)}
      />

      {/* Inline styles for animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default MindMapView;
