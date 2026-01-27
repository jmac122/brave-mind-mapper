import React, { useState, useCallback, useEffect, useRef } from 'react';

interface SearchFilterProps {
  onSearch: (query: string) => void;
  resultCount?: number;
  totalCount?: number;
}

const SearchFilter: React.FC<SearchFilterProps> = ({ onSearch, resultCount, totalCount }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);

      // Debounce search
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        onSearch(value);
      }, 200);
    },
    [onSearch]
  );

  const handleClear = useCallback(() => {
    setQuery('');
    onSearch('');
    inputRef.current?.focus();
  }, [onSearch]);

  // Keyboard shortcut: Ctrl+F or Cmd+F to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape' && isFocused) {
        handleClear();
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused, handleClear]);

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Search icon */}
        <span
          style={{
            position: 'absolute',
            left: '10px',
            color: isFocused ? '#4F46E5' : '#9ca3af',
            fontSize: '14px',
            pointerEvents: 'none',
            transition: 'color 0.15s',
          }}
        >
          🔍
        </span>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search domains or pages... (Ctrl+F)"
          style={{
            width: '240px',
            padding: '8px 32px 8px 34px',
            fontSize: '13px',
            border: `2px solid ${isFocused ? '#4F46E5' : '#e5e7eb'}`,
            borderRadius: '8px',
            outline: 'none',
            backgroundColor: isFocused ? '#fff' : '#f9fafb',
            transition: 'all 0.15s',
          }}
        />

        {/* Clear button */}
        {query && (
          <button
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: '8px',
              width: '18px',
              height: '18px',
              border: 'none',
              borderRadius: '50%',
              backgroundColor: '#e5e7eb',
              color: '#6b7280',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Result count */}
      {query && resultCount !== undefined && totalCount !== undefined && (
        <span
          style={{
            fontSize: '12px',
            color: resultCount > 0 ? '#059669' : '#dc2626',
            fontWeight: 500,
          }}
        >
          {resultCount} / {totalCount}
        </span>
      )}
    </div>
  );
};

export default SearchFilter;
