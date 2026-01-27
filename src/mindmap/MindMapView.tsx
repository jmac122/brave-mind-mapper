import React, { useEffect, useState, useCallback } from 'react';
import { HistoryEntry, TreeNode, TreeOrientation } from '../utils/types';
import { transformToD3Tree, createEmptyD3Tree } from './dataTransformer';
import D3TreeView from './components/D3TreeView';

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
  const [entryCount, setEntryCount] = useState(0);
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [orientation, setOrientation] = useState<TreeOrientation>('horizontal');

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

  const loadData = useCallback(
    async (range: TimeRange) => {
      setLoading(true);
      setError(null);
      try {
        const historyEntries = await fetchHistoryData(range);
        setEntryCount(historyEntries.length);

        const data =
          historyEntries.length > 0 ? transformToD3Tree(historyEntries) : createEmptyD3Tree();

        setTreeData(data);
      } catch (err) {
        console.error('Failed to load mind map:', err);
        setError(err instanceof Error ? err.message : 'Failed to load mind map');
      }
      setLoading(false);
    },
    [fetchHistoryData]
  );

  useEffect(() => {
    loadData(timeRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    loadData(range);
  };

  const handleOrientationToggle = () => {
    setOrientation(prev => (prev === 'horizontal' ? 'vertical' : 'horizontal'));
  };

  const handleRefresh = () => {
    loadData(timeRange);
  };

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
        <div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
            Browsing History Mind Map
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
            {loading ? 'Loading...' : 'Refresh'}
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
          }}
        >
          Error: {error}
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
                  fontSize: '24px',
                  marginBottom: '8px',
                  color: '#4F46E5',
                }}
              >
                Loading...
              </div>
              <div style={{ color: '#6b7280' }}>Fetching browsing history</div>
            </div>
          </div>
        )}

        {treeData && <D3TreeView data={treeData} orientation={orientation} />}
      </div>

      {/* Instructions footer */}
      <div
        style={{
          padding: '8px 16px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: 'white',
          fontSize: '12px',
          color: '#6b7280',
          textAlign: 'center',
        }}
      >
        Scroll to zoom | Drag to pan | Click nodes to expand/collapse | Click underlined links to
        open pages
      </div>
    </div>
  );
};

export default MindMapView;
