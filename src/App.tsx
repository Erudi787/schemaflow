function App() {
  return (
    <div className="flex h-screen w-screen bg-bg-primary text-text-primary">
      {/* Sidebar — saved diagrams */}
      <aside className="w-64 shrink-0 border-r border-border bg-bg-secondary flex flex-col">
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-bold text-gradient">SchemaFlow</h1>
          <p className="text-xs text-text-muted mt-1">Interactive Schema Visualizer</p>
        </div>
        <div className="flex-1 p-4 text-text-muted text-sm">
          {/* DiagramSidebar will mount here */}
          <p className="opacity-50">No saved diagrams yet</p>
        </div>
      </aside>

      {/* Main area — input panel + canvas */}
      <main className="flex-1 flex flex-col">
        {/* Toolbar */}
        <header className="h-12 border-b border-border bg-bg-secondary flex items-center px-4 gap-3">
          <span className="text-sm text-text-secondary">Toolbar placeholder</span>
        </header>

        {/* Split: Input | Canvas */}
        <div className="flex-1 flex">
          {/* Input panel */}
          <section className="w-[420px] shrink-0 border-r border-border bg-bg-secondary flex flex-col">
            <div className="p-3 border-b border-border flex items-center gap-2">
              <span className="text-sm font-medium text-text-primary">Input</span>
            </div>
            <div className="flex-1 p-4 text-text-muted text-sm font-mono">
              {/* InputPanel will mount here */}
              <p className="opacity-50">Paste your SQL or JSON here...</p>
            </div>
          </section>

          {/* Canvas */}
          <section className="flex-1 bg-bg-primary relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-bg-tertiary border border-border flex items-center justify-center">
                  <span className="text-2xl">⬡</span>
                </div>
                <p className="text-text-secondary text-sm">Paste a schema and click Visualize</p>
                <p className="text-text-muted text-xs mt-1">SQL CREATE TABLE or JSON API responses</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default App
