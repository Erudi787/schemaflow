import { useCallback, useRef, useEffect } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { sql } from '@codemirror/lang-sql';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import type { InputMode } from '@/models/schema';
import { Database, Braces, Play, FileText } from 'lucide-react';

interface InputPanelProps {
    value: string;
    mode: InputMode;
    onValueChange: (value: string) => void;
    onModeChange: (mode: InputMode) => void;
    onVisualize: () => void;
    onLoadSample: (sample: 'sql' | 'json') => void;
}

// -- Generic SQL sample (ANSI-style) --
const SQL_SAMPLE_GENERIC = `CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE posts (
  id INTEGER PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  body TEXT,
  author_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE comments (
  id INTEGER PRIMARY KEY,
  content TEXT NOT NULL,
  post_id INTEGER NOT NULL REFERENCES posts(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL
);`;

// -- MySQL-flavored sample --
const SQL_SAMPLE_MYSQL = `CREATE TABLE \`users\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`username\` VARCHAR(50) NOT NULL,
  \`email\` VARCHAR(100) NOT NULL,
  \`role\` ENUM('admin', 'editor', 'viewer') NOT NULL,
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE \`posts\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`title\` VARCHAR(200) NOT NULL,
  \`body\` LONGTEXT,
  \`status\` ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
  \`author_id\` INT UNSIGNED NOT NULL,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT \`fk_posts_author\` FOREIGN KEY (\`author_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE \`comments\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`content\` TEXT NOT NULL,
  \`post_id\` INT UNSIGNED NOT NULL,
  \`user_id\` INT UNSIGNED NOT NULL,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`post_id\`) REFERENCES \`posts\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

// -- PostgreSQL-flavored sample --
const SQL_SAMPLE_PG = `CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email CHARACTER VARYING(100) NOT NULL,
  roles TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE posts (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  body TEXT,
  metadata JSONB DEFAULT '{}',
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE comments (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`;

const SQL_SAMPLES = [
    { label: 'Generic', value: SQL_SAMPLE_GENERIC },
    { label: 'MySQL', value: SQL_SAMPLE_MYSQL },
    { label: 'PostgreSQL', value: SQL_SAMPLE_PG },
];


const JSON_SAMPLE = JSON.stringify({
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    profile: {
        bio: "Software developer",
        avatar_url: "https://example.com/avatar.jpg",
        social: {
            twitter: "@johndoe",
            github: "johndoe"
        }
    },
    posts: [
        {
            id: 101,
            title: "Getting Started with React",
            published_at: "2024-01-15",
            tags: ["react", "javascript"]
        }
    ]
}, null, 2);

export function InputPanel({
    value,
    mode,
    onValueChange,
    onModeChange,
    onVisualize,
    onLoadSample,
}: InputPanelProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);

    // Initialize and update CodeMirror
    useEffect(() => {
        if (!editorRef.current) return;

        // Destroy existing editor
        if (viewRef.current) {
            viewRef.current.destroy();
        }

        const langExtension = mode === 'sql' ? sql() : json();

        const state = EditorState.create({
            doc: value,
            extensions: [
                basicSetup,
                langExtension,
                oneDark,
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        onValueChange(update.state.doc.toString());
                    }
                }),
                EditorView.theme({
                    '&': { height: '100%' },
                    '.cm-scroller': { overflow: 'auto' },
                }),
            ],
        });

        viewRef.current = new EditorView({
            state,
            parent: editorRef.current,
        });

        return () => {
            viewRef.current?.destroy();
            viewRef.current = null;
        };
    }, [mode]); // Recreate when mode changes

    // Sync external value changes (e.g., loading a sample)
    useEffect(() => {
        if (viewRef.current) {
            const currentValue = viewRef.current.state.doc.toString();
            if (currentValue !== value) {
                viewRef.current.dispatch({
                    changes: {
                        from: 0,
                        to: viewRef.current.state.doc.length,
                        insert: value,
                    },
                });
            }
        }
    }, [value]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                onVisualize();
            }
        },
        [onVisualize]
    );

    return (
        <section className="w-[420px] shrink-0 border-r border-border bg-bg-secondary flex flex-col">
            {/* Header with mode toggle */}
            <div className="p-3 border-b border-border flex items-center gap-2">
                {/* Mode toggle buttons */}
                <div className="flex rounded-md border border-border overflow-hidden">
                    <button
                        onClick={() => onModeChange('sql')}
                        className={
                            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ' +
                            (mode === 'sql'
                                ? 'bg-accent text-white'
                                : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover')
                        }
                    >
                        <Database size={12} />
                        SQL
                    </button>
                    <button
                        onClick={() => onModeChange('json')}
                        className={
                            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ' +
                            (mode === 'json'
                                ? 'bg-accent-secondary text-white'
                                : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover')
                        }
                    >
                        <Braces size={12} />
                        JSON
                    </button>
                </div>

                <div className="flex-1" />

                {/* Sample button */}
                <button
                    onClick={() => onLoadSample(mode)}
                    className="flex items-center gap-1 px-2 py-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
                    title="Load sample schema"
                >
                    <FileText size={12} />
                    Sample
                </button>

                {/* Visualize button */}
                <button
                    onClick={onVisualize}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-accent hover:bg-accent-hover text-white rounded-md transition-colors glow-accent"
                >
                    <Play size={12} />
                    Visualize
                </button>
            </div>

            {/* Editor */}
            <div
                ref={editorRef}
                className="flex-1 overflow-hidden"
                onKeyDown={handleKeyDown}
            />
        </section>
    );
}

export { SQL_SAMPLES, JSON_SAMPLE };
