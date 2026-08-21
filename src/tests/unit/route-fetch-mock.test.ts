import { describe, test, expect } from 'bun:test';
import { Window } from 'happy-dom';
import {
  generateFetchPolyfillCode,
  createRouteFetchWrapper,
} from '../../core/executor/route-fetch-mock';
import type {
  BrowserFetch,
  RouteMatcher,
  RouteWindow,
} from '../../core/executor/route-fetch-mock';
import { invokeDynamicFunction } from '../../core/executor/dynamic-code';

interface GeneratedFetchWindow extends RouteWindow {
  fetch?: BrowserFetch;
}

function installGeneratedFetch(routes: RouteMatcher[]): BrowserFetch {
  const generatedWindow: GeneratedFetchWindow = { __MOCK_ROUTES__: routes };
  const code = generateFetchPolyfillCode();
  // The generated polyfill is trusted application code under test.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const install = new Function('window', code);
  invokeDynamicFunction(install, undefined, [generatedWindow]);

  if (!generatedWindow.fetch) {
    throw new Error('Generated fetch polyfill did not install');
  }
  return generatedWindow.fetch;
}

async function captureRejectedError(value: unknown): Promise<Error> {
  try {
    await Promise.resolve(value);
  } catch (error) {
    if (error instanceof Error) return error;
    throw new Error('Expected rejection to contain an Error', { cause: error });
  }
  throw new Error('Expected promise to reject');
}

describe('generateFetchPolyfillCode', () => {
  test('should generate valid JavaScript code', () => {
    const code = generateFetchPolyfillCode();
    expect(code).toContain('window.fetch = async function');
    expect(code).toContain('__MOCK_ROUTES__');
  });

  test('should include api/data fallback when enabled', () => {
    const code = generateFetchPolyfillCode({ includeApiDataFallback: true });
    expect(code).toContain('/api/data');
    expect(code).toContain('success: true, count: 5');
  });

  test('should not include api/data fallback when disabled', () => {
    const code = generateFetchPolyfillCode({ includeApiDataFallback: false });
    expect(code).not.toContain('/api/data');
  });

  test('should include function matcher when enabled', () => {
    const code = generateFetchPolyfillCode({ includeFunctionMatcher: true });
    expect(code).toContain("typeof route.matcher === 'function'");
  });

  test('should not include function matcher when disabled', () => {
    const code = generateFetchPolyfillCode({ includeFunctionMatcher: false });
    expect(code).not.toContain('route.matcher instanceof Function');
  });

  test('should include arrayBuffer response when enabled', () => {
    const code = generateFetchPolyfillCode({ includeArrayBuffer: true });
    expect(code).toContain('arrayBuffer:');
    expect(code).toContain('TextEncoder');
  });

  test('should not include arrayBuffer response when disabled', () => {
    const code = generateFetchPolyfillCode({ includeArrayBuffer: false });
    expect(code).not.toContain('arrayBuffer:');
  });

  test('should include statusText when enabled', () => {
    const code = generateFetchPolyfillCode({ includeStatusText: true });
    expect(code).toContain('statusText:');
  });

  test('should not include statusText when disabled', () => {
    const code = generateFetchPolyfillCode({ includeStatusText: false });
    expect(code).not.toContain('statusText:');
  });

  test('should include fallback to original fetch when enabled', () => {
    const code = generateFetchPolyfillCode({ fallbackToOriginal: true });
    expect(code).toContain('originalFetch');
  });

  test('should return 404 as fallback when fallbackToOriginal is false', () => {
    const code = generateFetchPolyfillCode({ fallbackToOriginal: false });
    expect(code).toContain('status: 404');
    expect(code).not.toContain('originalFetch');
  });

  test('generated code should be syntactically valid', () => {
    const code = generateFetchPolyfillCode({
      includeApiDataFallback: true,
      includeFunctionMatcher: true,
      includeArrayBuffer: false,
      includeStatusText: false,
      fallbackToOriginal: false,
    });

    // Wrap in function to test syntax
    expect(() => {
      // The generated polyfill is dynamic code by design; this assertion only
      // compiles it and never executes untrusted input.
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      new Function(code);
    }).not.toThrow();
  });
});

