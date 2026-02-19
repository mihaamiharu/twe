
import { describe, test, expect } from 'bun:test';

describe('Regex Test', () => {
    const regex = /^\s*import\s+[\s\S]+?from\s+['"]@playwright\/test['"];?/gm;

    test('should strip imports correctly', () => {
        const code = `import { test, expect } from '@playwright/test';
test('foo', async ({ page }) => {
  await page.goto('https://example.com');
});`;

        // Replace once globally (as per iframe-executor.ts)
        const result = code.replace(regex, '');
        console.log('Result:\n', result);
        expect(result).not.toContain('import { test, expect }');
        expect(result).toContain("test('foo'");
    });

    test('should NOT strip comments that look like imports', () => {
        const code = `// import { test, expect } from '@playwright/test';
const foo = 'bar';`;

        const result = code.replace(regex, '');
        console.log('Result:\n', result);
        // Since regex starts with ^\s*import, it should NOT match // import
        expect(result).toBe(code);
    });

    test('should handle multi-line imports', () => {
        const code = `import {
  test,
  expect
} from '@playwright/test';
console.log('hi');`;

        const result = code.replace(regex, '');
        console.log('Result:\n', result);
        expect(result.trim()).toBe("console.log('hi');");
    });

    test('should NOT match inside strings', () => {
        const code = `const x = "import { test } from '@playwright/test'";`;
        const result = code.replace(regex, '');
        expect(result).toBe(code);
    });

    test('should match imports with aggressive whitespace', () => {
        const code = `
     import 
     { test } 
     from 
     '@playwright/test';
     const x = 1;`;
        const result = code.replace(regex, '');
        expect(result).toContain('const x = 1;');
        expect(result).not.toContain('import');
    });
});
