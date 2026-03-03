import { memo } from 'react';
import {
    BaseEdge,
    EdgeLabelRenderer,
    getSmoothStepPath,
    type EdgeProps,
} from '@xyflow/react';

interface EdgeData {
    relationshipType?: string;
    fromField?: string;
    toField?: string;
    fromTable?: string;
    toTable?: string;
    [key: string]: unknown;
}

const REL_SYMBOLS: Record<string, string> = {
    'one-to-one': '1 : 1',
    'one-to-many': '1 : N',
    'many-to-many': 'N : N',
};

function CustomEdgeComponent({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    style = {},
    markerEnd,
}: EdgeProps) {
    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 12,
    });

    const d = data as EdgeData | undefined;
    const relType = d?.relationshipType;
    const fromField = d?.fromField;
    const toField = d?.toField;
    const fromTable = d?.fromTable;
    const toTable = d?.toTable;

    const relSymbol = relType ? REL_SYMBOLS[relType] || relType : '';

    // Build the label: "posts.author_id → users.id"
    const fieldLabel =
        fromField && toField && fromTable && toTable
            ? `${fromTable}.${fromField} → ${toTable}.${toField}`
            : fromField && toField
                ? `${fromField} → ${toField}`
                : '';

    return (
        <>
            <BaseEdge
                id={id}
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    stroke: 'var(--color-accent)',
                    strokeWidth: 2,
                    opacity: 0.6,
                    ...style,
                }}
            />
            {(relType || fieldLabel) && (
                <EdgeLabelRenderer>
                    <div
                        className="absolute flex flex-col items-center gap-0.5 pointer-events-none"
                        style={{
                            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                        }}
                    >
                        {fieldLabel && (
                            <div className="text-[9px] font-mono font-medium px-2 py-0.5 rounded-md bg-bg-elevated border border-accent/30 text-accent whitespace-nowrap shadow-sm">
                                {fieldLabel}
                            </div>
                        )}
                        {relSymbol && (
                            <div className="text-[8px] font-medium px-1.5 py-0.5 rounded bg-bg-tertiary border border-border text-text-muted whitespace-nowrap">
                                {relSymbol}
                            </div>
                        )}
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
}

export const CustomEdge = memo(CustomEdgeComponent);
