import type {
    SchemaTable,
    SchemaField,
    SchemaRelationship,
    ParseOutcome,
} from '@/models/schema';

// ===== SQL DDL Parser =====
// Parses CREATE TABLE statements into SchemaModel.
// Supports: CREATE TABLE, columns, PRIMARY KEY, FOREIGN KEY ... REFERENCES, NOT NULL.

/**
 * Parse SQL DDL input into a SchemaModel.
 */
export function parseSql(input: string): ParseOutcome {
    try {
        const cleaned = stripComments(input);
        const statements = splitStatements(cleaned);
        const createStatements = statements.filter((s) =>
            /^\s*CREATE\s+TABLE/i.test(s)
        );

        if (createStatements.length === 0) {
            return {
                success: false,
                error: 'No CREATE TABLE statements found. Please provide valid SQL DDL.',
            };
        }

        const tables: SchemaTable[] = [];
        const relationships: SchemaRelationship[] = [];

        for (const stmt of createStatements) {
            const result = parseCreateTable(stmt);
            if (!result.success) {
                return result;
            }
            tables.push(result.table);
            relationships.push(...result.relationships);
        }

        return {
            success: true,
            data: {
                type: 'sql',
                tables,
                relationships,
            },
        };
    } catch (err) {
        return {
            success: false,
            error: `SQL parsing failed: ${err instanceof Error ? err.message : String(err)}`,
        };
    }
}

// ===== Internal Helpers =====

function stripComments(sql: string): string {
    // Remove single-line comments (-- ...)
    let result = sql.replace(/--.*$/gm, '');
    // Remove multi-line comments (/* ... */)
    result = result.replace(/\/\*[\s\S]*?\*\//g, '');
    return result;
}

function splitStatements(sql: string): string[] {
    return sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
}

interface CreateTableResult {
    success: true;
    table: SchemaTable;
    relationships: SchemaRelationship[];
}

function parseCreateTable(
    stmt: string
): CreateTableResult | { success: false; error: string } {
    // Match: CREATE TABLE [IF NOT EXISTS] <name> ( ... )
    const tableMatch = stmt.match(
        /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"'\[]?(\w+)[`"'\]]?\s*\(([\s\S]+)\)/i
    );

    if (!tableMatch) {
        return {
            success: false,
            error: `Could not parse CREATE TABLE statement: ${stmt.substring(0, 60)}...`,
        };
    }

    const tableName = tableMatch[1];
    const body = tableMatch[2];

    const fields: SchemaField[] = [];
    const relationships: SchemaRelationship[] = [];
    const tablePrimaryKeys: string[] = [];

    // Split body by commas, respecting parentheses depth
    const lines = splitByComma(body);

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Table-level PRIMARY KEY
        const pkMatch = trimmed.match(
            /^\s*PRIMARY\s+KEY\s*\(([^)]+)\)/i
        );
        if (pkMatch) {
            const keys = pkMatch[1].split(',').map((k) => k.trim().replace(/[`"'\[\]]/g, ''));
            tablePrimaryKeys.push(...keys);
            continue;
        }

        // Table-level FOREIGN KEY
        const fkMatch = trimmed.match(
            /^\s*(?:CONSTRAINT\s+\w+\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+[`"'\[]?(\w+)[`"'\]]?\s*\(([^)]+)\)/i
        );
        if (fkMatch) {
            const localFields = fkMatch[1].split(',').map((k) => k.trim().replace(/[`"'\[\]]/g, ''));
            const refTable = fkMatch[2];
            const refFields = fkMatch[3].split(',').map((k) => k.trim().replace(/[`"'\[\]]/g, ''));

            for (let i = 0; i < localFields.length; i++) {
                // Mark the matching field as FK
                const existingField = fields.find((f) => f.name === localFields[i]);
                if (existingField) {
                    existingField.isForeignKey = true;
                    existingField.references = {
                        table: refTable,
                        field: refFields[i] || refFields[0],
                    };
                }

                relationships.push({
                    from: { table: tableName, field: localFields[i] },
                    to: { table: refTable, field: refFields[i] || refFields[0] },
                    type: 'one-to-many',
                });
            }
            continue;
        }

        // Table-level UNIQUE, CHECK, INDEX — skip
        if (/^\s*(UNIQUE|CHECK|INDEX|KEY|CONSTRAINT)/i.test(trimmed)) {
            continue;
        }

        // Column definition
        const field = parseColumnDef(trimmed, tableName, relationships);
        if (field) {
            fields.push(field);
        }
    }

    // Apply table-level PRIMARY KEY
    for (const pkName of tablePrimaryKeys) {
        const field = fields.find((f) => f.name === pkName);
        if (field) {
            field.isPrimaryKey = true;
        }
    }

    if (fields.length === 0) {
        return {
            success: false,
            error: `No columns found in table "${tableName}".`,
        };
    }

    return {
        success: true,
        table: { name: tableName, fields },
        relationships,
    };
}

function parseColumnDef(
    line: string,
    tableName: string,
    relationships: SchemaRelationship[]
): SchemaField | null {
    // Match: <name> <type> [constraints...]
    const colMatch = line.match(
        /^[`"'\[]?(\w+)[`"'\]]?\s+([\w]+(?:\s*\([^)]*\))?)\s*(.*)/i
    );
    if (!colMatch) return null;

    const name = colMatch[1];
    const type = colMatch[2].toUpperCase();
    const constraints = colMatch[3].toUpperCase();

    const isPrimaryKey = /PRIMARY\s+KEY/i.test(constraints);
    const isForeignKey = /REFERENCES/i.test(constraints);
    const isNullable = !/NOT\s+NULL/i.test(constraints) && !isPrimaryKey;

    let references: SchemaField['references'];

    if (isForeignKey) {
        const refMatch = constraints.match(
            /REFERENCES\s+[`"'\[]?(\w+)[`"'\]]?\s*\(([^)]+)\)/i
        );
        if (refMatch) {
            const refTable = refMatch[1];
            const refField = refMatch[2].trim().replace(/[`"'\[\]]/g, '');
            references = { table: refTable, field: refField };

            relationships.push({
                from: { table: tableName, field: name },
                to: { table: refTable, field: refField },
                type: 'one-to-many',
            });
        }
    }

    return {
        name,
        type,
        isPrimaryKey,
        isForeignKey,
        isNullable,
        references,
    };
}

function splitByComma(body: string): string[] {
    const parts: string[] = [];
    let current = '';
    let depth = 0;

    for (const char of body) {
        if (char === '(') depth++;
        if (char === ')') depth--;
        if (char === ',' && depth === 0) {
            parts.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    if (current.trim()) parts.push(current);

    return parts;
}
