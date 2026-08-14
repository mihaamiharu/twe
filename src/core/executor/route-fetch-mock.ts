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
    body?: string | ArrayBuffer;
    json?: unknown;
    headers?: Record<string, string>;
  };
  options?: {
    method?: string;
    headers?: Record<string, string>;
    postData?: string | Buffer;
  };
}

export type BrowserFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export interface RouteWindow {
  __MOCK_ROUTES__?: RouteMatcher[];
}

const supportedRequestBodyTags = [
  '[object ArrayBuffer]',
  '[object Blob]',
  '[object File]',
  '[object FormData]',
  '[object ReadableStream]',
  '[object URLSearchParams]',
] as const;
const unsupportedRequestBodyMessage =
  'Unsupported request body for page.route';

function isSupportedRequestBody(body: unknown): body is BodyInit {
  if (typeof body === 'string' || ArrayBuffer.isView(body)) return true;
  const bodyTag = Object.prototype.toString.call(body);
  return supportedRequestBodyTags.some((supportedTag) => supportedTag === bodyTag);
}

function isRequestInput(input: unknown): input is Request {
  if (typeof input !== 'object' || input === null) return false;
  return Object.prototype.toString.call(input) === '[object Request]' &&
    typeof Reflect.get(input, 'url') === 'string' &&
    typeof Reflect.get(input, 'method') === 'string' &&
    typeof Reflect.get(input, 'clone') === 'function';
}

type FetchInputStringifier = (this: object) => unknown;

function isFetchInputStringifier(
  value: unknown,
): value is FetchInputStringifier {
  return typeof value === 'function';
}

function stringifyFetchInput(input: object): string {
  const toString: unknown = Reflect.get(input, 'toString');
  if (!isFetchInputStringifier(toString)) {
    throw new TypeError('Fetch input does not provide a toString method');
  }
  const result: unknown = Reflect.apply(toString, input, []);
  if (typeof result !== 'string') {
    throw new TypeError('Fetch input toString method did not return a string');
  }
  return result;
}

export async function requestBodyToPostData(
  body: unknown,
): Promise<string | null> {
  if (body === undefined || body === null) return null;

  if (!isSupportedRequestBody(body)) {
    throw new TypeError(
      `${unsupportedRequestBodyMessage}: ${Object.prototype.toString.call(body)}`,
    );
  }

  try {
    return await new Response(body).text();
  } catch (error) {
    const detail = error instanceof Error ? `: ${error.message}` : '';
    throw new TypeError(`${unsupportedRequestBodyMessage}${detail}`, {
      cause: error,
    });
  }
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
  const supportedRequestBodyTagsCode = JSON.stringify(supportedRequestBodyTags);
  const unsupportedRequestBodyMessageCode = JSON.stringify(
    unsupportedRequestBodyMessage,
  );

  return `
            window.fetch = async function(input, init) {
                let url = input;
                if (typeof input === 'string') {
                    if (input.startsWith('/')) {
                        url = 'http://localhost' + input;
                    } else if (input.startsWith('http')) {
                        url = input;
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
                            const serializeRequestBody = async function(requestBody) {
                                if (requestBody === undefined || requestBody === null) return null;
                                const tag = Object.prototype.toString.call(requestBody);
                                const isSupported =
                                    typeof requestBody === 'string' ||
                                    ArrayBuffer.isView(requestBody) ||
                                    ${supportedRequestBodyTagsCode}.includes(tag);
                                if (!isSupported) {
                                    throw new TypeError(${unsupportedRequestBodyMessageCode} + ': ' + tag);
                                }
                                try {
                                    return await new Response(requestBody).text();
                                } catch (error) {
                                    const detail = error instanceof Error ? ': ' + error.message : '';
                                    throw new TypeError(${unsupportedRequestBodyMessageCode} + detail, { cause: error });
                                }
                            };
                            let body = null;
                            if (init?.body !== undefined && init.body !== null) {
                                body = await serializeRequestBody(init.body);
                            } else if (input instanceof Request && input.body !== null) {
                                body = await input.clone().text();
                            }
                            const requestInfo = {
                                url,
                                method: init?.method || (input instanceof Request ? input.method : 'GET'),
                                headers: init?.headers || (input instanceof Request ? input.headers : {}),
                                body
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
  originalFetch: BrowserFetch | undefined,
  getWindow: () => RouteWindow | undefined,
): BrowserFetch {
  const wrappedFetch: BrowserFetch = async (input, init) => {
    const requestInput = isRequestInput(input) ? input : undefined;
    let url: string;
    if (typeof input === 'string') {
      url = input.startsWith('/') ? 'http://localhost' + input : input;
    } else if (requestInput) {
      url = requestInput.url;
    } else if (input && typeof input === 'object' && 'toString' in input) {
      url = stringifyFetchInput(input);
    } else {
      url = String(input);
    }

    const iframeWindow = getWindow();
    if (iframeWindow?.__MOCK_ROUTES__) {
      const routes = iframeWindow.__MOCK_ROUTES__;
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
          const headersInit = init?.headers ??
            requestInput?.headers;
          const headers = headersInit
            ? Object.fromEntries(new Headers(headersInit).entries())
            : undefined;
          const requestBody = init?.body !== undefined
            ? init.body
            : requestInput && requestInput.body !== null
              ? await requestInput.clone().text()
              : null;
          const body = typeof requestBody === 'string'
            ? requestBody
            : await requestBodyToPostData(requestBody);

          return route
            .handler({
              url,
              method: init?.method || requestInput?.method || 'GET',
              headers,
              body: body ?? undefined,
            })
            .then((r) => {
              if (r?.type === 'fulfill') {
                const body =
                  r.response?.body || JSON.stringify(r.response?.json || {});
                return new Response(body, {
                  status: r.response?.status || 200,
                  statusText: r.response?.statusText || 'OK',
                  headers: r.response?.headers || {},
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

  return wrappedFetch;
}
