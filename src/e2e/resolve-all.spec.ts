
import { test, expect } from '@playwright/test';
import { ALL_SOLUTIONS } from './fixtures/challenges';

test.describe('Platform Smoke Tests', () => {
    test('should load homepage', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/TestingWithEkki/); // Assuming title contains TestingWithEkki
        // Verify basic navigation exists
        await expect(page.getByRole('navigation').getByRole('link', { name: 'Challenges' })).toBeVisible();
    });

    test('should load challenges list', async ({ page }) => {
        await page.goto('/challenges');
        await expect(page.getByRole('heading', { name: 'Challenges' })).toBeVisible();
    });

    test('should load leaderboard', async ({ page }) => {
        await page.goto('/leaderboard');
        await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible();
    });
});

test.describe('Challenge Resolution', () => {
    // Iterate over all known solutions
    for (const [slug, solution] of Object.entries(ALL_SOLUTIONS)) {
        test(`should resolve challenge: ${slug}`, async ({ page }) => {
            test.setTimeout(60000);
            console.log(`Starting test for ${slug}`);
            // 1. Navigate to challenge
            await page.goto(`/challenges/${slug}`, { waitUntil: 'domcontentloaded' });

            // 2. Determine challenge type (Code or Selector) by looking for headers
            const codeHeader = page.getByRole('heading', { name: 'Solution Code' });
            const selectorHeader = page.getByRole('heading', { name: 'Enter Selector' });

            await expect(async () => {
                const codeVisible = await codeHeader.isVisible();
                const selectorVisible = await selectorHeader.isVisible();
                if (!codeVisible && !selectorVisible) throw new Error('Challenge interface not loaded');
            }).toPass();

            const isCodeChallenge = await codeHeader.isVisible();

            if (isCodeChallenge) {
                // Handle Code Challenge

                // Wait for editor to be ready
                // Wait for editor to be ready
                await page.waitForSelector('.monaco-editor .view-lines', { state: 'visible', timeout: 15000 });

                // Robust clear logic: Retry clearing until empty
                const editorArea = page.locator('.monaco-editor .view-lines').first();
                await editorArea.click();

                for (let i = 0; i < 3; i++) {
                    await page.waitForTimeout(50);
                    // Try ControlOrMeta first which is the standard
                    await page.keyboard.press('ControlOrMeta+A');
                    await page.waitForTimeout(50);
                    await page.keyboard.press('Backspace');
                    await page.waitForTimeout(50);

                    // Fallback to explicit Meta+A / Control+A if standard fails
                    await page.keyboard.press('Meta+A');
                    await page.keyboard.press('Delete');
                    await page.waitForTimeout(50);

                    // Re-focus just in case
                    if (i < 2) await editorArea.click();
                }

                // Type the solution
                // Using insertText is faster and more reliable than type for large blocks
                await page.keyboard.insertText(solution);

                // Run Code
                await page.getByRole('button', { name: 'Run Code' }).click();
            } else {
                // Handle Selector Challenge
                const input = page.getByPlaceholder(/Enter (CSS|XPath)/);
                await input.fill(solution);

                // Click Test Selector
                await page.getByRole('button', { name: 'Test Selector' }).click();
            }

            // Asset Success
            // The "Submit Solution" button should become enabled when passed
            const submitBtn = page.getByRole('button', { name: 'Submit Solution' });

            // Wait reasonable time for tests to run
            try {
                await expect(submitBtn).toBeEnabled({ timeout: 10000 });
            } catch (e) {
                // detailed debug
                console.log(`Test failed for ${slug}. capturing details...`);
                const editorContent = await page.locator('.monaco-editor').first().textContent();
                // Note: textContent on editor container might not give code.
                // Try to get error results
                const errorResults = await page.locator('.text-destructive').allTextContents();
                console.log(`UI Errors: ${JSON.stringify(errorResults)}`);
                const allResults = await page.locator('.test-result-item').allTextContents();
                console.log(`All Results: ${JSON.stringify(allResults)}`);
                throw e;
            }
        });
    }
});
