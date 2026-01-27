import React, { useState, useCallback, useEffect } from 'react';
import { TreeNode, TreeConfig, TreeOrientation } from '../../utils/types';
import { useD3Tree } from '../hooks/useD3Tree';
import { DEFAULT_CONFIG } from '../utils/treeLayout';

interface D3TreeViewProps {
  data: TreeNode | null;
  orientation: TreeOrientation;
  onUrlClick?: (url: string) => void;
}

const D3TreeView: React.FC<D3TreeViewProps> = ({ data, orientation, onUrlClick }) => {
  const [treeData, setTreeData] = useState<TreeNode | null>(data);
  const [updateKey, setUpdateKey] = useState(0);

  const config: TreeConfig = {
    ...DEFAULT_CONFIG,
    orientation,
  };

  // Toggle node collapse/expand
  const handleNodeClick = useCallback((nodeData: TreeNode) => {
    if (nodeData.children) {
      nodeData._children = nodeData.children;
      nodeData.children = undefined;
    } else if (nodeData._children) {
      nodeData.children = nodeData._children;
      nodeData._children = undefined;
    }
    setUpdateKey(k => k + 1);
  }, []);

  // Handle URL clicks
  const handleLinkClick = useCallback(
    (url: string) => {
      if (onUrlClick) {
        onUrlClick(url);
      } else {
        chrome.tabs.create({ url });
      }
    },
    [onUrlClick]
  );

  const { svgRef, gRef, zoomIn, zoomOut, resetZoom, fitToView } = useD3Tree({
    data: treeData,
    config: { ...config, duration: updateKey > 0 ? config.duration : 0 },
    onNodeClick: handleNodeClick,
    onLinkClick: handleLinkClick,
  });

  // Sync external data changes
  useEffect(() => {
    setTreeData(data);
    setUpdateKey(0);
  }, [data]);

  // Re-render when orientation changes
  useEffect(() => {
    setUpdateKey(k => k + 1);
  }, [orientation]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Zoom controls */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          backgroundColor: 'white',
          borderRadius: 6,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          padding: 4,
        }}
      >
        <button onClick={zoomIn} title="Zoom In" style={buttonStyle}>
          +
        </button>
        <button onClick={zoomOut} title="Zoom Out" style={buttonStyle}>
          -
        </button>
        <button onClick={resetZoom} title="Reset Zoom" style={buttonStyle}>
          R
        </button>
        <button onClick={fitToView} title="Fit to View" style={buttonStyle}>
          F
        </button>
      </div>

      {/* SVG canvas */}
      <svg
        ref={svgRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          backgroundColor: '#fafafa',
        }}
      >
        <g ref={gRef} />
      </svg>
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  border: '1px solid #e5e7eb',
  borderRadius: 4,
  backgroundColor: 'white',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export default D3TreeView;
