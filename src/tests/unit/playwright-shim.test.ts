import { describe, test, expect, beforeEach } from 'bun:test';
import { MockedPlaywrightPage } from '../../lib/playwright-shim';

describe('Playwright Shim', () => {
    let page: MockedPlaywrightPage;

    beforeEach(() => {
        // Clear DOM
        document.body.innerHTML = '';
        page = new MockedPlaywrightPage(document);
    });

    test('should find elements with locator() and click them', async () => {
        const btn = document.createElement('button');
        btn.id = 'my-btn';
        let clicked = false;
        btn.onclick = () => { clicked = true; };
        document.body.appendChild(btn);

        await page.locator('#my-btn').click();
        expect(clicked).toBe(true);
    });

    test('should fill inputs with fill()', async () => {
        const input = document.createElement('input');
        input.id = 'my-input';
        document.body.appendChild(input);

        await page.fill('#my-input', 'hello world');
        expect(input.value).toBe('hello world');
    });

    test('should get text content', async () => {
        const div = document.createElement('div');
        div.id = 'my-div';
        div.textContent = 'content here';
        document.body.appendChild(div);

        const text = await page.textContent('#my-div');
        expect(text).toBe('content here');
    });

    test('should find elements by role', async () => {
        const btn = document.createElement('button');
        btn.textContent = 'Click Me';
        document.body.appendChild(btn);

        const locator = page.getByRole('button', { name: 'Click Me' });
        expect(await locator.count()).toBe(1);
    });

    test('should find elements by text', async () => {
        const span = document.createElement('span');
        span.textContent = 'Find Me Near';
        document.body.appendChild(span);

        const locator = page.getByText('Find Me');
        expect(await locator.count()).toBe(1);
    });

    test('should find elements by label', async () => {
        const label = document.createElement('label');
        label.setAttribute('for', 'input-id');
        label.textContent = 'User Name';
        const input = document.createElement('input');
        input.id = 'input-id';
        document.body.appendChild(label);
        document.body.appendChild(input);

        const locator = page.getByLabel('User Name');
        expect(await locator.count()).toBe(1);
        await locator.fill('test user');
        expect(input.value).toBe('test user');
    });

    test('should handle checkbox actions', async () => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'check-me';
        document.body.appendChild(checkbox);

        await page.check('#check-me');
        expect(checkbox.checked).toBe(true);
        expect(await page.isChecked('#check-me')).toBe(true);

        await page.uncheck('#check-me');
        expect(checkbox.checked).toBe(false);
    });

    test('should handle select options', async () => {
        const select = document.createElement('select');
        select.id = 'my-select';
        const opt1 = document.createElement('option');
        opt1.value = 'v1';
        const opt2 = document.createElement('option');
        opt2.value = 'v2';
        select.appendChild(opt1);
        select.appendChild(opt2);
        document.body.appendChild(select);

        await page.locator('#my-select').selectOption('v2');
        expect(select.value).toBe('v2');
    });

    test('should handle nth, first, last filters', async () => {
        for (let i = 0; i < 3; i++) {
            const div = document.createElement('div');
            div.className = 'item';
            div.textContent = `Item ${i}`;
            document.body.appendChild(div);
        }

        const items = page.locator('.item');
        expect(await items.count()).toBe(3);
        expect(await items.first().textContent()).toBe('Item 0');
        expect(await items.last().textContent()).toBe('Item 2');
        expect(await items.nth(1).textContent()).toBe('Item 1');
    });

    test('should check element states (disabled, visible) on page and locator', async () => {
        const btn = document.createElement('button');
        btn.id = 'btn';
        btn.disabled = true;
        btn.setAttribute('aria-label', 'Submit');
        document.body.appendChild(btn);

        expect(await page.locator('#btn').isDisabled()).toBe(true);
        expect(await page.isDisabled('#btn')).toBe(true);
        expect(await page.isEditable('#btn')).toBe(false);

        const attr = await page.getAttribute('#btn', 'aria-label');
        expect(attr).toBe('Submit');
    });

    test('should support regex in getByRole and getByText', async () => {
        const btn = document.createElement('button');
        btn.textContent = 'Submit Form';
        document.body.appendChild(btn);

        expect(await page.getByRole('button', { name: /submit/i }).count()).toBe(1);
        expect(await page.getByText(/form/i).count()).toBe(1);
    });

    test('should handle uncheck on page', async () => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'check';
        checkbox.checked = true;
        document.body.appendChild(checkbox);

        await page.uncheck('#check');
        expect(checkbox.checked).toBe(false);
    });

    test('should handle dragTo', async () => {
        const source = document.createElement('div');
        source.id = 'source';
        const target = document.createElement('div');
        target.id = 'target';
        document.body.appendChild(source);
        document.body.appendChild(target);

        // dragTo is currently a mock that does nothing but we should cover the call
        await page.locator('#source').dragTo(page.locator('#target'));
    });

    test('should handle press and hover', async () => {
        const input = document.createElement('input');
        input.id = 'input';
        document.body.appendChild(input);

        await page.press('#input', 'Enter');
        await page.hover('#input');
    });

    test('should handle page-level content checks', async () => {
        const div = document.createElement('div');
        div.id = 'content';
        div.innerHTML = '<b>bold</b>';
        document.body.appendChild(div);

        expect(await page.innerHTML('#content')).toBe('<b>bold</b>');
        expect(await page.count('#content')).toBe(1);
        expect(await page.isElementVisible('#content')).toBe(true);
    });

    test('should handle basic frameLocator', async () => {
        const iframe = document.createElement('iframe');
        iframe.id = 'my-frame';
        document.body.appendChild(iframe);

        const frameDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (frameDoc) {
            const btn = frameDoc.createElement('button');
            btn.id = 'frame-btn';
            frameDoc.body.appendChild(btn);

            // This hits the frameLocator proxy logic
            const locator = page.frameLocator('#my-frame').locator('#frame-btn');
            expect(locator).toBeDefined();
        }
    });

    test('should handle wait functions', async () => {
        await page.waitForTimeout(50);
        await page.waitForFunction(() => true);
    });

    test('should throw error when checking non-checkbox', async () => {
        const div = document.createElement('div');
        div.id = 'not-a-check';
        document.body.appendChild(div);

        expect(page.check('#not-a-check')).rejects.toThrow();
    });

    test('should proxy page methods to locators', async () => {
        const input = document.createElement('input');
        input.id = 'proxy-input';
        input.value = 'typed value';
        document.body.appendChild(input);

        expect(await page.inputValue('#proxy-input')).toBe('typed value');
    });
});
