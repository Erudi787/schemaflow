import { memo } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { TableNodeData, NodeCustomStyle } from '@/transform/toReactFlow';
import { useSchemaStore } from '@/store/useSchemaStore';
import { ChevronDown, ChevronRight, Key, Link, Database } from 'lucide-react';
import { NodeCustomizer } from '@/components/canvas/NodeCustomizer';
import { getContrastYIQ } from '@/lib/utils';

function TableNodeComponent({ id, data }: NodeProps) {
    const { label, fields, isCollapsed = false } = data as TableNodeData;
    const { saveHistorySnapshot } = useSchemaStore();
    const { updateNodeData } = useReactFlow();

    const visibleFields = isCollapsed ? fields.slice(0, 3) : fields;
    const hasMore = fields.length > 3;

    const toggleCollapse = () => {
        saveHistorySnapshot();
        updateNodeData(id, { isCollapsed: !isCollapsed });
    };

    const customStyle = (data.style || {}) as NodeCustomStyle;

    const headerTextColor = customStyle.headerColor
        ? getContrastYIQ(customStyle.headerColor) === 'black' ? 'text-bg-primary' : 'text-white'
        : 'text-white';

    const headerIconColor = customStyle.headerColor
        ? getContrastYIQ(customStyle.headerColor) === 'black' ? 'text-bg-primary/80' : 'text-white/80'
        : 'text-white/80';

    const bodyTextColor = customStyle.backgroundColor
        ? getContrastYIQ(customStyle.backgroundColor) === 'black' ? 'text-bg-primary' : 'text-text-primary'
        : 'text-text-primary';

    const bodyMutedColor = customStyle.backgroundColor
        ? getContrastYIQ(customStyle.backgroundColor) === 'black' ? 'text-bg-primary/80' : 'text-text-muted'
        : 'text-text-muted';

    const bodyHoverClass = customStyle.backgroundColor
        ? getContrastYIQ(customStyle.backgroundColor) === 'black' ? 'hover:bg-black/5' : 'hover:bg-white/5'
        : 'hover:bg-bg-hover';

    return (
        <div
            className="rounded-lg border shadow-md min-w-[220px] relative"
            style={{
                backgroundColor: customStyle.backgroundColor || 'var(--color-bg-secondary)',
                borderColor: customStyle.borderColor || 'var(--color-border)',
            }}
        >
            {/* Header */}
            <div
                className="flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none rounded-t-lg"
                style={{
                    backgroundColor: customStyle.headerColor || 'var(--color-node-sql-header)',
                }}
                onClick={() => hasMore && toggleCollapse()}
            >
                <Database size={14} className={headerIconColor} />
                <span className={`text-sm font-semibold flex-1 truncate ${headerTextColor}`}>
                    {label}
                </span>
                {hasMore && (
                    <span className={headerIconColor}>
                        {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                    </span>
                )}
                <span className={`text-[10px] ml-1 ${headerIconColor}`}>
                    {fields.length} fields
                </span>
                <NodeCustomizer nodeId={id} currentStyle={customStyle} iconClass={headerIconColor} />
            </div>

            {/* Body */}
            <div className="overflow-hidden rounded-b-lg">
                {/* Fields */}
                <div className="divide-y divide-border/50">
                    {visibleFields.map((field) => (
                        <div
                            key={field.name}
                            className={`flex items-center gap-2 px-3 py-1.5 text-xs transition-colors relative ${bodyHoverClass}`}
                        >
                            {/* Per-field handles for edge connections */}
                            <Handle
                                type="source"
                                position={Position.Right}
                                id={field.name + '-source'}
                                className="!w-1.5 !h-1.5 !bg-accent !border-accent-hover"
                                style={{ top: '50%' }}
                            />
                            <Handle
                                type="target"
                                position={Position.Left}
                                id={field.name + '-target'}
                                className="!w-1.5 !h-1.5 !bg-accent !border-accent-hover"
                                style={{ top: '50%' }}
                            />

                            {/* Badges */}
                            <span className="flex items-center gap-1 shrink-0">
                                {field.isPrimaryKey && (
                                    <Key size={11} className="text-pk-badge" />
                                )}
                                {field.isForeignKey && (
                                    <Link size={11} className="text-fk-badge" />
                                )}
                            </span>

                            {/* Field name */}
                            <span className={`font-medium truncate flex-1 ${bodyTextColor}`}>
                                {field.name}
                            </span>

                            {/* Field type */}
                            <span className={`font-mono text-[10px] shrink-0 ${bodyMutedColor}`}>
                                {field.type}
                            </span>

                            {/* Nullable indicator */}
                            {field.isNullable && (
                                <span className="text-nullable-badge text-[9px]">?</span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Collapsed indicator */}
                {isCollapsed && hasMore && (
                    <div
                        className={`px-3 py-1.5 text-[10px] text-center cursor-pointer transition-colors ${bodyMutedColor} ${bodyHoverClass}`}
                        onClick={() => toggleCollapse()}
                    >
                        +{fields.length - 3} more fields
                    </div>
                )}
            </div>
        </div>
    );
}

export const TableNode = memo(TableNodeComponent);
