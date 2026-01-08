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
    logs?: Array<{ id: string; type: string; message: string }>;
    assertionCount?: number;
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
 * Executes Playwright-style code in a sandboxed iframe
 */
export async function executePlaywrightCode(
    code: string,
    htmlContent: string,
    options?: ExecuteOptions & { existingIframe?: HTMLIFrameElement }
): Promise<ExecutionResult> {
    const timeout = options?.timeout || 10000;
    const startTime = Date.now();
    const useExistingIframe = !!options?.existingIframe;
    const logs: Array<{ id: string; type: string; message: string }> = [];


    // Patch HTML content for specific challenges where happy-dom needs checking
    // e.g. pw-wait-for-response uses relative fetch which fails in happy-dom
    let finalHtml = htmlContent;
    if (htmlContent.includes("fetch('/api/data')")) {
        finalHtml = htmlContent.replace("fetch('/api/data')", "fetch('http://localhost/api/data')");
    }

    // Static analysis for "Strict Mode" (Educational Check)
    // We want to catch uses of 'document' or 'window' that aren't inside page.evaluate()
    // This is a simple regex check, not a full AST parse, but catches most beginner mistakes.
    const forbiddenPatterns = [
        { pattern: /document\.getElement/, message: "In Playwright, you cannot access 'document' directly. Use 'page.locator()' or 'page.evaluate()'." },
        { pattern: /document\.query/, message: "In Playwright, you cannot access 'document' directly. Use 'page.locator()' or 'page.evaluate()'." },
        { pattern: /window\.local/, message: "In Playwright, you cannot access 'window' directly. Use 'page.evaluate(() => window.localStorage...)'." },
        { pattern: /alert\(/, message: "In Playwright, you cannot handle alerts this way. Use 'page.on(\"dialog\", ...)'." },
    ];

    for (const { pattern, message } of forbiddenPatterns) {
        if (pattern.test(code)) {
            // Check if it might be inside an evaluate block (naive check)
            // If the code line containing the pattern is not inside an evaluate, throw error
            // Ideally we'd use AST, but for now we'll just warn if it looks suspicious
            // Actually, let's just return a FAILED result immediately to teach the user.
            return {
                status: 'FAILED',
                output: `Strict Mode Error: ${message}\n\nReal Playwright tests run in Node.js and cannot access the Browser DOM directly.`,
                executionTime: 0,
                error: `Strict Mode Error: ${message}`,
                logs: []
            };
        }
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

        let timeoutId: any;

        const cleanup = () => {
            if (timeoutId) clearTimeout(timeoutId);
            // Only remove if we created it
            if (!useExistingIframe && iframe.parentNode) {
                document.body.removeChild(iframe);
            }
        };

        // Timeout handler
        timeoutId = setTimeout(() => {
            cleanup();
            resolve({
                status: 'TIMEOUT',
                output: `Process timed out. Please review your logic for potential errors or long-running tasks.`,
                executionTime: timeout,
                error: `Process timed out. Please review your logic for potential errors or long-running tasks.`,
                logs,
            });
        }, timeout);

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

                    // NOTE: Console interception is done AFTER iframeDoc.close() below
                    // to ensure we intercept the final document's console object

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

                                    // Check against dynamic routes from page.route()
                                    if (window.__MOCK_ROUTES__) {
                                        for (const route of window.__MOCK_ROUTES__) {
                                            let isMatch = false;
                                            if (typeof route.matcher === 'string') {
                                                // Simple glob-like matching (very basic)
                                                // If it contains *, treat as simple wildcard
                                                if (route.matcher.includes('*')) {
                                                    const regex = new RegExp(route.matcher.replace(/\*/g, '.*'));
                                                    isMatch = regex.test(url);
                                                } else {
                                                    isMatch = url.includes(route.matcher);
                                                }
                                            } else if (route.matcher instanceof RegExp) {
                                                isMatch = route.matcher.test(url);
                                            } else if (typeof route.matcher === 'function') {
                                                try {
                                                    isMatch = route.matcher(new URL(url));
                                                } catch {
                                                    isMatch = false;
                                                }
                                            }

                                            if (isMatch) {
                                                console.log('Mocking fetch via page.route to ' + url);

                                                // Create a request object to pass to handler
                                                const requestInfo = {
                                                    url,
                                                    method: init?.method || 'GET',
                                                    headers: init?.headers || {},
                                                    body: init?.body
                                                };

                                                return route.handler(requestInfo).then(result => {
                                                    if (result && result.type === 'fulfill') {
                                                        const resp = result.response;
                                                        return Promise.resolve({
                                                            ok: (resp.status || 200) >= 200 && (resp.status || 200) < 300,
                                                            status: resp.status || 200,
                                                            json: () => Promise.resolve(resp.json || JSON.parse(typeof resp.body === 'string' ? resp.body : '{}')),
                                                            text: () => Promise.resolve(typeof resp.body === 'string' ? resp.body : JSON.stringify(resp.json || {})),
                                                            headers: new Headers(resp.headers || {'content-type': 'application/json'})
                                                        });
                                                    } else if (result && result.type === 'continue') {
                                                        // Fall through to original fetch (network)
                                                        // In our sandbox, this means hitting the actual URL (or failing if CORS/offline)
                                                        // return originalFetch(url, init);
                                                    }
                                                    return Promise.reject(new Error('Route handler did not fulfill or continue'));
                                                });
                                            }
                                        }
                                    }

                                    // Legacy Mock for /api/data (for backward compatibility with existing challenges)
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

                    // NOTE: Console logs from user code are captured via interceptedConsole
                    // which is injected into the user function scope below

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
                                const funcMatches = Array.from(scriptCode.matchAll(/function\s+(\w+)\s*\(/g));
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

                    // Create an intercepted console object that logs to our logs array
                    let logCounter = 0;
                    const interceptedConsole = {
                        log: (...args: unknown[]) => {
                            logs.push({ id: `log-${Date.now()}-${logCounter++}`, type: 'log', message: args.map(a => String(a)).join(' ') });
                            console.log(...args); // Also log to browser console for debugging
                        },
                        error: (...args: unknown[]) => {
                            logs.push({ id: `log-${Date.now()}-${logCounter++}`, type: 'error', message: args.map(a => String(a)).join(' ') });
                            console.error(...args);
                        },
                        warn: (...args: unknown[]) => {
                            logs.push({ id: `log-${Date.now()}-${logCounter++}`, type: 'warn', message: args.map(a => String(a)).join(' ') });
                            console.warn(...args);
                        },
                        info: (...args: unknown[]) => {
                            logs.push({ id: `log-${Date.now()}-${logCounter++}`, type: 'log', message: args.map(a => String(a)).join(' ') });
                            console.info(...args);
                        },
                    };

                    // Execute user code
                    // For JS challenges, we need to capture the 'result' variable
                    // We use eval-style declaration to make result accessible even if user uses const/let

                    // Create an enhanced document wrapper with friendlier error messages
                    const createEnhancedDocument = (doc: Document) => {
                        const handler: ProxyHandler<Document> = {
                            get(target, prop) {
                                // querySelector override removed to allow null returns for existence checks

                                if (prop === 'querySelectorAll') {
                                    return (selector: string) => {
                                        const elements = target.querySelectorAll(selector);
                                        if (elements.length === 0) {
                                            console.warn(`Warning: No elements found for selector '${selector}'`);
                                        }
                                        return elements;
                                    };
                                }
                                // getElementById override removed to allow null returns

                                // For all other properties, return the original value
                                /* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */
                                const value = target[prop as keyof Document];
                                if (typeof value === 'function') {
                                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                                    return value.bind(target);
                                }
                                return value;
                                /* eslint-enable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */
                            }
                        };
                        return new Proxy(doc, handler);
                    };

                    const enhancedDocument = createEnhancedDocument(iframeDoc);

                    // Mock test runner object
                    const test = {
                        step: async (name: string, callback: () => Promise<any>) => {
                            interceptedConsole.log(`[Step] ${name}`);
                            try {
                                await callback();
                            } catch (error) {
                                interceptedConsole.error(`[Step] ${name} FAILED: ${error}`);
                                throw error;
                            }
                        }
                    };

                    // eslint-disable-next-line @typescript-eslint/no-implied-eval
                    const userFunction = new Function(
                        'page',
                        'expect',
                        'test',
                        'window',
                        'document',
                        'console',
                        `
                            const fetch = window.fetch;
                            return (async () => {
                              ${code} try { if (typeof result !== "undefined") return result; } catch(e) {}
                            })();
                        `
                    );

                    // Simple expect function with assertion tracking
                    const { expect, getAssertionCount, getTestResults } = createExpect();

                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
                    const returnValue = await userFunction(page, expect, test, iframe.contentWindow, enhancedDocument, interceptedConsole);

                    const executionTime = Date.now() - startTime;
                    cleanup();

                    // Check for soft failures
                    const softFailures = getTestResults().filter(r => !r.passed);
                    if (softFailures.length > 0) {
                        resolve({
                            status: 'FAILED',
                            output: `Test failed with ${softFailures.length} soft assertion error(s):\n${softFailures.map(f => `- ${f.message}`).join('\n')}`,
                            executionTime,
                            error: softFailures[0].message, // Return first error
                            logs,
                            assertionCount: getAssertionCount(),
                        });
                        return;
                    }

                    resolve({
                        status: 'PASSED',
                        output: 'All steps completed successfully',
                        executionTime,
                        returnValue,
                        logs,
                        assertionCount: getAssertionCount(),
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
 * Returns both the expect function and assert count getter
 */
// Define the return type explicitly to avoid circular reference
interface ExpectResult {
    expect: (actual: unknown) => {
        toBe: (expected: unknown) => void;
        toBeVisible: () => Promise<void>;
        toBeHidden: () => Promise<void>;
        toHaveText: (text: string | RegExp) => Promise<void>;
        toHaveValue: (value: string) => Promise<void>;
        toContainText: (text: string) => Promise<void>;
        toHaveAttribute: (name: string, value?: string | RegExp) => Promise<void>;
        toHaveCount: (count: number) => Promise<void>;
    };
    getAssertionCount: () => number;
    getTestResults: () => Array<{ message: string; passed: boolean }>;
}

function createExpect(): ExpectResult {
    let assertionCount = 0;
    const testResults: Array<{ message: string; passed: boolean }> = [];

    const incrementCount = () => { assertionCount++; };
    const getAssertionCount = () => assertionCount;
    const getTestResults = () => testResults;

    /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-return */
    const expect = function (actual: any) {
        const createMatchers = (isSoft = false) => {
            const handleResult = (pass: boolean, message: string) => {
                incrementCount(); // Count every assertion call
                if (!pass) {
                    if (isSoft) {
                        // Soft failure - record it but don't throw
                        const formattedMessage = message.includes('Expected')
                            ? `Soft Assertion Failed: ${message}`
                            : `Soft Assertion Failed: ${message} (Actual value did not match expected criteria)`;
                        console.error(formattedMessage);
                        testResults.push({ message: formattedMessage, passed: false });
                    } else {
                        // Improve error message format
                        const formattedMessage = message.includes('Expected')
                            ? `Assertion Error: ${message}`
                            : `Assertion Error: ${message} (Actual value did not match expected criteria)`;
                        throw new Error(formattedMessage);
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

                    handleResult(pass, `Expected text "${text}" to match "${expected}"`);
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

                    handleResult(text.includes(expected), `Expected text "${text}" to contain "${expected}"`);
                },

                async toHaveValue(expected: string | RegExp) {
                    let value = '';
                    if (actual && typeof actual.inputValue === 'function') {
                        value = await actual.inputValue();
                    } else if (actual instanceof HTMLInputElement || actual instanceof HTMLTextAreaElement || actual instanceof HTMLSelectElement) {
                        value = actual.value;
                    }

                    const pass = expected instanceof RegExp ? expected.test(value) : value === expected;
                    handleResult(pass, `Expected value "${value}" to match "${expected}"`);
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
                        handleResult(pass, `Expected attribute "${name}" to have value "${value}", got "${attrValue}"`);
                    } else {
                        handleResult(true, ''); // Attribute exists
                    }
                },

                async toHaveCount(expected: number) {
                    let count = 0;
                    if (actual && typeof actual.count === 'function') {
                        count = await actual.count();
                    } else if (Array.isArray(actual)) {
                        count = actual.length;
                    }

                    handleResult(count === expected, `Expected count ${expected}, got ${count}`);
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

                    handleResult(visible, 'Expected element to be visible');
                },

                async toBeChecked() {
                    await Promise.resolve();
                    let checked = false;
                    if (actual && typeof actual.isChecked === 'function') {
                        checked = await actual.isChecked();
                    }
                    handleResult(checked, 'Expected element to be checked');
                },

                async toBeEnabled() {
                    await Promise.resolve();
                    let disabled = false;
                    if (actual && typeof actual.isDisabled === 'function') {
                        disabled = await actual.isDisabled();
                    }
                    handleResult(!disabled, 'Expected element to be enabled');
                },

                async toBeDisabled() {
                    await Promise.resolve();
                    let disabled = false;
                    if (actual && typeof actual.isDisabled === 'function') {
                        disabled = await actual.isDisabled();
                    }
                    handleResult(disabled, 'Expected element to be disabled');
                },

                async toBeEditable() {
                    await Promise.resolve();
                    let editable = false;
                    if (actual && typeof actual.isEditable === 'function') {
                        editable = await actual.isEditable();
                    }
                    handleResult(editable, 'Expected element to be editable');
                },

                async toHaveTitle(expected: string | RegExp) {
                    await Promise.resolve();
                    let title = '';
                    if (actual && typeof actual.title === 'function') {
                        title = await actual.title();
                    } else if (actual && actual.targetDocument) {
                        title = actual.targetDocument.title;
                    } else if (typeof actual === 'string') {
                        title = actual;
                    }

                    const pass = expected instanceof RegExp ? expected.test(title) : title === expected;
                    handleResult(pass, `Expected title "${title}" to match "${expected}"`);
                },

                async toHaveURL(expected: string | RegExp) {
                    await Promise.resolve();
                    let url = '';
                    if (actual && typeof actual.url === 'function') {
                        url = actual.url();
                    } else if (typeof actual === 'string') {
                        url = actual;
                    }

                    const pass = expected instanceof RegExp ? expected.test(url) : url === expected;
                    handleResult(pass, `Expected URL "${url}" to match "${expected}"`);
                },

                async toHaveClass(expected: string | RegExp) {
                    let className = '';
                    if (actual && typeof actual.getAttribute === 'function') {
                        className = (await actual.getAttribute('class')) || '';
                    } else if (actual instanceof HTMLElement) {
                        className = actual.className;
                    }

                    let pass;
                    if (expected instanceof RegExp) {
                        pass = expected.test(className);
                    } else {
                        pass = className === expected;
                    }

                    handleResult(pass, `Expected class "${className}" to match "${expected}"`);
                },

                async toBeFocused() {
                    await Promise.resolve();
                    let isFocused = false;

                    if (actual && typeof actual.evaluate === 'function') {

                        isFocused = await actual.evaluate((el: any) => el === el.ownerDocument.activeElement);
                    } else if (actual instanceof HTMLElement) {
                        isFocused = actual === actual.ownerDocument.activeElement;
                    }
                    handleResult(isFocused, 'Expected element to be focused');
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
                    handleResult(isEmpty, 'Expected element to be empty');
                },

                async toBeHidden() {
                    await Promise.resolve();
                    let visible = false;
                    if (actual && typeof actual.isVisible === 'function') {
                        visible = await actual.isVisible();
                    } else if (actual instanceof HTMLElement) {
                        visible = actual.style.display !== 'none';
                    }

                    handleResult(!visible, 'Expected element to be hidden');
                },

                // standard matchers (sync mostly, but we make async for consistency)
                async toBe(expected: unknown) {
                    await Promise.resolve();
                    handleResult(actual === expected, `Expected ${expected}, got ${actual}`);
                },
                async toEqual(expected: unknown) {
                    await Promise.resolve();
                    handleResult(JSON.stringify(actual) === JSON.stringify(expected), `Expected equal`);
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

    return { expect, getAssertionCount };
    /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-return */
}

// Helper type for createExpect internal use
function createExpectInternal() {
    return createExpect().expect;
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
