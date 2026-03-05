import { useSchemaStore } from '@/store/useSchemaStore';
import { exportToMermaid, exportToMarkdown, exportToTypeScript } from '@/features/export';
import { generateMockApi } from '@/features/mockApi';
import { downloadImage } from '@/features/exportImage';
import { showToast } from '@/components/ui/Toast';
import { Download, Palette, Trash2, Copy, Code, FileText, Zap, Undo2, Redo2, Menu, Image as ImageIcon, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { Theme } from '@/hooks/useTheme';

interface ToolbarProps {
    theme: Theme;
    themes: Theme[];
    setTheme: (t: Theme) => void;
    onToggleTheme: () => void; // Keeping for backward compat/quick toggle if needed
    onOpenSidebar: () => void;
}

export function Toolbar({ theme, themes, setTheme, onOpenSidebar }: ToolbarProps) {
    const { schemaModel, nodes, pastNodes, futureNodes, clear, undo, redo } = useSchemaStore();
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showThemeMenu, setShowThemeMenu] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const themeMenuRef = useRef<HTMLDivElement>(null);

    const [isTransparent, setIsTransparent] = useState(false);

    // Close menus on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
                setShowExportMenu(false);
            }
            if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
                setShowThemeMenu(false);
            }
        };
        if (showExportMenu || showThemeMenu) {
            document.addEventListener('mousedown', handler);
            return () => document.removeEventListener('mousedown', handler);
        }
    }, [showExportMenu, showThemeMenu]);

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

    const handleExportImage = async (format: 'png' | 'jpeg' | 'svg') => {
        if (!schemaModel || nodes.length === 0) return;
        try {
            await downloadImage({
                nodes,
                format,
                // If transparent is checked, background gets wiped anyway automatically in downloadImage.
                // By passing undefined instead of #000, we let html-to-image render natively.
                backgroundColor: theme === 'light' ? '#ffffff' : '#0a0a0f',
                isTransparent,
            });
            showToast('success', `Exported as ${format.toUpperCase()}`);
            setShowExportMenu(false);
        } catch (error) {
            showToast('error', 'Failed to export image');
            console.error(error);
        }
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
                <div className="relative" ref={exportMenuRef}>
                    <button
                        onClick={() => {
                            setShowExportMenu(!showExportMenu);
                            setShowThemeMenu(false);
                        }}
                        disabled={!hasData}
                        className="flex items-center gap-1 px-2 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded transition-colors disabled:opacity-30 disabled:pointer-events-none"
                        title="Export schema"
                    >
                        <Download size={13} />
                        Export
                        <ChevronDown size={12} className="opacity-50" />
                    </button>

                    {showExportMenu && (
                        <div className="absolute right-0 top-full mt-1 w-56 bg-bg-elevated border border-border rounded-lg shadow-lg py-1 z-50">
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
                            <div className="border-t border-border my-1" />
                            <div className="px-3 py-1.5 flex items-center justify-between">
                                <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
                                    Image
                                </span>
                                <label className="flex items-center gap-1 cursor-pointer">
                                    <span className="text-[10px] text-text-secondary">Transparent</span>
                                    <div className="relative inline-block w-6 h-3 align-middle select-none transition duration-200 ease-in">
                                        <input
                                            type="checkbox"
                                            className="peer sr-only"
                                            checked={isTransparent}
                                            onChange={(e) => setIsTransparent(e.target.checked)}
                                        />
                                        <div className="w-6 h-3 bg-bg-hover rounded-full peer-checked:bg-accent transition-colors"></div>
                                        <div className="absolute left-[2px] top-[2px] w-2 h-2 bg-text-secondary rounded-full transition-transform peer-checked:translate-x-3 peer-checked:bg-white shadow-sm"></div>
                                    </div>
                                </label>
                            </div>
                            <button
                                onClick={() => handleExportImage('png')}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors text-left"
                            >
                                <ImageIcon size={12} />
                                Download PNG
                            </button>
                            <button
                                onClick={() => handleExportImage('jpeg')}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors text-left"
                                title="JPEG format does not support transparency"
                            >
                                <ImageIcon size={12} />
                                Download JPEG
                            </button>
                            <button
                                onClick={() => handleExportImage('svg')}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors text-left"
                            >
                                <ImageIcon size={12} />
                                Download SVG
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

                {/* Theme Selector Dropdown */}
                <div className="relative" ref={themeMenuRef}>
                    <button
                        onClick={() => {
                            setShowThemeMenu(!showThemeMenu);
                            setShowExportMenu(false);
                        }}
                        className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded transition-colors capitalize"
                        title="Change Theme"
                    >
                        <Palette size={14} />
                        <span className="hidden sm:inline">{theme}</span>
                        <ChevronDown size={12} className="opacity-50" />
                    </button>

                    {showThemeMenu && (
                        <div className="absolute right-0 top-full mt-1 w-36 bg-bg-elevated border border-border rounded-lg shadow-lg py-1 z-50">
                            {themes.map((t) => (
                                <button
                                    key={t}
                                    onClick={() => {
                                        setTheme(t);
                                        setShowThemeMenu(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors text-left capitalize
                                        ${theme === t ? 'text-accent bg-bg-hover/50 font-medium' : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'}
                                    `}
                                >
                                    {t}
                                    {theme === t && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    onClick={clear}
                    disabled={!hasData}
                    className="p-1.5 text-text-secondary hover:text-error hover:bg-bg-hover rounded transition-colors disabled:opacity-30 disabled:pointer-events-none ml-1"
                    title="Clear canvas"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </header>
    );
}
