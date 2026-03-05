import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { TableNodeData, NodeCustomStyle } from '@/transform/toReactFlow';
import { ChevronDown, ChevronRight, Braces, Hash, Type, ToggleLeft, List, Calendar, Globe, Mail } from 'lucide-react';
import { NodeCustomizer } from '@/components/canvas/NodeCustomizer';

const TYPE_ICONS: Record<string, typeof Hash> = {
    integer: Hash,
    float: Hash,
    string: Type,
    boolean: ToggleLeft,
    date: Calendar,
    url: Globe,
    email: Mail,
    object: Braces,
    null: Type,
};

function JsonNodeComponent({ id, data }: NodeProps) {
    const { label, fields } = data as TableNodeData;
    const [isCollapsed, setIsCollapsed] = useState(false);

    const customStyle = (data.style || {}) as NodeCustomStyle;

    return (
        <div
            className="rounded-lg border overflow-hidden shadow-md min-w-[220px] relative"
            style={{
                backgroundColor: customStyle.backgroundColor || 'var(--color-bg-secondary)',
                borderColor: customStyle.borderColor || 'var(--color-border)',
            }}
        >
            {/* 'self' target handle on node header for parent→child edges */}
            <Handle
                type="target"
                position={Position.Left}
                id="self"
                className="!w-1.5 !h-1.5 !bg-accent-secondary !border-accent-secondary-hover"
                style={{ top: '20px' }}
            />
            {/* Header */}
            <div
                className="flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none"
                style={{
                    backgroundColor: customStyle.headerColor || 'var(--color-node-json-header)',
                }}
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <Braces size={14} className="text-white/80" />
                <span className="text-sm font-semibold text-white flex-1 truncate">
                    {label}
                </span>
                <span className="text-white/60">
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                </span>
                <span className="text-[10px] text-white/50 ml-1">
                    {fields.length} props
                </span>
                <NodeCustomizer nodeId={id} currentStyle={customStyle} />
            </div>

            {/* Fields */}
            {!isCollapsed && (
                <div className="divide-y divide-border/50">
                    {fields.map((field) => {
                        const isArray = field.type.startsWith('array<');
                        const isObject = field.type === 'object';
                        const IconComponent = isArray ? List : (TYPE_ICONS[field.type] || Type);

                        return (
                            <div
                                key={field.name}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-bg-hover transition-colors relative"
                            >
                                {/* Per-field handles for edge connections */}
                                <Handle
                                    type="source"
                                    position={Position.Right}
                                    id={field.name}
                                    className="!w-1.5 !h-1.5 !bg-accent-secondary !border-accent-secondary-hover"
                                    style={{ top: '50%' }}
                                />
                                <Handle
                                    type="target"
                                    position={Position.Left}
                                    id={field.name}
                                    className="!w-1.5 !h-1.5 !bg-accent-secondary !border-accent-secondary-hover"
                                    style={{ top: '50%' }}
                                />

                                {/* Type icon */}
                                <IconComponent
                                    size={11}
                                    className={
                                        isObject || isArray
                                            ? 'text-accent-secondary'
                                            : 'text-text-muted'
                                    }
                                />

                                {/* Field name */}
                                <span className="text-text-primary font-medium truncate flex-1">
                                    {field.name}
                                </span>

                                {/* Type label */}
                                <span className="text-text-muted font-mono text-[10px] shrink-0">
                                    {field.type}
                                </span>

                                {/* Nullable */}
                                {field.isNullable && (
                                    <span className="text-nullable-badge text-[9px]">?</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export const JsonNode = memo(JsonNodeComponent);
