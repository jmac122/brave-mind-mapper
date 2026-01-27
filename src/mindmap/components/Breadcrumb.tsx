import React from 'react';

export interface BreadcrumbItem {
  id: string;
  name: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (id: string) => void;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, onNavigate }) => {
  if (items.length <= 1) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 16px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        fontSize: '12px',
        maxWidth: '80%',
        overflowX: 'auto',
        flexWrap: 'nowrap',
      }}
    >
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          {index > 0 && (
            <span style={{ color: '#9ca3af', flexShrink: 0 }}>›</span>
          )}
          <button
            onClick={() => onNavigate(item.id)}
            style={{
              border: 'none',
              background: 'none',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: index < items.length - 1 ? 'pointer' : 'default',
              color: index === items.length - 1 ? '#4F46E5' : '#6b7280',
              fontWeight: index === items.length - 1 ? 600 : 400,
              whiteSpace: 'nowrap',
              maxWidth: '150px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={e => {
              if (index < items.length - 1) {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {index === 0 ? '🏠' : item.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

export default Breadcrumb;
