
const codes = [
    `import { test, expect } from '@playwright/test';`,
    `import { test, expect } from "@playwright/test";`,
    `import { 
        test, 
        expect 
    } from '@playwright/test';`,
    `import { test, expect } from '@playwright/test'`, // No semicolon
    `   import { test, expect } from '@playwright/test';   `, // Spaces
    `import { test, expect } from '@playwright/test';
    test('foo', async () => {});` // With other code
];

// Current Regex (simplified from my memory of what's in iframe-executor, which is likely line-based or simple)
// Actually let's use the proposed NEW regex to verify it works.
const newRegex = /^\s*import\s+[\s\S]+?from\s+['"]@playwright\/test['"];?/gm;

console.log('--- Testing New Regex ---');
codes.forEach((code, i) => {
    const stripped = code.replace(newRegex, '');
    const hasImport = stripped.includes('@playwright/test');
    console.log(`[${i}] Original length: ${code.length}, Stripped length: ${stripped.length}`);
    console.log(`[${i}] Has import leftover? ${hasImport}`);
    if (hasImport) {
        console.log(`[${i}] FAILED content:`, stripped);
    } else {
        console.log(`[${i}] PASS`);
    }
    console.log('---');
});
