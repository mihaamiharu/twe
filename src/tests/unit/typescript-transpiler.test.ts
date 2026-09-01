import { describe, expect, test } from 'bun:test';

import { transpileTypeScript } from '@/core/executor/typescript-transpiler';

describe('TypeScript Transpiler', () => {
    test('transpiles with the real Node transformer without browser initialization', async () => {
        const code = 'const x: number = 1;';
        const result = await transpileTypeScript(code);

        expect(result).toContain('const x = 1');
        expect(result).not.toContain(': number');
    });

    test('reports transform errors', async () => {
        let message: string | undefined;
        try {
            await transpileTypeScript('const value: = 1;');
        } catch (error) {
            message = error instanceof Error ? error.message : String(error);
        }

        expect(message).toContain('Transpilation Error:');
    });
});
