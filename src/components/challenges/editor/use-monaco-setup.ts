import { useEffect, useRef, useCallback, useState } from 'react';
import { loader, type OnMount } from '@monaco-editor/react';
import type { editor, IDisposable } from 'monaco-editor';
import { storage } from '@/lib/storage-adapter';
import { CUSTOM_DARK_THEME, CUSTOM_LIGHT_THEME } from './themes';
import type { CodeEditorProps } from './types';

let monacoConfigured = false;

interface TypeScriptDefaults {
    setCompilerOptions(options: {
        target: unknown;
        module: unknown;
        allowNonTsExtensions: boolean;
        moduleResolution: unknown;
    }): void;
    setDiagnosticsOptions(options: {
        noSemanticValidation: boolean;
        noSyntaxValidation: boolean;
    }): void;
    addExtraLib(content: string, filePath?: string): IDisposable;
}

interface MonacoInstance {
    editor: {
        setTheme(theme: string): void;
        defineTheme(name: string, theme: editor.IStandaloneThemeData): void;
    };
    KeyMod: { CtrlCmd: number };
    KeyCode: { Enter: number; KeyS: number };
    typescript: {
        typescriptDefaults: TypeScriptDefaults;
        javascriptDefaults: TypeScriptDefaults;
        ScriptTarget: { ESNext: unknown };
        ModuleKind: { ESNext: unknown };
        ModuleResolutionKind: { NodeJs: unknown };
    };
}

function isObject(value: unknown): value is object {
    return typeof value === 'object' && value !== null;
}

function requireObject(value: unknown, name: string): object {
    if (!isObject(value)) {
        throw new TypeError(`Monaco ${name} API is unavailable`);
    }
    return value;
}

function requireNumber(value: unknown, name: string): number {
    if (typeof value !== 'number') {
        throw new TypeError(`Monaco ${name} value is unavailable`);
    }
    return value;
}

function callMethod(target: object, name: string, args: unknown[]): unknown {
    const method: unknown = Reflect.get(target, name);
    if (typeof method !== 'function') {
        throw new TypeError(`Monaco ${name} method is unavailable`);
    }
    return Reflect.apply(method, target, args);
}

function createDefaultsAdapter(value: unknown, name: string): TypeScriptDefaults {
    const defaults = requireObject(value, name);
    return {
        setCompilerOptions: (options) => {
            callMethod(defaults, 'setCompilerOptions', [options]);
        },
        setDiagnosticsOptions: (options) => {
            callMethod(defaults, 'setDiagnosticsOptions', [options]);
        },
        addExtraLib: (content, filePath) => {
            const disposable = requireObject(
                callMethod(defaults, 'addExtraLib', [content, filePath]),
                `${name}.addExtraLib result`,
            );
            return {
                dispose: () => {
                    callMethod(disposable, 'dispose', []);
                },
            };
        },
    };
}

function createMonacoAdapter(monaco: unknown): MonacoInstance {
    // @monaco-editor/react types its callback against editor.api, while
    // loader.config receives the full Monaco module with language contributions.
    const root = requireObject(monaco, 'root');
    const editorApi = requireObject(Reflect.get(root, 'editor'), 'editor');
    const typescriptApi = requireObject(
        Reflect.get(root, 'typescript'),
        'TypeScript contribution',
    );
    const keyMod = requireObject(Reflect.get(root, 'KeyMod'), 'KeyMod');
    const keyCode = requireObject(Reflect.get(root, 'KeyCode'), 'KeyCode');
    const scriptTarget = requireObject(
        Reflect.get(typescriptApi, 'ScriptTarget'),
        'ScriptTarget',
    );
    const moduleKind = requireObject(
        Reflect.get(typescriptApi, 'ModuleKind'),
        'ModuleKind',
    );
    const moduleResolutionKind = requireObject(
        Reflect.get(typescriptApi, 'ModuleResolutionKind'),
        'ModuleResolutionKind',
    );

    return {
        editor: {
            setTheme: (theme) => {
                callMethod(editorApi, 'setTheme', [theme]);
            },
            defineTheme: (name, theme) => {
                callMethod(editorApi, 'defineTheme', [name, theme]);
            },
        },
        KeyMod: {
            CtrlCmd: requireNumber(Reflect.get(keyMod, 'CtrlCmd'), 'KeyMod.CtrlCmd'),
        },
        KeyCode: {
            Enter: requireNumber(Reflect.get(keyCode, 'Enter'), 'KeyCode.Enter'),
            KeyS: requireNumber(Reflect.get(keyCode, 'KeyS'), 'KeyCode.KeyS'),
        },
        typescript: {
            typescriptDefaults: createDefaultsAdapter(
                Reflect.get(typescriptApi, 'typescriptDefaults'),
                'typescriptDefaults',
            ),
            javascriptDefaults: createDefaultsAdapter(
                Reflect.get(typescriptApi, 'javascriptDefaults'),
                'javascriptDefaults',
            ),
            ScriptTarget: { ESNext: Reflect.get(scriptTarget, 'ESNext') },
            ModuleKind: { ESNext: Reflect.get(moduleKind, 'ESNext') },
            ModuleResolutionKind: {
                NodeJs: Reflect.get(moduleResolutionKind, 'NodeJs'),
            },
        },
    };
}

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
            const monacoApi = createMonacoAdapter(monaco);
            editorRef.current = editor;
            monacoRef.current = monacoApi;

            // Compiler Options
            monacoApi.typescript.typescriptDefaults.setCompilerOptions({
                target: monacoApi.typescript.ScriptTarget.ESNext,
                module: monacoApi.typescript.ModuleKind.ESNext,
                allowNonTsExtensions: true,
                moduleResolution: monacoApi.typescript.ModuleResolutionKind.NodeJs,
            });

            // Diagnostics
            const diagOptions = {
                noSemanticValidation: true,
                noSyntaxValidation: false,
            };
            monacoApi.typescript.typescriptDefaults.setDiagnosticsOptions(diagOptions);
            monacoApi.typescript.javascriptDefaults.setDiagnosticsOptions(diagOptions);

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
        const disposables: IDisposable[] = [];

        extraLibs.forEach((lib) => {
            disposables.push(monaco.typescript.javascriptDefaults.addExtraLib(lib.content, lib.filePath));
            disposables.push(monaco.typescript.typescriptDefaults.addExtraLib(lib.content, lib.filePath));
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
