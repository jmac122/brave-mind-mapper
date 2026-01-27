import React, { useState, useRef, useEffect } from 'react';

interface ExportMenuProps {
  svgElement: SVGSVGElement | null;
  gElement: SVGGElement | null;
  filename?: string;
}

const ExportMenu: React.FC<ExportMenuProps> = ({ svgElement, gElement, filename = 'mindmap' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const exportAsSVG = () => {
    if (!svgElement || !gElement) return;
    setExporting('svg');

    try {
      // Clone the SVG
      const clone = svgElement.cloneNode(true) as SVGSVGElement;
      const bounds = gElement.getBBox();

      // Set proper viewBox
      clone.setAttribute('viewBox', `${bounds.x - 20} ${bounds.y - 20} ${bounds.width + 40} ${bounds.height + 40}`);
      clone.setAttribute('width', String(bounds.width + 40));
      clone.setAttribute('height', String(bounds.height + 40));

      // Remove transform from g element for clean export
      const gClone = clone.querySelector('g');
      if (gClone) gClone.removeAttribute('transform');

      const svgData = new XMLSerializer().serializeToString(clone);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      downloadBlob(blob, `${filename}.svg`);
    } finally {
      setExporting(null);
      setIsOpen(false);
    }
  };

  const exportAsPNG = async () => {
    if (!svgElement || !gElement) return;
    setExporting('png');

    try {
      const bounds = gElement.getBBox();
      const scale = 2; // Higher resolution

      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = (bounds.width + 40) * scale;
      canvas.height = (bounds.height + 40) * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fill white background
      ctx.fillStyle = '#fafafa';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Clone and prepare SVG
      const clone = svgElement.cloneNode(true) as SVGSVGElement;
      clone.setAttribute('viewBox', `${bounds.x - 20} ${bounds.y - 20} ${bounds.width + 40} ${bounds.height + 40}`);
      clone.setAttribute('width', String((bounds.width + 40) * scale));
      clone.setAttribute('height', String((bounds.height + 40) * scale));

      const gClone = clone.querySelector('g');
      if (gClone) gClone.removeAttribute('transform');

      const svgData = new XMLSerializer().serializeToString(clone);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        canvas.toBlob(blob => {
          if (blob) downloadBlob(blob, `${filename}.png`);
          setExporting(null);
          setIsOpen(false);
        }, 'image/png');
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        setExporting(null);
        setIsOpen(false);
      };
      img.src = url;
    } catch {
      setExporting(null);
      setIsOpen(false);
    }
  };

  const exportAsJSON = () => {
    if (!gElement) return;
    setExporting('json');

    try {
      // Extract node data from the tree
      const nodes: Array<{ name: string; depth: number; hasChildren: boolean }> = [];
      gElement.querySelectorAll('g.node').forEach(node => {
        const label = node.querySelector('.label');
        if (label) {
          nodes.push({
            name: label.textContent || '',
            depth: 0, // Could parse from position if needed
            hasChildren: node.querySelector('.collapse-indicator')?.textContent !== '',
          });
        }
      });

      const data = {
        exportDate: new Date().toISOString(),
        nodeCount: nodes.length,
        nodes,
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      downloadBlob(blob, `${filename}.json`);
    } finally {
      setExporting(null);
      setIsOpen(false);
    }
  };

  const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={!svgElement}
        style={{
          padding: '6px 12px',
          backgroundColor: svgElement ? '#10b981' : '#9ca3af',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: svgElement ? 'pointer' : 'not-allowed',
          fontSize: '13px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        📥 Export
        <span style={{ fontSize: '10px' }}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            minWidth: '160px',
            zIndex: 50,
          }}
        >
          <button onClick={exportAsSVG} disabled={!!exporting} style={menuItemStyle}>
            {exporting === 'svg' ? '⏳' : '🎨'} Export as SVG
          </button>
          <button onClick={exportAsPNG} disabled={!!exporting} style={menuItemStyle}>
            {exporting === 'png' ? '⏳' : '🖼️'} Export as PNG
          </button>
          <button onClick={exportAsJSON} disabled={!!exporting} style={menuItemStyle}>
            {exporting === 'json' ? '⏳' : '📄'} Export as JSON
          </button>
        </div>
      )}
    </div>
  );
};

const menuItemStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: 'none',
  background: 'none',
  textAlign: 'left',
  cursor: 'pointer',
  fontSize: '13px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'background-color 0.15s',
};

export default ExportMenu;
