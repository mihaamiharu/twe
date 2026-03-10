import { expect, test, describe, mock } from 'bun:test';

// Mock esbuild-wasm BEFORE importing the transpiler
mock.module('esbuild-wasm', () => ({
    initialize: mock(() => Promise.resolve()),
    transform: mock((code: string) => Promise.resolve({ code: code.replace('const', 'var') })),
}));

import { transpileTypeScript, initEsbuild } from '@/core/executor/typescript-transpiler';

describe('TypeScript Transpiler', () => {
    test('should initialize and transpile', async () => {
        // Force window to be defined for initEsbuild
        const originalWindow = globalThis.window;
        (globalThis as any).window = {};
        
        const code = 'const x: number = 1;';
        const result = await transpileTypeScript(code);
        
        expect(result).toContain('var x');
        
        // Restore
        (globalThis as any).window = originalWindow;
    });

    test('should handle init errors', async () => {
        const esbuild = require('esbuild-wasm');
        esbuild.initialize.mockImplementationOnce(() => Promise.reject(new Error('init fail')));
        
        const originalWindow = globalThis.window;
        (globalThis as any).window = {};
        
        try {
            await initEsbuild();
        } catch (e) {
            expect(e.message).toBe('init fail');
        }
        
        (globalThis as any).window = originalWindow;
    });
});
