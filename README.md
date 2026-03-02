# SchemaFlow

**Interactive API & Database Documentation Tool**

Convert SQL schemas and JSON payloads into live, visual, interactive ERD and structure diagrams.

## Tech Stack

- **React 19** + **TypeScript** — UI framework
- **Vite 7** — Build tool with HMR
- **React Flow** (`@xyflow/react`) — Interactive graph rendering
- **TailwindCSS v4** — Utility-first styling
- **CodeMirror 6** — Code editor with SQL/JSON highlighting
- **Zustand** — Lightweight state management
- **Zod** — Runtime schema validation
- **dagre** — Automatic graph layout

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to start using SchemaFlow.

## Features (MVP)

- 📝 **SQL Parser** — Paste `CREATE TABLE` DDL and see an ERD
- 🔮 **JSON Parser** — Paste JSON API responses and see the structure
- 🎨 **Interactive Canvas** — Zoom, pan, drag, expand/collapse nodes
- 💾 **Local Persistence** — Save and reload your diagrams
- 🌙 **Dark/Light Theme** — Toggle between themes

## Project Structure

```
src/
├── components/     # UI components (canvas, input, sidebar, toolbar)
├── parsers/        # SQL and JSON parsers
├── models/         # TypeScript types and Zod schemas
├── transform/      # SchemaModel → React Flow conversion
├── store/          # Zustand state management
├── features/       # Mock API, export (post-MVP)
├── hooks/          # Custom React hooks
└── lib/            # Utilities
```

## License

MIT
