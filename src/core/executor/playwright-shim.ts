/**
 * Mocked Playwright Shim
 *
 * A client-side compatibility layer that mimics Playwright's API.
 * Runs entirely in the browser using DOM APIs.
 *
 * Based on: docs/TDD.md Section 5.2
 */

import { logger } from '@/lib/logger';

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
  evaluate<R, Arg>(
    pageFunction: (element: HTMLElement, arg: Arg) => R | Promise<R>,
    arg?: Arg,
  ): Promise<R>;
  locator(
    selector: string,
    options?: { hasText?: string | RegExp; has?: Locator },
  ): Locator;
  filter(options: { hasText?: string | RegExp; has?: Locator }): Locator;
  all(): Promise<Locator[]>;
  allTextContents(): Promise<string[]>;
  elementHandles(): Promise<HTMLElement[]>; // Internal helper exposed for filter({ has })
  getByRole(role: string, options?: LocatorOptions): Locator;
  getByText(text: string | RegExp, options?: { exact?: boolean }): Locator;
  getByLabel(text: string | RegExp, options?: { exact?: boolean }): Locator;
  getByPlaceholder(
    text: string | RegExp,
    options?: { exact?: boolean },
  ): Locator;
  getByTestId(testId: string): Locator;
  hover(options?: { force?: boolean; noWaitAfter?: boolean }): Promise<void>;
  waitFor(options?: {
    state?: 'attached' | 'detached' | 'visible' | 'hidden';
    timeout?: number;
  }): Promise<void>;
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
  storageState(
    options?: unknown,
  ): Promise<{ cookies: unknown[]; origins: unknown[] }>;
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

export interface Route {
  fulfill(response: {
    status?: number;
    headers?: Record<string, string>;
    contentType?: string;
    body?: string | Buffer;
    json?: unknown;
    path?: string;
  }): Promise<void>;
  continue(options?: {
    method?: string;
    headers?: Record<string, string>;
    postData?: string | Buffer;
  }): Promise<void>;
  request(): APIRequest;
}

export interface APIRequest {
  url(): string;
  method(): string;
  headers(): Record<string, string>;
  postData(): string | null;
}

export interface Dialog {
  message(): string;
  type(): 'alert' | 'confirm' | 'prompt' | 'beforeunload';
  accept(promptText?: string): Promise<void>;
  dismiss(): Promise<void>;
  defaultValue(): string;
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

export interface Keyboard {
  down(key: string): Promise<void>;
  up(key: string): Promise<void>;
  insertText(text: string): Promise<void>;
  type(text: string, options?: { delay?: number }): Promise<void>;
  press(key: string, options?: { delay?: number }): Promise<void>;
}

export interface Mouse {
  move(x: number, y: number, options?: { steps?: number }): Promise<void>;
  down(options?: {
    button?: 'left' | 'right' | 'middle';
    clickCount?: number;
  }): Promise<void>;
  up(options?: {
    button?: 'left' | 'right' | 'middle';
    clickCount?: number;
  }): Promise<void>;
  click(
    x: number,
    y: number,
    options?: {
      delay?: number;
      button?: 'left' | 'right' | 'middle';
      clickCount?: number;
    },
  ): Promise<void>;
  dblclick(
    x: number,
    y: number,
    options?: { delay?: number; button?: 'left' | 'right' | 'middle' },
  ): Promise<void>;
}

export interface FrameLocator {
  locator(selector: string): Locator;
  getByRole(role: string, options?: LocatorOptions): Locator;
  getByText(text: string | RegExp, options?: { exact?: boolean }): Locator;
  getByLabel(text: string | RegExp, options?: { exact?: boolean }): Locator;
  getByPlaceholder(
    text: string | RegExp,
    options?: { exact?: boolean },
  ): Locator;
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
  public keyboard: Keyboard;
  public mouse: Mouse;
  private currentUrl: string = 'about:blank';
  private _context: BrowserContext;

  // VFS (Virtual File System) for multi-page E2E support
  private vfs: Record<string, string> | null = null;
  private currentPath: string = '/index.html';
  private onNavigate?: (path: string) => void;
  private cssContent?: string;

  constructor(iframeDocument: Document, options?: { timeout?: number }) {
    this.targetDocument = iframeDocument;
    this.defaultTimeout = options?.timeout || 2500;
    this.request = this._createAPIRequestContext();
    this._context = this._createBrowserContext();
    this.keyboard = this._createKeyboard();
    this.mouse = this._createMouse();
  }

  /**
   * Set up Virtual File System for multi-page navigation
   */
  setVFS(
    files: Record<string, string>,
    options?: {
      onNavigate?: (path: string) => void;
      cssContent?: string;
    },
  ): void {
    this.vfs = files;
    this.onNavigate = options?.onNavigate;
    this.cssContent = options?.cssContent;
  }

  // ============================================
  // Core Actions
  // ============================================

