import { useRef, useEffect, useCallback } from 'react';
import * as d3 from 'd3';
import { TreeNode, TreeConfig } from '../../utils/types';
import {
  D3HierarchyNode,
  createTreeLayout,
  getNodePosition,
  getLinkPath,
  getNodeColor,
  truncateLabel,
} from '../utils/treeLayout';

interface TooltipData {
  x: number;
  y: number;
  title: string;
  url?: string;
  visitCount?: number;
  lastVisit?: number;
  pageCount?: number;
  category?: string;
}

interface UseD3TreeOptions {
  data: TreeNode | null;
  config: TreeConfig;
  onNodeClick?: (node: TreeNode) => void;
  onLinkClick?: (url: string) => void;
  onTooltipShow?: (data: TooltipData) => void;
  onTooltipHide?: () => void;
  highlightNodeId?: string | null;
}

interface UseD3TreeReturn {
  svgRef: React.RefObject<SVGSVGElement>;
  gRef: React.RefObject<SVGGElement>;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  fitToView: () => void;
}

export function useD3Tree(options: UseD3TreeOptions): UseD3TreeReturn {
  const { data, config, onNodeClick, onLinkClick, onTooltipShow, onTooltipHide, highlightNodeId } = options;

  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Initialize zoom behavior
  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', event => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    return () => {
      svg.on('.zoom', null);
    };
  }, []);

  // Main rendering function
  const renderTree = useCallback(
    (root: D3HierarchyNode, sourceNode?: D3HierarchyNode) => {
      if (!gRef.current || !svgRef.current) return;

      const svg = svgRef.current;
      const g = d3.select(gRef.current);
      const { width, height } = svg.getBoundingClientRect();

      // Create layout
      const treeLayout = createTreeLayout(width, height, config);
      treeLayout(root);

      // Get all visible nodes and links
      const nodes = root.descendants();
      const links = root.links();

      // Source position for animations
      const sourcePos = sourceNode
        ? getNodePosition(sourceNode, config)
        : getNodePosition(root, config);

      // ========== GRADIENT DEFINITIONS ==========
      let defs = g.select<SVGDefsElement>('defs');
      if (defs.empty()) {
        defs = g.append('defs');
      }

      // Create gradient for links
      const gradientId = 'linkGradient';
      let gradient = defs.select<SVGLinearGradientElement>(`#${gradientId}`);
      if (gradient.empty()) {
        gradient = defs.append('linearGradient')
          .attr('id', gradientId)
          .attr('gradientUnits', 'userSpaceOnUse');
        gradient.append('stop').attr('offset', '0%').attr('stop-color', '#4F46E5').attr('stop-opacity', 0.6);
        gradient.append('stop').attr('offset', '100%').attr('stop-color', '#7C3AED').attr('stop-opacity', 0.3);
      }

      // ========== LINKS ==========
      const linkSelection = g
        .selectAll<SVGPathElement, d3.HierarchyLink<TreeNode>>('path.link')
        .data(links, d => d.target.data.id);

      // Enter
      const linkEnter = linkSelection
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('fill', 'none')
        .attr('stroke', `url(#${gradientId})`)
        .attr('stroke-width', 2)
        .attr('stroke-linecap', 'round')
        .attr('opacity', 0)
        .attr('d', () => {
          const o = { x: sourcePos.x, y: sourcePos.y };
          return getLinkPath(o, o, config);
        });

      // Update
      linkSelection
        .merge(linkEnter)
        .transition()
        .duration(config.duration)
        .attr('opacity', 0.8)
        .attr('d', d => {
          const source = getNodePosition(d.source as D3HierarchyNode, config);
          const target = getNodePosition(d.target as D3HierarchyNode, config);
          return getLinkPath(source, target, config);
        });

      // Exit
      linkSelection
        .exit()
        .transition()
        .duration(config.duration)
        .attr('opacity', 0)
        .attr('d', () => {
          const o = { x: sourcePos.x, y: sourcePos.y };
          return getLinkPath(o, o, config);
        })
        .remove();

      // ========== NODES ==========
      const nodeSelection = g
        .selectAll<SVGGElement, D3HierarchyNode>('g.node')
        .data(nodes, d => d.data.id);

      // Helper to calculate node size based on visit count
      // Smaller sizes overall to prevent overlap
      const getNodeSize = (d: D3HierarchyNode): number => {
        const visitCount = d.data.data?.visitCount || 1;
        const hasChildren = d.data.children || d.data._children;
        const baseSize = hasChildren ? 7 : 4;
        const visitBonus = Math.min(Math.log10(visitCount + 1) * 1.5, 4);
        return baseSize + visitBonus;
      };

      // Check if a node was recently visited
      const isRecentNode = (d: D3HierarchyNode): boolean => {
        if (!config.highlightRecent) return false;
        const lastVisit = d.data.data?.lastVisit;
        if (!lastVisit) return false;
        return Date.now() - lastVisit < config.recentThresholdMs;
      };

      // Enter
      const nodeEnter = nodeSelection
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', `translate(${sourcePos.x},${sourcePos.y})`)
        .attr('opacity', 0)
        .style('cursor', 'pointer')
        .on('click', (event, d) => {
          event.stopPropagation();
          if (d.data.data?.url && d.data.data?.isLeaf) {
            onLinkClick?.(d.data.data.url);
          } else {
            onNodeClick?.(d.data);
          }
        })
        .on('mouseenter', (event, d) => {
          if (onTooltipShow) {
            const childCount = (d.data.children?.length || 0) + (d.data._children?.length || 0);
            onTooltipShow({
              x: event.clientX,
              y: event.clientY,
              title: d.data.name,
              url: d.data.data?.url,
              visitCount: d.data.data?.visitCount,
              lastVisit: d.data.data?.lastVisit,
              pageCount: childCount > 0 ? childCount : undefined,
              category: d.data.data?.category,
            });
          }
        })
        .on('mousemove', (event, d) => {
          if (onTooltipShow) {
            const childCount = (d.data.children?.length || 0) + (d.data._children?.length || 0);
            onTooltipShow({
              x: event.clientX,
              y: event.clientY,
              title: d.data.name,
              url: d.data.data?.url,
              visitCount: d.data.data?.visitCount,
              lastVisit: d.data.data?.lastVisit,
              pageCount: childCount > 0 ? childCount : undefined,
              category: d.data.data?.category,
            });
          }
        })
        .on('mouseleave', () => {
          onTooltipHide?.();
        });

      // Circle with shadow for depth
      nodeEnter
        .append('circle')
        .attr('class', 'node-shadow')
        .attr('r', d => getNodeSize(d) + 2)
        .attr('fill', 'rgba(0, 0, 0, 0.1)')
        .attr('cx', 1)
        .attr('cy', 1);

      nodeEnter
        .append('circle')
        .attr('class', 'node-circle')
        .attr('r', d => getNodeSize(d))
        .attr('fill', d => getNodeColor(d.depth, config))
        .attr('stroke', d => isRecentNode(d) ? '#fbbf24' : '#fff')
        .attr('stroke-width', d => isRecentNode(d) ? 3 : 2)
        .style('filter', d => isRecentNode(d) ? 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.6))' : 'none')
        .style('transition', 'all 0.2s');

      // Collapse indicator
      nodeEnter
        .append('text')
        .attr('class', 'collapse-indicator')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .attr('fill', '#fff')
        .attr('pointer-events', 'none');

      // Label with better styling
      nodeEnter
        .append('text')
        .attr('class', 'label')
        .attr('dy', '0.35em')
        .attr('font-size', '11px')
        .attr('fill', '#1f2937')
        .style('font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif');

      // Update
      const nodeUpdate = nodeSelection.merge(nodeEnter);

      nodeUpdate
        .transition()
        .duration(config.duration)
        .attr('transform', d => {
          const pos = getNodePosition(d, config);
          return `translate(${pos.x},${pos.y})`;
        })
        .attr('opacity', 1);

      // Update circle shadow
      nodeUpdate
        .select('.node-shadow')
        .attr('r', d => getNodeSize(d) + 2);

      // Update main circle
      nodeUpdate
        .select('.node-circle')
        .attr('r', d => getNodeSize(d))
        .attr('fill', d => {
          if (highlightNodeId && d.data.id === highlightNodeId) {
            return '#fbbf24';
          }
          return getNodeColor(d.depth, config);
        })
        .attr('stroke', d => {
          if (highlightNodeId && d.data.id === highlightNodeId) {
            return '#f59e0b';
          }
          return isRecentNode(d) ? '#fbbf24' : '#fff';
        })
        .attr('stroke-width', d => {
          if (highlightNodeId && d.data.id === highlightNodeId) {
            return 4;
          }
          return isRecentNode(d) ? 3 : 2;
        });

      // Update collapse indicator
      nodeUpdate.select('.collapse-indicator').text(d => {
        if (d.data._children) return '+';
        if (d.data.children && d.data.children.length > 0) return '-';
        return '';
      });

      // Update label position - increased buffer to prevent overlap
      nodeUpdate
        .select('.label')
        .attr('x', d => {
          if (config.orientation === 'horizontal') {
            // More buffer between circle and label
            const nodeSize = getNodeSize(d);
            return d.data.children || d.data._children ? -(nodeSize + 8) : (nodeSize + 8);
          }
          return 0;
        })
        .attr('y', d => {
          if (config.orientation === 'vertical') {
            // More vertical space for labels
            const nodeSize = getNodeSize(d);
            return d.data.children || d.data._children ? -(nodeSize + 8) : (nodeSize + 10);
          }
          return 0;
        })
        .attr('text-anchor', d => {
          if (config.orientation === 'horizontal') {
            return d.data.children || d.data._children ? 'end' : 'start';
          }
          return 'middle';
        })
        .text(d => {
          // Shorter labels in vertical mode to prevent horizontal overlap
          const maxLen = config.orientation === 'vertical' ? 25 : config.maxLabelLength;
          return truncateLabel(d.data.name, maxLen);
        })
        .style('text-decoration', d => (d.data.data?.isLeaf ? 'underline' : 'none'))
        .style('fill', d => (d.data.data?.isLeaf ? '#4F46E5' : '#1f2937'))
        .style('font-size', config.orientation === 'vertical' ? '10px' : '11px');

      // Exit
      nodeSelection
        .exit()
        .transition()
        .duration(config.duration)
        .attr('transform', `translate(${sourcePos.x},${sourcePos.y})`)
        .attr('opacity', 0)
        .remove();
    },
    [config, onNodeClick, onLinkClick, onTooltipShow, onTooltipHide, highlightNodeId]
  );

  // Handle data/config changes
  useEffect(() => {
    if (!data) return;

    const root = d3.hierarchy(data) as D3HierarchyNode;
    renderTree(root);
  }, [data, config, renderTree]);

  // Zoom controls
  const zoomIn = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 1.3);
  }, []);

  const zoomOut = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 0.7);
  }, []);

  const resetZoom = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  }, []);

  const fitToView = useCallback(() => {
    if (!svgRef.current || !gRef.current || !zoomBehaviorRef.current) return;

    const svg = svgRef.current;
    const g = gRef.current;
    const bounds = g.getBBox();
    const { width, height } = svg.getBoundingClientRect();

    const scale = Math.min(width / (bounds.width + 100), height / (bounds.height + 100), 1);
    const translateX = (width - bounds.width * scale) / 2 - bounds.x * scale;
    const translateY = (height - bounds.height * scale) / 2 - bounds.y * scale;

    d3.select(svg)
      .transition()
      .duration(500)
      .call(
        zoomBehaviorRef.current.transform,
        d3.zoomIdentity.translate(translateX, translateY).scale(scale)
      );
  }, []);

  return {
    svgRef,
    gRef,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToView,
  };
}
