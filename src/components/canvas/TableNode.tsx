import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { TableNodeData } from '@/transform/toReactFlow';
import { ChevronDown, ChevronRight, Key, Link, Database } from 'lucide-react';

function TableNodeComponent({ data }: NodeProps) {
    const { label, fields } = data as TableNodeData;
    const [isCollapsed, setIsCollapsed] = useState(false);
    const visibleFields = isCollapsed ? fields.slice(0, 3) : fields;
    const hasMore = fields.length > 3;

    return (
        <div className="rounded-lg border border-border overflow-hidden shadow-md bg-bg-secondary min-w-[220px] relative">
            {/* Node-level handles for edge connections */}
            <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-accent !border-accent-hover !opacity-0" />
            <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-accent !border-accent-hover !opacity-0" />
            {/* Header */}
            <div
                className="flex items-center gap-2 px-3 py-2.5 bg-node-sql-header cursor-pointer select-none"
                onClick={() => hasMore && setIsCollapsed(!isCollapsed)}
            >
                <Database size={14} className="text-white/80" />
                <span className="text-sm font-semibold text-white flex-1 truncate">
                    {label}
                </span>
                {hasMore && (
                    <span className="text-white/60">
                        {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                    </span>
                )}
                <span className="text-[10px] text-white/50 ml-1">
                    {fields.length} fields
                </span>
            </div>

            {/* Fields */}
            <div className="divide-y divide-border/50">
                {visibleFields.map((field) => (
                    <div
                        key={field.name}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-bg-hover transition-colors relative"
                    >

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
                        <span className="text-text-primary font-medium truncate flex-1">
                            {field.name}
                        </span>

                        {/* Field type */}
                        <span className="text-text-muted font-mono text-[10px] shrink-0">
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
                    className="px-3 py-1.5 text-[10px] text-text-muted text-center cursor-pointer hover:bg-bg-hover transition-colors"
                    onClick={() => setIsCollapsed(false)}
                >
                    +{fields.length - 3} more fields
                </div>
            )}
        </div>
    );
}

export const TableNode = memo(TableNodeComponent);
