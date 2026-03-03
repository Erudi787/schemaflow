import { useEffect, useState, useCallback } from 'react';

type Theme = 'dark' | 'light';

const STORAGE_KEY = 'schemaflow:theme';

function getInitialTheme(): Theme {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') return stored;
    } catch { /* ignore */ }
    return 'dark';
}

/**
 * Hook for dark/light theme management.
 * Persists preference to localStorage and applies CSS variables on <html>.
 */
export function useTheme() {
    const [theme, setThemeState] = useState<Theme>(getInitialTheme);

    const applyTheme = useCallback((t: Theme) => {
        const root = document.documentElement;

        if (t === 'light') {
            root.style.setProperty('--color-bg-primary', '#f8f8fc');
            root.style.setProperty('--color-bg-secondary', '#f0f0f8');
            root.style.setProperty('--color-bg-tertiary', '#e8e8f0');
            root.style.setProperty('--color-bg-elevated', '#ffffff');
            root.style.setProperty('--color-bg-hover', '#e0e0f0');
            root.style.setProperty('--color-surface', '#ffffff');
            root.style.setProperty('--color-surface-hover', '#f5f5fa');
            root.style.setProperty('--color-border', '#d8d8e8');
            root.style.setProperty('--color-border-bright', '#c0c0d8');
            root.style.setProperty('--color-text-primary', '#1a1a2e');
            root.style.setProperty('--color-text-secondary', '#4a4a6a');
            root.style.setProperty('--color-text-muted', '#8a8aa0');
            root.style.setProperty('--color-node-sql-bg', '#ebebff');
            root.style.setProperty('--color-node-json-bg', '#e8f8f4');
            root.style.colorScheme = 'light';
        } else {
            root.style.setProperty('--color-bg-primary', '#0a0a0f');
            root.style.setProperty('--color-bg-secondary', '#12121a');
            root.style.setProperty('--color-bg-tertiary', '#1a1a2e');
            root.style.setProperty('--color-bg-elevated', '#222240');
            root.style.setProperty('--color-bg-hover', '#2a2a4a');
            root.style.setProperty('--color-surface', '#16162a');
            root.style.setProperty('--color-surface-hover', '#1e1e38');
            root.style.setProperty('--color-border', '#2a2a4a');
            root.style.setProperty('--color-border-bright', '#3a3a6a');
            root.style.setProperty('--color-text-primary', '#e8e8f0');
            root.style.setProperty('--color-text-secondary', '#a0a0c0');
            root.style.setProperty('--color-text-muted', '#6a6a8a');
            root.style.setProperty('--color-node-sql-bg', '#1a1a3e');
            root.style.setProperty('--color-node-json-bg', '#1a2e2a');
            root.style.colorScheme = 'dark';
        }
    }, []);

    useEffect(() => {
        applyTheme(theme);
    }, [theme, applyTheme]);

    const toggleTheme = useCallback(() => {
        setThemeState((prev) => {
            const next = prev === 'dark' ? 'light' : 'dark';
            try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
            return next;
        });
    }, []);

    return { theme, toggleTheme };
}