  private _createKeyboard(): Keyboard {
    const getActiveElement = () =>
      (this.targetDocument.activeElement as HTMLElement) ||
      this.targetDocument.body;

    return {
      down: async (key: string) => {
        logger.debug(`[Keyboard] down: ${key}`);
        const el = getActiveElement();
        el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      },
      up: async (key: string) => {
        logger.debug(`[Keyboard] up: ${key}`);
        const el = getActiveElement();
        el.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
      },
      insertText: async (text: string) => {
        logger.debug(`[Keyboard] insertText: ${text}`);
        const el = getActiveElement();
        if ('value' in el) {
          (el as HTMLInputElement).value += text;
          el.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          el.textContent += text;
        }
      },
      type: async (text: string, options) => {
        logger.debug(`[Keyboard] type: ${text}`);
        const el = getActiveElement();
        for (const char of text) {
          el.dispatchEvent(
            new KeyboardEvent('keydown', { key: char, bubbles: true }),
          );
          el.dispatchEvent(
            new KeyboardEvent('keypress', { key: char, bubbles: true }),
          );
          if ('value' in el) {
            (el as HTMLInputElement).value += char;
            el.dispatchEvent(new Event('input', { bubbles: true }));
          } else {
            // Very basic contenteditable shim
            el.textContent += char;
          }
          el.dispatchEvent(
            new KeyboardEvent('keyup', { key: char, bubbles: true }),
          );
          if (options?.delay) await this.delay(options.delay);
        }
      },
      press: async (key: string, options) => {
        logger.debug(`[Keyboard] press: ${key}`);
        const el = getActiveElement();
        el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
        el.dispatchEvent(new KeyboardEvent('keypress', { key, bubbles: true }));
        el.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
        if (options?.delay) await this.delay(options.delay);
      },
    };
  }

  private _createMouse(): Mouse {
    let x = 0;
    let y = 0;

    return {
      move: async (newX, newY) => {
        // logger.debug(`[Mouse] move: ${newX}, ${newY}`); // Too spammy
        x = newX;
        y = newY;
        const el =
          this.targetDocument.elementFromPoint(x, y) ||
          this.targetDocument.body;
        el.dispatchEvent(
          new MouseEvent('mousemove', {
            clientX: x,
            clientY: y,
            bubbles: true,
            view: this.targetDocument.defaultView,
          }),
        );
      },
      down: async (options) => {
        logger.debug(`[Mouse] down`);
        const el =
          this.targetDocument.elementFromPoint(x, y) ||
          this.targetDocument.body;
        el.dispatchEvent(
          new MouseEvent('mousedown', {
            clientX: x,
            clientY: y,
            button: options?.button === 'right' ? 2 : 0,
            bubbles: true,
            view: this.targetDocument.defaultView,
          }),
        );
      },
      up: async (options) => {
        logger.debug(`[Mouse] up`);
        const el =
          this.targetDocument.elementFromPoint(x, y) ||
          this.targetDocument.body;
        el.dispatchEvent(
          new MouseEvent('mouseup', {
            clientX: x,
            clientY: y,
            button: options?.button === 'right' ? 2 : 0,
            bubbles: true,
            view: this.targetDocument.defaultView,
          }),
        );
      },
      click: async (targetX, targetY, options) => {
        logger.debug(`[Mouse] click at ${targetX},${targetY}`);
        x = targetX;
        y = targetY;
        const el =
          this.targetDocument.elementFromPoint(x, y) ||
          this.targetDocument.body;

        // Highlight target if found
        if (el instanceof HTMLElement) {
          void this._highlight(el, '#3b82f6'); // Blue for mouse click
        }

        el.dispatchEvent(
          new MouseEvent('mousemove', {
            clientX: x,
            clientY: y,
            bubbles: true,
          }),
        );
        el.dispatchEvent(
          new MouseEvent('mousedown', {
            clientX: x,
            clientY: y,
            bubbles: true,
          }),
        );
        el.dispatchEvent(
          new MouseEvent('mouseup', { clientX: x, clientY: y, bubbles: true }),
        );
        el.dispatchEvent(
          new MouseEvent('click', { clientX: x, clientY: y, bubbles: true }),
        );
        if (options?.delay) await this.delay(options.delay);
      },
      dblclick: async (targetX, targetY, options) => {
        logger.debug(`[Mouse] dblclick at ${targetX},${targetY}`);
        x = targetX;
        y = targetY;
        const el =
          this.targetDocument.elementFromPoint(x, y) ||
          this.targetDocument.body;

        if (el instanceof HTMLElement) {
          void this._highlight(el, '#3b82f6');
        }

        el.dispatchEvent(
          new MouseEvent('mousemove', {
            clientX: x,
            clientY: y,
            bubbles: true,
          }),
        );
        el.dispatchEvent(
          new MouseEvent('mousedown', {
            clientX: x,
            clientY: y,
            bubbles: true,
          }),
        );
        el.dispatchEvent(
          new MouseEvent('mouseup', { clientX: x, clientY: y, bubbles: true }),
        );
        el.dispatchEvent(
          new MouseEvent('click', { clientX: x, clientY: y, bubbles: true }),
        );
        el.dispatchEvent(
          new MouseEvent('mousedown', {
            clientX: x,
            clientY: y,
            bubbles: true,
          }),
        );
        el.dispatchEvent(
          new MouseEvent('mouseup', { clientX: x, clientY: y, bubbles: true }),
        );
        el.dispatchEvent(
          new MouseEvent('click', { clientX: x, clientY: y, bubbles: true }),
        );
        el.dispatchEvent(
          new MouseEvent('dblclick', { clientX: x, clientY: y, bubbles: true }),
        );
        if (options?.delay) await this.delay(options.delay);
      },
    };
  }

