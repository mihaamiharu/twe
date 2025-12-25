/**
 * Mocked Playwright Shim
 * 
 * A client-side compatibility layer that mimics Playwright's API.
 * Runs entirely in the browser using DOM APIs.
 * 
 * Based on: docs/TDD.md Section 5.2
 */

import { logger } from '@/lib/logger';

export interface Locator {
    click(): Promise<void>;
    fill(value: string): Promise<void>;
    textContent(): Promise<string | null>;
    inputValue(): Promise<string>;
    isVisible(): Promise<boolean>;
    isChecked(): Promise<boolean>;
    isDisabled(): Promise<boolean>;
    isEditable(): Promise<boolean>;
    check(): Promise<void>;
    uncheck(): Promise<void>;
    selectOption(value: string | string[]): Promise<void>;
    getAttribute(name: string): Promise<string | null>;
    innerHTML(): Promise<string>;
    count(): Promise<number>;
    first(): Locator;
    last(): Locator;
    nth(index: number): Locator;
    setInputFiles(files: any): Promise<void>;
    dragTo(target: Locator): Promise<void>;
    press(key: string): Promise<void>;
    locator(selector: string): Locator;
}

export interface LocatorOptions {
    name?: string | RegExp;
    exact?: boolean;
}

export interface APIRequestContext {
    get(url: string, options?: any): Promise<APIResponse>;
    post(url: string, options?: any): Promise<APIResponse>;
    put(url: string, options?: any): Promise<APIResponse>;
    delete(url: string, options?: any): Promise<APIResponse>;
    fetch(url: string, options?: any): Promise<APIResponse>;
    storageState(options?: any): Promise<any>;
    newContext(options?: any): Promise<APIRequestContext>;
}

export interface APIResponse {
    ok(): boolean;
    status(): number;
    statusText(): string;
    headers(): Record<string, string>;
    json(): Promise<any>;
    text(): Promise<string>;
    body(): Promise<Buffer>;
}

export interface BrowserContext {
    tracing: {
        start(options?: any): Promise<void>;
        stop(options?: any): Promise<void>;
    };
    cookies(): Promise<any[]>;
    addCookies(cookies: any[]): Promise<void>;
    clearCookies(): Promise<void>;
    newPage(): Promise<MockedPlaywrightPage>;
    close(): Promise<void>;
    request: APIRequestContext;
}

export interface Browser {
    newContext(options?: any): Promise<BrowserContext>;
    close(): Promise<void>;
    version(): string;
}

export interface FrameLocator {
    locator(selector: string): Locator;
    getByRole(role: string, options?: LocatorOptions): Locator;
    getByText(text: string | RegExp, options?: { exact?: boolean }): Locator;
    getByLabel(text: string | RegExp, options?: { exact?: boolean }): Locator;
    getByPlaceholder(text: string | RegExp, options?: { exact?: boolean }): Locator;
    getByTestId(testId: string): Locator;
    first(): FrameLocator;
    last(): FrameLocator;
    nth(index: number): FrameLocator;
}

export interface WaitOptions {
    timeout?: number;
    state?: 'visible' | 'hidden' | 'attached' | 'detached';
}

/**
 * MockedPlaywrightPage - Implements a subset of Playwright's Page API
 * that works with DOM elements in an iframe.
 */
export class MockedPlaywrightPage {
    private targetDocument: Document;
    private defaultTimeout: number;
    public request: APIRequestContext;
    private _context: BrowserContext;

    constructor(iframeDocument: Document, options?: { timeout?: number }) {
        this.targetDocument = iframeDocument;
        this.defaultTimeout = options?.timeout || 5000;
        this.request = this._createAPIRequestContext();
        this._context = this._createBrowserContext();
    }

    // ============================================
    // Core Actions
    // ============================================

    async goto(url: string): Promise<void> {
        // Mock navigation
        // In a real browser this would change the URL
        // Here we can just pretend or update history if needed
        // For now, doing nothing is often enough for "happy path" checks as long as we don't assert URL immediately differently
        // But some assertions check title.
        logger.debug(`Navigating to ${url}`);
    }

