import { memo } from 'react';
import {
    BaseEdge,
    EdgeLabelRenderer,
    getSmoothStepPath,
    type EdgeProps,
} from '@xyflow/react';

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

    const relationshipType = (data as Record<string, unknown>)?.relationshipType as string | undefined;

    return (
        <>
            <BaseEdge
                id={id}
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    stroke: 'var(--color-border-bright)',
                    strokeWidth: 2,
                    ...style,
                }}
            />
            {relationshipType && (
                <EdgeLabelRenderer>
                    <div
                        className="absolute text-[9px] font-medium px-1.5 py-0.5 rounded bg-bg-elevated border border-border text-text-muted pointer-events-none"
                        style={{
                            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                        }}
                    >
                        {relationshipType}
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
}

export const CustomEdge = memo(CustomEdgeComponent);
