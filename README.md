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

- **SQL Visualization**: Paste `CREATE TABLE` statements and instantly see an Entity Relationship Diagram with primary keys, foreign keys, nullable indicators, and data types.

- **JSON Visualization**: Paste any JSON API response and see its nested structure broken down into interconnected nodes — objects, arrays, and primitives all clearly mapped.

- **Field-Level Edge Connections**: Edges connect at the exact field row, not just the node center. You can see that `posts.author_id` links to `users.id` with the line going from one field to another.

- **Relationship Labels**: Every edge is labeled with the column linkage (e.g., `comments.post_id → posts.id`) and a relationship badge (`1:N`, `1:1`).

- **Save & Load Diagrams**: Save your visualizations with custom names, load them back anytime, rename or delete — all persisted in localStorage.

- **Dark / Light Theme**: Toggle between dark and light modes. Your preference is remembered across sessions.

- **Export Options**: Export your schema as Mermaid ERD, Markdown documentation, TypeScript interfaces, or a mock REST API specification — all copied to clipboard with one click.

- **Interactive Canvas**: Zoom, pan, drag nodes around, expand/collapse table fields, and use the minimap and controls for navigation.

### 🎯 Keyboard Shortcuts

Speed up your work with these shortcuts:

- **Visualize**: `Ctrl + Enter` to parse and visualize the schema.
- **Save**: `Ctrl + S` to save the current diagram.

## 👩🏽‍🍳 The Process

I started by setting up the project foundation with Vite, React, TypeScript, and TailwindCSS v4. The design system was built first — CSS custom properties for colors, spacing, and typography using Inter and JetBrains Mono from Google Fonts.

Next, I built the data layer: TypeScript types for the schema model (`SchemaTable`, `SchemaField`, `SchemaRelationship`), Zod validation schemas, and two parsers — one for SQL DDL that extracts tables, columns, primary keys, foreign keys, and REFERENCES constraints, and one for JSON that recursively walks nested objects and arrays to infer types and structure.

With the data layer solid, I built the transformation pipeline that converts the internal `SchemaModel` into React Flow nodes and edges, then used Dagre for automatic graph layout (top-to-bottom for SQL ERDs, left-to-right for JSON structures).

The UI came together piece by piece: custom React Flow nodes with expand/collapse, CodeMirror 6 as the input editor with syntax highlighting, a sidebar for managing saved diagrams, and a toolbar with export options and theme toggling.

One interesting bug I hit was with the SQL parser — the REFERENCES extraction was matching against an uppercased string, which turned `users` into `USERS`. Since React Flow node IDs are case-sensitive, edges silently failed to render. Took some debugging to catch that one.

The per-field edge connections were another challenge. React Flow needs handles on nodes for edges to attach to. When I had only node-level handles, edges connected at the center. When I added per-field handles, JSON edges broke because the parser uses `"self"` as a sentinel for parent→child relationships. The fix was adding a dedicated `self` handle on JSON node headers.

## 📚 What I Learned

During this project, I've picked up important skills and a deeper understanding of interactive visualization.

### 🔗 React Flow Internals:

- **Handle System**: Learned how React Flow's handle system works — source vs target handles, handle IDs for per-field connections, and how edges resolve which handle to attach to. Missing or mismatched handle IDs cause silent failures with no visible error in the UI.
- **Custom Nodes**: Built custom node components that integrate handles at the field level, giving precise control over where edges connect.

### 🧩 Parser Design:

- **SQL DDL Parsing**: Wrote a regex-based parser that extracts table names, column definitions, types, constraints (PRIMARY KEY, NOT NULL), and REFERENCES from CREATE TABLE statements. Handling edge cases like quoted identifiers, parenthesized type parameters, and table-level vs inline constraints taught me a lot about careful string processing.
- **Recursive JSON Parsing**: Built a recursive descent approach that walks nested JSON to infer types — distinguishing between strings that look like emails, URLs, or dates, and handling arrays of objects by merging all array element fields.

### 📐 Graph Layout with Dagre:

- **Auto Layout**: Used Dagre to compute positions for nodes based on their relationships. Learned about layout direction (TB vs LR), node spacing, and how to estimate node dimensions from field count for proper layout.

### 🎨 Theming with CSS Custom Properties:

- **Dynamic Theming**: Instead of using Tailwind's built-in dark mode classes, I used CSS custom properties that get swapped at runtime. This gives instant theme switching without re-renders, and the preference persists in localStorage.

### 🏪 State Management with Zustand:

- **Derived Actions**: Learned how to build complex derived actions in Zustand — like `saveDiagram` that handles both insert and update, and `loadDiagram` that restores input state and re-runs the entire transformation pipeline.

## 💭 How can it be improved?

- Add support for more SQL dialects (MySQL, PostgreSQL-specific syntax).
- Add cloud-based persistence instead of localStorage.
- Add drag-and-drop file upload for `.sql` files.
- Add a real-time collaboration mode.
- Add more export formats like PNG/SVG image export of the diagram.
- Add support for ALTER TABLE and other DDL statements.
- Add an undo/redo system for canvas manipulations.
- Add responsive design for mobile/tablet usage.

## 🚦 Running the Project

To run the project in your local environment, follow these steps:

1. Clone the repository to your local machine.
2. Run `npm install` in the project directory to install the required dependencies.
3. Run `npm run dev` to get the project started.
4. Open [http://localhost:5173](http://localhost:5173) (or the address shown in your console) in your web browser to view the app.
