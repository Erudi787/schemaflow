import Dagre from '@dagrejs/dagre';
import type { Node } from '@xyflow/react';
import type { FlowData } from '@/transform/toReactFlow';

// ===== Dagre Auto-Layout =====
// Computes { x, y } positions for each node using the dagre graph layout algorithm.

export interface LayoutOptions {
    direction: 'TB' | 'LR'; // Top-to-Bottom or Left-to-Right
    nodeSpacing: number;
    rankSpacing: number;
}

const DEFAULT_OPTIONS: LayoutOptions = {
    direction: 'TB',
    nodeSpacing: 60,
    rankSpacing: 80,
};

/**
 * Apply dagre layout to React Flow nodes and edges.
 * Returns a new FlowData with updated node positions.
 */
export function applyLayout(
    flowData: FlowData,
    options: Partial<LayoutOptions> = {}
): FlowData {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

    g.setGraph({
        rankdir: opts.direction,
        nodesep: opts.nodeSpacing,
        ranksep: opts.rankSpacing,
        marginx: 40,
        marginy: 40,
    });

    // Add nodes with their dimensions
    for (const node of flowData.nodes) {
        const width = (node.style?.width as number) || 250;
        const height = (node.style?.height as number) || 200;
        g.setNode(node.id, { width, height });
    }

    // Add edges
    for (const edge of flowData.edges) {
        g.setEdge(edge.source, edge.target);
    }

    // Run the layout
    Dagre.layout(g);

    // Map the computed positions back to the nodes
    const layoutedNodes: Node[] = flowData.nodes.map((node) => {
        const nodeWithPosition = g.node(node.id);
        const width = (node.style?.width as number) || 250;
        const height = (node.style?.height as number) || 200;

        return {
            ...node,
            position: {
                // Dagre returns center positions, React Flow uses top-left
                x: nodeWithPosition.x - width / 2,
                y: nodeWithPosition.y - height / 2,
            },
        };
    });

    return {
        nodes: layoutedNodes,
        edges: flowData.edges,
    };
}

/**
 * Get the recommended layout direction based on schema type.
 */
export function getLayoutDirection(schemaType: 'sql' | 'json'): 'TB' | 'LR' {
    return schemaType === 'sql' ? 'TB' : 'LR';
}
