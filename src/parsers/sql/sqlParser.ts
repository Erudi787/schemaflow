import type {
    SchemaTable,
    SchemaField,
    SchemaRelationship,
    ParseOutcome,
} from '@/models/schema';

// ===== SQL DDL Parser =====
// Parses CREATE TABLE statements into SchemaModel.
// Supports: MySQL, PostgreSQL, and generic SQL dialects.
// Handles: CREATE TABLE, columns, PRIMARY KEY, FOREIGN KEY, REFERENCES,
//          NOT NULL, AUTO_INCREMENT, SERIAL, UNSIGNED, ENUM, schema.table,
//          multi-word types, array types, ENGINE/CHARSET trailers.

/**
 * Parse SQL DDL input into a SchemaModel.
 */
export function parseSql(input: string): ParseOutcome {
    try {
        const cleaned = stripComments(input);
        const statements = splitStatements(cleaned);
        const tables: SchemaTable[] = [];
        const relationships: SchemaRelationship[] = [];

        for (const stmt of statements) {
            if (/^\s*CREATE\s+TABLE/i.test(stmt)) {
                const result = parseCreateTable(stmt);
                if (!result.success) {
                    return result;
                }
                tables.push(result.table);
                relationships.push(...result.relationships);
            } else if (/^\s*ALTER\s+TABLE/i.test(stmt)) {
                parseAlterTable(stmt, tables, relationships);
            } else if (/^\s*(CREATE\s+(UNIQUE\s+)?INDEX|CREATE\s+SEQUENCE|CREATE\s+EXTENSION|SET\s+|DROP\s+|COMMENT\s+ON|ALTER\s+SEQUENCE|GRANT\s+|REVOKE\s+)/i.test(stmt)) {
                // Safely ignore standard DDL dump metadata that doesn't affect the ERD
                continue;
            }
        }

        if (tables.length === 0) {
            return {
                success: false,
                error: 'No CREATE TABLE statements found. Please provide valid SQL DDL.',
            };
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
    // Remove PostgreSQL hash comments (# ...)
    result = result.replace(/#.*$/gm, '');
    return result;
}

function splitStatements(sql: string): string[] {
    return sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
}

/**
 * Strip MySQL engine/charset trailers that come after the closing paren.
 * e.g., `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
 */
function stripTableTrailer(stmt: string): string {
    // Remove everything after the last closing paren that looks like a MySQL option
    return stmt.replace(
        /\)\s*(ENGINE|DEFAULT\s+CHARSET|CHARSET|COLLATE|AUTO_INCREMENT|COMMENT|ROW_FORMAT|TABLESPACE)\s*=?.*/i,
        ')'
    );
}

interface CreateTableResult {
    success: true;
    table: SchemaTable;
    relationships: SchemaRelationship[];
}

function parseCreateTable(
    rawStmt: string
): CreateTableResult | { success: false; error: string } {
    const stmt = stripTableTrailer(rawStmt);

    // Match: CREATE TABLE [IF NOT EXISTS] [schema.]<name> ( ... )
    // Supports: schema.table, `schema`.`table`, "schema"."table"
    const tableMatch = stmt.match(
        /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([^(]+)\s*\(([\s\S]+)\)/i
    );

    if (!tableMatch) {
        return {
            success: false,
            error: `Could not parse CREATE TABLE statement: ${rawStmt.substring(0, 60)}...`,
        };
    }

    const tableNameRaw = tableMatch[1].trim();
    // Strip quotes and spaces, keep schema dot if present (e.g. "public"."users" -> public.users)
    const tableName = tableNameRaw.replace(/[`"'\[\]\s]/g, '');
    const body = tableMatch[2];

    const fields: SchemaField[] = [];
    const relationships: SchemaRelationship[] = [];
    const tablePrimaryKeys: string[] = [];

    // Split body by commas, respecting parentheses depth and quoted strings
    const lines = splitByComma(body);

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Table-level PRIMARY KEY
        const pkMatch = trimmed.match(
            /^\s*PRIMARY\s+KEY\s*\(([^)]+)\)/i
        );
        if (pkMatch) {
            const keys = pkMatch[1].split(',').map((k) => k.trim().replace(/[`"'\[\]\s]/g, ''));
            tablePrimaryKeys.push(...keys);
            continue;
        }

        // Table-level FOREIGN KEY
        const fkMatch = trimmed.match(
            /^\s*(?:CONSTRAINT\s+[`"'\[]?\w+[`"'\]]?\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([^(]+)\s*\(([^)]+)\)/i
        );
        if (fkMatch) {
            const localFields = fkMatch[1].split(',').map((k) => k.trim().replace(/[`"'\[\]\s]/g, ''));
            const refTableRaw = fkMatch[2].trim();
            const refTable = refTableRaw.replace(/[`"'\[\]\s]/g, '');
            const refFields = fkMatch[3].split(',').map((k) => k.trim().replace(/[`"'\[\]\s]/g, ''));

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

        // Table-level constraints to skip
        if (/^\s*(UNIQUE|CHECK|INDEX|KEY|CONSTRAINT|USING|TABLESPACE|WITH|INHERITS|EXCLUDE|LIKE)/i.test(trimmed)) {
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

/**
 * Mutates tables and relationships array based on ALTER TABLE statement.
 */
function parseAlterTable(
    rawStmt: string,
    tables: SchemaTable[],
    relationships: SchemaRelationship[]
): void {
    // Match: ALTER TABLE [schema.]<name> <action>
    // Name is everything up to the first space or Action keyword
    const match = rawStmt.match(/ALTER\s+TABLE\s+([^\s]+)\s+(.+)/i);
    if (!match) return;

    const tableNameRaw = match[1].trim();
    const tableName = tableNameRaw.replace(/[`"'\[\]\s]/g, '');
    const actionStr = match[2].trim();

    const table = tables.find((t) => t.name === tableName);
    if (!table) return; // Table not found

    // Support: ADD [CONSTRAINT <name>] FOREIGN KEY (<col>) REFERENCES <table>(<col>)
    const fkMatch = actionStr.match(
        /ADD\s+(?:CONSTRAINT\s+[`"'\[]?\w+[`"'\]]?\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([^(]+)\s*\(([^)]+)\)/i
    );
    if (fkMatch) {
        const localFields = fkMatch[1].split(',').map((k) => k.trim().replace(/[`"'\[\]\s]/g, ''));
        const refTableRaw = fkMatch[2].trim();
        const refTable = refTableRaw.replace(/[`"'\[\]\s]/g, '');
        const refFields = fkMatch[3].split(',').map((k) => k.trim().replace(/[`"'\[\]\s]/g, ''));

        for (let i = 0; i < localFields.length; i++) {
            const existingField = table.fields.find((f) => f.name === localFields[i]);
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
        return;
    }

    // Support: ADD [CONSTRAINT <name>] PRIMARY KEY (<col>)
    const pkMatch = actionStr.match(/ADD\s+(?:CONSTRAINT\s+[`"'\[]?\w+[`"'\]]?\s+)?PRIMARY\s+KEY\s*\(([^)]+)\)/i);
    if (pkMatch) {
        const keys = pkMatch[1].split(',').map((k) => k.trim().replace(/[`"'\[\]\s]/g, ''));
        for (const pkName of keys) {
            const field = table.fields.find((f) => f.name === pkName);
            if (field) {
                field.isPrimaryKey = true;
            }
        }
        return;
    }

    // Support: ADD [COLUMN] <col_def>
    const colMatch = actionStr.match(/ADD\s+(?:COLUMN\s+)?(.+)/i);
    if (colMatch) {
        const field = parseColumnDef(colMatch[1].trim(), tableName, relationships);
        if (field) {
            table.fields.push(field);
        }
    }
}

/**
 * Known multi-word SQL types that should be captured as a single type.
 */
const MULTI_WORD_TYPES: Record<string, string> = {
    'DOUBLE PRECISION': 'DOUBLE PRECISION',
    'CHARACTER VARYING': 'VARCHAR',
    'TIMESTAMP WITHOUT TIME ZONE': 'TIMESTAMP',
    'TIMESTAMP WITH TIME ZONE': 'TIMESTAMPTZ',
    'TIME WITHOUT TIME ZONE': 'TIME',
    'TIME WITH TIME ZONE': 'TIMETZ',
    'BIT VARYING': 'BIT VARYING',
    'LONG TEXT': 'LONGTEXT',
    'MEDIUM TEXT': 'MEDIUMTEXT',
    'TINY INT': 'TINYINT',
    'SMALL INT': 'SMALLINT',
    'BIG INT': 'BIGINT',
    'LONG BLOB': 'LONGBLOB',
    'MEDIUM BLOB': 'MEDIUMBLOB',
    'TINY BLOB': 'TINYBLOB',
};

function parseColumnDef(
    line: string,
    tableName: string,
    relationships: SchemaRelationship[]
): SchemaField | null {
    // First, try to match multi-word types before the single-word regex
    let name: string | null = null;
    let type = '';
    let constraintsRaw = '';
    let constraintsUpper = '';
    let matched = false;

    // Try matching multi-word types first
    for (const multiType of Object.keys(MULTI_WORD_TYPES)) {
        const pattern = new RegExp(
            `^[\\x60"'\\[]?(\\w+)[\\x60"'\\]]?\\s+(${multiType})\\b(.*)$`,
            'i'
        );
        const m = line.match(pattern);
        if (m) {
            name = m[1];
            type = MULTI_WORD_TYPES[multiType];
            constraintsRaw = m[3] || '';
            constraintsUpper = constraintsRaw.toUpperCase();
            matched = true;
            break;
        }
    }

    // Fallback to single-word type match
    if (!matched) {
        // Match: <name> <type>[(<params>)][[][]] [constraints...]
        // Supports: INT, VARCHAR(255), TEXT[], ENUM('a','b','c'), SERIAL, etc.
        const colMatch = line.match(
            /^[`"'\[]?(\w+)[`"'\]]?\s+([\w]+(?:\s*\([^)]*\))?(?:\[\])?)\s*(.*)/i
        );
        if (!colMatch) return null;

        name = colMatch[1];
        type = colMatch[2].toUpperCase();
        constraintsRaw = colMatch[3] || '';
        constraintsUpper = constraintsRaw.toUpperCase();
    }

    if (!name) return null;

    // Strip UNSIGNED from type (MySQL)
    type = type.replace(/\s*UNSIGNED/i, '').trim();

    // Check for UNSIGNED in constraints too
    constraintsUpper = constraintsUpper.replace(/\bUNSIGNED\b/i, '').trim();

    // Detect SERIAL/BIGSERIAL as auto-increment PK types (PostgreSQL)
    const isSerialType = /^(SERIAL|BIGSERIAL|SMALLSERIAL)$/i.test(type);

    const isPrimaryKey = /PRIMARY\s+KEY/i.test(constraintsUpper) || isSerialType || /AUTO_INCREMENT/i.test(constraintsUpper);
    const isForeignKey = /REFERENCES/i.test(constraintsUpper);
    const isNullable = !/NOT\s+NULL/i.test(constraintsUpper) && !isPrimaryKey;

    // Normalize SERIAL types for display
    if (isSerialType) {
        if (/^BIGSERIAL$/i.test(type)) type = 'BIGINT';
        else if (/^SMALLSERIAL$/i.test(type)) type = 'SMALLINT';
        else type = 'INTEGER';
    }

    let references: SchemaField['references'];

    if (isForeignKey) {
        // Match against the original-casing constraint string to preserve table/field names
        // Support schema.table references
        const refMatch = constraintsRaw.match(
            /REFERENCES\s+([^(]+)\s*\(([^)]+)\)/i
        );
        if (refMatch) {
            const refTableRaw = refMatch[1].trim();
            const refTable = refTableRaw.replace(/[`"'\[\]\s]/g, '');
            const refField = refMatch[2].trim().replace(/[`"'\[\]\s]/g, '');
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
    let inSingleQuote = false;
    let inDoubleQuote = false;

    for (let i = 0; i < body.length; i++) {
        const char = body[i];
        const prevChar = i > 0 ? body[i - 1] : '';

        // Track quote state (skip escaped quotes)
        if (char === "'" && !inDoubleQuote && prevChar !== '\\') {
            inSingleQuote = !inSingleQuote;
        }
        if (char === '"' && !inSingleQuote && prevChar !== '\\') {
            inDoubleQuote = !inDoubleQuote;
        }

        // Track parentheses depth (only outside quotes)
        if (!inSingleQuote && !inDoubleQuote) {
            if (char === '(') depth++;
            if (char === ')') depth--;
            if (char === ',' && depth === 0) {
                parts.push(current);
                current = '';
                continue;
            }
        }

        current += char;
    }
    if (current.trim()) parts.push(current);

    return parts;
}
