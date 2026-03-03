import type { SavedDiagram } from '@/models/schema';

// ===== localStorage Persistence Adapter =====
// Saves and loads diagrams from localStorage.

const STORAGE_KEY = 'schemaflow:diagrams';

/**
 * Load all saved diagrams from localStorage.
 */
export function loadDiagrams(): SavedDiagram[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed;
    } catch {
        return [];
    }
}

/**
 * Save a diagram to localStorage (insert or update).
 */
export function saveDiagram(diagram: SavedDiagram): void {
    const existing = loadDiagrams();
    const index = existing.findIndex((d) => d.id === diagram.id);

    if (index >= 0) {
        existing[index] = diagram;
    } else {
        existing.unshift(diagram); // newest first
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

/**
 * Delete a saved diagram by ID.
 */
export function deleteDiagram(id: string): void {
    const existing = loadDiagrams();
    const filtered = existing.filter((d) => d.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Generate a unique ID.
 */
export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}
