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
            iframe.style.cssText = `
                position: fixed;
                bottom: 0;
                right: 0;
                width: 400px;
                height: 300px;
                border: 1px solid #333;
                background: white;
                z-index: 9999;
            `;
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

                    await userFunction(page, expect);

                    const executionTime = Date.now() - startTime;
                    cleanup();

                    resolve({
                        status: 'PASSED',
                        output: 'All steps completed successfully',
                        executionTime,
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
    return function expect(actual: unknown) {
        return {
            toBe(expected: unknown) {
                if (actual !== expected) {
                    throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
                }
            },
            toEqual(expected: unknown) {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
                }
            },
            toBeTruthy() {
                if (!actual) {
                    throw new Error(`Expected value to be truthy, but got ${JSON.stringify(actual)}`);
                }
            },
            toBeFalsy() {
                if (actual) {
                    throw new Error(`Expected value to be falsy, but got ${JSON.stringify(actual)}`);
                }
            },
            toContain(expected: string) {
                if (typeof actual !== 'string' || !actual.includes(expected)) {
                    throw new Error(`Expected "${actual}" to contain "${expected}"`);
                }
            },
            toBeVisible() {
                // For elements, check visibility
                if (actual instanceof HTMLElement) {
                    const style = window.getComputedStyle(actual);
                    const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
                    if (!isVisible) {
                        throw new Error('Expected element to be visible');
                    }
                } else if (!actual) {
                    throw new Error('Expected element to be visible, but element is null');
                }
            },
            toHaveText(expected: string) {
                const text = actual instanceof HTMLElement ? actual.textContent : String(actual);
                if (!text?.includes(expected)) {
                    throw new Error(`Expected text "${text}" to contain "${expected}"`);
                }
            },
            toHaveValue(expected: string) {
                const value = (actual as HTMLInputElement)?.value;
                if (value !== expected) {
                    throw new Error(`Expected value "${expected}", but got "${value}"`);
                }
            },
        };
    };
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