    async click(selector: string): Promise<void> {
        // Auto-wait for element to be visible
        await this.waitForSelector(selector, { state: 'visible' });

        const element = this.targetDocument.querySelector(selector) as HTMLElement;
        if (!element) throw new Error(`Element not found: ${selector}`);
        element.click();
    }

    /**
     * Fill an input or textarea with text
     */
    async fill(selector: string, value: string): Promise<void> {
        // Auto-wait for element to be visible
        await this.waitForSelector(selector, { state: 'visible' });

        const element = this.targetDocument.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement;

        if (!element) throw new Error(`Element not found: ${selector}`);
        if (!('value' in element)) {
            throw new Error(`Element is not an input or textarea: ${selector}`);
        }

        element.focus();
        element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
    }

    /**
     * Check a checkbox or radio button
     */
    async check(selector: string): Promise<void> {
        await this.waitForSelector(selector, { state: 'visible' });
        const element = this.targetDocument.querySelector(selector) as HTMLInputElement;

        if (!element) throw new Error(`Element not found: ${selector}`);
        if (element.type !== 'checkbox' && element.type !== 'radio') {
            throw new Error(`Element is not a checkbox or radio: ${selector}`);
        }

        if (!element.checked) {
            element.click();
        }
    }

    /**
     * Check if a checkbox is checked
     */
    async isChecked(selector: string): Promise<boolean> {
        return this.locator(selector).isChecked();
    }

    /**
     * Check if element is disabled
     */
    async isDisabled(selector: string): Promise<boolean> {
        return this.locator(selector).isDisabled();
    }

    /**
     * Check if element is editable
     */
    async isEditable(selector: string): Promise<boolean> {
        return this.locator(selector).isEditable();
    }

    /**
     * Get input value
     */
    async inputValue(selector: string): Promise<string> {
        return this.locator(selector).inputValue();
    }

    /**
     * Get element attribute
     */
    async getAttribute(selector: string, name: string): Promise<string | null> {
        return this.locator(selector).getAttribute(name);
    }

    /**
     * Select option
     */
    async selectOption(selector: string, value: string | string[]): Promise<void> {
        return this.locator(selector).selectOption(value);
    }

    /**
     * Uncheck a checkbox
     */
    async uncheck(selector: string): Promise<void> {
        await this.waitForSelector(selector, { state: 'visible' });
        const element = this.targetDocument.querySelector(selector) as HTMLInputElement;

        if (!element) throw new Error(`Element not found: ${selector}`);
        if (element.type !== 'checkbox') {
            throw new Error(`Element is not a checkbox: ${selector}`);
        }

        if (element.checked) {
            element.click();
        }
    }

    /**
     * Get text content of an element
     */
    async textContent(selector: string): Promise<string | null> {
        await this.delay(20);
        const element = this.targetDocument.querySelector(selector);
        return element?.textContent || null;
    }

    /**
     * Wait for an element matching the selector to appear
     */
    async waitForSelector(selector: string, options?: WaitOptions): Promise<void> {
        const timeout = options?.timeout || this.defaultTimeout;
        const state = options?.state || 'visible';
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            const element = this.targetDocument.querySelector(selector) as HTMLElement;

            if (state === 'attached' && element) {
                return;
            }

            if (state === 'detached' && !element) {
                return;
            }

            if (state === 'visible' && element && this.isVisible(element)) {
                return;
            }

            if (state === 'hidden' && (!element || !this.isVisible(element))) {
                return;
            }

            await this.delay(100);
        }

