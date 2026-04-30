import { describe, test, expect } from 'bun:test';
import {
  generateFetchPolyfillCode,
  createRouteFetchWrapper,
} from '../../core/executor/route-fetch-mock';

describe('generateFetchPolyfillCode', () => {
  test('should generate valid JavaScript code', () => {
    const code = generateFetchPolyfillCode();
    expect(code).toContain('window.fetch = function');
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
          handler: async () => ({
            type: 'fulfill' as const,
            response: { status: 200, json: { matched: true } },
          }),
        },
      ],
    } as unknown as Window & Record<string, unknown>;

    const wrapper = createRouteFetchWrapper(
      undefined,
      () => mockWindow,
    );

    // Relative URL should be normalized and match the route
    const response = await wrapper('/api/test');
    expect(response.ok).toBe(true);
    const json = await response.json();
    expect(json).toEqual({ matched: true });
  });

  test('should pass through to original fetch when no routes match', async () => {
    const mockWindow = {
      __MOCK_ROUTES__: [],
    } as unknown as Window & Record<string, unknown>;

    let originalCalled = false;
    const originalFetch = async () => {
      originalCalled = true;
      return new Response(null, { status: 200 });
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
          handler: async () => ({
            type: 'fulfill' as const,
            response: {
              status: 200,
              json: { message: 'mocked' },
            },
          }),
        },
      ],
    } as unknown as Window & Record<string, unknown>;

    const wrapper = createRouteFetchWrapper(
      undefined,
      () => mockWindow,
    );

    const response = await wrapper('http://localhost/api/data');
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({ message: 'mocked' });
  });

  test('should support RegExp matchers', async () => {
    const mockWindow = {
      __MOCK_ROUTES__: [
        {
          matcher: /\/api\/.*/,
          handler: async () => ({
            type: 'fulfill' as const,
            response: { status: 200, json: { matched: true } },
          }),
        },
      ],
    } as unknown as Window & Record<string, unknown>;

    const wrapper = createRouteFetchWrapper(
      undefined,
      () => mockWindow,
    );

    const response = await wrapper('http://localhost/api/users');
    expect(response.ok).toBe(true);
    const json = await response.json();
    expect(json).toEqual({ matched: true });
  });

  test('should support function matchers', async () => {
    const mockWindow = {
      __MOCK_ROUTES__: [
        {
          matcher: (url: URL) => url.pathname === '/api/special',
          handler: async () => ({
            type: 'fulfill' as const,
            response: { status: 200, json: { special: true } },
          }),
        },
      ],
    } as unknown as Window & Record<string, unknown>;

    const wrapper = createRouteFetchWrapper(
      undefined,
      () => mockWindow,
    );

    const response = await wrapper('http://localhost/api/special');
    expect(response.ok).toBe(true);
    const json = await response.json();
    expect(json).toEqual({ special: true });
  });

  test('should return 404 response when no original fetch and no routes match', async () => {
    const mockWindow = {
      __MOCK_ROUTES__: [],
    } as unknown as Window & Record<string, unknown>;

    const wrapper = createRouteFetchWrapper(
      undefined,
      () => mockWindow,
    );

    const response = await wrapper('http://localhost/unknown');
    expect(response.status).toBe(404);
  });
});
