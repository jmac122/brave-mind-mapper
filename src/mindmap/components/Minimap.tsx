import React, { useRef, useEffect, useCallback } from 'react';
import * as d3 from 'd3';

interface MinimapProps {
  mainSvg: SVGSVGElement | null;
  mainG: SVGGElement | null;
  width?: number;
  height?: number;
}

const Minimap: React.FC<MinimapProps> = ({ mainSvg, mainG, width = 150, height = 100 }) => {
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const updateMinimap = useCallback(() => {
    if (!mainSvg || !mainG || !minimapRef.current || !viewportRef.current) return;

    const canvas = minimapRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get the main SVG dimensions and content bounds
    const svgRect = mainSvg.getBoundingClientRect();
    const gBounds = mainG.getBBox();

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate scale to fit content in minimap
    const padding = 10;
    const contentWidth = gBounds.width + padding * 2;
    const contentHeight = gBounds.height + padding * 2;
    const scale = Math.min((width - 10) / contentWidth, (height - 10) / contentHeight, 1);

    // Draw nodes as dots
    const nodes = mainG.querySelectorAll('g.node');
    ctx.fillStyle = '#4F46E5';

    nodes.forEach(node => {
      const transform = node.getAttribute('transform');
      if (!transform) return;

      const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
      if (!match) return;

      const x = (parseFloat(match[1]) - gBounds.x + padding) * scale + 5;
      const y = (parseFloat(match[2]) - gBounds.y + padding) * scale + 5;

      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw links as lines
    const links = mainG.querySelectorAll('path.link');
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 0.5;

    links.forEach(link => {
      const d = link.getAttribute('d');
      if (!d) return;

      // Parse the path - simplified for bezier curves
      const match = d.match(/M([^,]+),([^C]+)/);
      if (!match) return;

      const x1 = (parseFloat(match[1]) - gBounds.x + padding) * scale + 5;
      const y1 = (parseFloat(match[2]) - gBounds.y + padding) * scale + 5;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      // Just draw a dot for simplicity
      ctx.lineTo(x1 + 1, y1 + 1);
      ctx.stroke();
    });

    // Update viewport indicator
    const currentTransform = d3.zoomTransform(mainSvg);
    const viewportDiv = viewportRef.current;

    const vpWidth = (svgRect.width / currentTransform.k) * scale;
    const vpHeight = (svgRect.height / currentTransform.k) * scale;
    const vpX = (-currentTransform.x / currentTransform.k - gBounds.x + padding) * scale + 5;
    const vpY = (-currentTransform.y / currentTransform.k - gBounds.y + padding) * scale + 5;

    viewportDiv.style.width = `${Math.min(vpWidth, width - 4)}px`;
    viewportDiv.style.height = `${Math.min(vpHeight, height - 4)}px`;
    viewportDiv.style.left = `${Math.max(0, Math.min(vpX, width - vpWidth - 4))}px`;
    viewportDiv.style.top = `${Math.max(0, Math.min(vpY, height - vpHeight - 4))}px`;
  }, [mainSvg, mainG, width, height]);

  useEffect(() => {
    if (!mainSvg) return;

    // Initial render
    updateMinimap();

    // Listen for zoom changes
    const svg = d3.select(mainSvg);
    svg.on('zoom.minimap', updateMinimap);

    // Also update on any changes to the G element
    const observer = new MutationObserver(updateMinimap);
    if (mainG) {
      observer.observe(mainG, { childList: true, subtree: true, attributes: true });
    }

    return () => {
      svg.on('zoom.minimap', null);
      observer.disconnect();
    };
  }, [mainSvg, mainG, updateMinimap]);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 10,
        left: 10,
        width,
        height,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '8px',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
      }}
    >
      <canvas ref={minimapRef} width={width} height={height} />
      <div
        ref={viewportRef}
        style={{
          position: 'absolute',
          border: '2px solid #4F46E5',
          borderRadius: '2px',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

export default Minimap;
