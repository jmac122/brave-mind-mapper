import React from 'react';

export type VisitCountRange = 'all' | '1' | '2-5' | '6-10' | '10+';

interface VisitCountFilterProps {
  value: VisitCountRange;
  onChange: (range: VisitCountRange) => void;
  disabled?: boolean;
}

const VISIT_RANGES: { value: VisitCountRange; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: '1', label: '1 visit' },
  { value: '2-5', label: '2-5' },
  { value: '6-10', label: '6-10' },
  { value: '10+', label: '10+' },
];

const VisitCountFilter: React.FC<VisitCountFilterProps> = ({ value, onChange, disabled }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      <span style={{ fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap' }}>
        Visits:
      </span>
      <div
        style={{
          display: 'flex',
          borderRadius: '6px',
          overflow: 'hidden',
          border: '1px solid #e5e7eb',
        }}
      >
        {VISIT_RANGES.map(({ value: rangeValue, label }, index) => (
          <button
            key={rangeValue}
            onClick={() => onChange(rangeValue)}
            disabled={disabled}
            style={{
              padding: '4px 8px',
              backgroundColor: value === rangeValue ? '#059669' : 'white',
              color: value === rangeValue ? 'white' : '#374151',
              border: 'none',
              borderRight: index < VISIT_RANGES.length - 1 ? '1px solid #e5e7eb' : 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              fontSize: '11px',
              fontWeight: value === rangeValue ? 500 : 400,
              transition: 'background-color 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default VisitCountFilter;

/**
 * Helper to check if a visit count falls within a range
 */
export function isInVisitRange(visitCount: number, range: VisitCountRange): boolean {
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
