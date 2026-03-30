import { useEffect, useRef, useCallback, useState } from 'react';
import { loader, type OnMount, type Monaco } from '@monaco-editor/react';
import type { editor, IDisposable } from 'monaco-editor';
import { storage } from '@/lib/storage-adapter';
import { CUSTOM_DARK_THEME, CUSTOM_LIGHT_THEME } from './themes';
import type { CodeEditorProps } from './types';

let monacoConfigured = false;

export function useMonacoSetup(
    props: CodeEditorProps,
    monacoTheme: string
) {
    const { onRun, storageKey, onReady, extraLibs } = props;
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<Monaco | null>(null);
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
            editorRef.current = editor;
            monacoRef.current = monaco;

            // Compiler Options
            monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
                target: monaco.languages.typescript.ScriptTarget.ESNext,
                module: monaco.languages.typescript.ModuleKind.ESNext,
                allowNonTsExtensions: true,
                moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            });

            // Diagnostics
            const diagOptions = {
                noSemanticValidation: true,
                noSyntaxValidation: false,
            };
            monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions(diagOptions);
            monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions(diagOptions);

            // Register Themes
            monaco.editor.defineTheme('customDark', CUSTOM_DARK_THEME);
            monaco.editor.defineTheme('customLight', CUSTOM_LIGHT_THEME);
            monaco.editor.setTheme(monacoTheme);

            // Shortcuts: Run Code
            editor.addAction({
                id: 'run-code',
                label: 'Run Code',
                keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
                run: () => onRun?.(editor.getValue()),
            });

            // Shortcuts: Save Code
            editor.addAction({
                id: 'save-code',
                label: 'Save Code',
                keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
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
        const disposables: IDisposable[] = [];

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