        throw new Error(`Timeout ${timeout}ms waiting for selector: ${selector} (state: ${state})`);
    }

    /**
     * Get page title
     */
    /**
     * Get page title
     */
    async title(): Promise<string> {
        return this.targetDocument.title;
    }

    async waitForLoadState(state?: string): Promise<void> {
        await this.delay(100);
    }

    async waitForFunction(pageFunction: Function | string, arg?: any, options?: any): Promise<void> {
        const timeout = options?.timeout || this.defaultTimeout;
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            let result: any;
            try {
                if (typeof pageFunction === 'function') {
                    result = await pageFunction(arg);
                } else {
                    // Basic support for string evaluation if needed, though strictly we should avoid eval
                    // For now, assume function is passed as per strict TS usage in tests
                }
            } catch (e) {
                // Ignore errors while waiting
            }

            if (result) return;
            await this.delay(100);
        }
        throw new Error('Timeout waiting for function');
    }

    async waitForResponse(urlOrPredicate: string | RegExp | ((resp: any) => boolean)): Promise<any> {
        await this.delay(500);
        return {
            ok: true,
            status: () => 200,
            json: async () => ({}),
            text: async () => '',
            url: () => typeof urlOrPredicate === 'string' ? urlOrPredicate : '',
        };
    }

    async waitForTimeout(ms: number): Promise<void> {
        await this.delay(ms);
    }

    async screenshot(options?: any): Promise<Buffer> {
        logger.debug('Mocking screenshot');
        return Buffer.from('');
    }

    video(): { path(): Promise<string>; delete(): Promise<void>; saveAs(path: string): Promise<void>; } | null {
        return {
            path: async () => '/tmp/video.mp4',
            delete: async () => { },
            saveAs: async () => { }
        };
    }

    context(): BrowserContext {
        return this._context;
    }


    async hover(selector: string): Promise<void> {
        await this.waitForSelector(selector, { state: 'visible' });
        const element = this.targetDocument.querySelector(selector) as HTMLElement;
        if (!element) throw new Error(`Element not found: ${selector}`);
        element.dispatchEvent(new Event('mouseenter', { bubbles: true }));
        element.dispatchEvent(new Event('mouseover', { bubbles: true }));
    }

    async press(selector: string, key: string): Promise<void> {
        await this.waitForSelector(selector, { state: 'visible' });
        const element = this.targetDocument.querySelector(selector) as HTMLElement;
        if (!element) throw new Error(`Element not found: ${selector}`);

        element.focus();
        element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
        element.dispatchEvent(new KeyboardEvent('keypress', { key, bubbles: true }));
        element.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
    }

    frameLocator(selector: string): FrameLocator {
        const frameElement = this.targetDocument.querySelector(selector) as HTMLIFrameElement;
        const self = this;

        return {
            locator(itemSelector: string): Locator {
                const getDoc = () => {
                    const frame = self.targetDocument.querySelector(selector) as HTMLIFrameElement;
                    if (!frame) throw new Error(`Frame not found: ${selector}`);
                    return frame.contentDocument || frame.contentWindow?.document;
                };

                const createFramePage = () => {
                    const doc = getDoc();
                    if (!doc) throw new Error('Frame document not accessible');
                    return new MockedPlaywrightPage(doc);
                };

                const proxyHandler = {
                    get(_target: any, prop: string | symbol) {
                        const page = createFramePage();
                        const locator = page.locator(itemSelector);
                        const value = (locator as any)[prop];
                        if (typeof value === 'function') {
                            return function (...args: any[]) {
                                return value.apply(locator, args);
                            };
                        }
                        return value;
                    }
                };
                return new Proxy({}, proxyHandler) as Locator;
            },
            getByRole(r, o) {
                const frame = self.targetDocument.querySelector(selector) as HTMLIFrameElement;
                const doc = frame?.contentDocument;
                if (!doc) throw new Error('Frame document not found');
                return new MockedPlaywrightPage(doc).getByRole(r, o);
            },
            getByText(t, o) {
                const frame = self.targetDocument.querySelector(selector) as HTMLIFrameElement;
                const doc = frame?.contentDocument;
                if (!doc) throw new Error('Frame document not found');
                return new MockedPlaywrightPage(doc).getByText(t, o);
            },
            getByLabel(t, o) {
                const frame = self.targetDocument.querySelector(selector) as HTMLIFrameElement;
                const doc = frame?.contentDocument;
                if (!doc) throw new Error('Frame document not found');
                return new MockedPlaywrightPage(doc).getByLabel(t, o);
            },
            getByPlaceholder(t, o) {
                const frame = self.targetDocument.querySelector(selector) as HTMLIFrameElement;
                const doc = frame?.contentDocument;
                if (!doc) throw new Error('Frame document not found');
                return new MockedPlaywrightPage(doc).getByPlaceholder(t, o);
            },
            getByTestId(id) {
                const frame = self.targetDocument.querySelector(selector) as HTMLIFrameElement;
                const doc = frame?.contentDocument;
                if (!doc) throw new Error('Frame document not found');
                return new MockedPlaywrightPage(doc).getByTestId(id);
            },
            first() { return this; },
            last() { return this; },
            nth(i) { return this; }
        };
    }


    // ============================================
    // Role-based Locators (Playwright-style)
    // ============================================

    /**
     * Find element by ARIA role
     */
    getByRole(role: string, options?: LocatorOptions): Locator {
        return this.createLocator(() => {
            let elements: HTMLElement[];

            // Handle common roles that map to HTML elements
            const roleToTag: Record<string, string> = {
                button: 'button, [role="button"], input[type="submit"], input[type="button"]',
                textbox: 'input[type="text"], input[type="email"], input[type="password"], input:not([type]), textarea, [role="textbox"]',
                checkbox: 'input[type="checkbox"], [role="checkbox"]',
                radio: 'input[type="radio"], [role="radio"]',
                link: 'a, [role="link"]',
                heading: 'h1, h2, h3, h4, h5, h6, [role="heading"]',
                listitem: 'li, [role="listitem"]',
                img: 'img, [role="img"]',
            };

            const selector = roleToTag[role] || `[role="${role}"]`;
            elements = Array.from(this.targetDocument.querySelectorAll(selector));

            // Filter by name if provided
            if (options?.name) {
                elements = elements.filter(el => {
                    const text = el.textContent || el.getAttribute('aria-label') || '';
                    if (options.name instanceof RegExp) {
                        return options.name.test(text);
                    }
                    return options.exact
                        ? text.trim() === options.name
                        : text.toLowerCase().includes((options.name as string).toLowerCase());
                });
            }

            return elements;
        });
    }

    /**
     * Find element by text content
     */
    getByText(text: string | RegExp, options?: { exact?: boolean }): Locator {
        return this.createLocator(() => {
            const walker = this.targetDocument.createTreeWalker(
                this.targetDocument.body,
                NodeFilter.SHOW_ELEMENT
            );

            const elements: HTMLElement[] = [];
            let node: Node | null;

            while ((node = walker.nextNode())) {
                const el = node as HTMLElement;
                const content = el.textContent || '';

                if (text instanceof RegExp) {
                    if (text.test(content)) elements.push(el);
                } else if (options?.exact) {
                    if (content.trim() === text) elements.push(el);
                } else {
                    if (content.toLowerCase().includes(text.toLowerCase())) elements.push(el);
                }
            }

            return elements;
        });
    }

    /**
     * Find form element by label text
     */
    getByLabel(text: string | RegExp, options?: { exact?: boolean }): Locator {
        return this.createLocator(() => {
            const labels = Array.from(this.targetDocument.querySelectorAll('label'));
            const matchingElements: HTMLElement[] = [];

            for (const label of labels) {
                const labelText = label.textContent || '';
                let matches = false;

                if (text instanceof RegExp) {
                    matches = text.test(labelText);
                } else if (options?.exact) {
                    matches = labelText.trim() === text;
                } else {
                    matches = labelText.toLowerCase().includes(text.toLowerCase());
                }

                if (matches) {
                    // Find associated input
                    const forId = label.getAttribute('for');
                    if (forId) {
                        const input = this.targetDocument.getElementById(forId);
                        if (input) matchingElements.push(input as HTMLElement);
                    } else {
                        // Input might be inside label
                        const input = label.querySelector('input, textarea, select');
                        if (input) matchingElements.push(input as HTMLElement);
                    }
                }
            }

            return matchingElements;
        });
    }

    /**
     * Find element by placeholder text
     */
    getByPlaceholder(text: string | RegExp, options?: { exact?: boolean }): Locator {
        return this.createLocator(() => {
            const inputs = Array.from(this.targetDocument.querySelectorAll('[placeholder]'));

            return inputs.filter(el => {
                const placeholder = el.getAttribute('placeholder') || '';
                if (text instanceof RegExp) {
                    return text.test(placeholder);
                }
                return options?.exact
                    ? placeholder === text
                    : placeholder.toLowerCase().includes(text.toLowerCase());
            }) as HTMLElement[];
        });
    }

    /**
     * Find element by test ID attribute
     */
    getByTestId(testId: string): Locator {
        return this.locator(`[data-testid="${testId}"]`);
    }

    // ============================================
    // CSS/XPath Locator
    // ============================================

    /**
     * Create a locator using CSS selector
     */
    locator(selector: string): Locator {
        return this.createLocator(() => {
            return Array.from(this.targetDocument.querySelectorAll(selector)) as HTMLElement[];
        });
    }

    // ============================================
    // Page-level Methods
    // ============================================

    /**
     * Get inner HTML of any element
     */
    async innerHTML(selector: string): Promise<string> {
        const element = this.targetDocument.querySelector(selector);
        if (!element) {
            throw new Error(`Element not found: ${selector}`);
        }
        return element.innerHTML;
    }

    /**
     * Check if element is visible
     */
    async isElementVisible(selector: string): Promise<boolean> {
        const element = this.targetDocument.querySelector(selector) as HTMLElement;
        return element ? this.isVisible(element) : false;
    }

    /**
     * Get count of matching elements
     */
    async count(selector: string): Promise<number> {
        return this.targetDocument.querySelectorAll(selector).length;
    }

    // ============================================
    // Private Helpers
    // ============================================

    private isVisible(element: HTMLElement): boolean {
        if (!element) return false;

        const style = window.getComputedStyle(element);

        return (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0' &&
            element.offsetParent !== null
        );
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private _createAPIRequestContext(): APIRequestContext {
        return {
            get: async (url) => this._mockResponse(),
            post: async (url) => this._mockResponse(),
            put: async (url) => this._mockResponse(),
            delete: async (url) => this._mockResponse(),
            fetch: async (url) => this._mockResponse(),
            storageState: async () => ({ cookies: [], origins: [] }),
            newContext: async () => this._createAPIRequestContext()
        };
    }

    private _mockResponse(): APIResponse {
        return {
            ok: () => true,
            status: () => 200,
            statusText: () => 'OK',
            headers: () => ({ 'content-type': 'application/json' }),
            json: async () => ({ success: true, id: 1 }),
            text: async () => '{"success":true}',
            body: async () => Buffer.from('')
        };
    }

    private _createBrowserContext(): BrowserContext {
        return {
            tracing: {
                start: async () => logger.debug('Tracing started'),
                stop: async () => logger.debug('Tracing stopped')
            },
            cookies: async () => [],
            addCookies: async () => { },
            clearCookies: async () => { },
            newPage: async () => new MockedPlaywrightPage(this.targetDocument),
            close: async () => { },
            request: this._createAPIRequestContext()
        };
    }

    private createLocator(finder: () => HTMLElement[]): Locator {
        const self = this;
        let filterIndex: number | null = null;
        let filterType: 'first' | 'last' | 'nth' | null = null;

        const getElement = (): HTMLElement | null => {
            const elements = finder();
            if (elements.length === 0) return null;

            if (filterType === 'first') return elements[0];
            if (filterType === 'last') return elements[elements.length - 1];
            if (filterType === 'nth' && filterIndex !== null) return elements[filterIndex] || null;

            return elements[0]; // Default to first
        };

        const locator: Locator = {
            async click(): Promise<void> {
                await self.delay(50);
                const el = getElement();
                if (!el) throw new Error('Element not found');
                if (!self.isVisible(el)) throw new Error('Element is not visible');
                el.click();
            },

            async fill(value: string): Promise<void> {
                await self.delay(50);
                const el = getElement() as HTMLInputElement | HTMLTextAreaElement;
                if (!el) throw new Error('Element not found');
                el.focus();
                el.value = value;
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            },

            async textContent(): Promise<string | null> {
                const el = getElement();
                return el?.textContent || null;
            },

            async inputValue(): Promise<string> {
                const el = getElement() as HTMLInputElement;
                if (!el) throw new Error('Element not found');
                return el.value;
            },

            async isVisible(): Promise<boolean> {
                const el = getElement();
                return el ? self.isVisible(el) : false;
            },

            async isChecked(): Promise<boolean> {
                const el = getElement() as HTMLInputElement;
                if (!el) return false;
                return el.checked;
            },

            async isDisabled(): Promise<boolean> {
                const el = getElement() as HTMLButtonElement | HTMLInputElement;
                if (!el) return false;
                return el.disabled;
            },

            async isEditable(): Promise<boolean> {
                const el = getElement() as HTMLInputElement;
                if (!el) return false;
                return !el.readOnly && !el.disabled;
            },

            async check(): Promise<void> {
                const el = getElement() as HTMLInputElement;
                if (!el) throw new Error('Element not found');
                if (el.type !== 'checkbox' && el.type !== 'radio') {
                    throw new Error('Element is not a checkbox or radio');
                }
                if (!el.checked) el.click();
            },

            async uncheck(): Promise<void> {
                const el = getElement() as HTMLInputElement;
                if (!el) throw new Error('Element not found');
                if (el.type !== 'checkbox') throw new Error('Element is not a checkbox');
                if (el.checked) el.click();
            },

            async selectOption(value: string | string[]): Promise<void> {
                const el = getElement() as HTMLSelectElement;
                if (!el) throw new Error('Element not found');
                if (el.tagName !== 'SELECT') throw new Error('Element is not a select');

                const values = Array.isArray(value) ? value : [value];
                for (const option of el.options) {
                    option.selected = values.includes(option.value);
                }
                el.dispatchEvent(new Event('change', { bubbles: true }));
            },

            async getAttribute(name: string): Promise<string | null> {
                const el = getElement();
                return el?.getAttribute(name) || null;
            },

            async innerHTML(): Promise<string> {
                const el = getElement();
                return el?.innerHTML || '';
            },

            async count(): Promise<number> {
                return finder().length;
            },

            first(): Locator {
                filterType = 'first';
                return locator;
            },

            last(): Locator {
                filterType = 'last';
                return locator;
            },

            nth(index: number): Locator {
                filterType = 'nth';
                filterIndex = index;
                return locator;
            },

            async setInputFiles(files: any): Promise<void> {
                await self.delay(50);
                const el = getElement() as HTMLInputElement;
                if (!el) throw new Error('Element not found');
                if (el.type !== 'file') throw new Error('Element is not a file input');

                const dataTransfer = new DataTransfer();
                const fileList = Array.isArray(files) ? files : [files];

                for (const f of fileList) {
                    const file = new File([f.buffer || ''], f.name, { type: f.mimeType });
                    dataTransfer.items.add(file);
                }

                el.files = dataTransfer.files;
                el.dispatchEvent(new Event('change', { bubbles: true }));
                el.dispatchEvent(new Event('input', { bubbles: true }));
            },

            async dragTo(target: Locator): Promise<void> {
                const sourceEl = getElement();
                if (!sourceEl) throw new Error('Source element not found');
                sourceEl.dispatchEvent(new DragEvent('dragstart', { bubbles: true }));
            },

            async press(key: string): Promise<void> {
                await self.delay(50);
                const el = getElement();
                if (!el) throw new Error('Element not found');
                el.focus();
                el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
                el.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
            },

            locator(subSelector: string): Locator {
                return self.createLocator(() => {
                    const parents = finder();
                    const children: HTMLElement[] = [];
                    for (const parent of parents) {
                        const matches = Array.from(parent.querySelectorAll(subSelector)) as HTMLElement[];
                        children.push(...matches);
                    }
                    return children;
                });
            },
        };

        return locator;
    }
}
