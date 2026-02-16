export type EditorLanguage = 'javascript' | 'typescript' | 'css' | 'html';

export interface CodeEditorProps {
    initialCode?: string;
    language?: EditorLanguage;
    onChange?: (code: string) => void;
    onRun?: (code: string) => void;
    onReady?: () => void;
    storageKey?: string;
    readOnly?: boolean;
    height?: string | number;
    showMinimap?: boolean;
    className?: string;
    extraLibs?: { content: string; filePath?: string }[];
    enableSuggestions?: boolean;
}
