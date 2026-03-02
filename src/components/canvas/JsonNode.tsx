import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { TableNodeData } from '@/transform/toReactFlow';
import { ChevronDown, ChevronRight, Braces, Hash, Type, ToggleLeft, List, Calendar, Globe, Mail } from 'lucide-react';

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

function JsonNodeComponent({ data }: NodeProps) {
    const { label, fields } = data as TableNodeData;
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="rounded-lg border border-border overflow-hidden shadow-md bg-bg-secondary min-w-[220px]">
            {/* Header */}
            <div
                className="flex items-center gap-2 px-3 py-2.5 bg-node-json-header cursor-pointer select-none"
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
                                <Handle
                                    type="source"
                                    position={Position.Right}
                                    id={field.name}
                                    className="!w-2 !h-2 !bg-accent-secondary !border-accent-secondary-hover"
                                    style={{ top: 'auto' }}
                                />
                                <Handle
                                    type="target"
                                    position={Position.Left}
                                    id={field.name}
                                    className="!w-2 !h-2 !bg-accent-secondary !border-accent-secondary-hover"
                                    style={{ top: 'auto' }}
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
