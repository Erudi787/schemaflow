import { useEffect } from 'react';
import { useSchemaStore } from '@/store/useSchemaStore';
import { showToast } from '@/components/ui/Toast';

/**
 * Global keyboard shortcuts hook.
 * Ctrl+Enter → Visualize
 * Ctrl+S → Save current diagram
 */
export function useKeyboardShortcuts() {
    const visualize = useSchemaStore((s) => s.visualize);
    const saveCurrent = useSchemaStore((s) => s.saveCurrent);
    const schemaModel = useSchemaStore((s) => s.schemaModel);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const mod = e.ctrlKey || e.metaKey;

            // Ctrl+Enter → Visualize
            if (mod && e.key === 'Enter') {
                e.preventDefault();
                visualize();
            }

            // Ctrl+S → Save
            if (mod && e.key === 's') {
                e.preventDefault();
                if (schemaModel) {
                    saveCurrent();
                    showToast('success', 'Diagram saved');
                }
            }
        };

        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [visualize, saveCurrent, schemaModel]);
}
