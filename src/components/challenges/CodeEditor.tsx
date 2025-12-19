/**
 * CodeEditor - Monaco Editor wrapper for challenge code input
 * 
 * Features:
 * - JavaScript/TypeScript syntax highlighting
 * - Dark theme matching app design
 * - Auto-save to localStorage
 * - Cmd/Ctrl+Enter to run
 * - Line numbers and minimap
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import Editor, { OnMount, OnChange, Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { cn } from '@/lib/utils';

export interface CodeEditorProps {
    initialCode?: string;
    language?: 'javascript' | 'typescript' | 'css' | 'html';
    onChange?: (code: string) => void;
    onRun?: (code: string) => void;
    storageKey?: string;
    readOnly?: boolean;
    height?: string | number;
    showMinimap?: boolean;
    className?: string;
}

// Custom dark theme matching app design
const CUSTOM_DARK_THEME: editor.IStandaloneThemeData = {
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

export function CodeEditor({
    initialCode = '',
    language = 'javascript',
    onChange,
    onRun,
    storageKey,
    readOnly = false,
    height = '400px',
    showMinimap = true,
    className,
}: CodeEditorProps) {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<Monaco | null>(null);
    const [code, setCode] = useState<string>(() => {
        // Load from localStorage if key provided
        if (storageKey && typeof window !== 'undefined') {
            const saved = localStorage.getItem(storageKey);
            if (saved) return saved;
        }
        return initialCode;
    });

    // Load code when storageKey changes
    useEffect(() => {
        if (storageKey && typeof window !== 'undefined') {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                setCode(saved);
                onChange?.(saved);
            } else if (initialCode) {
                // If no saved code for this new key, revert to initial
                setCode(initialCode);
                onChange?.(initialCode);
            }
        }
    }, [storageKey, initialCode, onChange]);

    // Auto-save to localStorage
    useEffect(() => {
        if (storageKey && typeof window !== 'undefined') {
            const debounceTimer = setTimeout(() => {
                localStorage.setItem(storageKey, code);
            }, 500);
            return () => clearTimeout(debounceTimer);
        }
    }, [code, storageKey]);

    // Handle code changes
    const handleChange: OnChange = useCallback(
        (value) => {
            const newCode = value || '';
            setCode(newCode);
            onChange?.(newCode);
        },
        [onChange]
    );

    // Handle editor mount
    const handleEditorMount: OnMount = useCallback(
        (editor, monaco) => {
            editorRef.current = editor;
            monacoRef.current = monaco;

            // Define custom theme
            monaco.editor.defineTheme('customDark', CUSTOM_DARK_THEME);
            monaco.editor.setTheme('customDark');

            // Add Cmd/Ctrl+Enter keyboard shortcut
            editor.addAction({
                id: 'run-code',
                label: 'Run Code',
                keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
                run: () => {
                    onRun?.(code);
                },
            });

            // Add Cmd/Ctrl+S to save (prevent default)
            editor.addAction({
                id: 'save-code',
                label: 'Save Code',
                keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
                run: () => {
                    // Auto-save handled by effect, just prevent default
                    if (storageKey) {
                        localStorage.setItem(storageKey, code);
                    }
                },
            });

            // Focus editor
            editor.focus();
        },
        [code, onRun, storageKey]
    );

    // Update editor when onRun changes (to capture latest code)
    useEffect(() => {
        if (editorRef.current && monacoRef.current) {
            // Update the run action with latest code
            editorRef.current.addAction({
                id: 'run-code',
                label: 'Run Code',
                keybindings: [monacoRef.current.KeyMod.CtrlCmd | monacoRef.current.KeyCode.Enter],
                run: () => {
                    onRun?.(code);
                },
            });
        }
    }, [code, onRun]);

    return (
        <div className={cn('rounded-lg overflow-hidden border border-border', className)}>
            <Editor
                height={height}
                language={language}
                value={code}
                onChange={handleChange}
                onMount={handleEditorMount}
                theme="customDark"
                options={{
                    readOnly,
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                    minimap: { enabled: showMinimap },
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    wordWrap: 'on',
                    padding: { top: 12, bottom: 12 },
                    renderLineHighlight: 'all',
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: 'on',
                    smoothScrolling: true,
                    formatOnPaste: true,
                    formatOnType: true,
                    folding: true,
                    bracketPairColorization: { enabled: true },
                    autoClosingBrackets: 'always',
                    autoClosingQuotes: 'always',
                    suggestOnTriggerCharacters: true,
                    quickSuggestions: true,
                    contextmenu: true,
                }}
                loading={
                    <div className="flex items-center justify-center h-full bg-slate-900 text-muted-foreground">
                        Loading editor...
                    </div>
                }
            />
        </div>
    );
}

// Export helper methods
export function useCodeEditor() {
    const editorRef = useRef<{
        getCode: () => string;
        resetCode: () => void;
    } | null>(null);

    return editorRef;
}

export default CodeEditor;
