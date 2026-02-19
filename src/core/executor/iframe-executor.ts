/**
 * Iframe Executor
 *
 * Creates an isolated iframe environment for executing user code
 * against HTML content using the MockedPlaywrightPage shim.
 */

import { MockedPlaywrightPage } from './playwright-shim';
import { logger } from '@/lib/logger';
import { transpileTypeScript } from './typescript-transpiler';
import {
  type ExecutionResult,
  type ExecuteOptions,
  type TestCase,
  type TestCaseResult
} from './executor.types';
import { createExpect } from './expect-matchers';
import { validateExpectedState } from './dom-validator';
import { createInterceptedConsole } from './console-interceptor';

/**
 * Executes Playwright-style code in a sandboxed iframe
 */
export async function executePlaywrightCode(
  code: string,
  htmlContent: string,
  options?: ExecuteOptions & {
    existingIframe?: HTMLIFrameElement;
    strictMode?: boolean;
  },
): Promise<ExecutionResult> {
  const timeout = options?.timeout || 10000;
  const startTime = Date.now();
  const useExistingIframe = !!options?.existingIframe;
  const logs: Array<{ id: string; type: string; message: string }> = [];
  const strictMode = options?.strictMode !== false; // Default to true for backward compatibility
  let executableCode = code;

  // Transpile if TypeScript
  if (options?.isTypeScript) {
    try {
      executableCode = await transpileTypeScript(code);
    } catch (error) {
      return {
        status: 'ERROR',
        output: error instanceof Error ? error.message : String(error),
        executionTime: 0,
        error: error instanceof Error ? error.message : String(error),
        logs: [],
      };
    }
  }

  // Determine standard log level mapping
  const getLogType = (level: string) => {
    if (level === 'error') return 'error';
    if (level === 'warn') return 'warn';
    return 'log';
  };

  // 1. Capture logger.debug() and other calls (e.g. from playwright-shim)
  // This redirects [Action] click logs from DevTools to the User Console UI
  let logCounter = 0;
  logger.setHandler((level, message, args) => {
    // Basic formatting for args
    const argsStr = args.length ? ' ' + args.map(String).join(' ') : '';
    logs.push({
      id: `log-${Date.now()}-${logCounter++}`,
      type: getLogType(level),
      message: `${message}${argsStr}`,
    });
  });

  // Patch HTML content for specific challenges where happy-dom needs checking
  // e.g. pw-wait-for-response uses relative fetch which fails in happy-dom
  let finalHtml = htmlContent;
  if (htmlContent.includes("fetch('/api/data')")) {
    finalHtml = htmlContent.replace(
      "fetch('/api/data')",
      "fetch('http://localhost/api/data')",
    );
  }

  // Static analysis for "Strict Mode" (Educational Check)
  // We want to catch uses of 'document' or 'window' that aren't inside page.evaluate()
  // This is a simple regex check, not a full AST parse, but catches most beginner mistakes.
  const forbiddenPatterns = [
    {
      pattern: /\bwindow\.localStorage\b/,
      message:
        "In Playwright, you cannot access 'window' directly. Use 'page.evaluate(() => window.localStorage...)'.",
    },
    {
      pattern: /\bwindow\.sessionStorage\b/,
      message:
        "In Playwright, you cannot access 'window' directly. Use 'page.evaluate(() => window.sessionStorage...)'.",
    },
    {
      pattern: /\bdocument\.(getElement|query|body|cookie)\b/,
      message:
        "In Playwright, you cannot access 'document' directly. Use 'page.locator()' or 'page.evaluate()'.",
    },
    {
      pattern: /alert\(/,
      message:
        'In Playwright, you cannot handle alerts this way. Use \'page.on("dialog", ...)\'.',
    },
  ];

  if (strictMode) {
    for (const { pattern, message } of forbiddenPatterns) {
      if (pattern.test(executableCode)) {
        // Check if it might be inside an evaluate block (naive check)
        // If the code line containing the pattern is not inside an evaluate, throw error
        // Ideally we'd use AST, but for now we'll just warn if it looks suspicious
        // Actually, let's just return a FAILED result immediately to teach the user.
        return {
          status: 'FAILED',
          output: `Strict Mode Error: ${message}\n\nReal Playwright tests run in Node.js and cannot access the Browser DOM directly.`,
          executionTime: 0,
          error: `Strict Mode Error: ${message}`,
          logs: [],
        };
      }
    }
  }

  // Phase 2: Strip standard Playwright imports (they are decorative in the shim)
  executableCode = executableCode.replace(
    /^\s*import\s+.*from\s+['"]@playwright\/test['"];?\s*$/gm,
    '',
  );

  try {
    return await new Promise((resolve) => {
      let iframe: HTMLIFrameElement;

      if (useExistingIframe && options?.existingIframe) {
        // Use existing iframe - re-inject HTML content
        iframe = options.existingIframe;
        if (iframe.sandbox && iframe.sandbox.add) {
          iframe.sandbox.add('allow-scripts', 'allow-same-origin', 'allow-forms');
        }
      } else {
        // Create isolated iframe (fallback behavior)
        iframe = document.createElement('iframe');
        iframe.style.cssText = 'display: none;';
        iframe.sandbox.add('allow-scripts', 'allow-same-origin', 'allow-forms');
        document.body.appendChild(iframe);
      }

      // Use function declaration for hoisting so it can be called by setTimeout
      // and can see timeoutId defined below (TDZ is passed by the time this runs)
      function cleanup() {
        clearTimeout(timeoutId);
        // Only remove if we created it
        if (!useExistingIframe && iframe.parentNode) {
          document.body.removeChild(iframe);
        }
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

      try {
        const executeCode = async () => {
          try {
            // Inject HTML into iframe
            const iframeDoc = iframe.contentDocument;
            if (!iframeDoc) {
              throw new Error('Could not access iframe document');
            }

            // In Playwright tests, localStorage/sessionStorage should be empty at the start of a run
            // to ensure isolation. Since all challenges share the same origin, we clear manually.
            // We also initialize __APP_STATE__ for E2E app state that persists across VFS navigations.
            try {
              if (iframe.contentWindow) {
                iframe.contentWindow.localStorage?.clear();
                iframe.contentWindow.sessionStorage?.clear();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const win = iframe.contentWindow as any;
                win.__MOCK_ROUTES__ = [];
                // In-memory state that persists across VFS navigations within a single execution run
                win.__APP_STATE__ = {};
              }
            } catch (e) {
              console.warn('Failed to clear storage:', e);
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
                              ${options?.cssContent || ''}
                            </style>
                            <script data-internal="true">
                              (function() {
                                if (window['__tweVfsPolyfillInstalled']) return;
                                window['__tweVfsPolyfillInstalled'] = true;

                                // Polyfill fetch to handle relative URLs and MOCK requests
                                window.fetch = function(input, init) {
                                    let url = input;
                                    if (typeof input === 'string') {
                                        if (input.startsWith('/')) {
                                            url = 'http://localhost' + input;
                                        } else if (input.startsWith('http')) {
                                            url = input;
                                        }
                                    }

                                    if (window.__MOCK_ROUTES__) {
                                        for (const route of window.__MOCK_ROUTES__) {
                                            let isMatch = false;
                                            if (typeof route.matcher === 'string') {
                                                if (route.matcher.includes('*')) {
                                                    const regex = new RegExp(route.matcher.replace(/\\*/g, '.*'));
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
                                                    }
                                                    return Promise.reject(new Error('Route handler did not fulfill'));
                                                });
                                            }
                                        }
                                    }

                                    if (typeof url === 'string' && url.includes('/api/data')) {
                                        return Promise.resolve({
                                            ok: true,
                                            status: 200,
                                            json: () => Promise.resolve({ success: true, count: 5 }),
                                            text: () => Promise.resolve('{"success":true}'),
                                            headers: new Headers({'content-type': 'application/json'})
                                        });
                                    }
                                    
                                    return Promise.resolve({
                                        ok: true,
                                        status: 404,
                                        json: () => Promise.resolve({}),
                                        text: () => Promise.resolve('Not Found')
                                    });
                                };

                                    window.alert = function(message) {
                                    console.log('[Dialog] alert: ' + message);
                                    if (window.__MOCK_DIALOG_HANDLER__) {
                                        window.__MOCK_DIALOG_HANDLER__('alert', message);
                                    }
                                };
                                
                                // VFS Navigation Shim for Initial Render
                                // (Only active if files/VFS is enabled)
                                ${options?.files
                ? `
                                window.__VFS_NAVIGATE__ = function(path) {
                                    console.log('[VFS] Navigating to ' + path);
                                    if (window.page) {
                                        window.page.goto(path).catch(e => console.error('Navigation failed:', e));
                                    } else {
                                        console.error('window.page not found for VFS navigation');
                                    }
                                };

                                window.addEventListener('click', function(e) {
                                    const link = e.target.closest('a[href]');
                                    if (link && !link.getAttribute('target')) {
                                        const href = link.getAttribute('href');
                                        if (href && (href.startsWith('/') || href.endsWith('.html'))) {
                                            e.preventDefault();
                                            window.__VFS_NAVIGATE__(href);
                                        }
                                    }
                                }, true);

                                window.addEventListener('submit', function(e) {
                                    const form = e.target;
                                    const action = form.getAttribute('action');
                                    if (action && (action.startsWith('/') || action.endsWith('.html'))) {
                                        e.preventDefault();
                                        window.__VFS_NAVIGATE__(action);
                                    }
                                }, true);
                                `
                : `
                                window.addEventListener('click', function(e) {
                                    const link = e.target.closest('a[href]');
                                    if (link && !link.getAttribute('target')) {
                                        const href = link.getAttribute('href');
                                        // Block navigation for relative links or anything that would navigate the frame
                                        // We allow anchor links (#) if they don't have a path
                                        if (href && (href.startsWith('/') || href.startsWith('http') || (href.startsWith('#') && href.length > 1))) {
                                           // Special case for purely local anchors?
                                           // Actually, let's just block everything that looks like a page navigation
                                           if (!href.startsWith('#')) {
                                               e.preventDefault();
                                           }
                                        }
                                    }
                                }, true);

                                window.addEventListener('submit', function(e) {
                                    e.preventDefault();
                                }, true);
                                `
              }
                              })();
                            </script>
                          </head>
                          <body>
                            ${finalHtml}
                          </body>
                        </html>
                    `);
            iframeDoc.close();

            // Manually execute scripts using scoped execution
            // Skip internal scripts marked with data-internal="true"
            const scripts = Array.from(
              iframeDoc.querySelectorAll('script'),
            );

            scripts.forEach((script) => {
              if (script.textContent) {
                try {
                  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */
                  const win = iframe.contentWindow as any;
                  const doc = iframe.contentDocument;
                  if (!win || !doc) return;
                  /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */

                  const scriptCode = script.textContent;

                  // Extract function names and assign them to window
                  const funcMatches = Array.from(
                    scriptCode.matchAll(/function\s+(\w+)\s*\(/g),
                  );
                  const funcNames: string[] = [];
                  for (const match of funcMatches) {
                    funcNames.push(match[1]);
                  }

                  const code = `
                                    return (function(window, document) {
                                        try {
                                            ${scriptCode}
                                            ${funcNames.map((name) => `if (typeof ${name} === 'function') window.${name} = ${name};`).join('\n')}
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
            const elementsWithClick = Array.from(
              iframeDoc.querySelectorAll('[onclick]'),
            );
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
                    (key) =>
                      // eslint-disable-next-line security/detect-object-injection
                      typeof win[key] === 'function' &&
                      ![
                        'fetch',
                        'setTimeout',
                        'setInterval',
                        'clearTimeout',
                        'clearInterval',
                      ].includes(key),
                  );
                  /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
                  const funcDestructure =
                    windowFuncs.length > 0
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
            const actionTimeout = Math.min(5000, Math.max(2000, timeout - 2000));
            const page = new MockedPlaywrightPage(iframeDoc, { timeout: actionTimeout });

            // Set up VFS for multi-page E2E challenges
            if (options?.files) {
              page.setVFS(options.files, {
                onNavigate: options.onNavigate,
                cssContent: options.cssContent,
              });
            }

            // Create an intercepted console object that logs to our logs array
            const logCounterRef = { current: logCounter };
            const interceptedConsole = createInterceptedConsole(logs, logCounterRef);
            // Sync back the counter if needed, though logCounterRef.current handles it

            // Create an enhanced document wrapper with friendlier error messages
            const createEnhancedDocument = (doc: Document) => {
              const handler: ProxyHandler<Document> = {
                get(target, prop) {
                  if (prop === 'querySelectorAll') {
                    return (selector: string) => {
                      const elements = target.querySelectorAll(selector);
                      if (elements.length === 0) {
                        console.warn(`Warning: No elements found for selector '${selector}'`);
                      }
                      return elements;
                    };
                  }
                  const value = (target as any)[prop];
                  return typeof value === 'function' ? value.bind(target) : value;
                },
              };
              return new Proxy(doc, handler);
            };

            const enhancedDocument = createEnhancedDocument(iframeDoc);

            // Prepare the iframe execution environment
            const contentWindow = iframe.contentWindow as any;

            // Initialize promise tracker for async tests
            contentWindow.__testPromises = [];

            // Mock test runner object (Support both test.step and standard test('name', ...))
            const testInstance = async (name: string, callback: (fixtures: any) => Promise<void>) => {
              // Create a tracking promise for this test
              const testPromise = (async () => {
                interceptedConsole.log(`[Test] ${name}`);
                try {
                  await callback({ page, expect });
                } catch (error) {
                  interceptedConsole.error(`[Test] ${name} FAILED: ${String(error)}`);
                  throw error;
                }
              })();

              // Track it so we can await it later
              if (Array.isArray(contentWindow.__testPromises)) {
                contentWindow.__testPromises.push(testPromise);
              }

              return testPromise;
            };
            (testInstance as any).step = async (name: string, callback: () => Promise<unknown>) => {
              interceptedConsole.log(`[Step] ${name}`);
              try {
                await callback();
              } catch (error) {
                interceptedConsole.error(`[Step] ${name} FAILED: ${String(error)}`);
                throw error;
              }
            };
            const test = testInstance;

            // Inject tools into the iframe context
            contentWindow.page = page;

            // Standardize timeouts: assertions/actions should fail before the global execution timeout
            // to provide clear error messages instead of a generic "Process timed out".
            const assertionTimeout = Math.min(5000, Math.max(2000, timeout - 2000));
            const expectResult = createExpect({ timeout: assertionTimeout });
            const { expect, getAssertionCount, getTestResults, cleanup } = expectResult;

            contentWindow.expect = expect;
            contentWindow.test = test;

            // ... (rest of setup)

            // ... (execution)
            try {
               // ...
            } catch (error) {
               // ...
            } finally {
               if (cleanup) cleanup();
            }

            // Inject console interceptor
            const originalIframeConsole = contentWindow.console;
            contentWindow.console = {
              ...originalIframeConsole,
              ...interceptedConsole
            };

            const wrappedCode = `
                        return (async () => {
                            try {
                                ${executableCode}

                                // Wait for all tests to complete
                                if (window.__testPromises && Array.isArray(window.__testPromises)) {
                                    await Promise.all(window.__testPromises);
                                }

                                if (typeof result !== "undefined") return result;
                            } catch (e) {
                                throw e;
                            }
                        })();
                    `;


            let returnValue;
            if (typeof contentWindow.eval === 'function') {
              /* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
              returnValue = await contentWindow.eval(
                `(function() { ${wrappedCode} })()`,
              );
              /* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
            } else {
              // Fallback for environments without iframe eval (e.g. HappyDOM tests)
              // This runs in parent context, so 'Array' !== iframe.contentWindow.Array
              console.warn(
                'iframe.contentWindow.eval not supported, falling back to new Function() in parent context.',
              );
              // eslint-disable-next-line @typescript-eslint/no-implied-eval
              const fallbackFn = new Function(
                'page',
                'expect',
                'test',
                'window',
                'document',
                'console',
                wrappedCode,
              );
              /* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
              returnValue = await fallbackFn(
                page,
                expect,
                test,
                contentWindow,
                enhancedDocument,
                contentWindow.console,
              );
              /* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
            }

            const executionTime = Date.now() - startTime;
            cleanup();

            // Check for soft failures
            const softFailures = getTestResults().filter((r) => !r.passed);
            if (softFailures.length > 0) {
              resolve({
                status: 'FAILED',
                output: `Test failed with ${softFailures.length} soft assertion error(s):\n${softFailures.map((f) => `- ${f.message}`).join('\n')}`,
                executionTime,
                error: softFailures[0].message, // Return first error
                logs,
                assertionCount: getAssertionCount(),
              });
              return;
            }

            // Validate expected DOM state if defined
            if (options?.expectedState && options.expectedState.length > 0) {
              const stateValidation = validateExpectedState(iframeDoc, options.expectedState);
              if (!stateValidation.passed) {
                resolve({
                  status: 'FAILED',
                  output: `DOM State Validation Failed: ${stateValidation.error}`,
                  executionTime,
                  error: stateValidation.error,
                  logs,
                  assertionCount: getAssertionCount(),
                });
                return;
              }
            }

            if (cleanup) cleanup();
            
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
            if (cleanup) cleanup();
            
            // ... existing cleanup if any ...

            const errorMessage = formatError(error);
            resolve({
              status: 'FAILED',
              output: errorMessage,
              executionTime,
              error: errorMessage,
              logs,
              assertionCount: getAssertionCount(),
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
  } finally {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    logger.setHandler(null as any);
  }
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

  if (msg.includes('Cannot read properties of null')) {
    if (msg.includes('click')) {
      return `${msg}\n\n💡 Tip: You are trying to click on an element that doesn't exist. Check your selector for typos.`;
    }
    return `${msg}\n\n💡 Tip: You are trying to access a property on a null value. Did your selector fail to find an element?`;
  }

  if (msg.includes('Cannot read properties of undefined')) {
    return `${msg}\n\n💡 Tip: You are trying to access a property on an undefined value. Check your logic.`;
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
  options?: { timeout?: number },
): Promise<{
  overall: ExecutionResult;
  results: TestCaseResult[];
}> {
  const timeout = options?.timeout || 10000;
  const startTime = Date.now();
  const results: TestCaseResult[] = [];

  // First, run the user code
  const codeResult = await executePlaywrightCode(code, htmlContent, {
    timeout,
  });

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
    const userFunction = new Function(
      'page',
      'expect',
      `
      return (async () => { ${code} })();
    `,
    );
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
 * Helper to show iframe preview during development
 */
export function createPreviewIframe(
  htmlContent: string,
  container: HTMLElement,
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
