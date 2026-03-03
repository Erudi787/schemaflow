import { useEffect, useState } from 'react';
import { useSchemaStore } from '@/store/useSchemaStore';
import { Save, Trash2, FileText, Plus, Pencil, Check, X } from 'lucide-react';

export function DiagramSidebar() {
    const {
        savedDiagrams,
        activeDiagramId,
        schemaModel,
        initDiagrams,
        saveCurrent,
        loadDiagram,
        deleteDiagram,
        renameDiagram,
        clear,
    } = useSchemaStore();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [showSaveInput, setShowSaveInput] = useState(false);
    const [newName, setNewName] = useState('');

    // Load diagrams from localStorage on mount
    useEffect(() => {
        initDiagrams();
    }, [initDiagrams]);

    const handleSave = () => {
        if (activeDiagramId) {
            // Update existing
            saveCurrent();
        } else {
            // Show name input for new diagram
            setShowSaveInput(true);
            setNewName('');
        }
    };

    const handleSaveNew = () => {
        const name = newName.trim() || 'Untitled Diagram';
        saveCurrent(name);
        setShowSaveInput(false);
        setNewName('');
    };

    const handleStartRename = (id: string, currentName: string) => {
        setEditingId(id);
        setEditName(currentName);
    };

    const handleConfirmRename = () => {
        if (editingId && editName.trim()) {
            renameDiagram(editingId, editName.trim());
        }
        setEditingId(null);
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return mins + 'm ago';
        const hours = Math.floor(mins / 60);
        if (hours < 24) return hours + 'h ago';
        return date.toLocaleDateString();
    };

    return (
        <aside className="w-56 shrink-0 border-r border-border bg-bg-secondary flex flex-col">
            {/* Brand */}
            <div className="p-4 border-b border-border">
                <h1 className="text-lg font-bold text-gradient">SchemaFlow</h1>
                <p className="text-[10px] text-text-muted mt-1">Interactive Schema Visualizer</p>
            </div>

            {/* Actions */}
            <div className="p-2 border-b border-border flex gap-1">
                <button
                    onClick={handleSave}
                    disabled={!schemaModel}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium bg-accent hover:bg-accent-hover text-white rounded transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    title={activeDiagramId ? 'Save changes' : 'Save as new diagram'}
                >
                    <Save size={12} />
                    {activeDiagramId ? 'Save' : 'Save As'}
                </button>
                <button
                    onClick={() => { clear(); }}
                    className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded transition-colors"
                    title="New diagram"
                >
                    <Plus size={12} />
                    New
                </button>
            </div>

            {/* Save new dialog */}
            {showSaveInput && (
                <div className="p-2 border-b border-border bg-bg-tertiary">
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Diagram name..."
                        className="w-full px-2 py-1 text-xs bg-bg-primary border border-border rounded text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveNew();
                            if (e.key === 'Escape') setShowSaveInput(false);
                        }}
                        autoFocus
                    />
                    <div className="flex gap-1 mt-1.5">
                        <button
                            onClick={handleSaveNew}
                            className="flex-1 px-2 py-1 text-xs bg-accent text-white rounded hover:bg-accent-hover transition-colors"
                        >
                            Save
                        </button>
                        <button
                            onClick={() => setShowSaveInput(false)}
                            className="px-2 py-1 text-xs text-text-muted hover:text-text-primary transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Diagram list */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {savedDiagrams.length === 0 ? (
                    <div className="p-3 text-text-muted text-xs text-center opacity-50 mt-4">
                        <FileText size={24} className="mx-auto mb-2 opacity-30" />
                        No saved diagrams yet
                    </div>
                ) : (
                    <div className="p-1.5 flex flex-col gap-0.5">
                        {savedDiagrams.map((diagram) => (
                            <div
                                key={diagram.id}
                                className={
                                    'group flex items-center gap-1.5 px-2.5 py-2 rounded cursor-pointer transition-colors ' +
                                    (diagram.id === activeDiagramId
                                        ? 'bg-accent/15 border border-accent/30'
                                        : 'hover:bg-bg-hover border border-transparent')
                                }
                                onClick={() => {
                                    if (editingId !== diagram.id) loadDiagram(diagram.id);
                                }}
                            >
                                <FileText size={12} className="text-text-muted shrink-0" />

                                <div className="flex-1 min-w-0">
                                    {editingId === diagram.id ? (
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="flex-1 w-full px-1 py-0 text-xs bg-bg-primary border border-border rounded text-text-primary focus:outline-none focus:border-accent"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleConfirmRename();
                                                    if (e.key === 'Escape') setEditingId(null);
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                autoFocus
                                            />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleConfirmRename(); }}
                                                className="p-0.5 text-success hover:text-success/80"
                                            >
                                                <Check size={11} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                                                className="p-0.5 text-text-muted hover:text-error"
                                            >
                                                <X size={11} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-xs text-text-primary truncate">{diagram.name}</p>
                                            <p className="text-[10px] text-text-muted">
                                                {diagram.inputMode.toUpperCase()} · {formatDate(diagram.updatedAt)}
                                            </p>
                                        </>
                                    )}
                                </div>

                                {/* Action buttons (visible on hover) */}
                                {editingId !== diagram.id && (
                                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleStartRename(diagram.id, diagram.name); }}
                                            className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-bg-tertiary transition-colors"
                                            title="Rename"
                                        >
                                            <Pencil size={10} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteDiagram(diagram.id); }}
                                            className="p-1 text-text-muted hover:text-error rounded hover:bg-bg-tertiary transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={10} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </aside>
    );
}
