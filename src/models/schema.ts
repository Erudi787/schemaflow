// ===== Core Schema Model Types =====
// The canonical internal representation.
// Parsers write to it, visualization reads from it.

export interface SchemaField {
    name: string;
    type: string;
    isPrimaryKey: boolean;
    isForeignKey: boolean;
    isNullable: boolean;
    references?: { table: string; field: string };
    children?: SchemaField[]; // For nested JSON structures
}

export interface SchemaTable {
    name: string;
    fields: SchemaField[];
}

export type RelationshipType = 'one-to-one' | 'one-to-many' | 'many-to-many';

export interface SchemaRelationship {
    from: { table: string; field: string };
    to: { table: string; field: string };
    type: RelationshipType;
}

export type InputMode = 'sql' | 'json';

export interface SchemaModel {
    type: InputMode;
    tables: SchemaTable[];
    relationships: SchemaRelationship[];
}

export interface SavedDiagram {
    id: string;
    name: string;
    rawInput: string;
    inputMode: InputMode;
    schemaModel: SchemaModel;
    nodeStyles?: Record<string, any>;
    createdAt: number;
    updatedAt: number;
}

export interface ParseResult {
    success: true;
    data: SchemaModel;
}

export interface ParseError {
    success: false;
    error: string;
    line?: number;
    column?: number;
}

export type ParseOutcome = ParseResult | ParseError;
