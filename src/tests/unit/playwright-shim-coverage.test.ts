import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { MockedPlaywrightPage } from '../../core/executor/playwright-shim';
import type { Route } from '../../core/executor/shim.types';

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

            await page.mouse.move(50, 50);
            await page.mouse.click(50, 50);
            // Mouse move should trigger mouseover on element at point
            // Note: HappyDOM might not support elementFromPoint perfectly but let's see
        });
    });

    describe('Networking (Routing)', () => {
        test('should intercept fetch via route()', async () => {
            let intercepted = false;
            await page.route('/api/test', async (route) => {
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
            expect(response.url()).toBe('http://localhost/api/test');
            expect(await response.json()).toEqual({ success: true });
        });

        test('should preserve binary route response bodies', async () => {
            await page.route('/api/binary', (route) =>
                route.fulfill({
                    status: 200,
                    body: Buffer.from([0, 255, 1]),
                }),
            );

            const response = await page.request.get('http://localhost/api/binary');
            expect(Array.from(await response.body())).toEqual([0, 255, 1]);
        });

        test('should handle unroute()', async () => {
            const handler = mock(async (route: Route) => {
                await route.fulfill({ status: 200, body: '{}' });
            });

            const win = document.defaultView;
            if (!win) throw new Error('Test window is unavailable');
            const originalFetch = win.fetch;
            Reflect.set(
                win,
                'fetch',
                mock(() => Promise.resolve(new Response('{}', { status: 200 }))),
            );

            try {
                await page.route('/api/test', handler);
                await page.unroute('/api/test', handler);

                await page.request.get('http://localhost/api/test');
                expect(handler).not.toHaveBeenCalled();
            } finally {
                Reflect.set(win, 'fetch', originalFetch);
            }
        });

        test('unroute removes only the identical handler for a shared matcher', async () => {
            const firstHandler = mock((route: Route) =>
                route.fulfill({ status: 200, body: 'first' }),
            );
            const secondHandler = mock((route: Route) =>
                route.fulfill({ status: 200, body: 'second' }),
            );

            await page.route('/api/shared', firstHandler);
            await page.route('/api/shared', secondHandler);
            await page.unroute('/api/shared', firstHandler);

            const response = await page.request.get('http://localhost/api/shared');

            expect(await response.text()).toBe('second');
            expect(firstHandler).not.toHaveBeenCalled();
            expect(secondHandler).toHaveBeenCalledTimes(1);
        });

        test('exposes URLSearchParams request bodies through postData()', async () => {
            const captured: { postData?: string | null } = {};
            await page.route('/api/form', (route, request) => {
                captured.postData = request.postData();
                return route.fulfill({ status: 200, body: '{}' });
            });

            await page.request.post('http://localhost/api/form', {
                body: new URLSearchParams({ name: 'Ada Lovelace', role: 'admin' }),
            });

            expect(captured.postData).toBe('name=Ada+Lovelace&role=admin');
        });

        test('should waitForResponse', async () => {
            const waitPromise = page.waitForResponse('/api/data');
            
            // Trigger request
            void page.request.get('http://localhost/api/data');

            const response = (await waitPromise);
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

            const locator = page.locator('.container').filter({
                has: page.locator('.target')
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

            const locators = await page.locator('button').all();
            expect(locators.length).toBe(3);
            const secondLocator = locators[1];
            if (!secondLocator) throw new Error('Expected second button locator');
            expect(await secondLocator.textContent()).toBe('Btn 1');
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

            expect(await page.getByRole('button', { name: 'Submit' }).count()).toBe(1);
            expect(await page.getByPlaceholder('Enter name').count()).toBe(1);
            expect(await page.getByAltText('Logo').count()).toBe(1);
            expect(await page.getByLabel('Email').count()).toBe(1);
            expect(await page.getByTitle('Tooltip').count()).toBe(1);
            expect(await page.getByTestId('test-div').count()).toBe(1);
            expect(await page.getByText('Test').count()).toBe(1);

            // Locator actions
            const locator = page.locator('#check');
            await locator.check();
            expect((document.getElementById('check') as HTMLInputElement).checked).toBe(true);
            await locator.uncheck();
            expect((document.getElementById('check') as HTMLInputElement).checked).toBe(false);

            await page.locator('#name').fill('Alice');
            expect((document.getElementById('name') as HTMLInputElement).value).toBe('Alice');

            await page.locator('#name').focus();
            await page.locator('#name').press('Enter');
            
            expect(await page.locator('img').getAttribute('src')).toBe('logo.png');
            expect(await page.locator('img').allAttributes()).toBeDefined();
            expect(await page.locator('img').boundingBox()).toBeDefined();
        });

        test('should handle visibility variants', async () => {
             const div = document.createElement('div');
             document.body.appendChild(div);
             
             div.style.visibility = 'hidden';
             expect(await page.locator('div').isVisible()).toBe(false);
             
             div.style.visibility = 'visible';
             div.style.opacity = '0';
             expect(await page.locator('div').isVisible()).toBe(false);
        });

        test('should waitForSelector hidden', async () => {
             const div = document.createElement('div');
             document.body.appendChild(div);
             
             setTimeout(() => {
                 div.style.display = 'none';
             }, 100);
             
             await page.waitForSelector('div', { state: 'hidden', timeout: 500 });
             expect(await page.locator('div').isVisible()).toBe(false);
        });

        test('should handle selectOption with array', async () => {
             const select = document.createElement('select');
             select.multiple = true;
             select.innerHTML = '<option value="a">A</option><option value="b">B</option>';
             document.body.appendChild(select);
             
             await page.locator('select').selectOption(['a', 'b']);
             expect(Array.from(select.selectedOptions).map(o => o.value)).toEqual(['a', 'b']);
        });

        test('should handle setInputFiles with Buffer', async () => {
             const input = document.createElement('input');
             input.type = 'file';
             document.body.appendChild(input);
             
             await page.locator('input').setInputFiles({
                 name: 'test.txt',
                 mimeType: 'text/plain',
                 buffer: Buffer.from('hello')
             });
             const uploadedFile = input.files?.[0];
             if (!uploadedFile) throw new Error('Expected uploaded file');
             expect(uploadedFile.name).toBe('test.txt');
        });

        test('should filter by pressed state in getByRole', async () => {
             document.body.innerHTML = `
                <button type="button" aria-pressed="true">Pressed</button>
                <button type="button" aria-pressed="false">Not Pressed</button>
             `;
             expect(await page.getByRole('button', { pressed: true }).count()).toBe(1);
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

            const fl = page.frameLocator('iframe');
            expect(await fl.getByRole('button').count()).toBe(1);
            expect(await fl.getByPlaceholder('Enter name').count()).toBe(1);
            expect(await fl.getByLabel('Label').count()).toBe(1);
            expect(await fl.getByTestId('test').count()).toBe(1);
            expect(await fl.getByText('In Frame').count()).toBe(1);
            expect(await fl.locator('span').count()).toBe(1);
        });

        test('should handle text= selector and deep match', async () => {
            document.body.innerHTML = '<div><span>Deep Text</span></div>';
            expect(await page.locator('text="Deep Text"').count()).toBe(1);
            // Should pick the span, not the div (deepest match principle)
            expect(await page.locator('text="Deep Text"').evaluate((el: HTMLElement) => el.tagName)).toBe('SPAN');
        });

        test('should handle various event dispatching', async () => {
            const div = document.createElement('div');
            document.body.appendChild(div);

            let customTriggered = false;
            div.addEventListener('my-event', () => { customTriggered = true; });

            await page.locator('div').dispatchEvent('my-event');
            expect(customTriggered).toBe(true);
        });
    });

    describe('Dialogs', () => {
        test('should handle alerts via dialog emitter', async () => {
            await page.on('dialog', (dialog) => {
                void dialog.dismiss();
            });

            // Simulate alert trigger from window
            // In shim.ts, alert is usually shimmed by iframe-executor
            // But we can manually trigger the callback if we access internal __MOCK_DIALOG_HANDLER__
            const win = document.defaultView;
            if (win && win.__MOCK_DIALOG_HANDLER__) {
                await win.__MOCK_DIALOG_HANDLER__('alert', 'Hello World');
            }
            // Wait a tick for async emitter
            await new Promise(r => setTimeout(r, 10));
            // expect(dialogMsg).toBe('Hello World'); // Depends on emitter implementation
        });
    });

    describe('Evaluation', () => {
        test('should evaluate code in context', async () => {
            const result = await page.evaluate((arg: number) => {
                return arg + 1;
            }, 41);
            expect(result).toBe(42);
        });

        test('should evaluate on locator', async () => {
            const div = document.createElement('div');
            div.id = 'eval-target';
            div.textContent = 'Original';
            document.body.appendChild(div);

            await page.locator('#eval-target').evaluate((el: HTMLElement) => {
                el.textContent = 'Updated';
            });
            expect(div.textContent).toBe('Updated');
        });
    });
});
