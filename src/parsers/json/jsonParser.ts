import type {
    SchemaTable,
    SchemaField,
    SchemaRelationship,
    ParseOutcome,
} from '@/models/schema';

// ===== JSON Schema Parser =====
// Recursively parses JSON payloads into SchemaModel.
// Handles: flat objects, nested objects, arrays, arrays-of-objects as sub-tables.

/**
 * Parse JSON input into a SchemaModel.
 */
export function parseJson(input: string): ParseOutcome {
    try {
        const parsed = JSON.parse(input);
        const tables: SchemaTable[] = [];
        const relationships: SchemaRelationship[] = [];

        if (Array.isArray(parsed)) {
            // Top-level array -> infer table from first element
            if (parsed.length === 0) {
                return { success: false, error: 'Empty array — cannot infer schema.' };
            }
            const first = parsed[0];
            if (typeof first !== 'object' || first === null) {
                return {
                    success: false,
                    error: 'Top-level array must contain objects to form a table.',
                };
            }
            processObject('Root', first, tables, relationships);
        } else if (typeof parsed === 'object' && parsed !== null) {
            // Top-level object -> single table
            processObject('Root', parsed, tables, relationships);
        } else {
            return {
                success: false,
                error: 'Expected an object or array, got ' + typeof parsed + '.',
            };
        }

        if (tables.length === 0) {
            return { success: false, error: 'Could not extract any tables from JSON.' };
        }

        return {
            success: true,
            data: {
                type: 'json',
                tables,
                relationships,
            },
        };
    } catch (err) {
        if (err instanceof SyntaxError) {
            const posMatch = err.message.match(/position\s+(\d+)/i);
            return {
                success: false,
                error: 'Invalid JSON: ' + err.message,
                column: posMatch ? parseInt(posMatch[1], 10) : undefined,
            };
        }
        return {
            success: false,
            error: 'JSON parsing failed: ' + (err instanceof Error ? err.message : String(err)),
        };
    }
}

// ===== Internal Helpers =====

function processObject(
    tableName: string,
    obj: Record<string, unknown>,
    tables: SchemaTable[],
    relationships: SchemaRelationship[]
): void {
    const fields: SchemaField[] = [];

    for (const [key, value] of Object.entries(obj)) {
        const field = inferField(key, value, tableName, tables, relationships);
        fields.push(field);
    }

    if (fields.length > 0) {
        tables.push({ name: tableName, fields });
    }
}

function inferField(
    key: string,
    value: unknown,
    parentTable: string,
    tables: SchemaTable[],
    relationships: SchemaRelationship[]
): SchemaField {
    if (value === null || value === undefined) {
        return {
            name: key,
            type: 'null',
            isPrimaryKey: isLikelyPrimaryKey(key),
            isForeignKey: false,
            isNullable: true,
        };
    }

    if (Array.isArray(value)) {
        return handleArrayField(key, value, parentTable, tables, relationships);
    }

    if (typeof value === 'object') {
        // Nested object -> create sub-table + relationship
        const childTableName = capitalizeFirst(key);
        processObject(
            childTableName,
            value as Record<string, unknown>,
            tables,
            relationships
        );

        relationships.push({
            from: { table: parentTable, field: key },
            to: { table: childTableName, field: 'self' },
            type: 'one-to-one',
        });

        return {
            name: key,
            type: 'object',
            isPrimaryKey: false,
            isForeignKey: true,
            isNullable: false,
            references: { table: childTableName, field: 'self' },
            children: tables.find((t) => t.name === childTableName)?.fields,
        };
    }

    // Primitive
    return {
        name: key,
        type: inferPrimitiveType(value),
        isPrimaryKey: isLikelyPrimaryKey(key),
        isForeignKey: isLikelyForeignKey(key),
        isNullable: false,
    };
}

function handleArrayField(
    key: string,
    arr: unknown[],
    parentTable: string,
    tables: SchemaTable[],
    relationships: SchemaRelationship[]
): SchemaField {
    if (arr.length === 0) {
        return {
            name: key,
            type: 'array<unknown>',
            isPrimaryKey: false,
            isForeignKey: false,
            isNullable: false,
        };
    }

    const first = arr[0];

    if (typeof first === 'object' && first !== null && !Array.isArray(first)) {
        // Array of objects -> sub-table with one-to-many relationship
        const childTableName = capitalizeFirst(key);
        processObject(
            childTableName,
            first as Record<string, unknown>,
            tables,
            relationships
        );

        relationships.push({
            from: { table: parentTable, field: key },
            to: { table: childTableName, field: 'self' },
            type: 'one-to-many',
        });

        return {
            name: key,
            type: 'array<' + childTableName + '>',
            isPrimaryKey: false,
            isForeignKey: true,
            isNullable: false,
            references: { table: childTableName, field: 'self' },
            children: tables.find((t) => t.name === childTableName)?.fields,
        };
    }

    // Array of primitives
    const elemType = inferPrimitiveType(first);
    return {
        name: key,
        type: 'array<' + elemType + '>',
        isPrimaryKey: false,
        isForeignKey: false,
        isNullable: false,
    };
}

function inferPrimitiveType(value: unknown): string {
    if (typeof value === 'string') {
        // Check for common patterns
        if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
        if (/^https?:\/\//.test(value)) return 'url';
        if (/^[^@]+@[^@]+\.[^@]+$/.test(value)) return 'email';
        return 'string';
    }
    if (typeof value === 'number') {
        return Number.isInteger(value) ? 'integer' : 'float';
    }
    if (typeof value === 'boolean') return 'boolean';
    return typeof value;
}

function isLikelyPrimaryKey(key: string): boolean {
    const lower = key.toLowerCase();
    return lower === 'id' || lower === '_id' || lower === 'uuid';
}

function isLikelyForeignKey(key: string): boolean {
    const lower = key.toLowerCase();
    return lower.endsWith('_id') || lower.endsWith('id') && lower !== 'id';
}

function capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
