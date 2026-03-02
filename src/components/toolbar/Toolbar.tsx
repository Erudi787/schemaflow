import { useSchemaStore } from '@/store/useSchemaStore';
import { Download, Moon, Sun, Trash2 } from 'lucide-react';
import { useState } from 'react';

export function Toolbar() {
    const { schemaModel, flowData, clear } = useSchemaStore();
    const [isDark, setIsDark] = useState(true);

    const handleExportMermaid = () => {
        if (!schemaModel) return;

        let mermaid = 'erDiagram\n';

        for (const table of schemaModel.tables) {
            mermaid += '    ' + table.name + ' {\n';
            for (const field of table.fields) {
                const pk = field.isPrimaryKey ? ' PK' : '';
                const fk = field.isForeignKey ? ' FK' : '';
                mermaid += '        ' + field.type + ' ' + field.name + pk + fk + '\n';
            }
            mermaid += '    }\n';
        }

        for (const rel of schemaModel.relationships) {
            const relSymbol = rel.type === 'one-to-many' ? '||--o{' : '||--||';
            mermaid += '    ' + rel.from.table + ' ' + relSymbol + ' ' + rel.to.table + ' : "' + rel.from.field + '"\n';
        }

        navigator.clipboard.writeText(mermaid);
        alert('Mermaid ERD copied to clipboard!');
    };

    const handleExportMarkdown = () => {
        if (!schemaModel) return;

        let md = '# Schema Documentation\n\n';

        for (const table of schemaModel.tables) {
            md += '## ' + table.name + '\n\n';
            md += '| Field | Type | PK | FK | Nullable |\n';
            md += '|-------|------|----|----|----------|\n';
            for (const field of table.fields) {
                md += '| ' + field.name + ' | ' + field.type + ' | ' +
                    (field.isPrimaryKey ? 'Yes' : '') + ' | ' +
                    (field.isForeignKey ? 'Yes' : '') + ' | ' +
                    (field.isNullable ? 'Yes' : 'No') + ' |\n';
            }
            md += '\n';
        }

        navigator.clipboard.writeText(md);
        alert('Markdown documentation copied to clipboard!');
    };

    const handleThemeToggle = () => {
        setIsDark(!isDark);
        // Theme toggle will be fully implemented in Phase 7 (polish)
    };

    const hasData = !!flowData;

    return (
        <header className="h-11 border-b border-border bg-bg-secondary flex items-center px-4 gap-2">
            {/* Left: app context */}
            <span className="text-xs text-text-muted">
                {schemaModel
                    ? schemaModel.tables.length + ' table' + (schemaModel.tables.length !== 1 ? 's' : '') +
                    ' · ' + schemaModel.relationships.length + ' relationship' + (schemaModel.relationships.length !== 1 ? 's' : '')
                    : 'No schema loaded'}
            </span>

            <div className="flex-1" />

            {/* Right: actions */}
            <div className="flex items-center gap-1">
                <button
                    onClick={handleExportMermaid}
                    disabled={!hasData}
                    className="flex items-center gap-1 px-2 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    title="Export as Mermaid ERD"
                >
                    <Download size={13} />
                    Mermaid
                </button>

                <button
                    onClick={handleExportMarkdown}
                    disabled={!hasData}
                    className="flex items-center gap-1 px-2 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    title="Export as Markdown documentation"
                >
                    <Download size={13} />
                    Markdown
                </button>

                <div className="w-px h-5 bg-border mx-1" />

                <button
                    onClick={handleThemeToggle}
                    className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded transition-colors"
                    title="Toggle theme"
                >
                    {isDark ? <Sun size={14} /> : <Moon size={14} />}
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
