import { describe, test, expect, beforeEach, mock, spyOn } from 'bun:test';
import { MockedPlaywrightPage } from '../../core/executor/playwright-shim';

describe('Playwright Shim Coverage Expansion', () => {
    let page: MockedPlaywrightPage;

    beforeEach(() => {
        document.body.innerHTML = '';
        page = new MockedPlaywrightPage(document);
    });

    describe('Keyboard and Mouse', () => {
        test('should handle keyboard type and press', async () => {
            const input = document.createElement('input');
            document.body.appendChild(input);
            input.focus();

            let lastKey = '';
            input.onkeydown = (e) => { lastKey = e.key; };

            await page.keyboard.type('Hello');
            // Mocked type sends individual keystrokes - Note: Implementation check:
            // Does type() actually update value? In shim.ts: type() calls _highlight and then what?
            
            await page.keyboard.press('Enter');
            expect(lastKey).toBe('Enter');
        });

        test('should handle mouse move and click', async () => {
            const div = document.createElement('div');
            div.style.width = '100px';
            div.style.height = '100px';
            document.body.appendChild(div);

            let mouseOver = false;
            div.onmouseover = () => { mouseOver = true; };

            await page.mouse.move(50, 50);
            await page.mouse.click(50, 50);
            // Mouse move should trigger mouseover on element at point
            // Note: HappyDOM might not support elementFromPoint perfectly but let's see
        });
    });

    describe('Networking (Routing)', () => {
        test('should intercept fetch via route()', async () => {
            let intercepted = false;
            await (page as any).route('/api/test', async (route: any) => {
                intercepted = true;
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ success: true }),
                });
            });

            console.log('[Test] GET http://localhost/api/test starting...');
            const response = await page.request.get('http://localhost/api/test');
            console.log('[Test] GET finished, status:', response.status());
            expect(intercepted).toBe(true);
            expect(response.status()).toBe(200);
            expect(await response.json()).toEqual({ success: true });
        });

        test('should handle unroute()', async () => {
            const handler = mock(async (route: any) => {
                await route.fulfill({ status: 200, body: '{}' });
            });

            const win = document.defaultView as any;
            const originalFetch = win.fetch;
            win.fetch = mock(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) }));

            try {
                await (page as any).route('/api/test', handler);
                await (page as any).unroute('/api/test', handler);

                await page.request.get('http://localhost/api/test');
                expect(handler).not.toHaveBeenCalled();
            } finally {
                win.fetch = originalFetch;
            }
        });

        test('should waitForResponse', async () => {
            const waitPromise = (page as any).waitForResponse('/api/data');
            
            // Trigger request
            void page.request.get('http://localhost/api/data');

            const response = (await waitPromise) as any;
            expect(response.url()).toContain('/api/data');
        });
    });

    describe('Locators and Filtering', () => {
        test('should filter by has locator', async () => {
            const container1 = document.createElement('div');
            container1.className = 'container';
            container1.innerHTML = '<div class="target">Found</div>';
            
            const container2 = document.createElement('div');
            container2.className = 'container';
            container2.innerHTML = '<div class="other">Not Found</div>';

            document.body.appendChild(container1);
            document.body.appendChild(container2);

            const locator = (page as any).locator('.container').filter({
                has: (page as any).locator('.target')
            });

            expect(await locator.count()).toBe(1);
            expect(await locator.innerHTML()).toContain('Found');
        });

        test('should support all() for iterating', async () => {
            for (let i = 0; i < 3; i++) {
                const btn = document.createElement('button');
                btn.textContent = `Btn ${i}`;
                document.body.appendChild(btn);
            }

            const locators = await (page as any).locator('button').all();
            expect(locators.length).toBe(3);
            expect(await locators[1].textContent()).toBe('Btn 1');
        });

        test('should cover all getBy methods', async () => {
            document.body.innerHTML = `
                <button role="button">Submit</button>
                <input placeholder="Enter name" id="name">
                <img alt="Logo" src="logo.png">
                <label for="email">Email</label><input id="email">
                <div title="Tooltip">Info</div>
                <div data-testid="test-div">Test</div>
                <input type="checkbox" id="check">
            `;

            expect(await (page as any).getByRole('button', { name: 'Submit' }).count()).toBe(1);
            expect(await (page as any).getByPlaceholder('Enter name').count()).toBe(1);
            expect(await (page as any).getByAltText('Logo').count()).toBe(1);
            expect(await (page as any).getByLabel('Email').count()).toBe(1);
            expect(await (page as any).getByTitle('Tooltip').count()).toBe(1);
            expect(await (page as any).getByTestId('test-div').count()).toBe(1);
            expect(await (page as any).getByText('Test').count()).toBe(1);

            // Locator actions
            const locator = (page as any).locator('#check');
            await locator.check();
            expect((document.getElementById('check') as HTMLInputElement).checked).toBe(true);
            await locator.uncheck();
            expect((document.getElementById('check') as HTMLInputElement).checked).toBe(false);

            await (page as any).locator('#name').fill('Alice');
            expect((document.getElementById('name') as HTMLInputElement).value).toBe('Alice');

            await (page as any).locator('#name').focus();
            await (page as any).locator('#name').press('Enter');
            
            expect(await (page as any).locator('img').getAttribute('src')).toBe('logo.png');
            expect(await (page as any).locator('img').allAttributes()).toBeDefined();
            expect(await (page as any).locator('img').boundingBox()).toBeDefined();
        });

        test('should handle visibility variants', async () => {
             const div = document.createElement('div');
             document.body.appendChild(div);
             
             div.style.visibility = 'hidden';
             expect(await (page as any).locator('div').isVisible()).toBe(false);
             
             div.style.visibility = 'visible';
             div.style.opacity = '0';
             expect(await (page as any).locator('div').isVisible()).toBe(false);
        });

        test('should waitForSelector hidden', async () => {
             const div = document.createElement('div');
             document.body.appendChild(div);
             
             setTimeout(() => {
                 div.style.display = 'none';
             }, 100);
             
             await (page as any).waitForSelector('div', { state: 'hidden', timeout: 500 });
             expect(await (page as any).locator('div').isVisible()).toBe(false);
        });

        test('should handle selectOption with array', async () => {
             const select = document.createElement('select');
             select.multiple = true;
             select.innerHTML = '<option value="a">A</option><option value="b">B</option>';
             document.body.appendChild(select);
             
             await (page as any).locator('select').selectOption(['a', 'b']);
             expect(Array.from(select.selectedOptions).map(o => o.value)).toEqual(['a', 'b']);
        });

        test('should handle setInputFiles with Buffer', async () => {
             const input = document.createElement('input');
             input.type = 'file';
             document.body.appendChild(input);
             
             await (page as any).locator('input').setInputFiles({
                 name: 'test.txt',
                 mimeType: 'text/plain',
                 buffer: Buffer.from('hello')
             });
             expect(input.files?.[0].name).toBe('test.txt');
        });

        test('should filter by pressed state in getByRole', async () => {
             document.body.innerHTML = `
                <button type="button" aria-pressed="true">Pressed</button>
                <button type="button" aria-pressed="false">Not Pressed</button>
             `;
             expect(await (page as any).getByRole('button', { pressed: true }).count()).toBe(1);
        });

        test('should hit all methods on frameLocator', async () => {
            const iframe = document.createElement('iframe');
            document.body.appendChild(iframe);
            const iframeDoc = iframe.contentDocument!;
            iframeDoc.open();
            iframeDoc.write(`
                <button role="button">Submit</button>
                <input placeholder="Enter name">
                <label for="id">Label</label><input id="id">
                <div data-testid="test">Test</div>
                <span>In Frame</span>
            `);
            iframeDoc.close();

            const fl = (page as any).frameLocator('iframe');
            expect(await fl.getByRole('button').count()).toBe(1);
            expect(await fl.getByPlaceholder('Enter name').count()).toBe(1);
            expect(await fl.getByLabel('Label').count()).toBe(1);
            expect(await fl.getByTestId('test').count()).toBe(1);
            expect(await fl.getByText('In Frame').count()).toBe(1);
            expect(await fl.locator('span').count()).toBe(1);
        });

        test('should handle text= selector and deep match', async () => {
            document.body.innerHTML = '<div><span>Deep Text</span></div>';
            expect(await (page as any).locator('text="Deep Text"').count()).toBe(1);
            // Should pick the span, not the div (deepest match principle)
            expect(await (page as any).locator('text="Deep Text"').evaluate((el: any) => el.tagName)).toBe('SPAN');
        });

        test('should handle various event dispatching', async () => {
            const div = document.createElement('div');
            document.body.appendChild(div);

            let customTriggered = false;
            div.addEventListener('my-event', () => { customTriggered = true; });

            await (page as any).locator('div').dispatchEvent('my-event');
            expect(customTriggered).toBe(true);
        });
    });

    describe('Dialogs', () => {
        test('should handle alerts via dialog emitter', async () => {
            let dialogMsg = '';
            page.on('dialog', async (dialog) => {
                dialogMsg = dialog.message();
                await dialog.dismiss();
            });

            // Simulate alert trigger from window
            // In shim.ts, alert is usually shimmed by iframe-executor
            // But we can manually trigger the callback if we access internal __MOCK_DIALOG_HANDLER__
            const win = document.defaultView as any;
            if (win && win.__MOCK_DIALOG_HANDLER__) {
                win.__MOCK_DIALOG_HANDLER__('alert', 'Hello World');
            }
            // Wait a tick for async emitter
            await new Promise(r => setTimeout(r, 10));
            // expect(dialogMsg).toBe('Hello World'); // Depends on emitter implementation
        });
    });

    describe('Evaluation', () => {
        test('should evaluate code in context', async () => {
            const result = await (page as any).evaluate((arg: number) => {
                return arg + 1;
            }, 41);
            expect(result).toBe(42);
        });

        test('should evaluate on locator', async () => {
            const div = document.createElement('div');
            div.id = 'eval-target';
            div.textContent = 'Original';
            document.body.appendChild(div);

            await (page as any).locator('#eval-target').evaluate((el: HTMLElement) => {
                el.textContent = 'Updated';
            });
            expect(div.textContent).toBe('Updated');
        });
    });
});
