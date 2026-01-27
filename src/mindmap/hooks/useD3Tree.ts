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

interface UseD3TreeOptions {
  data: TreeNode | null;
  config: TreeConfig;
  onNodeClick?: (node: TreeNode) => void;
  onLinkClick?: (url: string) => void;
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
  const { data, config, onNodeClick, onLinkClick } = options;

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
        .attr('stroke', '#94a3b8')
        .attr('stroke-width', 1.5)
        .attr('d', () => {
          const o = { x: sourcePos.x, y: sourcePos.y };
          return getLinkPath(o, o, config);
        });

      // Update
      linkSelection
        .merge(linkEnter)
        .transition()
        .duration(config.duration)
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
        .attr('d', () => {
          const o = { x: sourcePos.x, y: sourcePos.y };
          return getLinkPath(o, o, config);
        })
        .remove();

      // ========== NODES ==========
      const nodeSelection = g
        .selectAll<SVGGElement, D3HierarchyNode>('g.node')
        .data(nodes, d => d.data.id);

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
        });

      // Circle
      nodeEnter
        .append('circle')
        .attr('r', 6)
        .attr('fill', d => getNodeColor(d.depth, config))
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

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

      // Label
      nodeEnter
        .append('text')
        .attr('class', 'label')
        .attr('dy', '0.35em')
        .attr('font-size', '11px')
        .attr('fill', '#1f2937');

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

      // Update circle
      nodeUpdate
        .select('circle')
        .attr('r', d => (d.data._children || d.data.children ? 8 : 5))
        .attr('fill', d => getNodeColor(d.depth, config));

      // Update collapse indicator
      nodeUpdate.select('.collapse-indicator').text(d => {
        if (d.data._children) return '+';
        if (d.data.children && d.data.children.length > 0) return '-';
        return '';
      });

      // Update label position
      nodeUpdate
        .select('.label')
        .attr('x', d => {
          if (config.orientation === 'horizontal') {
            return d.data.children || d.data._children ? -12 : 12;
          }
          return 0;
        })
        .attr('y', d => {
          if (config.orientation === 'vertical') {
            return d.data.children || d.data._children ? -18 : 18;
          }
          return 0;
        })
        .attr('text-anchor', d => {
          if (config.orientation === 'horizontal') {
            return d.data.children || d.data._children ? 'end' : 'start';
          }
          return 'middle';
        })
        .text(d => truncateLabel(d.data.name, config.maxLabelLength))
        .style('text-decoration', d => (d.data.data?.isLeaf ? 'underline' : 'none'))
        .style('fill', d => (d.data.data?.isLeaf ? '#4F46E5' : '#1f2937'));

      // Exit
      nodeSelection
        .exit()
        .transition()
        .duration(config.duration)
        .attr('transform', `translate(${sourcePos.x},${sourcePos.y})`)
        .attr('opacity', 0)
        .remove();
    },
    [config, onNodeClick, onLinkClick]
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
