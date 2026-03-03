import { create } from 'zustand';
import type { InputMode, SchemaModel, SavedDiagram } from '@/models/schema';
import type { FlowData } from '@/transform/toReactFlow';
import { parse } from '@/parsers';
import { toReactFlow } from '@/transform/toReactFlow';
import { applyLayout, getLayoutDirection } from '@/transform/layout';
import {
    loadDiagrams,
    saveDiagram as persistDiagram,
    deleteDiagram as removeDiagram,
    generateId,
} from '@/store/persistence';

interface SchemaStore {
    // Input state
    rawInput: string;
    inputMode: InputMode;

    // Parsed state
    schemaModel: SchemaModel | null;
    flowData: FlowData | null;
    error: string | null;

    // Saved diagrams
    savedDiagrams: SavedDiagram[];
    activeDiagramId: string | null;

    // Actions — input
    setRawInput: (input: string) => void;
    setInputMode: (mode: InputMode) => void;
    visualize: () => void;
    clear: () => void;

    // Actions — persistence
    initDiagrams: () => void;
    saveCurrent: (name?: string) => void;
    loadDiagram: (id: string) => void;
    deleteDiagram: (id: string) => void;
    renameDiagram: (id: string, name: string) => void;
}

export const useSchemaStore = create<SchemaStore>((set, get) => ({
    rawInput: '',
    inputMode: 'sql',
    schemaModel: null,
    flowData: null,
    error: null,
    savedDiagrams: [],
    activeDiagramId: null,

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

    clear: () =>
        set({
            rawInput: '',
            schemaModel: null,
            flowData: null,
            error: null,
            activeDiagramId: null,
        }),

    // Persistence actions
    initDiagrams: () => {
        const diagrams = loadDiagrams();
        set({ savedDiagrams: diagrams });
    },

    saveCurrent: (name) => {
        const { rawInput, inputMode, schemaModel, activeDiagramId, savedDiagrams } = get();

        if (!schemaModel) return;

        const now = Date.now();
        const existingDiagram = activeDiagramId
            ? savedDiagrams.find((d) => d.id === activeDiagramId)
            : null;

        const diagram: SavedDiagram = {
            id: activeDiagramId || generateId(),
            name: name || existingDiagram?.name || 'Untitled Diagram',
            rawInput,
            inputMode,
            schemaModel,
            createdAt: existingDiagram?.createdAt || now,
            updatedAt: now,
        };

        persistDiagram(diagram);
        const diagrams = loadDiagrams();
        set({ savedDiagrams: diagrams, activeDiagramId: diagram.id });
    },

    loadDiagram: (id) => {
        const { savedDiagrams } = get();
        const diagram = savedDiagrams.find((d) => d.id === id);
        if (!diagram) return;

        // Restore the diagram state and re-run transformation
        const flow = toReactFlow(diagram.schemaModel);
        const direction = getLayoutDirection(diagram.schemaModel.type);
        const layouted = applyLayout(flow, { direction });

        set({
            rawInput: diagram.rawInput,
            inputMode: diagram.inputMode,
            schemaModel: diagram.schemaModel,
            flowData: layouted,
            error: null,
            activeDiagramId: id,
        });
    },

    deleteDiagram: (id) => {
        removeDiagram(id);
        const diagrams = loadDiagrams();
        const { activeDiagramId } = get();

        set({
            savedDiagrams: diagrams,
            activeDiagramId: activeDiagramId === id ? null : activeDiagramId,
        });
    },

    renameDiagram: (id, name) => {
        const { savedDiagrams } = get();
        const diagram = savedDiagrams.find((d) => d.id === id);
        if (!diagram) return;

        const updated = { ...diagram, name, updatedAt: Date.now() };
        persistDiagram(updated);
        const diagrams = loadDiagrams();
        set({ savedDiagrams: diagrams });
    },
}));
