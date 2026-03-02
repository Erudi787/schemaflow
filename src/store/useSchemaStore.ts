import { create } from 'zustand';
import type { InputMode, SchemaModel } from '@/models/schema';
import type { FlowData } from '@/transform/toReactFlow';
import { parse } from '@/parsers';
import { toReactFlow } from '@/transform/toReactFlow';
import { applyLayout, getLayoutDirection } from '@/transform/layout';

interface SchemaStore {
    // Input state
    rawInput: string;
    inputMode: InputMode;

    // Parsed state
    schemaModel: SchemaModel | null;
    flowData: FlowData | null;
    error: string | null;

    // Actions
    setRawInput: (input: string) => void;
    setInputMode: (mode: InputMode) => void;
    visualize: () => void;
    loadSample: (sample: 'sql' | 'json') => void;
    clear: () => void;
}

export const useSchemaStore = create<SchemaStore>((set, get) => ({
    rawInput: '',
    inputMode: 'sql',
    schemaModel: null,
    flowData: null,
    error: null,

    setRawInput: (input) => set({ rawInput: input }),

    setInputMode: (mode) => set({ inputMode: mode, error: null }),

    visualize: () => {
        const { rawInput, inputMode } = get();
        const result = parse(rawInput, inputMode);

        if (!result.success) {
            set({ error: result.error, schemaModel: null, flowData: null });
            return;
        }

        const flow = toReactFlow(result.data);
        const direction = getLayoutDirection(result.data.type);
        const layouted = applyLayout(flow, { direction });

        set({
            schemaModel: result.data,
            flowData: layouted,
            error: null,
        });
    },

    loadSample: (sample) => {
        // Import samples lazily to avoid circular deps
        // Samples are defined in InputPanel, so we set mode and let InputPanel handle the content
        set({ inputMode: sample, error: null });
    },

    clear: () =>
        set({
            rawInput: '',
            schemaModel: null,
            flowData: null,
            error: null,
        }),
}));
