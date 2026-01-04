/**
 * Iframe Executor
 * 
 * Creates an isolated iframe environment for executing user code
 * against HTML content using the MockedPlaywrightPage shim.
 */

import { MockedPlaywrightPage } from './playwright-shim';

export interface ExecutionResult {
    status: 'PASSED' | 'FAILED' | 'ERROR' | 'TIMEOUT';
    output: string;
    executionTime: number;
    error?: string;
    returnValue?: unknown;
    logs?: Array<{ type: string; message: string }>;
}

export interface ExecuteOptions {
    timeout?: number;
    testCases?: TestCase[];
}

export interface TestCase {
    id: string;
    name: string;
    validate: (page: MockedPlaywrightPage) => Promise<boolean>;
}

export interface TestCaseResult {
    id: string;
    name: string;
    passed: boolean;
    error?: string;
}

/**
 * Execute user code in an isolated iframe environment
 * If existingIframe is provided, use it instead of creating a new one
 */
export async function executePlaywrightCode(
    code: string,
    htmlContent: string,
    options?: ExecuteOptions & { existingIframe?: HTMLIFrameElement }
): Promise<ExecutionResult> {
    const timeout = options?.timeout || 10000;
    const startTime = Date.now();
    const useExistingIframe = !!options?.existingIframe;
    const logs: Array<{ type: string; message: string }> = [];


    // Patch HTML content for specific challenges where happy-dom needs checking
    // e.g. pw-wait-for-response uses relative fetch which fails in happy-dom
    let finalHtml = htmlContent;
    if (htmlContent.includes("fetch('/api/data')")) {
        finalHtml = htmlContent.replace("fetch('/api/data')", "fetch('http://localhost/api/data')");
    }

    return new Promise((resolve) => {
        let iframe: HTMLIFrameElement;

        if (useExistingIframe && options?.existingIframe) {
            // Use existing iframe - re-inject HTML content
            iframe = options.existingIframe;
        } else {
            // Create isolated iframe (fallback behavior)
            iframe = document.createElement('iframe');
            iframe.style.cssText = 'display: none;';
            iframe.sandbox.add('allow-scripts', 'allow-same-origin');
            document.body.appendChild(iframe);
        }

        // Timeout handler
        const timeoutId = setTimeout(() => {
            cleanup();
            resolve({
                status: 'TIMEOUT',
                output: `Process timed out. Please review your logic for potential errors or long-running tasks.`,
                executionTime: timeout,
                error: `Process timed out. Please review your logic for potential errors or long-running tasks.`,
                logs,
            });
        }, timeout);

        const cleanup = () => {
            clearTimeout(timeoutId);
            // Only remove if we created it
            if (!useExistingIframe && iframe.parentNode) {
                document.body.removeChild(iframe);
            }
        };

        try {
            const executeCode = async () => {
                try {
                    // Inject HTML into iframe
                    const iframeDoc = iframe.contentDocument;
                    if (!iframeDoc) {
                        throw new Error('Could not access iframe document');
                    }

                    // Set up the HTML content
                    iframeDoc.open();

                    /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
                    // Intercept console logs
                    const win = iframe.contentWindow as any;
                    if (win) {
                        const originalLog = win.console.log;
                        const originalError = win.console.error;
                        const originalWarn = win.console.warn;

                        win.console.log = (...args: any[]) => {
                            logs.push({ type: 'log', message: args.map(a => String(a)).join(' ') });
                            originalLog.apply(win.console, args);
                        };
                        win.console.error = (...args: any[]) => {
                            logs.push({ type: 'error', message: args.map(a => String(a)).join(' ') });
                            originalError.apply(win.console, args);
                        };
                        win.console.warn = (...args: any[]) => {
                            logs.push({ type: 'warn', message: args.map(a => String(a)).join(' ') });
                            originalWarn.apply(win.console, args);
                        };
                        /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
                    }

                    iframeDoc.write(`
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
                            </style>
                            <script>
                                // Polyfill fetch to handle relative URLs if base tag doesn't work
                                // Polyfill fetch to handle relative URLs and MOCK requests
                                const originalFetch = window.fetch;
                                window.fetch = function(input, init) {
                                    let url = input;
                                    if (typeof input === 'string') {
                                        if (input.startsWith('/')) {
                                            url = 'http://localhost' + input;
                                        } else if (input.startsWith('http')) {
                                            url = input;
                                        }
                                    }

                                    // Mock /api/data
                                    if (typeof url === 'string' && url.includes('/api/data')) {
                                        console.log('Mocking fetch to ' + url);
                                        return Promise.resolve({
                                            ok: true,
                                            status: 200,
                                            json: () => Promise.resolve({ success: true, count: 5 }),
                                            text: () => Promise.resolve('{"success":true}'),
                                            headers: new Headers({'content-type': 'application/json'})
                                        });
                                    }
                                    
                                    // For other requests, try to fetch (or fail)
                                    // But usually we should mock everything in tests
                                    // return originalFetch(url, init);
                                    
                                    // Default mock for anything else to avoid connection refused
                                    return Promise.resolve({
                                        ok: true,
                                        status: 404,
                                        json: () => Promise.resolve({}),
                                        text: () => Promise.resolve('Not Found')
                                    });
                                };
                            </script>
                          </head>
                          <body>
                            ${finalHtml}
                          </body>
                        </html>
                    `);
                    iframeDoc.close();

                    // Manually execute scripts using scoped execution
                    // This works around HappyDOM limitations where inline scripts in iframes don't execute
                    // and timers within local iframe context don't fire reliably.
                    const scripts = Array.from(iframeDoc.querySelectorAll('script'));
                    scripts.forEach((script) => {
                        if (script.textContent) {
                            try {
                                /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */
                                const win = iframe.contentWindow as any;
                                const doc = iframe.contentDocument;
                                if (!win || !doc) return;
                                /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */

                                // Convert function declarations to window assignments
                                // e.g. "function runTask(n) {...}" -> "window.runTask = function(n) {...}"
                                // This ensures functions are accessible from onclick handlers
                                const scriptCode = script.textContent;

                                // Extract function names and assign them to window
                                const funcMatches = scriptCode.matchAll(/function\s+(\w+)\s*\(/g);
                                const funcNames: string[] = [];
                                for (const match of funcMatches) {
                                    funcNames.push(match[1]);
                                }

                                // Wrap code in a closure that shadows window and document
                                // This allows us to run the code in the MAIN window context (where timers work)
                                // but operating on the IFRAME's document and window.
                                const code = `
                                    return (function(window, document) {
                                        try {
                                            ${scriptCode}
                                            // Assign declared functions to window for onclick access
                                            ${funcNames.map(name => `if (typeof ${name} === 'function') window.${name} = ${name};`).join('\n')}
                                        } catch(err) {
                                            console.error('Error in injected script:', err);
                                        }
                                    }).call(window, window, document);
                                `;

                                // eslint-disable-next-line @typescript-eslint/no-implied-eval
                                const fn = new Function('window', 'document', code);
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                                fn(win, doc);
                            } catch (e) {
                                console.error('Failed to execute script shim:', e);
                            }
                        }
                    });

                    // Manually attach onclick handlers using scoped execution
                    // This works around HappyDOM limitation where inline event handlers don't verify consistently
                    const elementsWithClick = Array.from(iframeDoc.querySelectorAll('[onclick]'));
                    elementsWithClick.forEach((el) => {
                        const handlerCode = el.getAttribute('onclick');
                        if (handlerCode) {
                            try {
                                /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
                                const win = iframe.contentWindow as any;
                                const doc = iframe.contentDocument;
                                if (!win || !doc) return;

                                // Extract function names from window that were defined in script tags
                                // and create local references for them
                                const windowFuncs = Object.keys(win).filter(
                                    key => typeof win[key] === 'function' && !['fetch', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval'].includes(key)
                                );
                                /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
                                const funcDestructure = windowFuncs.length > 0
                                    ? `const { ${windowFuncs.join(', ')} } = window;`
                                    : '';

                                const code = `
                                    const fetch = window.fetch;
                                    ${funcDestructure}
                                    return (function(window, document, event) {
                                        try {
                                            ${handlerCode}
                                        } catch(err) {
                                            console.error('Error in onclick handler:', err);
                                        }
                                    }).call(this, window, document, event);
                                `;

                                // eslint-disable-next-line @typescript-eslint/no-implied-eval
                                const fn = new Function('window', 'document', 'event', code);

                                el.addEventListener('click', (event) => {
                                    fn.call(el, win, doc, event);
                                });
                                // Remove attribute to prevent double-execution if HappyDOM ever fixes this
                                el.removeAttribute('onclick');
                            } catch (e) {
                                console.error('Failed to attach onclick shim:', e);
                            }
                        }
                    });

                    // Create mocked page object
                    const page = new MockedPlaywrightPage(iframeDoc);

                    // Execute user code
                    // For JS challenges, we need to capture the 'result' variable
                    // We use eval-style declaration to make result accessible even if user uses const/let
                    // eslint-disable-next-line @typescript-eslint/no-implied-eval
                    const userFunction = new Function(
                        'page',
                        'expect',
                        'window',
                        'document',
                        `
                            const fetch = window.fetch;
                            return (async () => {
                              ${code}
                            })();
                        `
                    );

                    // Simple expect function
                    const expect = createExpect();

                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
                    const returnValue = await userFunction(page, expect, iframe.contentWindow, iframe.contentDocument);

                    const executionTime = Date.now() - startTime;
                    cleanup();

                    resolve({
                        status: 'PASSED',
                        output: 'All steps completed successfully',
                        executionTime,
                        returnValue,
                        logs,
                    });
                } catch (error) {
                    const executionTime = Date.now() - startTime;
                    cleanup();

                    const errorMessage = formatError(error);
                    resolve({
                        status: 'FAILED',
                        output: errorMessage,
                        executionTime,
                        error: errorMessage,
                        logs,
                    });
                }
            };

            if (useExistingIframe) {
                // Execute immediately for existing iframe
                void executeCode();
            } else {
                // Wait for iframe to be ready
                iframe.onload = executeCode;
                // Trigger load event by setting src
                iframe.src = 'about:blank';
            }
        } catch (error) {
            const executionTime = Date.now() - startTime;
            cleanup();

            const errorMessage = formatError(error);
            resolve({
                status: 'ERROR',
                output: `Execution error: ${errorMessage}`,
                executionTime,
                error: errorMessage,
                logs,
            });
        }
    });
}

/**
 * Format error messages to be more user-friendly
 */
function formatError(error: unknown): string {
    const msg = error instanceof Error ? error.message : String(error);

    if (msg.includes('Element not found')) {
        return `${msg}\n\n💡 Tip: Check if your selector matches the HTML structure in the Preview tab.`;
    }
    if (msg.includes('Timeout waiting')) {
        return `${msg}\n\n💡 Tip: The element might not be visible yet, or the operation took too long.`;
    }
    if (msg.includes('is not defined')) {
        return `${msg}\n\n💡 Tip: You might have a typo in a variable name.`;
    }
    if (msg.includes('Expected')) {
        // Assertion error
        return `${msg}\n\n💡 Tip: Your assertion failed. Check the Expected vs Actual values.`;
    }

    return msg;
}

/**
 * Execute code with multiple test cases
 */
export async function executeWithTestCases(
    code: string,
    htmlContent: string,
    testCases: TestCase[],
    options?: { timeout?: number }
): Promise<{
    overall: ExecutionResult;
    results: TestCaseResult[];
}> {
    const timeout = options?.timeout || 10000;
    const startTime = Date.now();
    const results: TestCaseResult[] = [];

    // First, run the user code
    const codeResult = await executePlaywrightCode(code, htmlContent, { timeout });

    if (codeResult.status !== 'PASSED') {
        return {
            overall: codeResult,
            results: testCases.map((tc) => ({
                id: tc.id,
                name: tc.name,
                passed: false,
                error: 'Code execution failed',
            })),
        };
    }

    // Re-run with test case validation
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    try {
        iframe.contentDocument?.open();
        iframe.contentDocument?.write(`
      <!DOCTYPE html>
      <html><body>${htmlContent}</body></html>
    `);
        iframe.contentDocument?.close();

        const page = new MockedPlaywrightPage(iframe.contentDocument!, { timeout });

        // Run user code first
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        const userFunction = new Function('page', 'expect', `
      return (async () => { ${code} })();
    `);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        await userFunction(page, createExpect());

        // Run test cases
        for (const testCase of testCases) {
            try {
                const passed = await testCase.validate(page);
                results.push({
                    id: testCase.id,
                    name: testCase.name,
                    passed,
                });
            } catch (error) {
                results.push({
                    id: testCase.id,
                    name: testCase.name,
                    passed: false,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
    } finally {
        if (iframe.parentNode) {
            document.body.removeChild(iframe);
        }
    }

    const allPassed = results.every((r) => r.passed);
    const executionTime = Date.now() - startTime;

    return {
        overall: {
            status: allPassed ? 'PASSED' : 'FAILED',
            output: allPassed
                ? `All ${results.length} test cases passed`
                : `${results.filter((r) => !r.passed).length} of ${results.length} test cases failed`,
            executionTime,
        },
        results,
    };
}

/**
 * Create a simple expect function for assertions
 */
function createExpect() {
    /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-return */
    const expect = function (actual: any) {
        const createMatchers = (isSoft = false) => {
            const handleResult = (pass: boolean, message: string) => {
                if (!pass) {
                    if (isSoft) {
                        try {
                            // In a real environment we'd collect this, but for now we'll just log or ignore
                            // console.warn(`Soft assertion failed: ${message}`);
                        } catch {
                            // ignore soft assertion
                        }
                    } else {
                        throw new Error(message);
                    }
                }
            };

            return {
                async toHaveText(expected: string | RegExp) {
                    let text = '';
                    if (actual && typeof actual.textContent === 'function') {
                        // It's a Locator
                        text = (await actual.textContent()) || '';
                    } else if (actual instanceof HTMLElement) {
                        text = actual.textContent || '';
                    } else {
                        text = String(actual);
                    }

                    const pass = expected instanceof RegExp
                        ? expected.test(text)
                        : text === expected; // toHaveText is strict exact match usually, but plays looser if needed. Playwright default is full string match.

                    if (!pass) {
                        handleResult(false, `Expected text "${text}" to match "${expected}"`);
                    }
                },

                async toContainText(expected: string) {
                    let text = '';
                    if (actual && typeof actual.textContent === 'function') {
                        text = (await actual.textContent()) || '';
                    } else if (actual instanceof HTMLElement) {
                        text = actual.textContent || '';
                    } else {
                        text = String(actual);
                    }

                    if (!text.includes(expected)) {
                        handleResult(false, `Expected text "${text}" to contain "${expected}"`);
                    }
                },

                async toHaveValue(expected: string | RegExp) {
                    let value = '';
                    if (actual && typeof actual.inputValue === 'function') {
                        value = await actual.inputValue();
                    } else if (actual instanceof HTMLInputElement || actual instanceof HTMLTextAreaElement || actual instanceof HTMLSelectElement) {
                        value = actual.value;
                    }

                    const pass = expected instanceof RegExp ? expected.test(value) : value === expected;
                    if (!pass) {
                        handleResult(false, `Expected value "${value}" to match "${expected}"`);
                    }
                },

                async toHaveAttribute(name: string, value?: string | RegExp) {
                    let attrValue: string | null = null;
                    if (actual && typeof actual.getAttribute === 'function') {
                        attrValue = await actual.getAttribute(name);
                    } else if (actual instanceof HTMLElement) {
                        attrValue = actual.getAttribute(name);
                    }

                    if (attrValue === null) {
                        handleResult(false, `Expected attribute "${name}" to exist`);
                        return;
                    }

                    if (value !== undefined) {
                        const pass = value instanceof RegExp ? value.test(attrValue) : attrValue === value;
                        if (!pass) {
                            handleResult(false, `Expected attribute "${name}" to have value "${value}", got "${attrValue}"`);
                        }
                    }
                },

                async toHaveCount(expected: number) {
                    let count = 0;
                    if (actual && typeof actual.count === 'function') {
                        count = await actual.count();
                    } else if (Array.isArray(actual)) {
                        count = actual.length;
                    }

                    if (count !== expected) {
                        handleResult(false, `Expected count ${expected}, got ${count}`);
                    }
                },

                async toBeVisible() {
                    await Promise.resolve();
                    let visible = false;
                    if (actual && typeof actual.isVisible === 'function') {
                        visible = await actual.isVisible();
                    } else if (actual instanceof HTMLElement) {
                        // simple visibility check
                        visible = actual.style.display !== 'none';
                    }

                    if (!visible) {
                        handleResult(false, 'Expected element to be visible');
                    }
                },

                async toBeChecked() {
                    await Promise.resolve();
                    let checked = false;
                    if (actual && typeof actual.isChecked === 'function') {
                        checked = await actual.isChecked();
                    }
                    if (!checked) handleResult(false, 'Expected element to be checked');
                },

                async toBeEnabled() {
                    await Promise.resolve();
                    let disabled = false;
                    if (actual && typeof actual.isDisabled === 'function') {
                        disabled = await actual.isDisabled();
                    }
                    if (disabled) handleResult(false, 'Expected element to be enabled');
                },

                async toBeDisabled() {
                    await Promise.resolve();
                    let disabled = false;
                    if (actual && typeof actual.isDisabled === 'function') {
                        disabled = await actual.isDisabled();
                    }
                    if (!disabled) handleResult(false, 'Expected element to be disabled');
                },

                async toBeEditable() {
                    await Promise.resolve();
                    let editable = false;
                    if (actual && typeof actual.isEditable === 'function') {
                        editable = await actual.isEditable();
                    }
                    if (!editable) handleResult(false, 'Expected element to be editable');
                },

                async toHaveTitle(expected: string | RegExp) {
                    let title = '';
                    if (actual && typeof actual.title === 'function') {
                        title = await actual.title();
                    } else if (actual && actual.targetDocument) {
                        title = actual.targetDocument.title;
                    }

                    const pass = expected instanceof RegExp ? expected.test(title) : title === expected;
                    if (!pass) {
                        handleResult(false, `Expected title "${title}" to match "${expected}"`);
                    }
                },

                async toHaveClass(expected: string | RegExp) {
                    let className = '';
                    if (actual && typeof actual.getAttribute === 'function') {
                        className = (await actual.getAttribute('class')) || '';
                    } else if (actual instanceof HTMLElement) {
                        className = actual.className;
                    }

                    let pass = false;
                    if (expected instanceof RegExp) {
                        pass = expected.test(className);
                    } else {
                        pass = className === expected;
                    }

                    if (!pass) {
                        handleResult(false, `Expected class "${className}" to match "${expected}"`);
                    }
                },

                async toBeFocused() {
                    await Promise.resolve();
                    let isFocused = false;

                    if (actual && typeof actual.evaluate === 'function') {

                        isFocused = await actual.evaluate((el: any) => el === el.ownerDocument.activeElement);
                    } else if (actual instanceof HTMLElement) {
                        isFocused = actual === actual.ownerDocument.activeElement;
                    }
                    if (!isFocused) handleResult(false, 'Expected element to be focused');
                },

                async toBeEmpty() {
                    let isEmpty = false;
                    if (actual && typeof actual.evaluate === 'function') {
                        isEmpty = await actual.evaluate((el: HTMLElement) => {
                            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) {
                                return !(el as HTMLInputElement).value;
                            }
                            return !el.textContent;
                        });
                    } else if (actual instanceof HTMLElement) {
                        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(actual.tagName)) {
                            isEmpty = !(actual as HTMLInputElement).value;
                        } else {
                            isEmpty = !actual.textContent;
                        }
                    }
                    if (!isEmpty) handleResult(false, 'Expected element to be empty');
                },

                async toBeHidden() {
                    await Promise.resolve();
                    let visible = false;
                    if (actual && typeof actual.isVisible === 'function') {
                        visible = await actual.isVisible();
                    } else if (actual instanceof HTMLElement) {
                        visible = actual.style.display !== 'none';
                    }

                    if (visible) {
                        handleResult(false, 'Expected element to be hidden');
                    }
                },

                // standard matchers (sync mostly, but we make async for consistency)
                async toBe(expected: unknown) {
                    await Promise.resolve();
                    if (actual !== expected) handleResult(false, `Expected ${expected}, got ${actual}`);
                },
                async toEqual(expected: unknown) {
                    await Promise.resolve();
                    if (JSON.stringify(actual) !== JSON.stringify(expected)) handleResult(false, `Expected equal`);
                }
            };
        };

        return createMatchers(false);
    };

    // Add soft property
    expect.soft = function (actual: any) {
        // We need 'createMatchers' logic accessible here. 
        // Duplicate logic or structure differently. 
        // Let's restructure above slightly to reuse.
        // Actually, just returning a proxy that swallows errors? 
        // Or re-implementing briefly.
        // For brevity in this replacement:
        const matchers = expect(actual);
        // Wrap all matchers to catch errors
        const softMatchers: any = {};
        for (const key in matchers) {
            softMatchers[key] = async (...args: any[]) => {
                try {
                    await (matchers as any)[key](...args);
                } catch {
                    // Soft assertion failure - ignore
                }
            };
        }
        return softMatchers;
    };

    return expect;
    /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-return */
}

/**
 * Helper to show iframe preview during development
 */
export function createPreviewIframe(
    htmlContent: string,
    container: HTMLElement
): { iframe: HTMLIFrameElement; page: MockedPlaywrightPage } {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    background: white;
  `;

    container.appendChild(iframe);

    iframe.contentDocument?.open();
    iframe.contentDocument?.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { box-sizing: border-box; }
          body { font-family: system-ui, sans-serif; padding: 16px; margin: 0; }
        </style>
      </head>
      <body>${htmlContent}</body>
    </html>
  `);
    iframe.contentDocument?.close();

    const page = new MockedPlaywrightPage(iframe.contentDocument!);

    return { iframe, page };
}
