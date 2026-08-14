import { expect, test, describe, mock } from 'bun:test';

// Mock esbuild-wasm BEFORE importing the transpiler
const mockInitialize = mock(() => Promise.resolve());
void mock.module('esbuild-wasm', () => ({
    initialize: mockInitialize,
    transform: mock((code: string) => Promise.resolve({ code: code.replace('const', 'var') })),
}));

import { transpileTypeScript, initEsbuild } from '@/core/executor/typescript-transpiler';

describe('TypeScript Transpiler', () => {
    test('should initialize and transpile', async () => {
        // Force window to be defined for initEsbuild
        const originalWindow = globalThis.window;
        Reflect.set(globalThis, 'window', {});
        
        const code = 'const x: number = 1;';
        const result = await transpileTypeScript(code);
        
        expect(result).toContain('var x');
        
        // Restore
        Reflect.set(globalThis, 'window', originalWindow);
    });

    test('should handle init errors', async () => {
        mockInitialize.mockImplementationOnce(() => Promise.reject(new Error('init fail')));
        
        const originalWindow = globalThis.window;
        Reflect.set(globalThis, 'window', {});
        
        try {
            await initEsbuild();
        } catch (error) {
            if (!(error instanceof Error)) {
                throw error;
            }
            expect(error.message).toBe('init fail');
        }
        
        Reflect.set(globalThis, 'window', originalWindow);
    });
});
