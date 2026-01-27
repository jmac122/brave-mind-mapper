import React from 'react';
import { Category } from '../../utils/types';

export interface StatsData {
  totalPages: number;
  totalDomains: number;
  totalVisits: number;
  categoryCounts: Record<Category, number>;
  topDomains: Array<{ domain: string; count: number; visits: number }>;
  recentActivity: Array<{ title: string; url: string; time: number }>;
}

interface StatsPanelProps {
  stats: StatsData | null;
  isOpen: boolean;
  onClose: () => void;
  onDomainClick?: (domain: string) => void;
}

const categoryLabels: Record<Category, { label: string; color: string; icon: string }> = {
  social: { label: 'Social Media', color: '#3b82f6', icon: '💬' },
  news: { label: 'News', color: '#ef4444', icon: '📰' },
  shopping: { label: 'Shopping', color: '#f59e0b', icon: '🛒' },
  development: { label: 'Development', color: '#10b981', icon: '💻' },
  entertainment: { label: 'Entertainment', color: '#8b5cf6', icon: '🎬' },
  productivity: { label: 'Productivity', color: '#06b6d4', icon: '⚡' },
  reference: { label: 'Reference', color: '#6366f1', icon: '📚' },
  email: { label: 'Email', color: '#ec4899', icon: '✉️' },
  other: { label: 'Other', color: '#6b7280', icon: '🔗' },
};

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const StatsPanel: React.FC<StatsPanelProps> = ({ stats, isOpen, onClose, onDomainClick }) => {
  if (!stats) return null;

  const sortedCategories = Object.entries(stats.categoryCounts)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a) as [Category, number][];

  const maxCategoryCount = sortedCategories[0]?.[1] || 1;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          transition: 'opacity 0.2s, visibility 0.2s',
          zIndex: 99,
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '360px',
          height: '100%',
          backgroundColor: 'white',
          boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>📊 Statistics</h2>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '4px',
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {/* Summary cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              marginBottom: '24px',
            }}
          >
            <div style={cardStyle}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#4F46E5' }}>
                {stats.totalPages}
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>Pages</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#7C3AED' }}>
                {stats.totalDomains}
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>Domains</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#DB2777' }}>
                {stats.totalVisits}
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>Visits</div>
            </div>
          </div>

          {/* Categories */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#374151' }}>
              Categories
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sortedCategories.map(([category, count]) => {
                const info = categoryLabels[category];
                const percentage = (count / maxCategoryCount) * 100;
                return (
                  <div key={category}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '4px',
                      }}
                    >
                      <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{info.icon}</span>
                        {info.label}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: info.color }}>
                        {count}
                      </span>
                    </div>
                    <div
                      style={{
                        height: '6px',
                        backgroundColor: '#e5e7eb',
                        borderRadius: '3px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${percentage}%`,
                          backgroundColor: info.color,
                          borderRadius: '3px',
                          transition: 'width 0.3s',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Domains */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#374151' }}>
              Top Domains
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {stats.topDomains.slice(0, 8).map((item, index) => (
                <div
                  key={item.domain}
                  onClick={() => onDomainClick?.(item.domain)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    cursor: onDomainClick ? 'pointer' : 'default',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={e => {
                    if (onDomainClick) e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }}
                >
                  <span
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: '#4F46E5',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {index + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.domain}
                    </div>
                    <div style={{ fontSize: '10px', color: '#6b7280' }}>
                      {item.count} pages · {item.visits} visits
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#374151' }}>
              Recent Activity
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {stats.recentActivity.slice(0, 6).map((item, index) => (
                <div
                  key={index}
                  style={{
                    padding: '8px 10px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    borderLeft: '3px solid #4F46E5',
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginBottom: '2px',
                    }}
                  >
                    {item.title || item.url}
                  </div>
                  <div style={{ fontSize: '10px', color: '#6b7280' }}>{formatTime(item.time)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  borderRadius: '10px',
  padding: '14px',
  textAlign: 'center',
};

export default StatsPanel;
