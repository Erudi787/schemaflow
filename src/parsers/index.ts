import type { InputMode, ParseOutcome } from '@/models/schema';
import { parseSql } from '@/parsers/sql/sqlParser';
import { parseJson } from '@/parsers/json/jsonParser';

// ===== Unified Parser Entry =====
// Routes input to the correct parser based on mode.

/**
 * Parse raw input using the specified parser mode.
 */
export function parse(input: string, mode: InputMode): ParseOutcome {
    const trimmed = input.trim();

    if (!trimmed) {
        const hint = mode === 'sql'
            ? 'Paste SQL CREATE TABLE statements and click Visualize.'
            : 'Paste a JSON object or array and click Visualize.';
        return { success: false, error: `Input is empty. ${hint}` };
    }

    switch (mode) {
        case 'sql':
            return parseSql(trimmed);
        case 'json':
            return parseJson(trimmed);
        default:
            return { success: false, error: `Unknown parser mode: ${mode}` };
    }
}

/**
 * Auto-detect input mode by analyzing the content.
 */
export function detectMode(input: string): InputMode {
    const trimmed = input.trim();

    // If it starts with { or [, it's probably JSON
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        return 'json';
    }

    // If it contains CREATE TABLE, it's SQL
    if (/CREATE\s+TABLE/i.test(trimmed)) {
        return 'sql';
    }

    // Default to SQL
    return 'sql';
}

export { parseSql } from '@/parsers/sql/sqlParser';
export { parseJson } from '@/parsers/json/jsonParser';
