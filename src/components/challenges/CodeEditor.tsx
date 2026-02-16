import { useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import {
  type CodeEditorProps,
  useEditorPersistence,
  useMonacoSetup
} from './editor';

/**
 * CodeEditor - Monaco Editor wrapper for challenge code input
 * 
 * Refactored in 2026 for improved maintainability.
 * This component orchestrates the Monaco lifecycle, theme management,
 * and asynchronous persistence to IndexedDB.
 */
export function CodeEditor(props: CodeEditorProps) {
  const {
    initialCode = '',
    language = 'javascript',
    onChange,
    storageKey,
    readOnly = false,
    height = '400px',
    showMinimap = true,
    className,
  } = props;

  const { resolvedTheme } = useTheme();

  // Determine Monaco theme based on app theme
  const monacoTheme = useMemo(
    () => (resolvedTheme === 'dark' ? 'customDark' : 'customLight'),
    [resolvedTheme],
  );

  // Hook: Handle storage loading and debounced persistence
  const {
    code,
    setCode,
    isStorageLoaded,
  } = useEditorPersistence(storageKey, initialCode, onChange);

  // Hook: Handle Monaco lifecycle, themes, shortcuts, and typings
  const { handleEditorMount } = useMonacoSetup(props, monacoTheme);

  // Loading state for initial IndexedDB fetch
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
        onChange={(val) => {
          const newCode = val || '';
          setCode(newCode);
          onChange?.(newCode);
        }}
        onMount={handleEditorMount}
        theme={monacoTheme}
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

          // Clean IntelliSense (as requested in original file)
          suggestOnTriggerCharacters: false,
          quickSuggestions: false,
          snippetSuggestions: 'none',
          parameterHints: { enabled: false },
          hover: { enabled: true },
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

export default CodeEditor;
