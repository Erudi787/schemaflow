import { z } from 'zod';

// ===== Zod Schemas for Runtime Validation =====
// Mirrors the TypeScript types in schema.ts
// Used to validate parser output at runtime.

export const SchemaFieldSchema: z.ZodType<{
    name: string;
    type: string;
    isPrimaryKey: boolean;
    isForeignKey: boolean;
    isNullable: boolean;
    references?: { table: string; field: string };
    children?: z.infer<typeof SchemaFieldSchema>[];
}> = z.lazy(() =>
    z.object({
        name: z.string().min(1),
        type: z.string().min(1),
        isPrimaryKey: z.boolean(),
        isForeignKey: z.boolean(),
        isNullable: z.boolean(),
        references: z
            .object({
                table: z.string().min(1),
                field: z.string().min(1),
            })
            .optional(),
        children: z.array(SchemaFieldSchema).optional(),
    })
);

export const SchemaTableSchema = z.object({
    name: z.string().min(1),
    fields: z.array(SchemaFieldSchema).min(1),
});

export const SchemaRelationshipSchema = z.object({
    from: z.object({
        table: z.string().min(1),
        field: z.string().min(1),
    }),
    to: z.object({
        table: z.string().min(1),
        field: z.string().min(1),
    }),
    type: z.enum(['one-to-one', 'one-to-many', 'many-to-many']),
});

export const SchemaModelSchema = z.object({
    type: z.enum(['sql', 'json']),
    tables: z.array(SchemaTableSchema).min(1),
    relationships: z.array(SchemaRelationshipSchema),
});

/**
 * Validate a SchemaModel at runtime.
 * Returns the validated data or throws a descriptive error.
 */
export function validateSchemaModel(data: unknown) {
    return SchemaModelSchema.parse(data);
}
