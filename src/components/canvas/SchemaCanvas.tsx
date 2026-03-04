import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback } from 'react';
import { useSchemaStore } from '@/store/useSchemaStore';
import { TableNode } from '@/components/canvas/TableNode';
import { JsonNode } from '@/components/canvas/JsonNode';
import { CustomEdge } from '@/components/canvas/CustomEdge';

const nodeTypes = {
    tableNode: TableNode,
    jsonNode: JsonNode,
};

const edgeTypes = {
    custom: CustomEdge,
};

export function SchemaCanvas() {
    const { nodes, edges, onNodesChange, onEdgesChange, saveHistorySnapshot } = useSchemaStore();

    const onInit = useCallback((instance: { fitView: () => void }) => {
        // Fit view after initial render
        setTimeout(() => instance.fitView(), 100);
    }, []);

    const onNodeDragStart = useCallback(() => {
        saveHistorySnapshot();
    }, [saveHistorySnapshot]);

    if (nodes.length === 0) {
        return (
            <div className="flex-1 bg-bg-primary relative">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-bg-tertiary border border-border flex items-center justify-center">
                            <span className="text-2xl">&#x2B21;</span>
                        </div>
                        <p className="text-text-secondary text-sm">Paste a schema and click Visualize</p>
                        <p className="text-text-muted text-xs mt-1">SQL CREATE TABLE or JSON API responses</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeDragStart={onNodeDragStart}
                onInit={onInit}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                minZoom={0.1}
                maxZoom={2}
                defaultEdgeOptions={{
                    style: { stroke: 'var(--color-border-bright)', strokeWidth: 2 },
                    type: 'smoothstep',
                }}
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={20}
                    size={1}
                    color="var(--color-border)"
                />
                <Controls
                    showInteractive={false}
                />
                <MiniMap
                    nodeStrokeWidth={3}
                    nodeColor={(n) => {
                        if (n.type === 'tableNode') return 'var(--color-node-sql-header)';
                        if (n.type === 'jsonNode') return 'var(--color-node-json-header)';
                        return 'var(--color-border)';
                    }}
                    maskColor="rgba(0, 0, 0, 0.6)"
                />
            </ReactFlow>
        </div>
    );
}
