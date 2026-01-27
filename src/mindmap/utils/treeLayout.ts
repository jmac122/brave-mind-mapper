import * as d3 from 'd3';
import { TreeNode, TreeConfig } from '../../utils/types';

export const DEFAULT_CONFIG: TreeConfig = {
  orientation: 'horizontal',
  nodeWidth: 220,
  nodeHeight: 30,
  duration: 400,
  maxLabelLength: 45,
  depthColors: ['#4F46E5', '#7C3AED', '#DB2777', '#EA580C', '#16A34A', '#0891B2'],
  showMinimap: true,
  highlightRecent: true,
  recentThresholdMs: 3600000, // 1 hour
};

export type D3HierarchyNode = d3.HierarchyPointNode<TreeNode>;

/**
 * Creates a D3 tree layout configured for the given orientation
 */
export function createTreeLayout(
  width: number,
  height: number,
  config: TreeConfig
): d3.TreeLayout<TreeNode> {
  const layout = d3.tree<TreeNode>();

  if (config.orientation === 'horizontal') {
    // Horizontal: more vertical space between siblings, generous horizontal spacing
    layout.size([height - 60, width - config.nodeWidth - 150]);
    // Dynamic separation based on sibling count to prevent overlap
    layout.separation((a, b) => {
      const siblingCount = a.parent?.children?.length || 1;
      // More siblings = more vertical space needed per node
      let baseSep: number;
      if (siblingCount > 50) {
        baseSep = 2.5;
      } else if (siblingCount > 20) {
        baseSep = 2.0;
      } else {
        baseSep = 1.5;
      }
      return a.parent === b.parent ? baseSep : 2.5;
    });
  } else {
    // Vertical: MUCH more horizontal space to prevent label overlap
    // Use nodeSize instead of size for better control
    layout.nodeSize([180, 80]); // [horizontal spacing, vertical spacing]
    layout.separation((a, b) => (a.parent === b.parent ? 1.2 : 1.5));
  }

  return layout;
}

/**
 * Calculates node position based on orientation
 */
export function getNodePosition(
  node: D3HierarchyNode,
  config: TreeConfig
): { x: number; y: number } {
  if (config.orientation === 'horizontal') {
    return {
      x: node.y + 50,
      y: node.x + 30,
    };
  } else {
    return {
      x: node.x + 50,
      y: node.y + 50,
    };
  }
}

/**
 * Generates SVG path for links based on orientation
 */
export function getLinkPath(
  source: { x: number; y: number },
  target: { x: number; y: number },
  config: TreeConfig
): string {
  if (config.orientation === 'horizontal') {
    const midX = (source.x + target.x) / 2;
    return `M${source.x},${source.y}C${midX},${source.y} ${midX},${target.y} ${target.x},${target.y}`;
  } else {
    const midY = (source.y + target.y) / 2;
    return `M${source.x},${source.y}C${source.x},${midY} ${target.x},${midY} ${target.x},${target.y}`;
  }
}

/**
 * Gets color for a node based on its depth
 */
export function getNodeColor(depth: number, config: TreeConfig): string {
  return config.depthColors[depth % config.depthColors.length];
}

/**
 * Truncates text to specified length
 */
export function truncateLabel(text: string, maxLength: number): string {
  return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
}
