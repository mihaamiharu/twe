/**
 * Route Fetch Mock
 *
 * Shared utilities for mocking fetch requests via route registration.
 * Used by both the iframe executor (inline script) and the Playwright shim
 * (runtime TypeScript and VFS navigation).
 */

export interface RouteMatcher {
  matcher: string | RegExp | ((url: URL) => boolean);
  handler: (requestInfo: RouteRequestInfo) => Promise<RouteHandlerResult>;
}

export interface RouteRequestInfo {
  url: string;
  method: string;
  headers?: Record<string, string> | Headers;
  body?: string;
}

export interface RouteHandlerResult {
  type: 'fulfill' | 'continue';
  response?: {
    status?: number;
    statusText?: string;
    body?: string;
    json?: Record<string, unknown>;
    headers?: Record<string, string>;
  };
}

/**
 * Generate the fetch polyfill code as a string for inline script injection.
 *
 * This generates the code that is injected into iframes to intercept fetch
 * calls and route them through the mock route system.
 */
export function generateFetchPolyfillCode(options: {
  /** Include the /api/data fallback (used by executor) */
  includeApiDataFallback?: boolean;
  /** Include function matcher support (executor only; VFS uses simpler version) */
  includeFunctionMatcher?: boolean;
  /** Include arrayBuffer response method */
  includeArrayBuffer?: boolean;
  /** Include statusText response field */
  includeStatusText?: boolean;
  /** Whether to call originalFetch as fallback (shim runtime) or return 404 (inline) */
  fallbackToOriginal?: boolean;
} = {}): string {
  const {
    includeApiDataFallback = false,
    includeFunctionMatcher = false,
    includeArrayBuffer = false,
    includeStatusText = false,
    fallbackToOriginal = false,
  } = options;

  const functionMatcherCode = includeFunctionMatcher
    ? ` else if (typeof route.matcher === 'function') {
                                                try {
                                                    isMatch = route.matcher(new URL(url));
                                                } catch {
                                                    isMatch = false;
                                                }
                                            }`
    : '';

  const apiDataFallbackCode = includeApiDataFallback
    ? `
                                    if (typeof url === 'string' && url.includes('/api/data')) {
                                        return Promise.resolve({
                                            ok: true,
                                            status: 200,
                                            json: () => Promise.resolve({ success: true, count: 5 }),
                                            text: () => Promise.resolve('{"success":true}'),
                                            headers: new Headers({'content-type': 'application/json'})
                                        });
                                    }`
    : '';

  const arrayBufferCode = includeArrayBuffer
    ? `
                      arrayBuffer: () =>
                        Promise.resolve(
                          new TextEncoder().encode(
                            r.response.body || JSON.stringify(r.response.json || {}),
                          ).buffer,
                        ),`
    : '';

  const statusTextCode = includeStatusText
    ? `
                      statusText: r.response.statusText || 'OK',`
    : '';

  const fallbackCode = fallbackToOriginal
    ? `return originalFetch ? originalFetch(input, init) : Promise.resolve({ ok: false, status: 404 });`
    : `return Promise.resolve({ ok: true, status: 404, json: () => Promise.resolve({}) });`;

  return `
            window.fetch = function(input, init) {
                let url = input;
                if (typeof input === 'string') {
                    if (input.startsWith('/')) {
                        url = 'http://localhost' + input;
                    } else if (input.startsWith('http')) {
                        url = input;
                    }
                }${includeArrayBuffer || includeStatusText ? ` else if (input instanceof Request) {
                    url = input.url;
                } else if (input && typeof input === 'object' && 'toString' in input) {
                    url = input.toString();
                }` : ''}

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
                        }${functionMatcherCode}

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
                                        status: resp.status || 200,${statusTextCode}
                                        json: () => Promise.resolve(resp.json || JSON.parse(typeof resp.body === 'string' ? resp.body : '{}')),
                                        text: () => Promise.resolve(typeof resp.body === 'string' ? resp.body : JSON.stringify(resp.json || {}))${arrayBufferCode},
                                        headers: new Headers(resp.headers || {'content-type': 'application/json'})
                                    });
                                }
                                return Promise.reject(new Error('Route handler did not fulfill'));
                            });
                        }
                    }
                }
                ${apiDataFallbackCode}
                ${fallbackCode}
            };`;
}

/**
 * Create a runtime fetch wrapper for the shim's route method.
 *
 * This wraps the original fetch and intercepts calls to check against
 * registered mock routes.
 */
export function createRouteFetchWrapper(
  originalFetch: typeof window.fetch | undefined,
  getWindow: () => (Window & Record<string, unknown>) | undefined,
): typeof window.fetch {
  return (input: RequestInfo | URL, init?: RequestInit) => {
    let url: string;
    if (typeof input === 'string') {
      url = input.startsWith('/') ? 'http://localhost' + input : input;
    } else if (input instanceof Request) {
      url = input.url;
    } else if (input && typeof input === 'object' && 'toString' in input) {
      url = (input as URL).toString();
    } else {
      url = String(input);
    }

    const iframeWindow = getWindow();
    if (iframeWindow?.__MOCK_ROUTES__) {
      const routes = iframeWindow.__MOCK_ROUTES__ as RouteMatcher[];
      for (const route of routes) {
        let isMatch = false;
        if (typeof route.matcher === 'string') {
          isMatch = url.includes(route.matcher);
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
          return route
            .handler({
              url,
              method: (init as RequestInit)?.method || 'GET',
              headers: (init as RequestInit)?.headers as Record<string, string> | undefined,
              body: (init as RequestInit)?.body as string | undefined,
            })
            .then((r) => {
              if (r?.type === 'fulfill') {
                return Promise.resolve({
                  ok:
                    (r.response?.status || 200) >= 200 &&
                    (r.response?.status || 200) < 300,
                  status: r.response?.status || 200,
                  statusText: r.response?.statusText || 'OK',
                  json: () =>
                    Promise.resolve(
                      r.response?.json ||
                        (r.response?.body ? JSON.parse(r.response.body) : {}),
                    ),
                  text: () =>
                    Promise.resolve(
                      r.response?.body || JSON.stringify(r.response?.json || {}),
                    ),
                  arrayBuffer: () =>
                    Promise.resolve(
                      new TextEncoder().encode(
                        r.response?.body || JSON.stringify(r.response?.json || {}),
                      ).buffer,
                    ),
                  headers: new Headers(
                    (r.response?.headers as HeadersInit) || {},
                  ),
                });
              }
              return Promise.reject(new Error('Route not fulfilled'));
            });
        }
      }
    }

    return originalFetch
      ? originalFetch(input, init)
      : Promise.resolve(new Response(null, { status: 404 }));
  };
}
