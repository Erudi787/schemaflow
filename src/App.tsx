import { useSchemaStore } from '@/store/useSchemaStore';
import { InputPanel, SQL_SAMPLES, JSON_SAMPLE } from '@/components/input/InputPanel';
import { SchemaCanvas } from '@/components/canvas/SchemaCanvas';
import { Toolbar } from '@/components/toolbar/Toolbar';
import { DiagramSidebar } from '@/components/sidebar/DiagramSidebar';
import { ToastContainer } from '@/components/ui/Toast';
import { useTheme } from '@/hooks/useTheme';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { AlertTriangle, X, Code2, Network } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

function App() {
  // Mobile responsive layout state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mobileView, setMobileView] = useState<'editor' | 'canvas'>('editor');
  const {
    sqlInput,
    jsonInput,
    inputMode,
    error,
    setRawInput,
    setInputMode,
    visualize,
  } = useSchemaStore();

  const handleVisualize = useCallback(() => {
    visualize();
    // On mobile, auto-switch to canvas view after hitting Visualize
    setMobileView('canvas');
  }, [visualize]);

  // Compute active input from the correct buffer
  const rawInput = inputMode === 'sql' ? sqlInput : jsonInput;

  const { theme, themes, setTheme, toggleTheme } = useTheme();
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
      <div className="flex h-[100dvh] w-screen bg-bg-primary text-text-primary overflow-hidden">
        {/* Sidebar — saved diagrams */}
        <DiagramSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main area */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <Toolbar
            theme={theme}
            themes={themes}
            setTheme={setTheme}
            onToggleTheme={toggleTheme}
            onOpenSidebar={() => setIsSidebarOpen(true)}
          />

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
          <div className="flex-1 flex overflow-hidden relative">

            {/* Editor Pane (Hidden on mobile if viewing canvas) */}
            <div className={`
              absolute inset-0 md:static md:flex md:h-full z-10 bg-bg-primary min-w-0
              ${mobileView === 'editor' ? 'flex' : 'hidden'}
            `}>
              <InputPanel
                value={rawInput}
                mode={inputMode}
                onValueChange={setRawInput}
                onModeChange={setInputMode}
                onVisualize={handleVisualize}
                onLoadSample={handleLoadSample}
              />
            </div>

            {/* Canvas Pane (Hidden on mobile if viewing editor) */}
            {/* Note: We use CSS hiding so React Flow doesn't unmount and lose state */}
            <div className={`
              absolute inset-0 md:static md:flex-1 md:flex md:h-full min-w-0
              ${mobileView === 'canvas' ? 'flex z-20' : 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto'}
            `}>
              <SchemaCanvas />
            </div>

          </div>

          {/* Mobile Bottom Navigation Bar (hidden on md and up) */}
          <div className="md:hidden flex border-t border-border bg-bg-secondary h-14 shrink-0 pb-safe">
            <button
              onClick={() => setMobileView('editor')}
              className={`flex-1 flex flex-col items-center justify-center gap-1 text-xs transition-colors
                           ${mobileView === 'editor' ? 'text-accent font-medium' : 'text-text-muted hover:text-text-secondary'}`}
            >
              <Code2 size={18} />
              Editor
            </button>
            <button
              onClick={() => setMobileView('canvas')}
              className={`flex-1 flex flex-col items-center justify-center gap-1 text-xs transition-colors
                           ${mobileView === 'canvas' ? 'text-accent font-medium' : 'text-text-muted hover:text-text-secondary'}`}
            >
              <Network size={18} />
              Canvas
            </button>
          </div>
        </main>
      </div>

      <ToastContainer />
    </>
  );
}

export default App;
