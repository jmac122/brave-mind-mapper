import React, { useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { TreeNode, TreeConfig, TreeOrientation } from '../../utils/types';
import { useD3Tree } from '../hooks/useD3Tree';
import { DEFAULT_CONFIG } from '../utils/treeLayout';
import Tooltip, { TooltipData } from './Tooltip';
import Minimap from './Minimap';

interface D3TreeViewProps {
  data: TreeNode | null;
  orientation: TreeOrientation;
  onUrlClick?: (url: string) => void;
  showMinimap?: boolean;
  highlightNodeId?: string | null;
}

export interface D3TreeViewRef {
  svgElement: SVGSVGElement | null;
  gElement: SVGGElement | null;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  fitToView: () => void;
}

const D3TreeView = forwardRef<D3TreeViewRef, D3TreeViewProps>(
  ({ data, orientation, onUrlClick, showMinimap = true, highlightNodeId }, ref) => {
    const [treeData, setTreeData] = useState<TreeNode | null>(data);
    const [updateKey, setUpdateKey] = useState(0);
    const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);

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

    // Tooltip handlers
    const handleTooltipShow = useCallback((data: TooltipData) => {
      setTooltipData(data);
    }, []);

    const handleTooltipHide = useCallback(() => {
      setTooltipData(null);
    }, []);

    const { svgRef, gRef, zoomIn, zoomOut, resetZoom, fitToView } = useD3Tree({
      data: treeData,
      config: { ...config, duration: updateKey > 0 ? config.duration : 0 },
      onNodeClick: handleNodeClick,
      onLinkClick: handleLinkClick,
      onTooltipShow: handleTooltipShow,
      onTooltipHide: handleTooltipHide,
      highlightNodeId,
    });

    // Expose ref for external access
    useImperativeHandle(ref, () => ({
      svgElement: svgRef.current,
      gElement: gRef.current,
      zoomIn,
      zoomOut,
      resetZoom,
      fitToView,
    }));

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
            borderRadius: 8,
            boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
            padding: 6,
          }}
        >
          <button onClick={zoomIn} title="Zoom In (Ctrl++)" style={buttonStyle}>
            +
          </button>
          <button onClick={zoomOut} title="Zoom Out (Ctrl+-)" style={buttonStyle}>
            -
          </button>
          <div style={{ height: 1, backgroundColor: '#e5e7eb', margin: '2px 0' }} />
          <button onClick={resetZoom} title="Reset Zoom (Ctrl+0)" style={buttonStyle}>
            ↺
          </button>
          <button onClick={fitToView} title="Fit to View (Ctrl+1)" style={buttonStyle}>
            ⛶
          </button>
        </div>

        {/* Keyboard shortcuts info */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 60,
            zIndex: 10,
            fontSize: '10px',
            color: '#9ca3af',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '4px 8px',
            borderRadius: '4px',
          }}
        >
          Ctrl+F: Search | +/-: Zoom | Arrows: Navigate
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

        {/* Minimap */}
        {showMinimap && (
          <Minimap
            mainSvg={svgRef.current}
            mainG={gRef.current}
            width={160}
            height={100}
          />
        )}

        {/* Tooltip */}
        <Tooltip data={tooltipData} />
      </div>
    );
  }
);

const buttonStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  border: '1px solid #e5e7eb',
  borderRadius: 6,
  backgroundColor: 'white',
  cursor: 'pointer',
  fontSize: 16,
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s',
  color: '#374151',
};

D3TreeView.displayName = 'D3TreeView';

export default D3TreeView;
