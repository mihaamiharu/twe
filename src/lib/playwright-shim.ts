/**
 * Mocked Playwright Shim
 * 
 * A client-side compatibility layer that mimics Playwright's API.
 * Runs entirely in the browser using DOM APIs.
 * 
 * Based on: docs/TDD.md Section 5.2
 */

import { logger } from './logger';

export interface FilePayload {
    name: string;
    mimeType: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buffer: any;
}

export interface Locator {
    click(): Promise<void>;
    dblclick(): Promise<void>;
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
    focus(): Promise<void>;
    blur(): Promise<void>;
    clear(): Promise<void>;
    dispatchEvent(type: string, eventInit?: CustomEventInit): Promise<void>;
    setInputFiles(files: FilePayload | FilePayload[]): Promise<void>;
    dragTo(target: Locator): Promise<void>;
    dragAndDrop(target: Locator): Promise<void>;
    press(key: string): Promise<void>;
    evaluate<R, Arg>(pageFunction: (element: HTMLElement, arg: Arg) => R | Promise<R>, arg?: Arg): Promise<R>;
    locator(selector: string): Locator;
    filter(options: { hasText?: string | RegExp }): Locator;
    all(): Promise<Locator[]>;
    allTextContents(): Promise<string[]>;
}

export interface LocatorOptions {
    name?: string | RegExp;
    exact?: boolean;
}

export interface APIRequestContext {
    get(url: string, options?: unknown): Promise<APIResponse>;
    post(url: string, options?: unknown): Promise<APIResponse>;
    put(url: string, options?: unknown): Promise<APIResponse>;
    delete(url: string, options?: unknown): Promise<APIResponse>;
    fetch(url: string, options?: unknown): Promise<APIResponse>;
    storageState(options?: unknown): Promise<{ cookies: unknown[]; origins: unknown[] }>;
    newContext(options?: unknown): Promise<APIRequestContext>;
}

export interface APIResponse {
    ok(): boolean;
    status(): number;
    statusText(): string;
    headers(): Record<string, string>;
    json(): Promise<unknown>;
    text(): Promise<string>;
    body(): Promise<Buffer>;
}

export interface BrowserContext {
    tracing: {
        start(options?: unknown): Promise<void>;
        stop(options?: unknown): Promise<void>;
    };
    cookies(): Promise<unknown[]>;
    addCookies(cookies: unknown[]): Promise<void>;
    clearCookies(): Promise<void>;
    newPage(): Promise<MockedPlaywrightPage>;
    close(): Promise<void>;
    request: APIRequestContext;
}

export interface Browser {
    newContext(options?: unknown): Promise<BrowserContext>;
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
    private currentUrl: string = 'about:blank';
    private _context: BrowserContext;

    constructor(iframeDocument: Document, options?: { timeout?: number }) {
        this.targetDocument = iframeDocument;
        this.defaultTimeout = options?.timeout || 2500;
        this.request = this._createAPIRequestContext();
        this._context = this._createBrowserContext();
    }

    // ============================================
    // Core Actions
    // ============================================

    async goto(url: string): Promise<void> {
        // Mock navigation
        logger.debug(`Navigating to ${url}`);
        this.currentUrl = url;
        await this.delay(50);
        return Promise.resolve();
    }

    url(): string {
        return this.currentUrl;
    }

    async reload(): Promise<void> {
        logger.debug('Reloading page');
        this.targetDocument.location.reload();
        await this.delay(100);
    }

    async goBack(): Promise<void> {
        logger.debug('Navigating back');
        this.targetDocument.defaultView?.history.back();
        await this.delay(100);
    }

    async goForward(): Promise<void> {
        logger.debug('Navigating forward');
        this.targetDocument.defaultView?.history.forward();
        await this.delay(100);
    }

    async evaluate<R, Arg>(pageFunction: (arg: Arg) => R | Promise<R>, arg?: Arg): Promise<R> {
        if (typeof pageFunction === 'function') {
            return Promise.resolve(pageFunction(arg as Arg));
        }
        // If string, we might need eval, but let's avoid it for security/complexity if possible.
        // Playwright supports string, but mostly people use functions.
        throw new Error('evaluate only supports functions in this shim');
    }

