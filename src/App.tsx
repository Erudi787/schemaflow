import { useSchemaStore } from '@/store/useSchemaStore';
import { InputPanel, SQL_SAMPLES, JSON_SAMPLE } from '@/components/input/InputPanel';
import { SchemaCanvas } from '@/components/canvas/SchemaCanvas';
import { Toolbar } from '@/components/toolbar/Toolbar';
import { DiagramSidebar } from '@/components/sidebar/DiagramSidebar';
import { ToastContainer } from '@/components/ui/Toast';
import { useTheme } from '@/hooks/useTheme';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { AlertTriangle, X } from 'lucide-react';
import { useCallback, useRef } from 'react';

function App() {
  const {
    sqlInput,
    jsonInput,
    inputMode,
    flowData,
    error,
    setRawInput,
    setInputMode,
    visualize,
  } = useSchemaStore();

  // Compute active input from the correct buffer
  const rawInput = inputMode === 'sql' ? sqlInput : jsonInput;

  const { theme, toggleTheme } = useTheme();
  useKeyboardShortcuts();

  const sqlSampleIndex = useRef(0);

  const handleLoadSample = useCallback(
    (sample: 'sql' | 'json') => {
      if (sample === 'sql') {
        const current = SQL_SAMPLES[sqlSampleIndex.current % SQL_SAMPLES.length];
        setInputMode('sql');
        setRawInput(current.value);
        sqlSampleIndex.current++;
      } else {
        setInputMode('json');
        setRawInput(JSON_SAMPLE);
      }
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

          {/* Error panel */}
          {error && (
            <div
              className="px-4 py-2.5 bg-error/10 border-b border-error/30 flex items-start gap-2.5 text-sm"
              style={{ animation: 'slideDown 0.2s ease-out' }}
            >
              <AlertTriangle size={16} className="text-error shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="text-error/70 font-medium text-xs uppercase tracking-wide">
                  {inputMode === 'sql' ? 'SQL Parse Error' : 'JSON Parse Error'}
                </span>
                <p className="text-error mt-0.5 leading-relaxed">{error}</p>
              </div>
              <button
                onClick={() => useSchemaStore.setState({ error: null })}
                className="p-1 hover:bg-error/20 rounded transition-colors text-error/60 hover:text-error shrink-0"
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
