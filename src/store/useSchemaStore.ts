import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import type { Node, Edge, NodeChange, EdgeChange } from '@xyflow/react';
import type { InputMode, SchemaModel, SavedDiagram } from '@/models/schema';
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
    // Input state — separate buffers per tab
    sqlInput: string;
    jsonInput: string;
    inputMode: InputMode;

    // Parsed state
    schemaModel: SchemaModel | null;
    nodes: Node[];
    edges: Edge[];
    error: string | null;

    // History state
    pastNodes: Node[][];
    futureNodes: Node[][];

    // Saved diagrams
    savedDiagrams: SavedDiagram[];
    activeDiagramId: string | null;

    // Actions — input
    getRawInput: () => string;
    setRawInput: (input: string) => void;
    setInputMode: (mode: InputMode) => void;
    visualize: () => void;
    clear: () => void;

    // React Flow handlers
    onNodesChange: (changes: NodeChange[]) => void;
    onEdgesChange: (changes: EdgeChange[]) => void;
    setNodes: (nodes: Node[]) => void;
    setEdges: (edges: Edge[]) => void;

    // History actions
    saveHistorySnapshot: () => void;
    undo: () => void;
    redo: () => void;

    // Actions — persistence
    initDiagrams: () => void;
    saveCurrent: (name?: string) => void;
    loadDiagram: (id: string) => void;
    deleteDiagram: (id: string) => void;
    renameDiagram: (id: string, name: string) => void;
}

export const useSchemaStore = create<SchemaStore>((set, get) => ({
    sqlInput: '',
    jsonInput: '',
    inputMode: 'sql',
    schemaModel: null,
    nodes: [],
    edges: [],
    error: null,
    pastNodes: [],
    futureNodes: [],
    savedDiagrams: [],
    activeDiagramId: null,

    getRawInput: () => {
        const { inputMode, sqlInput, jsonInput } = get();
        return inputMode === 'sql' ? sqlInput : jsonInput;
    },

    setRawInput: (input) => {
        const { inputMode } = get();
        if (inputMode === 'sql') {
            set({ sqlInput: input });
        } else {
            set({ jsonInput: input });
        }
    },

    setInputMode: (mode) => set({ inputMode: mode, error: null }),

    visualize: () => {
        const state = get();
        const rawInput = state.inputMode === 'sql' ? state.sqlInput : state.jsonInput;
        const result = parse(rawInput, state.inputMode);

        if (!result.success) {
            set({ error: result.error, schemaModel: null, nodes: [], edges: [] });
            return;
        }

        const flow = toReactFlow(result.data);
        const direction = getLayoutDirection(result.data.type);
        const layouted = applyLayout(flow, { direction });

        // Preserve custom node styles across visualize re-renders
        const existingStyles = new Map(state.nodes.map(n => [n.id, (n.data as any).style]));

        const preservedNodes = layouted.nodes.map(node => {
            const style = existingStyles.get(node.id);
            if (style) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        style
                    }
                };
            }
            return node;
        });

        set({
            schemaModel: result.data,
            nodes: preservedNodes,
            edges: layouted.edges,
            error: null,
            pastNodes: [],
            futureNodes: [],
        });
    },

    clear: () => {
        const { inputMode } = get();
        set({
            ...(inputMode === 'sql' ? { sqlInput: '' } : { jsonInput: '' }),
            schemaModel: null,
            nodes: [],
            edges: [],
            error: null,
            pastNodes: [],
            futureNodes: [],
            activeDiagramId: null,
        });
    },

    // History actions
    saveHistorySnapshot: () => {
        const { nodes, pastNodes } = get();
        if (nodes.length === 0) return;
        // Keep max 50 history states
        const newPast = [...pastNodes, nodes].slice(-50);
        set({ pastNodes: newPast, futureNodes: [] });
    },

    undo: () => {
        const { nodes, pastNodes, futureNodes } = get();
        if (pastNodes.length === 0) return;

        const previousNodes = pastNodes[pastNodes.length - 1];
        const newPast = pastNodes.slice(0, -1);
        const newFuture = [nodes, ...futureNodes];

        set({
            nodes: previousNodes,
            pastNodes: newPast,
            futureNodes: newFuture,
        });
    },

    redo: () => {
        const { nodes, pastNodes, futureNodes } = get();
        if (futureNodes.length === 0) return;

        const nextNodes = futureNodes[0];
        const newFuture = futureNodes.slice(1);
        const newPast = [...pastNodes, nodes];

        set({
            nodes: nextNodes,
            pastNodes: newPast,
            futureNodes: newFuture,
        });
    },

    // React Flow internal handlers
    onNodesChange: (changes) => {
        set({ nodes: applyNodeChanges(changes, get().nodes) });
    },

    onEdgesChange: (changes) => {
        set({ edges: applyEdgeChanges(changes, get().edges) });
    },

    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),

    // Persistence actions
    initDiagrams: () => {
        const diagrams = loadDiagrams();
        set({ savedDiagrams: diagrams });
    },

    saveCurrent: (name) => {
        const state = get();
        const rawInput = state.inputMode === 'sql' ? state.sqlInput : state.jsonInput;

        if (!state.schemaModel) return;

        const now = Date.now();
        const existingDiagram = state.activeDiagramId
            ? state.savedDiagrams.find((d) => d.id === state.activeDiagramId)
            : null;

        const nodeStyles: Record<string, any> = {};
        state.nodes.forEach(n => {
            if ((n.data as any).style) {
                nodeStyles[n.id] = (n.data as any).style;
            }
        });

        const diagram: SavedDiagram = {
            id: state.activeDiagramId || generateId(),
            name: name || existingDiagram?.name || 'Untitled Diagram',
            rawInput,
            inputMode: state.inputMode,
            schemaModel: state.schemaModel,
            nodeStyles,
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

        // Restore custom node styles if they exist in the saved diagram
        const preservedNodes = layouted.nodes.map(node => {
            if (diagram.nodeStyles && diagram.nodeStyles[node.id]) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        style: diagram.nodeStyles[node.id]
                    }
                };
            }
            return node;
        });

        // Write to the correct input buffer based on the diagram's mode
        const inputUpdate = diagram.inputMode === 'sql'
            ? { sqlInput: diagram.rawInput }
            : { jsonInput: diagram.rawInput };

        set({
            ...inputUpdate,
            inputMode: diagram.inputMode,
            schemaModel: diagram.schemaModel,
            nodes: preservedNodes,
            edges: layouted.edges,
            error: null,
            pastNodes: [],
            futureNodes: [],
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
