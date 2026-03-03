import type { Node, Edge } from '@xyflow/react';
import type { SchemaModel, SchemaTable, SchemaField } from '@/models/schema';

// ===== SchemaModel -> React Flow Transformation =====
// Converts the internal SchemaModel into React Flow nodes and edges.

export interface TableNodeData {
    label: string;
    fields: SchemaField[];
    tableType: 'sql' | 'json';
    [key: string]: unknown;
}

export interface FlowData {
    nodes: Node[];
    edges: Edge[];
}

/**
 * Transform a SchemaModel into React Flow nodes and edges.
 */
export function toReactFlow(model: SchemaModel): FlowData {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Create nodes for each table
    model.tables.forEach((table) => {
        nodes.push(createTableNode(table, model.type));
    });

    // Create edges for each relationship
    model.relationships.forEach((rel, index) => {
        const edgeId = 'edge-' + index;

        // Only create edge if both source and target tables exist
        const sourceExists = model.tables.some((t) => t.name === rel.from.table);
        const targetExists = model.tables.some((t) => t.name === rel.to.table);

        if (sourceExists && targetExists) {
            edges.push({
                id: edgeId,
                source: 'table-' + rel.from.table,
                target: 'table-' + rel.to.table,
                sourceHandle: rel.from.field,
                targetHandle: rel.to.field,
                type: 'custom',
                animated: rel.type === 'one-to-many',
                data: {
                    relationshipType: rel.type,
                    fromTable: rel.from.table,
                    fromField: rel.from.field,
                    toTable: rel.to.table,
                    toField: rel.to.field,
                },
            });
        }
    });

    return { nodes, edges };
}

function createTableNode(
    table: SchemaTable,
    schemaType: 'sql' | 'json'
): Node {
    // Calculate estimated node dimensions based on field count
    const headerHeight = 44;
    const fieldHeight = 32;
    const padding = 16;
    const estimatedHeight = headerHeight + table.fields.length * fieldHeight + padding;
    const estimatedWidth = calculateNodeWidth(table);

    return {
        id: 'table-' + table.name,
        type: schemaType === 'sql' ? 'tableNode' : 'jsonNode',
        position: { x: 0, y: 0 }, // Will be set by layout
        data: {
            label: table.name,
            fields: table.fields,
            tableType: schemaType,
        } satisfies TableNodeData,
        style: {
            width: estimatedWidth,
            height: estimatedHeight,
        },
    };
}

function calculateNodeWidth(table: SchemaTable): number {
    // Base width + extra based on longest field name/type
    const baseWidth = 250;
    let maxFieldLen = 0;

    for (const field of table.fields) {
        const len = field.name.length + field.type.length;
        if (len > maxFieldLen) maxFieldLen = len;
    }

    // Also consider table name length
    const tableNameLen = table.name.length * 9;
    const fieldBasedWidth = maxFieldLen * 8 + 80; // 8px per char + badges

    return Math.max(baseWidth, tableNameLen + 40, fieldBasedWidth);
}
