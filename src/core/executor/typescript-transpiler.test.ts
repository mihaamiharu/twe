import { expect, test, describe } from 'bun:test';
import { transpileTypeScript, initEsbuild } from './typescript-transpiler';

describe('TypeScript Transpiler', () => {
    test('should transpile basic TypeScript to JavaScript', async () => {
        const tsCode = 'const x: number = 10;';
        const jsCode = await transpileTypeScript(tsCode);
        expect(jsCode).toContain('const x = 10;');
    });

    test('should handle interfaces by removing them', async () => {
        const tsCode = 'interface User { name: string; }\nconst u: User = { name: "test" };';
        const jsCode = await transpileTypeScript(tsCode);
        expect(jsCode).toContain('const u = { name: "test" };');
        expect(jsCode).not.toContain('interface User');
    });

    test('should handle function types', async () => {
        const tsCode = 'function greet(name: string): string { return `Hello ${name}`; }';
        const jsCode = await transpileTypeScript(tsCode);
        expect(jsCode).toContain('function greet(name) {');
    });
});
