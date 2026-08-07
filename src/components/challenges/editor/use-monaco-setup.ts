import { useEffect, useRef, useCallback, useState } from 'react';
import { loader, type OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { storage } from '@/lib/storage-adapter';
import { CUSTOM_DARK_THEME, CUSTOM_LIGHT_THEME } from './themes';
import type { CodeEditorProps } from './types';

let monacoConfigured = false;

type Disposable = {
    dispose: () => void;
};

type MonacoDefaults = {
    setCompilerOptions: (options: {
        target: unknown;
        module: unknown;
        allowNonTsExtensions: boolean;
        moduleResolution: unknown;
    }) => void;
    setDiagnosticsOptions: (options: {
        noSemanticValidation: boolean;
        noSyntaxValidation: boolean;
    }) => void;
    addExtraLib: (content: string, filePath?: string) => Disposable;
};

type MonacoInstance = {
    editor: {
        setTheme: (theme: string) => void;
        defineTheme: (name: string, theme: object) => void;
    };
    languages: {
        typescript: {
            typescriptDefaults: MonacoDefaults;
            javascriptDefaults: MonacoDefaults;
            ScriptTarget: { ESNext: unknown };
            ModuleKind: { ESNext: unknown };
            ModuleResolutionKind: { NodeJs: unknown };
        };
    };
    KeyMod: { CtrlCmd: number };
    KeyCode: { Enter: number; KeyS: number };
};

export function useMonacoSetup(
    props: CodeEditorProps,
    monacoTheme: string
) {
    const { onRun, storageKey, onReady, extraLibs } = props;
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<MonacoInstance | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    // Configure Monaco loader on client side
    useEffect(() => {
        if (!monacoConfigured && typeof window !== 'undefined') {
            void import('monaco-editor').then((monaco) => {
                loader.config({ monaco });
                monacoConfigured = true;
            });
        }
    }, []);


    // Update theme dynamically
    useEffect(() => {
        if (monacoRef.current) {
            monacoRef.current.editor.setTheme(monacoTheme);
        }
    }, [monacoTheme]);

    // Handle editor mount and configuration
    const handleEditorMount: OnMount = useCallback(
        (editor, monaco) => {
            const monacoApi = monaco as unknown as MonacoInstance;
            editorRef.current = editor;
            monacoRef.current = monacoApi;

            // Compiler Options
            monacoApi.languages.typescript.typescriptDefaults.setCompilerOptions({
                target: monacoApi.languages.typescript.ScriptTarget.ESNext,
                module: monacoApi.languages.typescript.ModuleKind.ESNext,
                allowNonTsExtensions: true,
                moduleResolution: monacoApi.languages.typescript.ModuleResolutionKind.NodeJs,
            });

            // Diagnostics
            const diagOptions = {
                noSemanticValidation: true,
                noSyntaxValidation: false,
            };
            monacoApi.languages.typescript.typescriptDefaults.setDiagnosticsOptions(diagOptions);
            monacoApi.languages.typescript.javascriptDefaults.setDiagnosticsOptions(diagOptions);

            // Register Themes
            monacoApi.editor.defineTheme('customDark', CUSTOM_DARK_THEME);
            monacoApi.editor.defineTheme('customLight', CUSTOM_LIGHT_THEME);
            monacoApi.editor.setTheme(monacoTheme);

            // Shortcuts: Run Code
            editor.addAction({
                id: 'run-code',
                label: 'Run Code',
                keybindings: [monacoApi.KeyMod.CtrlCmd | monacoApi.KeyCode.Enter],
                run: () => onRun?.(editor.getValue()),
            });

            // Shortcuts: Save Code
            editor.addAction({
                id: 'save-code',
                label: 'Save Code',
                keybindings: [monacoApi.KeyMod.CtrlCmd | monacoApi.KeyCode.KeyS],
                run: () => {
                    if (storageKey) {
                        void storage.setItem(storageKey, editor.getValue());
                    }
                },
            });

            setIsMounted(true);
            editor.focus();
            onReady?.();
        },
        [onRun, storageKey, onReady, monacoTheme]
    );

    // Re-register 'Run Code' action when onRun changes
    useEffect(() => {
        if (editorRef.current && monacoRef.current) {
            editorRef.current.addAction({
                id: 'run-code',
                label: 'Run Code',
                keybindings: [monacoRef.current.KeyMod.CtrlCmd | monacoRef.current.KeyCode.Enter],
                run: (editor) => onRun?.(editor.getValue()),
            });
        }
    }, [onRun]);

    // Handle extraLibs with cleanup
    useEffect(() => {
        if (!isMounted || !monacoRef.current || !extraLibs) return;

        const monaco = monacoRef.current;
        const disposables: Disposable[] = [];

        extraLibs.forEach((lib) => {
            disposables.push(monaco.languages.typescript.javascriptDefaults.addExtraLib(lib.content, lib.filePath));
            disposables.push(monaco.languages.typescript.typescriptDefaults.addExtraLib(lib.content, lib.filePath));
        });

        return () => {
            disposables.forEach(d => d.dispose());
        };
    }, [isMounted, extraLibs]);

    return {
        editorRef,
        monacoRef,
        handleEditorMount,
    };
}