  /**
   * Handle dialogs
   */
  async on(event: string, handler: (dialog: Dialog) => void): Promise<void> {
    if (event === 'dialog') {
      // Register global handler that iframe logic can call
      const iframeWindow = this.targetDocument.defaultView as any;
      if (!iframeWindow) return;

      if (!iframeWindow.__MOCK_DIALOG_HANDLER__) {
        iframeWindow.__MOCK_DIALOG_HANDLER__ = (
          type: string,
          message: string,
          defaultValue?: string,
        ) => {
          return new Promise((resolve) => {
            const dialog: Dialog = {
              type: () => type as any,
              message: () => message,
              defaultValue: () => defaultValue || '',
              accept: async (promptText) => {
                resolve({ action: 'accept', promptText });
              },
              dismiss: async () => {
                resolve({ action: 'dismiss' });
              },
            };
            handler(dialog);
          });
        };
      }
    }
  }

  /**
   * Visual feedback helper
   * Highlights an element briefly to show interaction
   */
  private async _highlight(
    element: HTMLElement,
    color = '#dc2626',
  ): Promise<void> {
    // Skip if document is hidden or detached (safety check)
    if (!element.isConnected) return;

    const originalTransition = element.style.transition;
    const originalOutline = element.style.outline;
    const originalBoxShadow = element.style.boxShadow;

    // Apply highlight
    element.style.transition = 'all 0.1s ease';
    element.style.outline = `2px solid ${color}`;
    element.style.boxShadow = `0 0 0 4px ${color}40`; // 40 is alpha for hex

    // Wait a bit so user sees it
    await this.delay(300);

    // Restore
    element.style.outline = originalOutline;
    element.style.boxShadow = originalBoxShadow;
    element.style.transition = originalTransition;
  }

  async route(
    urlOrPredicate: string | RegExp | ((url: URL) => boolean),
    handler: (route: Route, request: APIRequest) => Promise<void> | void,
  ): Promise<void> {
    // Register route in global registry on the iframe window
    // The iframe fetch polyfill will read from this
    const iframeWindow = this.targetDocument.defaultView as any;
    if (!iframeWindow) return;

    if (!iframeWindow.__MOCK_ROUTES__) {
      iframeWindow.__MOCK_ROUTES__ = [];
    }

    iframeWindow.__MOCK_ROUTES__.push({
      matcher: urlOrPredicate,
      handler: async (requestInfo: any) => {
        const route: Route = {
          fulfill: async (response) => {
            return Promise.resolve(response);
          },
          continue: async () => {
            return Promise.resolve(null); // Signal to continue
          },
          request: () => ({
            url: () => requestInfo.url,
            method: () => requestInfo.method,
            headers: () => requestInfo.headers,
            postData: () => requestInfo.body,
          }),
        };

        const request: APIRequest = route.request();

        // We need to capture the response from the handler
        // Since handler returns void, we depend on it calling fulfill or continue
        // This is a bit tricky to bridge synchronously, so we'll use a Promise

        return new Promise(async (resolve) => {
          // Override fulfill/continue to resolve our promise
          route.fulfill = async (response) => {
            resolve({ type: 'fulfill', response });
          };
          route.continue = async (options) => {
            resolve({ type: 'continue', options });
          };

          await handler(route, request);
        });
      },
    });
  }

  async unroute(
    urlOrPredicate: string | RegExp | ((url: URL) => boolean),
  ): Promise<void> {
    const iframeWindow = this.targetDocument.defaultView as any;
    if (!iframeWindow || !iframeWindow.__MOCK_ROUTES__) return;

    // Remove matching routes
    iframeWindow.__MOCK_ROUTES__ = iframeWindow.__MOCK_ROUTES__.filter(
      (r: any) => r.matcher.toString() !== urlOrPredicate.toString(),
    );
  }

  async goto(url: string): Promise<void> {
    logger.debug(`Navigating to ${url}`);

    // Normalize URL to path
    let path = url;
    if (url.startsWith('http')) {
      try {
        path = new URL(url).pathname;
      } catch {
        // If URL parsing fails, use as-is
      }
    }
    if (!path.startsWith('/')) {
      path = '/' + path;
    }

    // VFS Mode: Replace iframe content with virtual file
    if (this.vfs) {
      const content = this.vfs[path];
      if (!content) {
        throw new Error(`Page not found in VFS: ${path}. Available pages: ${Object.keys(this.vfs).join(', ')}`);
      }

      // Wrap content with necessary HTML structure
      const wrappedHtml = this._wrapVfsContent(content);

      // Update iframe content
      this.targetDocument.open();
      this.targetDocument.write(wrappedHtml);
      this.targetDocument.close();

      // Re-execute scripts in new content
      this._executeScripts();

      this.currentPath = path;
      this.currentUrl = path;

      // Notify parent about navigation for URL bar update
      this.onNavigate?.(path);

      await this.delay(50);
      return;
    }

    // Legacy mode (no VFS) - just update URL tracking
    this.currentUrl = url;
    await this.delay(50);
  }

