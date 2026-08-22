import { useMemo } from 'react';
import { X, Lock, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { omitUndefined } from '@/lib/omit-undefined';
import { CodeEditor } from './code-editor';

interface MultiTabEditorProps {
  files: Record<string, string>;
  editableFiles?: string[];
  selectedFile: string;
  openFiles: string[];
  onSelectFile: (path: string) => void;
  onCloseFile: (path: string) => void;
  onCodeChange: (path: string, code: string) => void;
  onRun?: () => void;
  onReady?: () => void;
  storageKeyPrefix?: string;
  className?: string;
  extraLibs?: { content: string; filePath?: string }[];
}

export function MultiTabEditor({
  files,
  editableFiles = [],
  selectedFile,
  openFiles,
  onSelectFile,
  onCloseFile,
  onCodeChange,
  onRun,
  onReady,
  storageKeyPrefix,
  className,
  extraLibs,
}: MultiTabEditorProps) {
  const getLanguage = (path: string) => {
    if (path.endsWith('.html')) return 'html';
    if (path.endsWith('.css')) return 'css';
    if (path.endsWith('.ts')) return 'typescript';
    if (path.endsWith('.js')) return 'javascript';
    return 'javascript';
  };

  const isEditable = useMemo(() => {
    return editableFiles.includes(selectedFile);
  }, [selectedFile, editableFiles]);

  return (
    <div className={cn('technical-surface flex flex-col h-full', className)}>
      {/* Tab Bar */}
      <div className="flex items-center h-10 bg-workspace-panel border-b border-workspace-border overflow-x-auto no-scrollbar">
        {openFiles.map((path) => {
          const isSelected = selectedFile === path;
          const isFileEditable = editableFiles.includes(path);
          const fileName = path.split('/').pop() || path;

          return (
            <div
              key={path}
              className={cn(
                'group flex items-center h-full px-3 border-r border-workspace-border cursor-pointer min-w-[120px] max-w-[200px] transition-colors relative',
                isSelected
                  ? 'bg-workspace-background border-b-2 border-b-brand-orange'
                  : 'bg-workspace-panel hover:bg-workspace-elevated',
              )}
              onClick={() => onSelectFile(path)}
            >
              <div className="mr-2 opacity-50">
                {isFileEditable ? (
                  <Edit3 className="h-3 w-3 text-brand-teal" />
                ) : (
                  <Lock className="h-3 w-3" />
                )}
              </div>

              <span
                className={cn(
                  'text-xs font-medium truncate',
                  isSelected ? 'text-workspace-text' : 'text-workspace-muted',
                )}
              >
                {fileName}
              </span>

              {/* Only show close button if not the only editable file? Or just allow closing reference files */}
              {!isFileEditable && (
                <button
                  className="ml-2 p-0.5 rounded-sm hover:bg-workspace-elevated opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseFile(path);
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-workspace-background border-b border-workspace-border">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-workspace-muted">
            {getLanguage(selectedFile)}
          </span>
          {!isEditable && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-workspace-panel rounded text-[10px] text-workspace-muted font-medium">
              <Lock className="h-2.5 w-2.5" />
              READ ONLY
            </div>
          )}
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1 relative overflow-hidden">
        <CodeEditor
          key={selectedFile}
          initialCode={files[selectedFile] || ''}
          language={getLanguage(selectedFile)}
          onChange={(code) => isEditable && onCodeChange(selectedFile, code)}
          {...omitUndefined({ onRun, onReady })}
          readOnly={!isEditable}
          {...omitUndefined({
            storageKey:
              isEditable && storageKeyPrefix
                ? `${storageKeyPrefix}-${selectedFile}`
                : undefined,
          })}
          height="100%"
          showMinimap={true}
          className="h-full"
          {...omitUndefined({ extraLibs })}
        />
      </div>
    </div>
  );
}

export default MultiTabEditor;
