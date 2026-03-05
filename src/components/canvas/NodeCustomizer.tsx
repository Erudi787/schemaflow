import { useState, useRef, useEffect } from 'react';
import { Palette, X, RotateCcw } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import type { NodeCustomStyle } from '@/transform/toReactFlow';
import { useSchemaStore } from '@/store/useSchemaStore';

interface NodeCustomizerProps {
    nodeId: string;
    currentStyle: NodeCustomStyle;
}

const PRESET_COLORS = [
    '#6c63ff', '#ff79c6', '#bd93f9', '#88c0d0', '#00d4aa',
    '#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#6a6a8a',
    '#282a36', '#44475a', '#1e1e38', '#2a2a4a', '#ffffff',
];

export function NodeCustomizer({ nodeId, currentStyle }: NodeCustomizerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'header' | 'background' | 'border'>('header');
    const popoverRef = useRef<HTMLDivElement>(null);
    const { updateNodeData } = useReactFlow();
    const { saveHistorySnapshot } = useSchemaStore();

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    const handleColorPick = (color: string) => {
        if (!isOpen) return; // Prevent spurious

        // Save history state before changing colors
        saveHistorySnapshot();

        const propertyMap = {
            header: 'headerColor',
            background: 'backgroundColor',
            border: 'borderColor'
        } as const;

        const propToUpdate = propertyMap[activeTab];

        updateNodeData(nodeId, {
            style: {
                ...currentStyle,
                [propToUpdate]: color,
            }
        });
    };

    const handleReset = () => {
        saveHistorySnapshot();
        updateNodeData(nodeId, { style: undefined });
        setIsOpen(false);
    };

    return (
        <div className="relative nodrag" ref={popoverRef} onClick={(e) => e.stopPropagation()}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 rounded text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                title="Customize Node Style"
            >
                <Palette size={13} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-1 w-56 bg-bg-elevated border border-border rounded-lg shadow-xl z-[100] p-3 text-text-primary text-xs cursor-default">
                    <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
                        <span className="font-semibold text-sm">Styles</span>
                        <div className="flex gap-1">
                            <button
                                onClick={handleReset}
                                className="p-1 hover:bg-bg-hover hover:text-error text-text-muted rounded transition-colors"
                                title="Reset to theme defaults"
                            >
                                <RotateCcw size={12} />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-bg-hover rounded transition-colors"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-1 mb-3 bg-bg-secondary p-1 rounded-md">
                        {(['header', 'background', 'border'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-1 rounded capitalize transition-colors ${activeTab === tab ? 'bg-bg-elevated shadow-sm font-medium' : 'text-text-muted hover:text-text-primary text-[10px]'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-5 gap-1.5 place-items-center mb-2">
                        {PRESET_COLORS.map((hex) => {
                            const isSelected =
                                (activeTab === 'header' && currentStyle.headerColor === hex) ||
                                (activeTab === 'background' && currentStyle.backgroundColor === hex) ||
                                (activeTab === 'border' && currentStyle.borderColor === hex);

                            return (
                                <button
                                    key={hex}
                                    onClick={() => handleColorPick(hex)}
                                    title={hex}
                                    className={`w-6 h-6 rounded-full cursor-pointer hover:scale-110 transition-transform ${isSelected ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg-elevated' : 'border border-border/50'}`}
                                    style={{ backgroundColor: hex }}
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