  /**
   * Wrap VFS content with full HTML structure including styles and polyfills
   */
  private _wrapVfsContent(content: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <base href="http://localhost/" />
        <style>
          * { box-sizing: border-box; }
          body { 
            font-family: system-ui, sans-serif; 
            padding: 16px;
            margin: 0;
          }
          ${this.cssContent || ''}
        </style>
        <script data-internal="true">
          // Polyfill fetch to handle mock routes
          const originalFetch = window.fetch;
          window.fetch = function(input, init) {
            let url = input;
            if (typeof input === 'string') {
              if (input.startsWith('/')) {
                url = 'http://localhost' + input;
              }
            }
            if (window.__MOCK_ROUTES__) {
              for (const route of window.__MOCK_ROUTES__) {
                let isMatch = false;
                if (typeof route.matcher === 'string') {
                  isMatch = url.includes(route.matcher);
                } else if (route.matcher instanceof RegExp) {
                  isMatch = route.matcher.test(url);
                }
                if (isMatch) {
                  return route.handler({ url, method: init?.method || 'GET' }).then(r => {
                    if (r?.type === 'fulfill') {
                      return Promise.resolve({
                        ok: (r.response.status || 200) >= 200 && (r.response.status || 200) < 300,
                        status: r.response.status || 200,
                        json: () => Promise.resolve(r.response.json || {}),
                        text: () => Promise.resolve(r.response.body || '')
                      });
                    }
                    return Promise.reject(new Error('Route not fulfilled'));
                  });
                }
              }
            }
            return Promise.resolve({ ok: true, status: 404, json: () => Promise.resolve({}) });
          };

          // Handle navigation for VFS
          window.addEventListener('click', function(e) {
            const link = e.target.closest('a[href]');
            if (link && !link.getAttribute('target')) {
              const href = link.getAttribute('href');
              if (href && (href.startsWith('/') || href.endsWith('.html'))) {
                e.preventDefault();
                // VFS navigation will be handled by the shim via location change detection
                window.__VFS_NAVIGATE__ && window.__VFS_NAVIGATE__(href);
              }
            }
          }, true);
        </script>
      </head>
      <body>${content}</body>
      </html>
    `;
  }

  /**
   * Re-execute scripts after VFS page navigation
   */
  private _executeScripts(): void {
    const scripts = Array.from(
      this.targetDocument.querySelectorAll('script:not([data-internal="true"])'),
    );

    scripts.forEach((script) => {
      if (script.textContent) {
        try {
          const win = this.targetDocument.defaultView as any;
          if (!win) return;

          // eslint-disable-next-line @typescript-eslint/no-implied-eval
          const fn = new Function('window', 'document', `
            return (function(window, document) {
              try {
                ${script.textContent}
              } catch(err) {
                console.error('Error in VFS script:', err);
              }
            }).call(window, window, document);
          `);
          fn(win, this.targetDocument);
        } catch (e) {
          console.error('Failed to execute VFS script:', e);
        }
      }
    });
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

  async evaluate<R, Arg>(
    pageFunction: (arg: Arg) => R | Promise<R>,
    arg?: Arg,
  ): Promise<R> {
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
    element.dispatchEvent(
      new MouseEvent('dblclick', {
        bubbles: true,
        cancelable: true,
        view: window,
      }),
    );
  }

  async focus(selector: string): Promise<void> {
    await this.waitForSelector(selector, { state: 'visible' });
    const element = this.targetDocument.querySelector(selector) as HTMLElement;
    if (!element) throw new Error(`Element not found: ${selector}`);
    element.focus();
  }

  async dispatchEvent(
    selector: string,
    type: string,
    eventInit?: CustomEventInit,
  ): Promise<void> {
    await this.waitForSelector(selector, { state: 'visible' });
    const element = this.targetDocument.querySelector(selector) as HTMLElement;
    if (!element) throw new Error(`Element not found: ${selector}`);
    element.dispatchEvent(
      new CustomEvent(type, { bubbles: true, cancelable: true, ...eventInit }),
    );
  }

  /**
   * Fill an input or textarea with text
   */
  async fill(selector: string, value: string): Promise<void> {
    // Auto-wait for element to be visible
    await this.waitForSelector(selector, { state: 'visible' });

    const element = this.targetDocument.querySelector(selector) as
      | HTMLInputElement
      | HTMLTextAreaElement;

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
    const element = this.targetDocument.querySelector(
      selector,
    ) as HTMLInputElement;

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
  setInputFiles(
    selector: string,
    files: string | FilePayload | string[] | FilePayload[],
  ): Promise<void> {
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
    const element = this.targetDocument.querySelector(
      selector,
    ) as HTMLInputElement;

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
  async waitForSelector(
    selector: string,
    options?: WaitOptions,
  ): Promise<void> {
    const timeout = options?.timeout || this.defaultTimeout;
    const state = options?.state || 'visible';
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const element = this.targetDocument.querySelector(
        selector,
      ) as HTMLElement;

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

    throw new Error(
      `Unable to locate ${selector}. Please verify the element exists.`,
    );
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

  async waitForFunction(
    pageFunction: (...args: unknown[]) => unknown,
    arg?: unknown,
    options?: { timeout?: number },
  ): Promise<void> {
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

  async waitForResponse(
    urlOrPredicate: string | RegExp | ((resp: unknown) => boolean),
  ): Promise<unknown> {
    await this.delay(500);
    return {
      ok: true,
      status: () => 200,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      url: () => (typeof urlOrPredicate === 'string' ? urlOrPredicate : ''),
    };
  }

  async waitForTimeout(ms: number): Promise<void> {
    await this.delay(ms);
  }

  screenshot(): Promise<Buffer> {
    logger.debug('Mocking screenshot');
    return Promise.resolve(Buffer.from(''));
  }

  video(): {
    path(): Promise<string>;
    delete(): Promise<void>;
    saveAs(path: string): Promise<void>;
  } | null {
    return {
      path: () => Promise.resolve('/tmp/video.mp4'),
      delete: async () => { },
      saveAs: async () => { },
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
    element.dispatchEvent(
      new KeyboardEvent('keypress', { key, bubbles: true }),
    );
    element.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
  }

  frameLocator(selector: string): FrameLocator {
    const createFrameLocatorInternal = (
      frameSelector: string,
      index: number,
    ): FrameLocator => {
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
            return Array.from(
              doc.querySelectorAll(itemSelector),
            );
          });
        },
        getByRole: (role: string, options?: LocatorOptions) => {
          return this.createLocator(() => {
            const doc = getFrameDoc();
            if (!doc) return [];
            const page = new MockedPlaywrightPage(doc);
            // Use page's internal getByRole logic indirectly via querying
            const roleSelector = `[role="${role}"]`;
            let elements = Array.from(
              doc.querySelectorAll(roleSelector),
            );
            if (options?.name) {
              elements = elements.filter((el) => {
                const text =
                  el.textContent || el.getAttribute('aria-label') || '';
                return options.name instanceof RegExp
                  ? options.name.test(text)
                  : text.includes(options.name as string);
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
              const matches =
                text instanceof RegExp
                  ? text.test(content)
                  : options?.exact
                    ? content === text
                    : content.includes(text);
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
              const matches =
                text instanceof RegExp
                  ? text.test(labelText)
                  : options?.exact
                    ? labelText === text
                    : labelText.includes(text);
              if (matches) {
                const forId = label.getAttribute('for');
                if (forId) {
                  const input = doc.getElementById(forId);
                  if (input) elements.push(input);
                }
              }
            }
            return elements;
          });
        },
        getByPlaceholder: (
          text: string | RegExp,
          options?: { exact?: boolean },
        ) => {
          return this.createLocator(() => {
            const doc = getFrameDoc();
            if (!doc) return [];
            const inputs = Array.from(
              doc.querySelectorAll('[placeholder]'),
            );
            return inputs.filter((el) => {
              const placeholder = el.getAttribute('placeholder') || '';
              return text instanceof RegExp
                ? text.test(placeholder)
                : options?.exact
                  ? placeholder === text
                  : placeholder.includes(text);
            });
          });
        },
        getByTestId: (testId: string) => {
          return this.createLocator(() => {
            const doc = getFrameDoc();
            if (!doc) return [];
            return Array.from(
              doc.querySelectorAll(`[data-testid="${testId}"]`),
            );
          });
        },
        first: () => createFrameLocatorInternal(frameSelector, 0),
        last: () => createFrameLocatorInternal(frameSelector, -1),
        nth: (n: number) => createFrameLocatorInternal(frameSelector, n),
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
        button:
          'button, [role="button"], input[type="submit"], input[type="button"]',
        textbox:
          'input[type="text"], input[type="email"], input[type="password"], input:not([type]), textarea, [role="textbox"]',
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
        elements = elements.filter((el) => {
          const text = el.textContent || el.getAttribute('aria-label') || '';
          if (options.name instanceof RegExp) {
            return options.name.test(text);
          }
          return options.exact
            ? text.trim() === options.name
            : text
              .toLowerCase()
              .includes((options.name as string).toLowerCase());
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
        NodeFilter.SHOW_ELEMENT,
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
          if (content.toLowerCase().includes(text.toLowerCase()))
            elements.push(el);
        }
      }

      // Filter out parents if children match (Deepest match principle)
      // If A contains B, and both match, only keep B.
      const filteredElements = elements.filter((el) => {
        // Check if any *other* matched element is a descendant of this 'el'
        const hasMatchingDescendant = elements.some(
          (other) => other !== el && el.contains(other),
        );
        return !hasMatchingDescendant;
      });

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

      return filteredElements.sort((a, b) => getDepth(b) - getDepth(a));
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
  getByPlaceholder(
    text: string | RegExp,
    options?: { exact?: boolean },
  ): Locator {
    return this.createLocator(() => {
      const inputs = Array.from(
        this.targetDocument.querySelectorAll('[placeholder]'),
      );

      return inputs.filter((el) => {
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
      return this._findAll(this.targetDocument, selector);
    });
  }

  /**
   * Internal helper to find elements handling special Playwright selectors
   */
  private _findAll(root: Document | Element, selector: string): HTMLElement[] {
    let matchedElements: HTMLElement[] = [];

    // Text selector: text=...
    if (selector.startsWith('text=')) {
      const text = selector.substring(5);
      const exact = text.startsWith('"') && text.endsWith('"');
      const cleanText = exact ? text.slice(1, -1) : text;

      const allElements = root.querySelectorAll('*');
      Array.from(allElements).forEach((el) => {
        const element = el as HTMLElement;
        const content = element.textContent || '';
        if (exact ? content === cleanText : content.includes(cleanText)) {
          matchedElements.push(element);
        }
      });

      // Sort by depth (deepest first)
      matchedElements.sort((a, b) => {
        let depthA = 0,
          pA = a;
        while (pA.parentElement && pA !== root) {
          depthA++;
          pA = pA.parentElement;
        }
        let depthB = 0,
          pB = b;
        while (pB.parentElement && pB !== root) {
          depthB++;
          pB = pB.parentElement;
        }
        return depthB - depthA;
      });

      // Filter out parents if children match (Deepest match principle)
      // If A contains B, and both match, only keep B.
      matchedElements = matchedElements.filter((el) => {
        // Check if any *other* matched element is a descendant of this 'el'
        const hasMatchingDescendant = matchedElements.some(
          (other) => other !== el && el.contains(other),
        );
        return !hasMatchingDescendant;
      });
    }
    // XPath selector: xpath=...
    else if (selector.startsWith('xpath=')) {
      const xpath = selector.substring(6);
      try {
        const doc = root instanceof Document ? root : root.ownerDocument;
        const result = doc.evaluate(
          xpath,
          root,
          null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
          null,
        );
        for (let i = 0; i < result.snapshotLength; i++) {
          const node = result.snapshotItem(i);
          if (node instanceof HTMLElement) {
            matchedElements.push(node);
          }
        }
      } catch (e) {
        console.warn('Invalid XPath:', xpath, e);
      }
    }
    // CSS selector: css=... or just ...
    else {
      const cssSelector = selector.startsWith('css=')
        ? selector.substring(4)
        : selector;
      // Standard querySelectorAll
      matchedElements = Array.from(
        root.querySelectorAll(cssSelector),
      );
    }

    return matchedElements;
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
    return Promise.resolve(
      this.targetDocument.querySelectorAll(selector).length,
    );
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
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private _createAPIRequestContext(): APIRequestContext {
    return {
      get: () => Promise.resolve(this._mockResponse()),
      post: () => Promise.resolve(this._mockResponse()),
      put: () => Promise.resolve(this._mockResponse()),
      delete: () => Promise.resolve(this._mockResponse()),
      fetch: () => Promise.resolve(this._mockResponse()),
      storageState: () => Promise.resolve({ cookies: [], origins: [] }),
      newContext: () => Promise.resolve(this._createAPIRequestContext()),
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
      body: () => Promise.resolve(Buffer.from('')),
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
        },
      },
      cookies: () => Promise.resolve([]),
      addCookies: () => Promise.resolve(),
      clearCookies: () => Promise.resolve(),
      newPage: () =>
        Promise.resolve(new MockedPlaywrightPage(this.targetDocument)),
      close: () => Promise.resolve(),
      request: this._createAPIRequestContext(),
    };
  }

  private createLocator(finder: () => HTMLElement[]): Locator {
    let filterIndex: number | null = null;
    let filterType: 'first' | 'last' | 'nth' | null = null;

    // Helper to apply current filters (first/last/nth) to the finder results
    const getFilteredElements = (): HTMLElement[] => {
      const elements = finder();
      if (elements.length === 0) return [];

      if (filterType === 'first') return [elements[0]];
      if (filterType === 'last') return [elements[elements.length - 1]];
      if (filterType === 'nth' && filterIndex !== null)
        return elements[filterIndex] ? [elements[filterIndex]] : [];

      return elements;
    };

    // Expose finder for internal cross-locator delegation (e.g. frameLocator)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any).finder = getFilteredElements;

    const getElement = (): HTMLElement | null => {
      const elements = getFilteredElements();
      if (elements.length === 0) return null;
      return elements[0];
    };

    /**
     * Strict mode check - throws if multiple elements match without explicit filter
     */
    const strictCheck = () => {
      // For strict check, we look at what would be returned *after* filtering
      // If the user already applied .first(), filtering returns 1 element, so strictly valid.
      const elements = getFilteredElements();
      if (elements.length > 1) {
        throw new Error(
          `Strict mode violation: locator resolved to ${elements.length} elements. ` +
          `Use .first(), .last(), or .nth() to select a specific element, ` +
          `or make your selector more specific.`,
        );
      }
    };

    /**
     * Wait for element to be present and satisfy filter
     */
    const waitForElement = async (
      timeout: number = this.defaultTimeout,
    ): Promise<HTMLElement> => {
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

        logger.debug(`[Action] click`);
        await this._highlight(el);
        el.click();
      },

      dblclick: async () => {
        await this.delay(50);
        strictCheck();
        const el = getElement();
        if (!el) throw new Error('Element not found');
        if (!this.isVisible(el)) throw new Error('Element is not visible');

        logger.debug(`[Action] dblclick`);
        await this._highlight(el);
        el.dispatchEvent(
          new MouseEvent('dblclick', {
            bubbles: true,
            cancelable: true,
            view: window,
          }),
        );
      },

      fill: async (value: string) => {
        await this.delay(50);
        strictCheck();
        const el = getElement() as HTMLInputElement | HTMLTextAreaElement;
        if (!el) throw new Error('Element not found');

        logger.debug(`[Action] fill: "${value}"`);
        await this._highlight(el);
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

        logger.debug(`[Action] check`);
        await this._highlight(el);
        if (!el.checked) el.click();
      },

      uncheck: async () => {
        await this.delay(50);
        strictCheck();
        const el = getElement() as HTMLInputElement;
        if (!el) throw new Error('Element not found');
        if (el.type !== 'checkbox')
          throw new Error('Element is not a checkbox');

        logger.debug(`[Action] uncheck`);
        await this._highlight(el);
        if (el.checked) el.click();
      },

      selectOption: async (value: string | string[]) => {
        await this.delay(50);
        strictCheck();
        const el = getElement() as HTMLSelectElement;
        if (!el) throw new Error('Element not found');
        if (el.tagName !== 'SELECT') throw new Error('Element is not a select');

        const values = Array.isArray(value) ? value : [value];
        logger.debug(`[Action] selectOption: ${JSON.stringify(values)}`);
        await this._highlight(el);

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
        return Promise.resolve(getFilteredElements().length);
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
        el.dispatchEvent(
          new CustomEvent(type, {
            bubbles: true,
            cancelable: true,
            ...eventInit,
          }),
        );
      },

      setInputFiles: async (
        files: string | FilePayload | string[] | FilePayload[],
      ) => {
        await this.delay(50);
        strictCheck();
        const el = getElement() as HTMLInputElement;
        if (!el) throw new Error('Element not found');
        if (el.type !== 'file') throw new Error('Element is not a file input');

        logger.debug(`[Action] setInputFiles`);
        await this._highlight(el);

        const dataTransfer = new DataTransfer();
        const fileList = Array.isArray(files) ? files : [files];

        for (const f of fileList) {
          if (typeof f === 'string') {
            // Support string as filename for convenience
            const file = new File([''], f, {
              type: 'application/octet-stream',
            });
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
          sourceEl.dispatchEvent(
            new DragEvent('dragstart', {
              bubbles: true,
              cancelable: true,
              dataTransfer,
            }),
          );

          // 2. Drag over target
          targetEl.dispatchEvent(
            new DragEvent('dragover', {
              bubbles: true,
              cancelable: true,
              dataTransfer,
            }),
          );

          // 3. Drop on target
          targetEl.dispatchEvent(
            new DragEvent('drop', {
              bubbles: true,
              cancelable: true,
              dataTransfer,
            }),
          );

          // 4. End drag
          sourceEl.dispatchEvent(
            new DragEvent('dragend', {
              bubbles: true,
              cancelable: true,
              dataTransfer,
            }),
          );
        });
      },

      dragAndDrop: async (target: Locator) => {
        return locator.dragTo(target);
      },

      press: async (key: string) => {
        await this.delay(50);
        const el = getElement();
        if (!el) throw new Error('Element not found');

        logger.debug(`[Action] press: "${key}"`);
        await this._highlight(el);
        el.focus();
        el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
        el.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
      },

      evaluate: async <R, Arg>(
        fn: (el: HTMLElement, arg: Arg) => R | Promise<R>,
        arg?: Arg,
      ) => {
        const el = getElement();
        if (!el) throw new Error('Element not found');
        return fn(el, arg as Arg);
      },

      locator: (
        subSelector: string,
        options?: { hasText?: string | RegExp; has?: Locator },
      ) => {
        let loc = this.createLocator(() => {
          const parents = getFilteredElements();
          const children: HTMLElement[] = [];
          for (const parent of parents) {
            const matchedElements = this._findAll(parent, subSelector);
            children.push(...matchedElements);
          }
          return children;
        });

        if (options?.hasText || options?.has) {
          loc = loc.filter(options);
        }
        return loc;
      },

      filter: (options: { hasText?: string | RegExp; has?: Locator }) => {
        return this.createLocator(() => {
          const elements = getFilteredElements();

          // Filter by hasText
          let filtered = elements;
          if (options.hasText) {
            filtered = filtered.filter((el) => {
              const content = el.textContent || '';
              if (options.hasText instanceof RegExp) {
                return options.hasText.test(content);
              }
              return content
                .toLowerCase()
                .includes((options.hasText as string).toLowerCase());
            });
          }

          // Filter by has (Locator)
          if (options.has) {
            // We need to resolve the matching elements of the 'has' locator
            // Since we can't await here, we rely on the fact that our shim's finder is synchronous
            // EXCEPT that createLocator doesn't expose the finder publicly typed. 
            // But we added elementHandles() which is async... wait.
            // The finder inside createLocator is synchronous () => HTMLElement[].

            // To solve this properly in a sync finder:
            // We need access to the 'has' locator's finder.
            // We cast to any to access the internal finder if possible.

            const hasLocatorAny = options.has as any;
            let hasElements: HTMLElement[] = [];

            if (typeof hasLocatorAny.finder === 'function') {
              hasElements = hasLocatorAny.finder();
            } else {
              // Fallback: If passed a locator from outside the shim or different structure
              // We might just skip filtering or warn?
              // For now assuming it's our Shim locator
            }

            filtered = filtered.filter(el => {
              return hasElements.some(hasEl => el.contains(hasEl));
            });
          }

          return filtered;
        });
      },

      all: async () => {
        const elements = getFilteredElements();
        return elements.map((_, index) => {
          // Create a new locator for each specific index
          // This uses .nth(index) semantics
          const newLocator = this.createLocator(getFilteredElements);
          newLocator.nth(index);
          return newLocator;
        });
      },

      allTextContents: async () => {
        const elements = getFilteredElements();
        return elements.map((el) => el.textContent || '');
      },

      getByRole: (role: string, options?: LocatorOptions) => {
        return this.createLocator(() => {
          const parents = getFilteredElements();
          const children: HTMLElement[] = [];

          // Helper to reuse the page-level getByRole logic but scoped
          // We cheat a bit by creating a temporary page wrapper for each parent's subtree
          // This is inefficient but functional for the shim
          for (const parent of parents) {
            // Basic implementation: querySelectorAll within parent based on role logic
            const roleToTag: Record<string, string> = {
              button:
                'button, [role="button"], input[type="submit"], input[type="button"]',
              textbox:
                'input[type="text"], input[type="email"], input[type="password"], textarea, [role="textbox"]',
              checkbox: 'input[type="checkbox"], [role="checkbox"]',
              radio: 'input[type="radio"], [role="radio"]',
              link: 'a, [role="link"]',
              heading: 'h1, h2, h3, h4, h5, h6, [role="heading"]',
              listitem: 'li, [role="listitem"]',
              img: 'img, [role="img"]',
            };

            const selector = roleToTag[role] || `[role="${role}"]`;
            let matches = Array.from(
              parent.querySelectorAll(selector),
            ) as HTMLElement[];

            if (options?.name) {
              matches = matches.filter((el) => {
                const text =
                  el.textContent || el.getAttribute('aria-label') || '';
                if (options.name instanceof RegExp) {
                  return options.name.test(text);
                }
                return options.exact
                  ? text.trim() === options.name
                  : text.toLowerCase().includes(
                    (options.name as string).toLowerCase(),
                  );
              });
            }
            children.push(...matches);
          }
          return children;
        });
      },

      getByText: (text: string | RegExp, options?: { exact?: boolean }) => {
        return this.createLocator(() => {
          const parents = getFilteredElements();
          const children: HTMLElement[] = [];

          for (const parent of parents) {
            const walker = this.targetDocument.createTreeWalker(
              parent,
              NodeFilter.SHOW_ELEMENT,
            );
            let node: Node | null;
            const parentMatches: HTMLElement[] = [];
            while ((node = walker.nextNode())) {
              const el = node as HTMLElement;
              const content = el.textContent || '';
              const isMatch =
                text instanceof RegExp
                  ? text.test(content)
                  : options?.exact
                    ? content.trim() === text
                    : content.toLowerCase().includes(text.toLowerCase());

              if (isMatch) parentMatches.push(el);
            }
            // Apply deep filter per parent context
            // Filter out parents if children match (Deepest match principle)
            // If A contains B, and both match, only keep B.
            const filteredElements = parentMatches.filter((el) => {
              // Check if any *other* matched element is a descendant of this 'el'
              const hasMatchingDescendant = parentMatches.some(
                (other) => other !== el && el.contains(other),
              );
              return !hasMatchingDescendant;
            });
            children.push(...filteredElements);
          }
          return children;
        });
      },

      getByLabel: (text: string | RegExp, options?: { exact?: boolean }) => {
        return this.createLocator(() => {
          const parents = getFilteredElements();
          const children: HTMLElement[] = [];
          for (const parent of parents) {
            const labels = Array.from(parent.querySelectorAll('label'));
            for (const label of labels) {
              const labelText = label.textContent || '';
              const isMatch =
                text instanceof RegExp
                  ? text.test(labelText)
                  : options?.exact
                    ? labelText.trim() === text
                    : labelText.toLowerCase().includes(text.toLowerCase());

              if (isMatch) {
                const forId = label.getAttribute('for');
                if (forId) {
                  const input = this.targetDocument.getElementById(forId);
                  if (input) children.push(input);
                } else {
                  const input = label.querySelector('input, textarea, select');
                  if (input) children.push(input as HTMLElement);
                }
              }
            }
          }
          return children;
        });
      },

      getByPlaceholder: (
        text: string | RegExp,
        options?: { exact?: boolean },
      ) => {
        return this.createLocator(() => {
          const parents = getFilteredElements();
          const children: HTMLElement[] = [];
          for (const parent of parents) {
            const inputs = Array.from(
              parent.querySelectorAll('[placeholder]'),
            ) as HTMLElement[];
            const matches = inputs.filter((el) => {
              const ph = el.getAttribute('placeholder') || '';
              return text instanceof RegExp
                ? text.test(ph)
                : options?.exact
                  ? ph === text
                  : ph.toLowerCase().includes(text.toLowerCase());
            });
            children.push(...matches);
          }
          return children;
        });
      },

      getByTestId: (testId: string) => {
        return locator.locator(`[data-testid="${testId}"]`);
      },

      hover: async (options?: { force?: boolean }) => {
        await this.delay(50);
        strictCheck();
        const el = getElement();
        if (!el) throw new Error('Element not found');
        if (!options?.force && !this.isVisible(el))
          throw new Error('Element is not visible');

        logger.debug(`[Action] hover`);
        await this._highlight(el);
        el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
      },

      waitFor: async (options?: {
        state?: 'attached' | 'detached' | 'visible' | 'hidden';
        timeout?: number;
      }) => {
        const state = options?.state || 'visible';
        const timeout = options?.timeout || this.defaultTimeout;
        const startTime = Date.now();

        logger.debug(`[Action] waitFor state=${state}`);

        while (Date.now() - startTime < timeout) {
          const el = getElement();
          const isAttached = !!el;
          // For 'visible', we need attached AND visible
          const isVisible = isAttached && this.isVisible(el!);

          let satisfied = false;
          switch (state) {
            case 'attached':
              satisfied = isAttached;
              break;
            case 'detached':
              satisfied = !isAttached;
              break;
            case 'visible':
              satisfied = isVisible;
              break;
            case 'hidden':
              satisfied = !isVisible; // Detached is also considered hidden in Playwright
              break;
          }

          if (satisfied) return;
          await this.delay(100);
        }

        throw new Error(`Timeout ${timeout}ms exceeded waiting for ${state}`);
      },

      elementHandles: async () => {
        return getFilteredElements();
      },
    };

    return locator;
  }
}