describe('createRouteFetchWrapper', () => {
  test('should return a function', () => {
    const wrapper = createRouteFetchWrapper(undefined, () => undefined);
    expect(typeof wrapper).toBe('function');
  });

  test('should normalize relative URLs before route matching', async () => {
    const mockWindow = {
      __MOCK_ROUTES__: [
        {
          matcher: '/api/test',
          handler: () => Promise.resolve({
            type: 'fulfill' as const,
            response: { status: 200, json: { matched: true } },
          }),
        },
      ],
    };

    const wrapper = createRouteFetchWrapper(
      undefined,
      () => mockWindow,
    );

    // Relative URL should be normalized and match the route
    const response = await wrapper('/api/test');
    expect(response.ok).toBe(true);
    const json: unknown = await response.json();
    expect(json).toEqual({ matched: true });
  });

  test('should pass through to original fetch when no routes match', async () => {
    const mockWindow = {
      __MOCK_ROUTES__: [],
    };

    let originalCalled = false;
    const originalFetch = () => {
        originalCalled = true;
        return Promise.resolve(new Response(null, { status: 200 }));
      };

    const wrapper = createRouteFetchWrapper(
      originalFetch,
      () => mockWindow,
    );

    await wrapper('http://example.com/api');
    expect(originalCalled).toBe(true);
  });

  test('should fulfill matching route', async () => {
    const mockWindow = {
      __MOCK_ROUTES__: [
        {
          matcher: '/api/data',
          handler: () => Promise.resolve({
            type: 'fulfill' as const,
            response: {
              status: 200,
              json: { message: 'mocked' },
            },
          }),
        },
      ],
    };

    const wrapper = createRouteFetchWrapper(
      undefined,
      () => mockWindow,
    );

    const response = await wrapper('http://localhost/api/data');
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    const json: unknown = await response.json();
    expect(json).toEqual({ message: 'mocked' });
  });

  test('omits absent request headers and body from route handlers', async () => {
    let capturedRequest: Parameters<RouteMatcher['handler']>[0] | undefined;
    const wrapper = createRouteFetchWrapper(
      undefined,
      () => ({
        __MOCK_ROUTES__: [
          {
            matcher: '/api/no-options',
            handler: (request) => {
              capturedRequest = request;
              return Promise.resolve({
                type: 'fulfill' as const,
                response: { status: 204 },
              });
            },
          },
        ],
      }),
    );

    await wrapper('http://localhost/api/no-options');

    expect(capturedRequest).toBeDefined();
    if (!capturedRequest) throw new Error('Expected the route handler to run');
    expect('headers' in capturedRequest).toBe(false);
    expect('body' in capturedRequest).toBe(false);
  });

  test('preserves URLSearchParams request bodies for route handlers', async () => {
    let capturedBody: string | undefined;
    const wrapper = createRouteFetchWrapper(
      undefined,
      () => ({
        __MOCK_ROUTES__: [
          {
            matcher: '/api/form',
            handler: (request) => {
              capturedBody = request.body;
              return Promise.resolve({
                type: 'fulfill' as const,
                response: { status: 200 },
              });
            },
          },
        ],
      }),
    );

    await wrapper('http://localhost/api/form', {
      method: 'POST',
      body: new URLSearchParams({ query: 'type safety', page: '2' }),
    });

    expect(capturedBody).toBe('query=type+safety&page=2');
  });

  test('preserves bodies from Request inputs for route handlers', async () => {
    let capturedBody: string | undefined;
    const wrapper = createRouteFetchWrapper(
      undefined,
      () => ({
        __MOCK_ROUTES__: [
          {
            matcher: '/api/request',
            handler: (request) => {
              capturedBody = request.body;
              return Promise.resolve({
                type: 'fulfill' as const,
                response: { status: 200 },
              });
            },
          },
        ],
      }),
    );
    const request = new Request('http://localhost/api/request', {
      method: 'POST',
      body: new URLSearchParams({ source: 'request', valid: 'true' }),
    });

    await wrapper(request);

    expect(capturedBody).toBe('source=request&valid=true');
  });

  test('preserves bodies from iframe-realm Request inputs', async () => {
    const iframeWindow = new Window();

    try {
      let capturedBody: string | undefined;
      const wrapper = createRouteFetchWrapper(
        undefined,
        () => ({
          __MOCK_ROUTES__: [
            {
              matcher: '/api/cross-realm-request',
              handler: (request) => {
                capturedBody = request.body;
                return Promise.resolve({
                  type: 'fulfill' as const,
                  response: { status: 200 },
                });
              },
            },
          ],
        }),
      );
      const request = new iframeWindow.Request(
        'http://localhost/api/cross-realm-request',
        {
          method: 'POST',
          body: 'created-inside-iframe',
        },
      );

      expect(request instanceof Request).toBe(false);
      await Promise.resolve(
        invokeDynamicFunction(wrapper, undefined, [request]),
      );

      expect(capturedBody).toBe('created-inside-iframe');
    } finally {
      iframeWindow.close();
    }
  });

  test('continues to route URL-like inputs with custom stringification', async () => {
    let matched = false;
    const wrapper = createRouteFetchWrapper(
      undefined,
      () => ({
        __MOCK_ROUTES__: [
          {
            matcher: '/api/url-like',
            handler: () => {
              matched = true;
              return Promise.resolve({
                type: 'fulfill' as const,
                response: { status: 200 },
              });
            },
          },
        ],
      }),
    );
    const result = invokeDynamicFunction(wrapper, undefined, [
      { toString: () => 'http://localhost/api/url-like' },
    ]);

    await Promise.resolve(result);

    expect(matched).toBe(true);
  });

  test('rejects unsupported request bodies instead of coercing them', async () => {
    const wrapper = createRouteFetchWrapper(
      undefined,
      () => ({
        __MOCK_ROUTES__: [
          {
            matcher: '/api/invalid',
            handler: () => Promise.resolve({
              type: 'fulfill' as const,
              response: { status: 200 },
            }),
          },
        ],
      }),
    );
    const result = invokeDynamicFunction(wrapper, undefined, [
      'http://localhost/api/invalid',
      { method: 'POST', body: { unsupported: true } },
    ]);

    const error = await captureRejectedError(result);

    expect(error).toBeInstanceOf(TypeError);
    expect(error.message).toBe(
      'Unsupported request body for page.route: [object Object]',
    );
  });

  test('generated polyfill preserves bodies from Request inputs', async () => {
    let capturedBody: string | undefined;
    const generatedFetch = installGeneratedFetch([
      {
        matcher: '/api/request',
        handler: (request) => {
          capturedBody = request.body;
          return Promise.resolve({
            type: 'fulfill' as const,
            response: { status: 200 },
          });
        },
      },
    ]);
    const request = new Request('http://localhost/api/request', {
      method: 'POST',
      body: new URLSearchParams({ generated: 'true', source: 'request' }),
    });

    await generatedFetch(request);

    expect(capturedBody).toBe('generated=true&source=request');
  });

  test('generated polyfill rejects unsupported request bodies', async () => {
    const generatedFetch = installGeneratedFetch([
      {
        matcher: '/api/invalid',
        handler: () => Promise.resolve({
          type: 'fulfill' as const,
          response: { status: 200 },
        }),
      },
    ]);
    const result = invokeDynamicFunction(generatedFetch, undefined, [
      'http://localhost/api/invalid',
      { method: 'POST', body: { unsupported: true } },
    ]);

    const error = await captureRejectedError(result);

    expect(error).toBeInstanceOf(TypeError);
    expect(error.message).toBe(
      'Unsupported request body for page.route: [object Object]',
    );
  });

  test('should support RegExp matchers', async () => {
    const mockWindow = {
      __MOCK_ROUTES__: [
        {
          matcher: /\/api\/.*/,
          handler: () => Promise.resolve({
            type: 'fulfill' as const,
            response: { status: 200, json: { matched: true } },
          }),
        },
      ],
    };

    const wrapper = createRouteFetchWrapper(
      undefined,
      () => mockWindow,
    );

    const response = await wrapper('http://localhost/api/users');
    expect(response.ok).toBe(true);
    const json: unknown = await response.json();
    expect(json).toEqual({ matched: true });
  });

  test('should support function matchers', async () => {
    const mockWindow = {
      __MOCK_ROUTES__: [
        {
          matcher: (url: URL) => url.pathname === '/api/special',
          handler: () => Promise.resolve({
            type: 'fulfill' as const,
            response: { status: 200, json: { special: true } },
          }),
        },
      ],
    };

    const wrapper = createRouteFetchWrapper(
      undefined,
      () => mockWindow,
    );

    const response = await wrapper('http://localhost/api/special');
    expect(response.ok).toBe(true);
    const json: unknown = await response.json();
    expect(json).toEqual({ special: true });
  });

  test('should return 404 response when no original fetch and no routes match', async () => {
    const mockWindow = {
      __MOCK_ROUTES__: [],
    };

    const wrapper = createRouteFetchWrapper(
      undefined,
      () => mockWindow,
    );

    const response = await wrapper('http://localhost/unknown');
    expect(response.status).toBe(404);
  });
});