    async click(selector: string): Promise<void> {
        // Auto-wait for element to be visible
        await this.waitForSelector(selector, { state: 'visible' });

        const element = this.targetDocument.querySelector(selector) as HTMLElement;
        if (!element) throw new Error(`Element not found: ${selector}`);
        element.click();
    }

    async dblclick(selector: string): Promise<void> {
        await this.waitForSelector(selector, { state: 'visible' });
        const element = this.targetDocument.querySelector(selector) as HTMLElement;
        if (!element) throw new Error(`Element not found: ${selector}`);
        element.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window }));
    }

    async focus(selector: string): Promise<void> {
        await this.waitForSelector(selector, { state: 'visible' });
        const element = this.targetDocument.querySelector(selector) as HTMLElement;
        if (!element) throw new Error(`Element not found: ${selector}`);
        element.focus();
    }

    async dispatchEvent(selector: string, type: string, eventInit?: CustomEventInit): Promise<void> {
        await this.waitForSelector(selector, { state: 'visible' });
        const element = this.targetDocument.querySelector(selector) as HTMLElement;
        if (!element) throw new Error(`Element not found: ${selector}`);
        element.dispatchEvent(new CustomEvent(type, { bubbles: true, cancelable: true, ...eventInit }));
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
    isChecked(selector: string): Promise<boolean> {
        return this.locator(selector).isChecked();
    }

    /**
     * Check if element is disabled
     */
    isDisabled(selector: string): Promise<boolean> {
        return this.locator(selector).isDisabled();
    }

    /**
     * Check if element is editable
     */
    isEditable(selector: string): Promise<boolean> {
        return this.locator(selector).isEditable();
    }

    /**
     * Get input value
     */
    inputValue(selector: string): Promise<string> {
        return this.locator(selector).inputValue();
    }

    /**
     * Get element attribute
     */
    getAttribute(selector: string, name: string): Promise<string | null> {
        return this.locator(selector).getAttribute(name);
    }

    /**
     * Select option
     */
    selectOption(selector: string, value: string | string[]): Promise<void> {
        return this.locator(selector).selectOption(value);
    }

    /**
     * Set input files
     */
    setInputFiles(selector: string, files: string | FilePayload | string[] | FilePayload[]): Promise<void> {
        // @ts-expect-error Types in shim are simplified
        return this.locator(selector).setInputFiles(files);
    }

    /**
     * Drag and drop
     */
    dragAndDrop(source: string, target: string): Promise<void> {
        return this.locator(source).dragTo(this.locator(target));
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

        throw new Error(`Unable to locate ${selector}. Please verify the element exists.`);
    }

    /**
     * Get page title
     */
    title(): Promise<string> {
        return Promise.resolve(this.targetDocument.title);
    }

    async waitForLoadState(): Promise<void> {
        await this.delay(100);
    }

    async waitForFunction(pageFunction: (...args: unknown[]) => unknown, arg?: unknown, options?: { timeout?: number }): Promise<void> {
        const timeout = options?.timeout || this.defaultTimeout;
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            let result: unknown;
            try {
                if (typeof pageFunction === 'function') {
                    result = await pageFunction(arg);
                } else {
                    // Basic support for string evaluation if needed, though strictly we should avoid eval
                    // For now, assume function is passed as per strict TS usage in tests
                }
            } catch {
                // Ignore errors while waiting
            }

            if (result) return;
            await this.delay(100);
        }
        throw new Error('Timeout waiting for function');
    }

    async waitForResponse(urlOrPredicate: string | RegExp | ((resp: unknown) => boolean)): Promise<unknown> {
        await this.delay(500);
        return {
            ok: true,
            status: () => 200,
            json: () => Promise.resolve({}),
            text: () => Promise.resolve(''),
            url: () => typeof urlOrPredicate === 'string' ? urlOrPredicate : '',
        };
    }

    async waitForTimeout(ms: number): Promise<void> {
        await this.delay(ms);
    }

    screenshot(): Promise<Buffer> {
        logger.debug('Mocking screenshot');
        return Promise.resolve(Buffer.from(''));
    }

    video(): { path(): Promise<string>; delete(): Promise<void>; saveAs(path: string): Promise<void>; } | null {
        return {
            path: () => Promise.resolve('/tmp/video.mp4'),
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
        const createFrameLocatorInternal = (frameSelector: string, index: number): FrameLocator => {
            const getFrameDoc = (): Document | null => {
                const frames = this.targetDocument.querySelectorAll(frameSelector);
                let targetIndex = index;
                if (index < 0) {
                    targetIndex = frames.length + index; // Handle -1 for last
                }
                const frame = frames[targetIndex] as HTMLIFrameElement;
                if (!frame) return null;
                return frame.contentDocument || frame.contentWindow?.document || null;
            };

            return {
                locator: (itemSelector: string): Locator => {
                    return this.createLocator(() => {
                        const doc = getFrameDoc();
                        if (!doc) return [];
                        return Array.from(doc.querySelectorAll(itemSelector)) as HTMLElement[];
                    });
                },
                getByRole: (role: string, options?: LocatorOptions) => {
                    return this.createLocator(() => {
                        const doc = getFrameDoc();
                        if (!doc) return [];
                        const page = new MockedPlaywrightPage(doc);
                        // Use page's internal getByRole logic indirectly via querying
                        const roleSelector = `[role="${role}"]`;
                        let elements = Array.from(doc.querySelectorAll(roleSelector)) as HTMLElement[];
                        if (options?.name) {
                            elements = elements.filter(el => {
                                const text = el.textContent || el.getAttribute('aria-label') || '';
                                return options.name instanceof RegExp ? options.name.test(text) : text.includes(options.name as string);
                            });
                        }
                        return elements;
                    });
                },
                getByText: (text: string | RegExp, options?: { exact?: boolean }) => {
                    return this.createLocator(() => {
                        const doc = getFrameDoc();
                        if (!doc) return [];
                        const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
                        const elements: HTMLElement[] = [];
                        let node: Node | null;
                        while ((node = walker.nextNode())) {
                            const content = node.textContent || '';
                            const matches = text instanceof RegExp
                                ? text.test(content)
                                : options?.exact ? content === text : content.includes(text);
                            if (matches && node.parentElement) {
                                elements.push(node.parentElement);
                            }
                        }
                        return elements;
                    });
                },
                getByLabel: (text: string | RegExp, options?: { exact?: boolean }) => {
                    return this.createLocator(() => {
                        const doc = getFrameDoc();
                        if (!doc) return [];
                        const labels = Array.from(doc.querySelectorAll('label'));
                        const elements: HTMLElement[] = [];
                        for (const label of labels) {
                            const labelText = label.textContent || '';
                            const matches = text instanceof RegExp
                                ? text.test(labelText)
                                : options?.exact ? labelText === text : labelText.includes(text);
                            if (matches) {
                                const forId = label.getAttribute('for');
                                if (forId) {
                                    const input = doc.getElementById(forId);
                                    if (input) elements.push(input as HTMLElement);
                                }
                            }
                        }
                        return elements;
                    });
                },
                getByPlaceholder: (text: string | RegExp, options?: { exact?: boolean }) => {
                    return this.createLocator(() => {
                        const doc = getFrameDoc();
                        if (!doc) return [];
                        const inputs = Array.from(doc.querySelectorAll('[placeholder]')) as HTMLElement[];
                        return inputs.filter(el => {
                            const placeholder = el.getAttribute('placeholder') || '';
                            return text instanceof RegExp
                                ? text.test(placeholder)
                                : options?.exact ? placeholder === text : placeholder.includes(text);
                        });
                    });
                },
                getByTestId: (testId: string) => {
                    return this.createLocator(() => {
                        const doc = getFrameDoc();
                        if (!doc) return [];
                        return Array.from(doc.querySelectorAll(`[data-testid="${testId}"]`)) as HTMLElement[];
                    });
                },
                first: () => createFrameLocatorInternal(frameSelector, 0),
                last: () => createFrameLocatorInternal(frameSelector, -1),
                nth: (n: number) => createFrameLocatorInternal(frameSelector, n)
            };
        };

        return createFrameLocatorInternal(selector, 0);
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
                // Only match leaf-ish elements (elements without child elements that match)
                // This prevents matching containers when we want the actual text element
                const content = el.textContent || '';

                if (text instanceof RegExp) {
                    if (text.test(content)) elements.push(el);
                } else if (options?.exact) {
                    if (content.trim() === text) elements.push(el);
                } else {
                    if (content.toLowerCase().includes(text.toLowerCase())) elements.push(el);
                }
            }

            // Sort by depth (deepest first) so innermost elements come first
            // This mimics Playwright's behavior of preferring specific elements
            const getDepth = (el: HTMLElement): number => {
                let depth = 0;
                let parent = el.parentElement;
                while (parent) {
                    depth++;
                    parent = parent.parentElement;
                }
                return depth;
            };

            return elements.sort((a, b) => getDepth(b) - getDepth(a));
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
                        if (input) matchingElements.push(input);
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
            return Array.from(this.targetDocument.querySelectorAll(selector));
        });
    }

    // ============================================
    // Page-level Methods
    // ============================================

    /**
     * Get inner HTML of any element
     */
    innerHTML(selector: string): Promise<string> {
        const element = this.targetDocument.querySelector(selector);
        if (!element) {
            return Promise.reject(new Error(`Element not found: ${selector}`));
        }
        return Promise.resolve(element.innerHTML);
    }

    /**
     * Check if element is visible
     */
    isElementVisible(selector: string): Promise<boolean> {
        const element = this.targetDocument.querySelector(selector) as HTMLElement;
        return Promise.resolve(element ? this.isVisible(element) : false);
    }

    /**
     * Get count of matching elements
     */
    count(selector: string): Promise<number> {
        return Promise.resolve(this.targetDocument.querySelectorAll(selector).length);
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
            get: () => Promise.resolve(this._mockResponse()),
            post: () => Promise.resolve(this._mockResponse()),
            put: () => Promise.resolve(this._mockResponse()),
            delete: () => Promise.resolve(this._mockResponse()),
            fetch: () => Promise.resolve(this._mockResponse()),
            storageState: () => Promise.resolve({ cookies: [], origins: [] }),
            newContext: () => Promise.resolve(this._createAPIRequestContext())
        };
    }

    private _mockResponse(): APIResponse {
        return {
            ok: () => true,
            status: () => 200,
            statusText: () => 'OK',
            headers: () => ({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({ success: true, id: 1 }),
            text: () => Promise.resolve('{"success":true}'),
            body: () => Promise.resolve(Buffer.from(''))
        };
    }

    private _createBrowserContext(): BrowserContext {
        return {
            tracing: {
                start: () => {
                    logger.debug('Tracing started');
                    return Promise.resolve();
                },
                stop: () => {
                    logger.debug('Tracing stopped');
                    return Promise.resolve();
                }
            },
            cookies: () => Promise.resolve([]),
            addCookies: () => Promise.resolve(),
            clearCookies: () => Promise.resolve(),
            newPage: () => Promise.resolve(new MockedPlaywrightPage(this.targetDocument)),
            close: () => Promise.resolve(),
            request: this._createAPIRequestContext()
        };
    }

    private createLocator(finder: () => HTMLElement[]): Locator {
        let filterIndex: number | null = null;
        let filterType: 'first' | 'last' | 'nth' | null = null;

        // Expose finder for internal cross-locator delegation (e.g. frameLocator)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this as any).finder = () => {
            const elements = finder();
            if (elements.length === 0) return [];

            if (filterType === 'first') return [elements[0]];
            if (filterType === 'last') return [elements[elements.length - 1]];
            if (filterType === 'nth' && filterIndex !== null) return elements[filterIndex] ? [elements[filterIndex]] : [];

            return elements;
        };

        const getElement = (): HTMLElement | null => {
            const elements = finder();
            if (elements.length === 0) return null;

            if (filterType === 'first') return elements[0];
            if (filterType === 'last') return elements[elements.length - 1];
            if (filterType === 'nth' && filterIndex !== null) return elements[filterIndex] || null;

            return elements[0]; // Default to first
        };

        /**
         * Strict mode check - throws if multiple elements match without explicit filter
         */
        const strictCheck = () => {
            const elements = finder();
            if (elements.length > 1 && filterType === null) {
                throw new Error(
                    `Strict mode violation: locator resolved to ${elements.length} elements. ` +
                    `Use .first(), .last(), or .nth() to select a specific element, ` +
                    `or make your selector more specific.`
                );
            }
        };

        /**
         * Wait for element to be present and satisfy filter
         */
        const waitForElement = async (timeout: number = this.defaultTimeout): Promise<HTMLElement> => {
            const startTime = Date.now();
            while (Date.now() - startTime < timeout) {
                const el = getElement();
                if (el) return el;
                await this.delay(100);
            }
            throw new Error('Timeout waiting for element to appear');
        };

        const locator: Locator = {
            click: async () => {
                await this.delay(50);
                strictCheck();
                const el = getElement();
                if (!el) throw new Error('Element not found');
                if (!this.isVisible(el)) throw new Error('Element is not visible');
                el.click();
            },

            dblclick: async () => {
                await this.delay(50);
                strictCheck();
                const el = getElement();
                if (!el) throw new Error('Element not found');
                if (!this.isVisible(el)) throw new Error('Element is not visible');
                el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window }));
            },

            fill: async (value: string) => {
                await this.delay(50);
                strictCheck();
                const el = getElement() as HTMLInputElement | HTMLTextAreaElement;
                if (!el) throw new Error('Element not found');
                el.focus();
                el.value = value;
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            },

            textContent: async () => {
                const el = await waitForElement().catch(() => null);
                return el?.textContent || null;
            },

            inputValue: async () => {
                const el = await waitForElement();
                return (el as HTMLInputElement).value;
            },

            isVisible: () => {
                const el = getElement();
                return Promise.resolve(el ? this.isVisible(el) : false);
            },

            isChecked: () => {
                const el = getElement() as HTMLInputElement;
                if (!el) return Promise.resolve(false);
                return Promise.resolve(el.checked);
            },

            isDisabled: () => {
                const el = getElement() as HTMLButtonElement | HTMLInputElement;
                if (!el) return Promise.resolve(false);
                return Promise.resolve(el.disabled);
            },

            isEditable: () => {
                const el = getElement() as HTMLInputElement;
                if (!el) return Promise.resolve(false);
                return Promise.resolve(!el.readOnly && !el.disabled);
            },

            check: async () => {
                await this.delay(50);
                strictCheck();
                const el = getElement() as HTMLInputElement;
                if (!el) throw new Error('Element not found');
                if (el.type !== 'checkbox' && el.type !== 'radio') {
                    throw new Error('Element is not a checkbox or radio');
                }
                if (!el.checked) el.click();
            },

            uncheck: async () => {
                await this.delay(50);
                strictCheck();
                const el = getElement() as HTMLInputElement;
                if (!el) throw new Error('Element not found');
                if (el.type !== 'checkbox') throw new Error('Element is not a checkbox');
                if (el.checked) el.click();
            },

            selectOption: async (value: string | string[]) => {
                await this.delay(50);
                strictCheck();
                const el = getElement() as HTMLSelectElement;
                if (!el) throw new Error('Element not found');
                if (el.tagName !== 'SELECT') throw new Error('Element is not a select');

                const values = Array.isArray(value) ? value : [value];
                for (const option of Array.from(el.options)) {
                    option.selected = values.includes(option.value);
                }
                el.dispatchEvent(new Event('change', { bubbles: true }));
            },

            getAttribute: async (name: string) => {
                const el = await waitForElement().catch(() => null);
                return el?.getAttribute(name) || null;
            },

            innerHTML: async () => {
                const el = await waitForElement().catch(() => null);
                return el?.innerHTML || '';
            },

            count: () => {
                return Promise.resolve(finder().length);
            },

            first: () => {
                filterType = 'first';
                return locator;
            },

            last: () => {
                filterType = 'last';
                return locator;
            },

            nth: (index: number) => {
                filterType = 'nth';
                filterIndex = index;
                return locator;
            },

            focus: async () => {
                await this.delay(50);
                const el = getElement();
                if (!el) throw new Error('Element not found');
                el.focus();
            },

            blur: async () => {
                await this.delay(50);
                const el = getElement();
                if (!el) throw new Error('Element not found');
                el.blur();
            },

            clear: async () => {
                await this.delay(50);
                strictCheck();
                const el = getElement() as HTMLInputElement;
                if (!el) throw new Error('Element not found');
                el.focus();
                el.value = '';
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            },

            dispatchEvent: async (type: string, eventInit?: CustomEventInit) => {
                await this.delay(50);
                strictCheck();
                const el = getElement();
                if (!el) throw new Error('Element not found');
                el.dispatchEvent(new CustomEvent(type, { bubbles: true, cancelable: true, ...eventInit }));
            },

            setInputFiles: async (files: string | FilePayload | string[] | FilePayload[]) => {
                await this.delay(50);
                strictCheck();
                const el = getElement() as HTMLInputElement;
                if (!el) throw new Error('Element not found');
                if (el.type !== 'file') throw new Error('Element is not a file input');

                const dataTransfer = new DataTransfer();
                const fileList = Array.isArray(files) ? files : [files];

                for (const f of fileList) {
                    if (typeof f === 'string') {
                        // Support string as filename for convenience
                        const file = new File([''], f, { type: 'application/octet-stream' });
                        dataTransfer.items.add(file);
                    } else {
                        const bufferData = f.buffer ? [f.buffer as BlobPart] : [''];
                        const file = new File(bufferData, f.name, { type: f.mimeType });
                        dataTransfer.items.add(file);
                    }
                }

                el.files = dataTransfer.files;
                el.dispatchEvent(new Event('change', { bubbles: true }));
                el.dispatchEvent(new Event('input', { bubbles: true }));
            },

            dragTo: async (target: Locator) => {
                await this.delay(50);
                const sourceEl = getElement();
                if (!sourceEl) throw new Error('Source element not found');

                // Get target element via its own evaluate method to handle cross-locator logic
                await target.evaluate(async (targetEl) => {
                    const dataTransfer = new DataTransfer();

                    // 1. Start drag
                    sourceEl.dispatchEvent(new DragEvent('dragstart', {
                        bubbles: true,
                        cancelable: true,
                        dataTransfer
                    }));

                    // 2. Drag over target
                    targetEl.dispatchEvent(new DragEvent('dragover', {
                        bubbles: true,
                        cancelable: true,
                        dataTransfer
                    }));

                    // 3. Drop on target
                    targetEl.dispatchEvent(new DragEvent('drop', {
                        bubbles: true,
                        cancelable: true,
                        dataTransfer
                    }));

                    // 4. End drag
                    sourceEl.dispatchEvent(new DragEvent('dragend', {
                        bubbles: true,
                        cancelable: true,
                        dataTransfer
                    }));
                });
            },

            dragAndDrop: async (target: Locator) => {
                return locator.dragTo(target);
            },

            press: async (key: string) => {
                await this.delay(50);
                const el = getElement();
                if (!el) throw new Error('Element not found');
                el.focus();
                el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
                el.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
            },

            evaluate: async <R, Arg>(fn: (el: HTMLElement, arg: Arg) => R | Promise<R>, arg?: Arg) => {
                const el = getElement();
                if (!el) throw new Error('Element not found');
                return fn(el, arg as Arg);
            },

            locator: (subSelector: string) => {
                return this.createLocator(() => {
                    const parents = finder();
                    const children: HTMLElement[] = [];
                    for (const parent of parents) {
                        const matches = Array.from(parent.querySelectorAll(subSelector));
                        children.push(...matches as HTMLElement[]);
                    }
                    return children;
                });
            },

            filter: (options: { hasText?: string | RegExp }) => {
                return this.createLocator(() => {
                    const elements = finder();
                    return elements.filter(el => {
                        if (options.hasText) {
                            const content = el.textContent || '';
                            if (options.hasText instanceof RegExp) {
                                return options.hasText.test(content);
                            }
                            return content.toLowerCase().includes(options.hasText.toLowerCase());
                        }
                        return true;
                    });
                });
            },

            all: async () => {
                const elements = finder();
                return elements.map((_, index) => {
                    // Create a new locator for each specific index
                    // This uses .nth(index) semantics
                    const newLocator = this.createLocator(finder);
                    newLocator.nth(index);
                    return newLocator;
                });
            },

            allTextContents: async () => {
                const elements = finder();
                return elements.map(el => el.textContent || '');
            },
        };

        return locator;
    }
}
