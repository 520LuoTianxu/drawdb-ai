
import dagre from 'dagre';
import { Node, Edge, Position } from 'reactflow';
import { TableData } from '../types';

export const getLayoutedElements = (
  nodes: Node<TableData>[],
  edges: Edge[],
  direction = 'LR'
) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ 
    rankdir: direction,
    // Optimized settings for ER Diagrams
    ranksep: 150, // Increased vertical/rank separation to avoid clutter
    nodesep: 100, // Increased horizontal/node separation
    edgesep: 50   // Separation between edges to reduce overlap
  });

  nodes.forEach((node) => {
    // Height estimation: header (40) + columns * 36
    const height = 40 + (node.data.isExpanded !== false ? node.data.columns.length * 36 : 0);
    dagreGraph.setNode(node.id, { width: 240, height: height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    // Dagre gives center point, React Flow needs top-left
    // We add a slight randomness or offset to prevent perfect overlap if dagre fails
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - (240 / 2),
        y: nodeWithPosition.y - (nodeWithPosition.height / 2),
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};
