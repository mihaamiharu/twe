/**
 * CodeEditor - Monaco Editor wrapper for challenge code input
 *
 * Features:
 * - JavaScript/TypeScript syntax highlighting
 * - Dark theme matching app design
 * - Auto-save to IndexedDB (scalable storage)
 * - Cmd/Ctrl+Enter to run
 * - Line numbers and minimap
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Editor, {
  type OnMount,
  type OnChange,
  type Monaco,
  loader,
} from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { cn } from '@/lib/utils';
import { storage } from '@/lib/storage-adapter';
import { Loader2 } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

// Monaco loader configuration flag
let monacoConfigured = false;

export interface CodeEditorProps {
  initialCode?: string;
  language?: 'javascript' | 'typescript' | 'css' | 'html';
  onChange?: (code: string) => void;
  onRun?: (code: string) => void;
  onReady?: () => void;
  storageKey?: string;
  readOnly?: boolean;
  height?: string | number;
  showMinimap?: boolean;
  className?: string;
  extraLibs?: { content: string; filePath?: string }[];
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

// Custom light theme matching app design
const CUSTOM_LIGHT_THEME: editor.IStandaloneThemeData = {
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
  onReady,
  ...props
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  const monacoRef = useRef<Monaco | null>(null);
  const [code, setCode] = useState<string>(initialCode);

  // Dynamic theme name
  const monacoTheme = useMemo(
    () => (resolvedTheme === 'dark' ? 'customDark' : 'customLight'),
    [resolvedTheme],
  );

  // Loading state for async storage fetch
  const [isStorageLoaded, setIsStorageLoaded] = useState(!storageKey);

  // Configure Monaco loader on client side (SSR-safe)
  useEffect(() => {
    if (!monacoConfigured && typeof window !== 'undefined') {
      import('monaco-editor').then((monaco) => {
        loader.config({ monaco });
        monacoConfigured = true;
      });
    }
  }, []);

  // Apply theme change without re-mounting if possible
  useEffect(() => {
    if (monacoRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      monacoRef.current.editor.setTheme(monacoTheme);
    }
  }, [monacoTheme]);

  // Load code from IndexedDB
  useEffect(() => {
    let mounted = true;

    const loadCode = async () => {
      if (!storageKey) {
        setIsStorageLoaded(true);
        return;
      }

      try {
        // If the key changes, we might want to temporarily show loading?
        // For now, we just update the code when it arrives.
        const saved = await storage.getItem(storageKey);
        if (mounted) {
          if (saved !== null) {
            setCode(saved);
            onChange?.(saved);
          } else if (initialCode) {
            // If no saved code (null), fallback to initial
            setCode(initialCode);
            onChange?.(initialCode);
          }
          setIsStorageLoaded(true);
        }
      } catch (err) {
        console.warn('Failed to load code from storage:', err);
        if (mounted) setIsStorageLoaded(true);
      }
    };

    if (storageKey) {
      setIsStorageLoaded(false); // Start loading
      void loadCode();
    } else {
      setIsStorageLoaded(true);
    }

    return () => {
      mounted = false;
    };
  }, [storageKey]); // Rely on 'key' prop for re-mounting when file path or initialCode resets

  // Auto-save to IndexedDB
  useEffect(() => {
    // Only save if we are loaded and have a key and code
    if (storageKey && isStorageLoaded) {
      const debounceTimer = setTimeout(() => {
        void storage.setItem(storageKey, code);
      }, 500);
      return () => clearTimeout(debounceTimer);
    }
  }, [code, storageKey, isStorageLoaded]);

  // Handle code changes
  const handleChange: OnChange = useCallback(
    (value) => {
      const newCode = value || '';
      setCode(newCode);
      onChange?.(newCode);
    },
    [onChange],
  );

  // Handle editor mount
  const handleEditorMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      monacoRef.current = monaco;

      // Define custom themes
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        target: monaco.languages.typescript.ScriptTarget.ESNext,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        module: monaco.languages.typescript.ModuleKind.ESNext,
        allowNonTsExtensions: true,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      });

      // Disable diagnostics for challenge environment
      // This prevents false positives like "cannot redeclare" for top-level await context
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: false, // Keep syntax validation for basic errors
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: false,
      });

      monaco.editor.defineTheme('customDark', CUSTOM_DARK_THEME);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      monaco.editor.defineTheme('customLight', CUSTOM_LIGHT_THEME);

      // Set initial theme
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      monaco.editor.setTheme(monacoTheme);

      // Add Cmd/Ctrl+Enter keyboard shortcut
      editor.addAction({
        id: 'run-code',
        label: 'Run Code',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
        run: () => {
          onRun?.(editor.getValue());
        },
      });

      // Add Cmd/Ctrl+S to save (Just triggers save manually, also autosaved)
      editor.addAction({
        id: 'save-code',
        label: 'Save Code',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
        run: () => {
          if (storageKey) {
            void storage.setItem(storageKey, editor.getValue());
          }
        },
      });

      // Register extra libs (type definitions)
      if (props.extraLibs) {
        props.extraLibs.forEach((lib) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
          monaco.languages.typescript.javascriptDefaults.addExtraLib(
            lib.content,
            lib.filePath
          );
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
          monaco.languages.typescript.typescriptDefaults.addExtraLib(
            lib.content,
            lib.filePath
          );
        });
      }

      // Focus editor
      editor.focus();

      // Signal that editor is ready
      onReady?.();
    },
    [onRun, storageKey, onReady, props.extraLibs],
  );

  // Update editor when onRun changes
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      // Disposing the previous action is tricky with Monaco's API as addAction returns a IDisposable
      // but re-adding with the same ID usually works fine or we can rely on its internal management.
      // However, to avoid churn, we should only do this when onRun changes, not on every code change.

      // We use editor.getValue() inside the callback so we don't need 'code' in dependencies
      editorRef.current.addAction({
        id: 'run-code',
        label: 'Run Code',
        keybindings: [
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          monacoRef.current.KeyMod.CtrlCmd | monacoRef.current.KeyCode.Enter,
        ],
        run: (editor) => {
          // Use the editor instance passed to the run command to get current value
          onRun?.(editor.getValue());
        },
      });
    }
  }, [onRun]);

  if (!isStorageLoaded && storageKey) {
    return (
      <div
        className={cn(
          'rounded-lg border border-border bg-slate-900 flex items-center justify-center text-muted-foreground',
          className,
        )}
        style={{ height }}
      >
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-xs">Loading saved code...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('h-full w-full', className)}>
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
          automaticLayout: true, // Enable automatic layout - "Canceled" error is cosmetic
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

          // Disable "smart" suggestions as requested
          suggestOnTriggerCharacters: false,
          quickSuggestions: false,
          snippetSuggestions: 'none',
          parameterHints: { enabled: false },
          hover: { enabled: true }, // Keep hover for types/docs if they hover explicitly, but no auto-popups

          contextmenu: true,
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-slate-900 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
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
