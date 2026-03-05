import { useEffect, useState, useCallback } from 'react';

export type Theme = 'default' | 'light' | 'dracula' | 'nord' | 'monokai';

const STORAGE_KEY = 'schemaflow:theme';

const THEMES: Theme[] = ['default', 'light', 'dracula', 'nord', 'monokai'];

function getInitialTheme(): Theme {
    try {
        const stored = localStorage.getItem(STORAGE_KEY) as Theme;
        if (THEMES.includes(stored)) return stored;
    } catch { /* ignore */ }
    return 'default';
}

/**
 * Hook for multi-theme management.
 * Persists preference to localStorage and applies CSS classes (e.g., .theme-dracula) on <html>.
 */
export function useTheme() {
    const [theme, setThemeState] = useState<Theme>(getInitialTheme);

    const applyTheme = useCallback((t: Theme) => {
        const root = document.documentElement;

        // Remove all existing theme classes
        THEMES.forEach(th => root.classList.remove(`theme-${th}`));

        // Apply new theme class
        root.classList.add(`theme-${t}`);

        // Set color scheme for native UI elements (scrollbars, etc.)
        root.style.colorScheme = t === 'light' ? 'light' : 'dark';
    }, []);

    useEffect(() => {
        applyTheme(theme);
    }, [theme, applyTheme]);

    const setTheme = useCallback((t: Theme) => {
        setThemeState(t);
        try { localStorage.setItem(STORAGE_KEY, t); } catch { /* ignore */ }
    }, []);

    const toggleTheme = useCallback(() => {
        setThemeState((prev) => {
            const next = prev === 'default' ? 'light' : 'default';
            try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
            return next;
        });
    }, []);

    return { theme, themes: THEMES, setTheme, toggleTheme };
}
