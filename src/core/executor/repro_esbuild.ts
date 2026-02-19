
import * as esbuild from 'esbuild';

const code = `
import { test, expect } from '@playwright/test';

test('example', async ({ page }) => {
    await expect(page).toHaveTitle(/Playwright/);
});
`;

async function run() {
    try {
        const result = await esbuild.transform(code, {
            loader: 'ts',
            target: 'es2020',
        });
        console.log('--- Transpiled Code ---');
        console.log(result.code);
    } catch (e) {
        console.error('--- Error ---');
        console.error(e);
    }
}

run();
