import { useMemo } from 'react';
import { X, Lock, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
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
        <div className={cn("flex flex-col h-full bg-white dark:bg-slate-950", className)}>
            {/* Tab Bar */}
            <div className="flex items-center h-10 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
                {openFiles.map((path) => {
                    const isSelected = selectedFile === path;
                    const isFileEditable = editableFiles.includes(path);
                    const fileName = path.split('/').pop() || path;

                    return (
                        <div
                            key={path}
                            className={cn(
                                "group flex items-center h-full px-3 border-r border-slate-200 dark:border-slate-800 cursor-pointer min-w-[120px] max-w-[200px] transition-colors relative",
                                isSelected
                                    ? "bg-white dark:bg-slate-950 border-b-2 border-b-brand-teal"
                                    : "bg-slate-100 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
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

                            <span className={cn(
                                "text-xs font-medium truncate",
                                isSelected ? "text-slate-900 dark:text-slate-100" : "text-slate-500"
                            )}>
                                {fileName}
                            </span>

                            {/* Only show close button if not the only editable file? Or just allow closing reference files */}
                            {!isFileEditable && (
                                <button
                                    className="ml-2 p-0.5 rounded-sm hover:bg-slate-200 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
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
            <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {getLanguage(selectedFile)}
                    </span>
                    {!isEditable && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-900 rounded text-[10px] text-slate-500 font-medium">
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
                    onRun={onRun}
                    onReady={onReady}
                    readOnly={!isEditable}
                    storageKey={
                        isEditable && storageKeyPrefix
                            ? `${storageKeyPrefix}-${selectedFile}`
                            : undefined
                    }
                    height="100%"
                    showMinimap={true}
                    className="h-full"
                    extraLibs={extraLibs}
                />
            </div>
        </div>
    );
}

export default MultiTabEditor;
