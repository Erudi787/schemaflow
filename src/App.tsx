import { useSchemaStore } from '@/store/useSchemaStore';
import { InputPanel, SQL_SAMPLE, JSON_SAMPLE } from '@/components/input/InputPanel';
import { SchemaCanvas } from '@/components/canvas/SchemaCanvas';
import { Toolbar } from '@/components/toolbar/Toolbar';
import { DiagramSidebar } from '@/components/sidebar/DiagramSidebar';
import { ToastContainer } from '@/components/ui/Toast';
import { useTheme } from '@/hooks/useTheme';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
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

  const { theme, toggleTheme } = useTheme();
  useKeyboardShortcuts();

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
        {/* Sidebar — saved diagrams */}
        <DiagramSidebar />

        {/* Main area */}
        <main className="flex-1 flex flex-col">
          {/* Toolbar */}
          <Toolbar theme={theme} onToggleTheme={toggleTheme} />

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

