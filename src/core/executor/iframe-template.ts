/**
 * Iframe Template
 *
 * Shared HTML template generator for iframe content injection.
 * Used by both the iframe executor and the Playwright shim's VFS navigation.
 */

import { generateFetchPolyfillCode } from './route-fetch-mock';

export interface IframeTemplateOptions {
  /** HTML content to inject into the body */
  bodyContent: string;
  /** CSS content to inject into the style block */
  cssContent?: string;
  /** Whether VFS (Virtual File System) is enabled */
  filesEnabled?: boolean;
  /** Include the alert polyfill */
  includeAlertPolyfill?: boolean;
  /** Include function matcher support in fetch polyfill */
  includeFunctionMatcher?: boolean;
  /** Include wildcard support in fetch polyfill string matching */
  includeWildcardSupport?: boolean;
  /** Prepend an app state restoration script */
  appState?: Record<string, unknown>;
}

/**
 * Generate the full HTML template for iframe content injection.
 *
 * Creates a complete HTML document with the necessary polyfills for
 * fetch mocking, VFS navigation, and event handling.
 */
export function generateIframeTemplate(options: IframeTemplateOptions): string {
  const {
    bodyContent,
    cssContent = '',
    filesEnabled = false,
    includeAlertPolyfill = false,
    includeFunctionMatcher = false,
    includeWildcardSupport = false,
    appState,
  } = options;

  const appStateScript = appState
    ? `
      <script>
        // Restore persisted app state immediately
        window.__APP_STATE__ = ${JSON.stringify(appState)};
      </script>
    `
    : '';

  const fetchPolyfill = generateFetchPolyfillCode({
    includeApiDataFallback: !filesEnabled,
    includeFunctionMatcher,
    includeArrayBuffer: false,
    includeStatusText: false,
    fallbackToOriginal: false,
  });

  const alertPolyfill = includeAlertPolyfill
    ? `
                                window.alert = function(message) {
                                    console.log('[Dialog] alert: ' + message);
                                    if (window.__MOCK_DIALOG_HANDLER__) {
                                        window.__MOCK_DIALOG_HANDLER__('alert', message);
                                    }
                                };`
    : '';

  const vfsNavigationBlock = filesEnabled
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
                                }, true);`
    : `
                                window.addEventListener('click', function(e) {
                                    const link = e.target.closest('a[href]');
                                    if (link && !link.getAttribute('target')) {
                                        const href = link.getAttribute('href');
                                        if (href && (href.startsWith('/') || href.startsWith('http') || (href.startsWith('#') && href.length > 1))) {
                                            if (!href.startsWith('#')) {
                                                e.preventDefault();
                                            }
                                        }
                                    }
                                }, true);

                                window.addEventListener('submit', function(e) {
                                    e.preventDefault();
                                }, true);`;

  // Build the fetch polyfill with wildcard support if needed
  const fetchPolyfillWithWildcard = includeWildcardSupport
    ? fetchPolyfill.replace(
        /if \(route\.matcher\.includes\('\*'\)\) \{[\s\S]*?isMatch = url\.includes\(route\.matcher\);/,
        `if (route.matcher.includes('*')) {
                                                    const regex = new RegExp(route.matcher.replace(/\\\\*/g, '.*'));
                                                    isMatch = regex.test(url);
                                                } else {
                                                    isMatch = url.includes(route.matcher);`,
      )
    : fetchPolyfill;

  return `
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <meta charset="utf-8">
                            <base href="http://localhost/" />
                            ${appStateScript}
                            <style>
                              * { box-sizing: border-box; }
                              body {
                                font-family: system-ui, sans-serif;
                                padding: 16px;
                                margin: 0;
                              }
                              ${cssContent}
                            </style>
                            <script data-internal="true">
                              (function() {
                                if (window['__tweVfsPolyfillInstalled']) return;
                                window['__tweVfsPolyfillInstalled'] = true;

                                // Polyfill fetch to handle relative URLs and MOCK requests
                                ${fetchPolyfillWithWildcard}
                                ${alertPolyfill}
                                ${vfsNavigationBlock}
                              })();
                            </script>
                          </head>
                          <body>
                            ${bodyContent}
                          </body>
                        </html>
                    `;
}

/**
 * Generate a minimal VFS navigation template for shim's _wrapVfsContent.
 * This version is optimized for VFS page navigation with simplified fetch handling.
 */
export function generateVfsNavigationTemplate(options: {
  bodyContent: string;
  cssContent?: string;
  appState?: Record<string, unknown>;
}): string {
  const { bodyContent, cssContent = '', appState } = options;

  const appStateScript = appState
    ? `
      <script>
        // Restore persisted app state immediately
        window.__APP_STATE__ = ${JSON.stringify(appState)};
      </script>
    `
    : '';

  // Simplified fetch polyfill for VFS (no wildcard, no function matcher, no api/data fallback)
  const vfsFetchPolyfill = `
            window.fetch = function(input, init) {
              let url = input;
              if (typeof input === 'string') {
                if (input.startsWith('/')) {
                  url = 'http://localhost' + input;
                }
              } else if (input instanceof Request) {
                url = input.url;
              } else if (input && typeof input === 'object' && 'toString' in input) {
                 url = input.toString();
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
            };`;

  return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <base href="http://localhost/" />
        ${appStateScript}
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: system-ui, sans-serif;
            padding: 16px;
            margin: 0;
          }
          ${cssContent}
        </style>
        <script data-internal="true">
          (function() {
            if (window['__tweVfsPolyfillInstalled']) return;
            window['__tweVfsPolyfillInstalled'] = true;

            // Polyfill fetch to handle mock routes
            ${vfsFetchPolyfill}

            // Define VFS Navigation Helper
            window.__VFS_NAVIGATE__ = function(path) {
              if (window.page) {
                  window.page.goto(path).catch(e => console.error('Navigation failed:', e));
              } else {
                  console.error('window.page not found for VFS navigation');
              }
            };

            // Handle navigation for VFS
            window.addEventListener('click', function(e) {
              const link = e.target.closest('a[href]');
              if (link && !link.getAttribute('target')) {
                const href = link.getAttribute('href');
                if (href && (href.startsWith('/') || href.endsWith('.html'))) {
                  e.preventDefault();
                  window.__VFS_NAVIGATE__ && window.__VFS_NAVIGATE__(href);
                }
              }
            }, true);

            // Handle form submission for VFS
            window.addEventListener('submit', function(e) {
              const form = e.target;
              const action = form.getAttribute('action');
              if (action && (action.startsWith('/') || action.endsWith('.html'))) {
                e.preventDefault();
                window.__VFS_NAVIGATE__ && window.__VFS_NAVIGATE__(action);
              }
            }, true);
          })();
        </script>
      </head>
      <body>${bodyContent}</body>
      </html>
    `;
}
