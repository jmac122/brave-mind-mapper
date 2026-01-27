import React from 'react';

export interface TooltipData {
  x: number;
  y: number;
  title: string;
  url?: string;
  visitCount?: number;
  lastVisit?: number;
  pageCount?: number;
  category?: string;
}

interface TooltipProps {
  data: TooltipData | null;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

const categoryColors: Record<string, string> = {
  social: '#3b82f6',
  news: '#ef4444',
  shopping: '#f59e0b',
  development: '#10b981',
  entertainment: '#8b5cf6',
  productivity: '#06b6d4',
  reference: '#6366f1',
  email: '#ec4899',
  other: '#6b7280',
};

const Tooltip: React.FC<TooltipProps> = ({ data }) => {
  if (!data) return null;

  const categoryColor = data.category ? categoryColors[data.category] || categoryColors.other : null;

  return (
    <div
      style={{
        position: 'fixed',
        left: Math.min(data.x + 15, window.innerWidth - 340),
        top: Math.min(data.y - 10, window.innerHeight - 120),
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '10px',
        fontSize: '12px',
        maxWidth: '320px',
        pointerEvents: 'none',
        zIndex: 1000,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Category badge */}
      {data.category && (
        <div
          style={{
            display: 'inline-block',
            backgroundColor: categoryColor || '#6b7280',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          {data.category}
        </div>
      )}

      {/* Title */}
      <div
        style={{
          fontWeight: 600,
          fontSize: '13px',
          marginBottom: data.url || data.visitCount ? '8px' : 0,
          wordBreak: 'break-word',
          lineHeight: 1.4,
        }}
      >
        {data.title}
      </div>

      {/* URL */}
      {data.url && (
        <div
          style={{
            color: '#93c5fd',
            fontSize: '11px',
            marginBottom: '8px',
            wordBreak: 'break-all',
            maxHeight: '36px',
            overflow: 'hidden',
            opacity: 0.9,
          }}
        >
          {data.url}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', gap: '16px', color: '#d1d5db', fontSize: '11px' }}>
        {data.visitCount !== undefined && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '14px' }}>📊</span>
            <strong style={{ color: '#fff' }}>{data.visitCount}</strong> visits
          </span>
        )}
        {data.pageCount !== undefined && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '14px' }}>📄</span>
            <strong style={{ color: '#fff' }}>{data.pageCount}</strong> pages
          </span>
        )}
        {data.lastVisit && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '14px' }}>🕐</span>
            {formatRelativeTime(data.lastVisit)}
          </span>
        )}
      </div>
    </div>
  );
};

export default Tooltip;
