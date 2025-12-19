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
                output: `Execution timed out after ${timeout}ms`,
                executionTime: timeout,
                error: 'Timeout',
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
                    iframeDoc.write(`
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <meta charset="utf-8">
                            <style>
                              * { box-sizing: border-box; }
                              body { 
                                font-family: system-ui, sans-serif; 
                                padding: 16px;
                                margin: 0;
                              }
                            </style>
                          </head>
                          <body>
                            ${htmlContent}
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
                                const win = iframe.contentWindow;
                                const doc = iframe.contentDocument;
                                if (!win || !doc) return;

                                // Wrap code in a closure that shadows window and document
                                // This allows us to run the code in the MAIN window context (where timers work)
                                // but operating on the IFRAME's document and window.
                                const code = `
                                    return (function(window, document) {
                                        try {
                                            ${script.textContent}
                                        } catch(err) {
                                            console.error('Error in injected script:', err);
                                        }
                                    }).call(window, window, document);
                                `;

                                // Execute using main window's Function constructor
                                const fn = new Function('window', 'document', code);
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
                                const win = iframe.contentWindow;
                                const doc = iframe.contentDocument;
                                if (!win || !doc) return;

                                const code = `
                                    return (function(window, document, event) {
                                        try {
                                            ${handlerCode}
                                        } catch(err) {
                                            console.error('Error in onclick handler:', err);
                                        }
                                    }).call(this, window, document, event);
                                `;

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
                    const page = new MockedPlaywrightPage(iframeDoc, { timeout });

                    // Execute user code

                    const userFunction = new Function(
                        'page',
                        'expect',
                        `
                            return (async () => {
                              ${code}
                            })();
                        `
                    );

                    // Simple expect function
                    const expect = createExpect();

                    const returnValue = await userFunction(page, expect);

                    const executionTime = Date.now() - startTime;
                    cleanup();

                    resolve({
                        status: 'PASSED',
                        output: 'All steps completed successfully',
                        executionTime,
                        returnValue,
                    });
                } catch (error) {
                    const executionTime = Date.now() - startTime;
                    cleanup();

                    const errorMessage = error instanceof Error ? error.message : String(error);
                    resolve({
                        status: 'FAILED',
                        output: errorMessage,
                        executionTime,
                        error: errorMessage,
                    });
                }
            };

            if (useExistingIframe) {
                // Execute immediately for existing iframe
                executeCode();
            } else {
                // Wait for iframe to be ready
                iframe.onload = executeCode;
                // Trigger load event by setting src
                iframe.src = 'about:blank';
            }
        } catch (error) {
            const executionTime = Date.now() - startTime;
            cleanup();

            const errorMessage = error instanceof Error ? error.message : String(error);
            resolve({
                status: 'ERROR',
                output: `Execution error: ${errorMessage}`,
                executionTime,
                error: errorMessage,
            });
        }
    });
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
        const userFunction = new Function('page', 'expect', `
      return (async () => { ${code} })();
    `);
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
    const expect = function (actual: any) {
        const createMatchers = (isSoft = false) => {
            const handleResult = (pass: boolean, message: string) => {
                if (!pass) {
                    if (isSoft) {
                        try {
                            // In a real environment we'd collect this, but for now we'll just log or ignore
                            // console.warn(`Soft assertion failed: ${message}`);
                        } catch (e) { }
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
                    let checked = false;
                    if (actual && typeof actual.isChecked === 'function') {
                        checked = await actual.isChecked();
                    }
                    if (!checked) handleResult(false, 'Expected element to be checked');
                },

                async toBeEnabled() {
                    let disabled = false;
                    if (actual && typeof actual.isDisabled === 'function') {
                        disabled = await actual.isDisabled();
                    }
                    if (disabled) handleResult(false, 'Expected element to be enabled');
                },

                async toBeDisabled() {
                    let disabled = false;
                    if (actual && typeof actual.isDisabled === 'function') {
                        disabled = await actual.isDisabled();
                    }
                    if (!disabled) handleResult(false, 'Expected element to be disabled');
                },

                async toBeEditable() {
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

                // standard matchers (sync mostly, but we make async for consistency)
                async toBe(expected: unknown) {
                    if (actual !== expected) handleResult(false, `Expected ${expected}, got ${actual}`);
                },
                async toEqual(expected: unknown) {
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
                } catch (e) {
                    // Soft assertion failure - ignore
                }
            };
        }
        return softMatchers;
    };

    return expect;
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
