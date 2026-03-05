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
    const d = data as EdgeData | undefined;
    const relType = d?.relationshipType;
    const fromField = d?.fromField;
    const toField = d?.toField;
    const fromTable = d?.fromTable;
    const toTable = d?.toTable;

    const isSelfReferencing = fromTable && toTable && fromTable === toTable;

    let edgePath = '';
    let labelX = 0;
    let labelY = 0;

    if (isSelfReferencing) {
        // Draw a custom C-curve loop on the right side of the node.
        // We force both start X and end X to use sourceX (Right side).
        const startX = sourceX;
        const startY = sourceY;
        const endX = sourceX;
        const endY = targetY; // Connect to the proper row height

        const distanceY = Math.abs(endY - startY);

        if (distanceY < 5) {
            // Same exact field loop (e.g. tenant_id -> tenant_id)
            const cpOffset = 50;
            const yOffset = 25;
            edgePath = `M ${startX} ${startY} C ${startX + cpOffset} ${startY - yOffset}, ${startX + cpOffset} ${startY + yOffset}, ${endX} ${startY}`;
            labelX = startX + cpOffset;
            labelY = startY;
        } else {
            // Different fields on the same table (e.g. manager_id -> emp_id)
            const cpOffset = Math.max(40, distanceY * 0.5);
            edgePath = `M ${startX} ${startY} C ${startX + cpOffset} ${startY}, ${startX + cpOffset} ${endY}, ${endX} ${endY}`;
            labelX = startX + cpOffset;
            labelY = (startY + endY) / 2;
        }
    } else {
        const [path, lx, ly] = getSmoothStepPath({
            sourceX,
            sourceY,
            sourcePosition,
            targetX,
            targetY,
            targetPosition,
            borderRadius: 12,
        });
        edgePath = path;
        labelX = lx;
        labelY = ly;
    }



    const relSymbol = isSelfReferencing
        ? ''
        : (relType ? REL_SYMBOLS[relType] || relType : '');

    // Build the label: "posts.author_id → users.id"
    // Hide field label on self-referencing edges to prevent overlapping the node visually
    const fieldLabel = isSelfReferencing
        ? ''
        : fromField && toField && fromTable && toTable
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
