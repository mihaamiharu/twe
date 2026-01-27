import { describe, test, expect, beforeEach } from 'bun:test';
import { createExpect } from '../../core/executor/expect-matchers';
import { MockedPlaywrightPage } from '../../core/executor/playwright-shim';

describe('createExpect', () => {
    let shimExpect: any;

    beforeEach(() => {
        const { expect: e } = createExpect();
        shimExpect = e;
        // Clean body
        document.body.innerHTML = '';
    });

    test('should pass visible assertion', async () => {
        const div = document.createElement('div');
        div.style.display = 'block';
        Object.defineProperty(div, 'offsetParent', { get: () => document.body });
        document.body.appendChild(div);
        const page = new MockedPlaywrightPage(document);

        await shimExpect(page.locator('div')).toBeVisible();
    });

    test('should fail visible assertion with not negation', async () => {
        const div = document.createElement('div');
        div.style.display = 'block';
        Object.defineProperty(div, 'offsetParent', { get: () => document.body });
        document.body.appendChild(div);
        const page = new MockedPlaywrightPage(document);

        try {
            await shimExpect(page.locator('div')).not.toBeVisible();
            throw new Error('Should have failed');
        } catch (e: any) {
            expect(e.message).toContain('Expected element NOT to be visible');
        }
    });

    test('should pass hidden assertion with not negation', async () => {
        const page = new MockedPlaywrightPage(document);
        // No div exists
        await shimExpect(page.locator('div')).toBeHidden();
    });

    test('should pass text assertion with not negation', async () => {
        const div = document.createElement('div');
        div.textContent = 'Hello';
        document.body.appendChild(div);
        const page = new MockedPlaywrightPage(document);

        await shimExpect(page.locator('div')).not.toHaveText('Goodbye');
    });

    test('should fail text assertion with not negation when it matches', async () => {
        const div = document.createElement('div');
        div.textContent = 'Hello';
        document.body.appendChild(div);
        const page = new MockedPlaywrightPage(document);

        try {
            await shimExpect(page.locator('div')).not.toHaveText('Hello');
            throw new Error('Should have failed');
        } catch (e: any) {
            expect(e.message).toContain('Expected text "Hello" NOT to match "Hello"');
        }
    });

    test('should work with soft assertions and not', async () => {
        const { expect: e, getTestResults } = createExpect();
        const div = document.createElement('div');
        div.textContent = 'Hello';
        document.body.appendChild(div);
        const page = new MockedPlaywrightPage(document);

        // Soft assertion fails but doesn't throw
        await e.soft(page.locator('div')).not.toHaveText('Hello');

        const results = getTestResults();
        expect(results.length).toBe(1);
        expect(results[0].passed).toBe(false);
        expect(results[0].message).toContain('Soft Assertion Failed');
    });

    test('should execute standard Playwright test syntax by stripping imports and using test() wrapper', async () => {
        // This test simulates what happens inside executePlaywrightCode
        const page = new MockedPlaywrightPage(document);
        const { expect: shimExpect } = createExpect();

        const testLogs: string[] = [];
        const testInstance = async (name: string, callback: any) => {
            testLogs.push(`Test: ${name}`);
            try {
                await callback({ page, expect: shimExpect });
            } catch (e) {
                console.error(`Error in test [${name}]:`, e);
                throw e;
            }
        };

        const code = `
            import { test, expect } from '@playwright/test';
            test('login test', async ({ page, expect }) => {
                console.log('INTERNAL: about to click');
                await page.click('button');
                console.log('INTERNAL: clicked');
                await expect(page.locator('#msg')).toHaveText('Success');
                console.log('INTERNAL: verified');
            });
        `;

        // Strip imports (Phase 2 logic)
        const processedCode = code.replace(/^\s*import\s+.*from\s+['"]@playwright\/test['"];?\s*$/gm, '');

        // Setup DOM
        document.body.innerHTML = '';
        const btn = document.createElement('button');
        btn.id = 'btn';
        btn.textContent = 'Click';
        // Mock layout for visibility check
        btn.style.display = 'block';
        btn.style.visibility = 'visible';
        btn.style.opacity = '1';
        Object.defineProperty(btn, 'offsetParent', { get: () => document.body });
        document.body.appendChild(btn);

        const msgContainer = document.createElement('div');
        msgContainer.id = 'msg';
        msgContainer.style.display = 'block';
        msgContainer.style.visibility = 'visible';
        msgContainer.style.opacity = '1';
        Object.defineProperty(msgContainer, 'offsetParent', { get: () => document.body });
        document.body.appendChild(msgContainer);

        // Use addEventListener for more robust event handling in mock env
        btn.addEventListener('click', () => {
            msgContainer.textContent = 'Success';
        });

        // Execute (Simulating the IIFE wrapper and injected globals)
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        const fn = new Function('test', 'expect', 'page', `
            return (async () => {
                ${processedCode}
            })();
        `);

        await fn(testInstance, shimExpect, page);

        expect(testLogs).toContain('Test: login test');
        expect(msgContainer.textContent).toBe('Success');
    });
});
