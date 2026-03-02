import { useSchemaStore } from '@/store/useSchemaStore';
import { InputPanel, SQL_SAMPLE, JSON_SAMPLE } from '@/components/input/InputPanel';
import { SchemaCanvas } from '@/components/canvas/SchemaCanvas';
import { Toolbar } from '@/components/toolbar/Toolbar';
import { ToastContainer } from '@/components/ui/Toast';
import { AlertCircle, X } from 'lucide-react';
import { useCallback } from 'react';

function App() {
  const {
    rawInput,
    inputMode,
    flowData,
    error,
    setRawInput,
    setInputMode,
    visualize,
  } = useSchemaStore();

  const handleLoadSample = useCallback(
    (sample: 'sql' | 'json') => {
      const content = sample === 'sql' ? SQL_SAMPLE : JSON_SAMPLE;
      setInputMode(sample);
      setRawInput(content);
    },
    [setInputMode, setRawInput]
  );

  return (
    <>
      <div className="flex h-screen w-screen bg-bg-primary text-text-primary">
        {/* Sidebar — saved diagrams (placeholder for now) */}
        <aside className="w-56 shrink-0 border-r border-border bg-bg-secondary flex flex-col">
          <div className="p-4 border-b border-border">
            <h1 className="text-lg font-bold text-gradient">SchemaFlow</h1>
            <p className="text-[10px] text-text-muted mt-1">Interactive Schema Visualizer</p>
          </div>
          <div className="flex-1 p-3 text-text-muted text-xs">
            <p className="opacity-50">Saved diagrams will appear here</p>
          </div>
        </aside>

        {/* Main area */}
        <main className="flex-1 flex flex-col">
          {/* Toolbar */}
          <Toolbar />

          {/* Error bar */}
          {error && (
            <div className="px-4 py-2 bg-error/10 border-b border-error/30 flex items-center gap-2 text-sm text-error">
              <AlertCircle size={14} />
              <span className="flex-1">{error}</span>
              <button
                onClick={() => useSchemaStore.setState({ error: null })}
                className="p-1 hover:bg-error/20 rounded transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Content: Input Panel + Canvas */}
          <div className="flex-1 flex">
            <InputPanel
              value={rawInput}
              mode={inputMode}
              onValueChange={setRawInput}
              onModeChange={setInputMode}
              onVisualize={visualize}
              onLoadSample={handleLoadSample}
            />

            <SchemaCanvas flowData={flowData} />
          </div>
        </main>
      </div>

      <ToastContainer />
    </>
  );
}

export default App;

