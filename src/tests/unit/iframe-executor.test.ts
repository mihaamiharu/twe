import { describe, test, expect, beforeEach } from 'bun:test';
import { createExpect } from '../../core/executor/iframe-executor';
import { MockedPlaywrightPage } from '../../core/executor/playwright-shim';

describe('createExpect', () => {
    let shimExpect: any;

    beforeEach(() => {
        const { expect: e } = createExpect();
        shimExpect = e;
        document.body.innerHTML = '';
    });

    test('should pass visible assertion', async () => {
        const btn = document.createElement('button');
        document.body.appendChild(btn);
        const page = new MockedPlaywrightPage(document);

        await shimExpect(page.locator('button')).toBeVisible();
    });

    test('should fail visible assertion with not negation', async () => {
        const btn = document.createElement('button');
        document.body.appendChild(btn);
        const page = new MockedPlaywrightPage(document);

        // This should fail because it IS visible
        try {
            await shimExpect(page.locator('button')).not.toBeVisible();
            throw new Error('Should have failed');
        } catch (e: any) {
            expect(e.message).toContain('Expected element NOT to be visible');
        }
    });

    test('should pass hidden assertion with not negation', async () => {
        const btn = document.createElement('button');
        btn.style.display = 'none';
        document.body.appendChild(btn);
        const page = new MockedPlaywrightPage(document);

        // toBeVisible() fails (pass=false) -> not.toBeVisible() passes (finalPass=true)
        await shimExpect(page.locator('button')).not.toBeVisible();
    });

    test('should pass text assertion with not negation', async () => {
        const div = document.createElement('div');
        div.textContent = 'Hello';
        document.body.appendChild(div);
        const page = new MockedPlaywrightPage(document);

        await shimExpect(page.locator('div')).not.toHaveText('World');
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
});
