# ⚡ SchemaFlow

An interactive schema visualizer that turns SQL DDL and JSON payloads into live ERD and structure diagrams using React Flow. Paste a schema, hit Visualize, and watch relationships come to life — with edge labels showing exactly which columns link to which.

## 📦 Technologies

- `Vite`
- `React.js`
- `TypeScript`
- `React Flow`
- `TailwindCSS`
- `CodeMirror 6`
- `Zustand`
- `Zod`
- `Dagre`
- `Lucide React`

## 🦄 Features

Here's what you can do with SchemaFlow:

- **SQL Visualization**: Paste `CREATE TABLE` and `ALTER TABLE` statements to instantly see an Entity Relationship Diagram with primary keys, foreign keys, nullable indicators, and data types.
  
- **JSON Visualization**: Paste any JSON API response and see its nested structure broken down into interconnected nodes — objects, arrays, and primitives all clearly mapped.

- **Advanced SQL Dialects**: Natively parses PostgreSQL-specific types (`UUID`, `JSONB`, `TIMESTAMPTZ`) and MySQL configurations (`ENUM`, `UNSIGNED`). Automatically handles schema-qualified tables (`"public"."users"`).

- **Complex Relational Parsing**: Robust Dagre layout physics gracefully traces self-referencing table relationships (e.g., `manager_id -> id`) and accurately maps composite primary/foreign keys without crashing.

- **Field-Level Edge Connections**: Edges connect at the exact field row, not just the node center. You can see that `posts.author_id` links to `users.id` with the line going from one field to another.

- **Relationship Labels**: Every edge is labeled with the column linkage (e.g., `comments.post_id → posts.id`) and a relationship badge (`1:N`, `1:1`).

- **Drag & Drop Upload**: Seamlessly drag `.sql` or `.json` files directly onto the editor. SchemaFlow auto-detects the extension and switches parsing modes seamlessly.

- **Responsive Mobile Flow**: A sticky navigation bar on mobile platforms transitions smoothly between code-editing mode and the interactive canvas visualization.
  
- **Visual Node Customization**: Paint specific domains or entities! Every node features an inline Customizer Palette, allowing granular overrides for header, background, and border colors.

- **Multi-Theming Engine**: Beyond standard Light mode, apply gorgeous developer-centric aesthetic presets including **Dracula**, **Nord**, and **Monokai**.

- **Undo / Redo History**: Confidently manipulate layout positions or collapse table schema. Full `Ctrl+Z` / `Ctrl+Y` support lets you reverse non-destructive actions natively on the Canvas.

- **Save & Load Diagrams**: Save visualizations, persist custom node colors, and load them back dynamically across browser reloads via internal storage routing.

- **High-Quality Diagram Exports**: Not just standard code interfaces (Mermaid ERD, Markdown, TypeScript). Natively export the graph framing boundaries cleanly into crisp **PNG, JPEG, and SVG** imagery, featuring togglable transparent backgrounds for sleek presentations.

### 🎯 Keyboard Shortcuts

Speed up your work with these shortcuts:

- **Visualize**: `Ctrl + Enter` to parse and visualize the schema.
- **Save**: `Ctrl + S` to save the current diagram.
- **Undo**: `Ctrl + Z` to undo a canvas layout action.
- **Redo**: `Ctrl + Y` (or `Ctrl+Shift+Z`) to redo a canvas layout action.

## 👩🏽‍🍳 The Process

I started by setting up the project foundation with Vite, React, TypeScript, and TailwindCSS v4. The design system was built first — CSS custom properties for colors, spacing, and typography using Inter and JetBrains Mono from Google Fonts.

Next, I built the data layer: TypeScript types for the schema model (`SchemaTable`, `SchemaField`, `SchemaRelationship`), Zod validation schemas, and two parsers — one for SQL DDL that extracts tables, columns, primary keys, foreign keys, and REFERENCES constraints, and one for JSON that recursively walks nested objects and arrays to infer types and structure.

With the data layer solid, I built the transformation pipeline that converts the internal `SchemaModel` into React Flow nodes and edges, then used Dagre for automatic graph layout. We later expanded this pipeline by integrating custom dynamic styling protocols to track manually injected user color palettes natively tracking across graph rebuilds.

The UI came together piece by piece: custom React Flow nodes with expand/collapse, CodeMirror 6 as the input editor with syntax highlighting, a sidebar for managing saved diagrams, and a complex Undo/Redo historical event stack wrapped over React Flow's native event hooks.

One interesting bug I hit was with the SQL parser — the REFERENCES extraction was matching against an uppercased string, which turned `users` into `USERS`. Since React Flow node IDs are case-sensitive, edges silently failed to render. Took some debugging to catch that one.

## 📚 What I Learned

During this project, I've picked up important skills and a deeper understanding of interactive visualization.

### 🔗 React Flow Internals:

- **Handle System**: Learned how React Flow's handle system works — source vs target handles, handle IDs for per-field connections, and how edges resolve which handle to attach to. Missing or mismatched handle IDs cause silent failures with no visible error in the UI.
- **Bounded Image Generation**: Integrated `html-to-image` mathematically measuring view-ports to perfectly slice image exports capturing precisely only the boundaries established by Dagre.

### 🧩 Parser Design:

- **Mutation Architecture**: Extended the read-only schema paradigm into an extensible parser supporting relational mappings built retroactively by standard DDL dumps (`ALTER TABLE ADD FOREIGN KEY`).

### 📐 Graph Layout with Dagre:

- **Auto Layout**: Used Dagre to compute positions for nodes based on their relationships. Learned how to dynamically formulate node dimensions spanning varied header/field heights.
- **Cyclic Graphs**: Navigated `acyclicer` greedy modes to prevent algorithm failures when users establish self-referential edge connections.

### 🏪 State Management with Zustand:

- **Derived Data Serialization**: Abstracted history mapping alongside complex UI saving structures integrating custom object palettes bound strictly into `localStorage`.

## 💭 How can it be improved?

- Add cloud-based persistence (e.g. Supabase/Firebase) replacing `localStorage`.
- Add a real-time collaboration mode using WebSockets (e.g. Liveblocks or Yjs).

## 🚦 Running the Project

To run the project in your local environment, follow these steps:

1. Clone the repository to your local machine.
2. Run `npm install` in the project directory to install the required dependencies.
3. Run `npm run dev` to get the project started.
4. Open [http://localhost:5173](http://localhost:5173) (or the address shown in your console) in your web browser to view the app.
