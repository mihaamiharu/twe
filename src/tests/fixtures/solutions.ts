/**
 * Known solutions mapping for code challenges.
 * Used by automated tests to verify challenge completion.
 * 
 * Format: [challenge-slug]: "solution code"
 */
export const KNOWN_SOLUTIONS: Record<string, string> = {
    // JavaScript Basic
    'js-variables-types': `
const name = "John";
const age = 30;
const isStudent = true;
`,
    // Playwright Basic
    'pw-click-actions': `
await page.click('#increment');
await page.click('#increment');
await page.click('#increment');
`,
    // Playwright Assertions
    'pw-to-have-text': `
await expect(page.locator('h1')).toHaveText('Hello World');
await expect(page.locator('p')).toContainText('Playwright');
`,
    'pw-to-have-value': `
await page.fill('#email', 'qa@test.com');
await expect(page.locator('#email')).toHaveValue('qa@test.com');
`,
    'pw-state-assertions': `
await page.check('#terms');
await expect(page.locator('#terms')).toBeChecked();
await expect(page.locator('#submit')).toBeEnabled();
`,
    'pw-to-have-attribute': `
await expect(page.locator('a')).toHaveAttribute('href', '/about');
await expect(page.locator('img')).toHaveAttribute('alt', 'Company Logo');
`,
    'pw-to-have-count': `
await expect(page.locator('#list li')).toHaveCount(4);
await page.click('#add');
await expect(page.locator('#list li')).toHaveCount(5);
`,
    'pw-page-assertions': `
await expect(page).toHaveTitle('Test Page');
`,
    'pw-soft-assertions': `
await expect.soft(page.locator('#name-status')).toContainText('valid');
await expect.soft(page.locator('#email-status')).toContainText('valid');
await expect.soft(page.locator('#pass-status')).toContainText('valid');
`,
    // Wait Strategies
    'pw-auto-wait': `
await page.click('#delayed-btn');
`,
    'pw-wait-for-selector': `
await page.click('#show-msg');
await page.waitForSelector('#message');
await expect(page.locator('#message')).toBeVisible();
`,
};
