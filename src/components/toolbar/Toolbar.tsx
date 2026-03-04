import { useSchemaStore } from '@/store/useSchemaStore';
import { exportToMermaid, exportToMarkdown, exportToTypeScript } from '@/features/export';
import { generateMockApi } from '@/features/mockApi';
import { showToast } from '@/components/ui/Toast';
import { Download, Moon, Sun, Trash2, Copy, Code, FileText, Zap, Undo2, Redo2, Menu } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface ToolbarProps {
    theme: 'dark' | 'light';
    onToggleTheme: () => void;
    onOpenSidebar: () => void;
}

export function Toolbar({ theme, onToggleTheme, onOpenSidebar }: ToolbarProps) {
    const { schemaModel, nodes, pastNodes, futureNodes, clear, undo, redo } = useSchemaStore();
    const [showExportMenu, setShowExportMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowExportMenu(false);
            }
        };
        if (showExportMenu) {
            document.addEventListener('mousedown', handler);
            return () => document.removeEventListener('mousedown', handler);
        }
    }, [showExportMenu]);

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        showToast('success', label + ' copied to clipboard');
        setShowExportMenu(false);
    };

    const handleExportMermaid = () => {
        if (!schemaModel) return;
        copyToClipboard(exportToMermaid(schemaModel), 'Mermaid ERD');
    };

    const handleExportMarkdown = () => {
        if (!schemaModel) return;
        copyToClipboard(exportToMarkdown(schemaModel), 'Markdown docs');
    };

    const handleExportTypeScript = () => {
        if (!schemaModel) return;
        copyToClipboard(exportToTypeScript(schemaModel), 'TypeScript interfaces');
    };

    const handleMockApi = () => {
        if (!schemaModel) return;
        copyToClipboard(generateMockApi(schemaModel), 'Mock API spec');
    };

    const hasData = nodes.length > 0;

    return (
        <header className="h-11 border-b border-border bg-bg-secondary flex items-center px-2 md:px-4 gap-2">
            {/* Hamburger Menu (Mobile Only) */}
            <button
                onClick={onOpenSidebar}
                className="md:hidden p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded transition-colors"
                title="Open Sidebar"
            >
                <Menu size={16} />
            </button>

            {/* Left: schema summary */}
            <span className="text-xs text-text-muted hidden sm:inline-block">
                {schemaModel
                    ? schemaModel.tables.length + ' table' + (schemaModel.tables.length !== 1 ? 's' : '') +
                    ' · ' + schemaModel.relationships.length + ' relationship' + (schemaModel.relationships.length !== 1 ? 's' : '')
                    : 'No schema loaded'}
            </span>

            {/* Keyboard shortcut hints */}
            <span className="text-[10px] text-text-muted/50 ml-2 hidden sm:inline">
                Ctrl+Enter to visualize · Ctrl+S to save
            </span>

            <div className="flex-1" />

            {/* Right: actions */}
            <div className="flex items-center gap-1">
                {/* Export dropdown */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        disabled={!hasData}
                        className="flex items-center gap-1 px-2 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded transition-colors disabled:opacity-30 disabled:pointer-events-none"
                        title="Export schema"
                    >
                        <Download size={13} />
                        Export
                    </button>

                    {showExportMenu && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-bg-elevated border border-border rounded-lg shadow-lg py-1 z-50">
                            <button
                                onClick={handleExportMermaid}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors text-left"
                            >
                                <Copy size={12} />
                                Mermaid ERD
                            </button>
                            <button
                                onClick={handleExportMarkdown}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors text-left"
                            >
                                <FileText size={12} />
                                Markdown Docs
                            </button>
                            <button
                                onClick={handleExportTypeScript}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors text-left"
                            >
                                <Code size={12} />
                                TypeScript Interfaces
                            </button>
                            <div className="border-t border-border my-1" />
                            <button
                                onClick={handleMockApi}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors text-left"
                            >
                                <Zap size={12} />
                                Mock REST API
                            </button>
                        </div>
                    )}
                </div>

                <div className="w-px h-5 bg-border mx-1" />

                <button
                    onClick={undo}
                    disabled={pastNodes.length === 0}
                    className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    title="Undo (Ctrl+Z)"
                >
                    <Undo2 size={14} />
                </button>
                <button
                    onClick={redo}
                    disabled={futureNodes.length === 0}
                    className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    title="Redo (Ctrl+Y/Ctrl+Shift+Z)"
                >
                    <Redo2 size={14} />
                </button>

                <div className="w-px h-5 bg-border mx-1" />

                <button
                    onClick={onToggleTheme}
                    className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded transition-colors"
                    title={'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' mode'}
                >
                    {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                </button>

                <button
                    onClick={clear}
                    disabled={!hasData}
                    className="p-1.5 text-text-secondary hover:text-error hover:bg-bg-hover rounded transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    title="Clear canvas"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </header>
    );
}
