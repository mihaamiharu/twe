import type { editor } from 'monaco-editor';

// Custom dark theme matching app design
export const CUSTOM_DARK_THEME: editor.IStandaloneThemeData = {
    base: 'vs-dark',
    inherit: true,
    rules: [
        { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'c084fc' },
        { token: 'string', foreground: '4ade80' },
        { token: 'number', foreground: 'f59e0b' },
        { token: 'function', foreground: '60a5fa' },
        { token: 'variable', foreground: 'e2e8f0' },
        { token: 'type', foreground: '22d3ee' },
    ],
    colors: {
        'editor.background': '#0f172a', // slate-900
        'editor.foreground': '#e2e8f0', // slate-200
        'editor.lineHighlightBackground': '#1e293b', // slate-800
        'editor.selectionBackground': '#334155', // slate-700
        'editorCursor.foreground': '#22d3ee', // cyan-400
        'editor.inactiveSelectionBackground': '#1e293b',
        'editorLineNumber.foreground': '#475569', // slate-600
        'editorLineNumber.activeForeground': '#94a3b8', // slate-400
        'editorIndentGuide.background1': '#1e293b',
        'editorGutter.background': '#0f172a',
        'scrollbarSlider.background': '#33415580',
        'scrollbarSlider.hoverBackground': '#47556980',
    },
};

// Custom light theme matching app design
export const CUSTOM_LIGHT_THEME: editor.IStandaloneThemeData = {
    base: 'vs',
    inherit: true,
    rules: [
        { token: 'comment', foreground: '9ca3af', fontStyle: 'italic' },
        { token: 'keyword', foreground: '7c3aed' }, // violet-600
        { token: 'string', foreground: '059669' }, // emerald-600
        { token: 'number', foreground: 'd97706' }, // amber-600
        { token: 'function', foreground: '2563eb' }, // blue-600
        { token: 'variable', foreground: '1f2937' }, // gray-800
        { token: 'type', foreground: '0891b2' }, // cyan-600
    ],
    colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#1f2937',
        'editor.lineHighlightBackground': '#f3f4f6', // gray-100
        'editor.selectionBackground': '#e5e7eb', // gray-200
        'editorCursor.foreground': '#0891b2',
        'editor.inactiveSelectionBackground': '#f3f4f6',
        'editorLineNumber.foreground': '#9ca3af',
        'editorLineNumber.activeForeground': '#4b5563',
        'editorIndentGuide.background1': '#e5e7eb',
        'editorGutter.background': '#ffffff',
        'scrollbarSlider.background': '#e5e7eb',
        'scrollbarSlider.hoverBackground': '#d1d5db',
    },
};
