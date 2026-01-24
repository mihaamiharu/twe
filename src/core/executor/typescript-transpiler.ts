import * as esbuild from 'esbuild-wasm';

let initialized = false;

/**
 * Initialize esbuild-wasm if not already initialized
 */
export async function initEsbuild() {
    if (!initialized && typeof window !== 'undefined') {
        try {
            await esbuild.initialize({
                wasmURL: '/esbuild.wasm',
            });
            initialized = true;
        } catch (error) {
            if (error instanceof Error && error.message.includes('initialize')) {
                // Already initialized, which can happen in dev HMR
                initialized = true;
            } else {
                console.error('Failed to initialize esbuild-wasm:', error);
                throw error;
            }
        }
    }
}

/**
 * Transpile TypeScript code to JavaScript
 */
export async function transpileTypeScript(code: string): Promise<string> {
    await initEsbuild();

    try {
        const result = await esbuild.transform(code, {
            loader: 'ts',
            target: 'es2020',
            format: 'esm',
        });
        return result.code;
    } catch (error) {
        console.error('TypeScript transpilation failed:', error);
        throw new Error(`Transpilation Error: ${error instanceof Error ? error.message : String(error)}`);
    }
}
