import { expect as bunExpect, test, describe, beforeEach } from 'bun:test';
import { createExpect } from '@/core/executor/expect-matchers';
import { MockedPlaywrightPage } from '@/core/executor/playwright-shim';
import { validateExpectedState } from '@/core/executor/dom-validator';

describe('Final Coverage & Stability Pass', () => {
    let page: MockedPlaywrightPage;

    beforeEach(() => {
        document.body.innerHTML = '';
        page = new MockedPlaywrightPage(document);
    });

    test('dom-validator.ts Edge Cases - Failure Paths', () => {
        const el = document.createElement('section');
        el.setAttribute('data-test', '123');
        document.body.appendChild(el);
        
        const result = validateExpectedState(document, [{
            selector: 'section',
            hasAttribute: { name: 'data-test', value: /abc/ }
        }]);
        bunExpect(result.passed).toBe(false);
    });

    describe('expect-matchers.ts - 90%+ Path Coverage (v11)', () => {
        test('should hit all matchers using Locator and HTMLElement', async () => {
            const { expect, getTestResults } = createExpect({ timeout: 100 });
            
            document.body.innerHTML = `
                <button id="btn" class="primary" value="v" style="display:block">Click</button>
                <input id="inp" value="iv">
                <input type="checkbox" id="chk" checked>
                <div id="empty"></div>
            `;
            
            const btnLoc = page.locator('#btn');
            const btnEl = document.getElementById('btn')!;

            // 1. Locator paths
            await expect(btnLoc).toBeVisible();
            await expect(btnLoc).not.toBeHidden();
            await expect(btnLoc).toBeEnabled();
            await expect(btnLoc).toHaveText('Click');
            await expect(btnLoc).toHaveClass('primary');

            // 2. HTMLElement paths
            await expect(btnEl).toBeVisible();
            await expect(btnEl).not.toBeDisabled();
            await expect(btnEl).toHaveValue('v');
            await expect(btnEl).toHaveCSS('display', /block/);

            // 3. Collection/Numeric
            await expect([1]).toContain(1);
            await expect(new Set([1])).toContain(1);
            await expect(new Map([['a', 1]])).toContain('a');
            await expect(10).toBeGreaterThan(5);
            
            // 4. Soft failures
            await expect.soft(btnEl).toBeDisabled({ timeout: 10 });
            const results = getTestResults();
            bunExpect(results.some(r => !r.passed)).toBe(true);
            
            // 5. Hard failure catch
            try {
                await expect(btnEl).toBeDisabled({ timeout: 10 });
            } catch (e) {
                // Expected throw
            }
        });
    });

    describe('playwright-shim.ts - Additional Paths', () => {
        test('should hit specialized role selections', async () => {
            document.body.innerHTML = `
                <div role="meter" aria-valuenow="50"></div>
                <div role="progressbar" aria-valuenow="50"></div>
                <div role="slider" aria-valuenow="50"></div>
                <button aria-pressed="true">Pressed</button>
            `;
            bunExpect(await page.getByRole('meter').count()).toBe(1);
            bunExpect(await page.getByRole('progressbar').count()).toBe(1);
            bunExpect(await page.getByRole('slider').count()).toBe(1);
            bunExpect(await page.getByRole('button', { pressed: true }).count()).toBe(1);
        });
    });
});
