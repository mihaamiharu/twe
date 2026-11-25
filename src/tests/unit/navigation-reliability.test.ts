import { describe, expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  createEmptySpeculationRulesResponse,
  forwardToAppRuntime,
  isRetryableDurableObjectError,
  isSpeculationRulesRequest,
  protectResponse,
  SPECULATION_RULES_CONTENT_TYPE,
  SPECULATION_RULES_HEADER_VALUE,
  SPECULATION_RULES_PATH,
} from '@/server/worker-gateway';
import {
  isWorkspacePath,
  parseDehydratedQueryState,
  resolveViewTransitionTypes,
  serializeDehydratedQueryState,
} from '@/lib/router-navigation';

describe('Worker gateway navigation reliability (Issue #263)', () => {
  test('emits explicit Speculation-Rules header on HTML responses to prevent Cloudflare Speed Brain 503 prefetches', () => {
    const htmlResponse = new Response('<!doctype html><html></html>', {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });

    const protectedHtml = protectResponse(htmlResponse, false);
    expect(protectedHtml.headers.get('Speculation-Rules')).toBe(
      SPECULATION_RULES_HEADER_VALUE,
    );
    expect(protectedHtml.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
    expect(protectedHtml.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  test('does not attach Speculation-Rules to non-HTML API/JSON responses and preserves existing header', () => {
    const jsonResponse = new Response('{"ok":true}', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    expect(
      protectResponse(jsonResponse, false).headers.get('Speculation-Rules'),
    ).toBeNull();

    const customHtml = new Response('<html></html>', {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Speculation-Rules': '"/custom-rules.json"',
      },
    });
    expect(
      protectResponse(customHtml, false).headers.get('Speculation-Rules'),
    ).toBe('"/custom-rules.json"');
  });

  test('serves an empty speculation-rules manifest with the required MIME type', async () => {
    expect(
      isSpeculationRulesRequest(
        new Request(`https://testingwithekki.com${SPECULATION_RULES_PATH}`),
      ),
    ).toBe(true);
    expect(
      isSpeculationRulesRequest(
        new Request(`https://testingwithekki.com${SPECULATION_RULES_PATH}`, {
          method: 'HEAD',
        }),
      ),
    ).toBe(true);
    expect(
      isSpeculationRulesRequest(
        new Request(`https://testingwithekki.com${SPECULATION_RULES_PATH}`, {
          method: 'POST',
        }),
      ),
    ).toBe(false);
    expect(
      isSpeculationRulesRequest(
        new Request('https://testingwithekki.com/en/learn'),
      ),
    ).toBe(false);

    const response = createEmptySpeculationRulesResponse();
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe(
      SPECULATION_RULES_CONTENT_TYPE,
    );
    expect(JSON.parse(await response.text())).toEqual({});
  });

  test('keeps static asset public/speculation-rules.json and public/_headers aligned for $0 production serving', async () => {
    const assetJson = await readFile(
      resolve(process.cwd(), 'public/speculation-rules.json'),
      'utf8',
    );
    const headersFile = await readFile(
      resolve(process.cwd(), 'public/_headers'),
      'utf8',
    );

    expect(JSON.parse(assetJson)).toEqual({});
    expect(headersFile).toContain('/speculation-rules.json');
    expect(headersFile).toContain(
      'Content-Type: application/speculationrules+json; charset=utf-8',
    );
  });

  test('retries idempotent GET requests once on retryable non-overloaded Durable Object errors', async () => {
    let attempts = 0;
    const runtime = {
      getByName: () => ({
        fetch: () => {
          attempts += 1;
          if (attempts === 1) {
            return Promise.reject(
              Object.assign(new Error('DO reset'), { retryable: true }),
            );
          }
          return Promise.resolve(new Response('ok', { status: 200 }));
        },
      }),
    };

    const response = await forwardToAppRuntime(
      runtime,
      new Request('https://testingwithekki.com/en/learn', { method: 'GET' }),
    );
    expect(attempts).toBe(2);
    expect(response.status).toBe(200);
  });

  test('never retries overloaded Durable Object errors or non-idempotent POST requests', async () => {
    expect(isRetryableDurableObjectError({ retryable: true })).toBe(true);
    expect(
      isRetryableDurableObjectError({ retryable: true, overloaded: true }),
    ).toBe(false);
    expect(isRetryableDurableObjectError(new Error('fatal'))).toBe(false);

    let overloadedAttempts = 0;
    const overloadedRuntime = {
      getByName: () => ({
        fetch: () => {
          overloadedAttempts += 1;
          return Promise.reject(
            Object.assign(new Error('overloaded'), {
              retryable: true,
              overloaded: true,
            }),
          );
        },
      }),
    };
    let overloadedError: unknown;
    try {
      await forwardToAppRuntime(
        overloadedRuntime,
        new Request('https://testingwithekki.com/en/learn', { method: 'GET' }),
      );
    } catch (error) {
      overloadedError = error;
    }
    expect(overloadedError).toBeInstanceOf(Error);
    expect((overloadedError as Error).message).toBe('overloaded');
    expect(overloadedAttempts).toBe(1);

    let postAttempts = 0;
    const postRuntime = {
      getByName: () => ({
        fetch: () => {
          postAttempts += 1;
          return Promise.reject(
            Object.assign(new Error('transient'), { retryable: true }),
          );
        },
      }),
    };
    let postError: unknown;
    try {
      await forwardToAppRuntime(
        postRuntime,
        new Request('https://testingwithekki.com/_serverFn/submit', {
          method: 'POST',
          body: '{}',
        }),
      );
    } catch (error) {
      postError = error;
    }
    expect(postError).toBeInstanceOf(Error);
    expect((postError as Error).message).toBe('transient');
    expect(postAttempts).toBe(1);
  });
});

describe('Router navigation hydration and view transitions (Issue #263)', () => {
  test('round-trips dehydrated SSR query payloads and ignores malformed payloads safely', () => {
    const sampleState = {
      mutations: [],
      queries: [
        {
          queryKey: ['catalog', 'learn', 'list', 'en', 'anonymous'],
          queryHash: '["catalog","learn","list","en","anonymous"]',
          state: {
            data: { success: true, data: [] },
            dataUpdateCount: 1,
            dataUpdatedAt: 1_700_000_000_000,
            error: null,
            errorUpdateCount: 0,
            errorUpdatedAt: 0,
            fetchFailureCount: 0,
            fetchFailureReason: null,
            fetchMeta: null,
            isInvalidated: false,
            status: 'success' as const,
            fetchStatus: 'idle' as const,
          },
        },
      ],
    };

    const serialized = serializeDehydratedQueryState(sampleState);
    expect(typeof serialized.queryClientState).toBe('string');
    expect(parseDehydratedQueryState(serialized)).toEqual(sampleState);
    expect(parseDehydratedQueryState(undefined)).toBeUndefined();
    expect(
      parseDehydratedQueryState({ queryClientState: '{not-json' }),
    ).toBeUndefined();
    expect(
      parseDehydratedQueryState({ queryClientState: '{"invalid":true}' }),
    ).toBeUndefined();
  });

  test('guards view transitions for hidden tabs, reduced motion, same-path search changes, and challenge workspaces', () => {
    expect(isWorkspacePath('/en/practice/css-selector-101-id-class')).toBe(
      true,
    );
    expect(isWorkspacePath('/admin/challenges')).toBe(true);
    expect(isWorkspacePath('/en/practice')).toBe(false);

    expect(
      resolveViewTransitionTypes({
        fromPathname: '/en',
        toPathname: '/en/learn',
        pathChanged: true,
        visibilityState: 'visible',
        prefersReducedMotion: false,
      }),
    ).toEqual(['page']);

    expect(
      resolveViewTransitionTypes({
        fromPathname: '/en',
        toPathname: '/en/learn',
        pathChanged: true,
        visibilityState: 'hidden',
        prefersReducedMotion: false,
      }),
    ).toBe(false);

    expect(
      resolveViewTransitionTypes({
        fromPathname: '/en',
        toPathname: '/en/learn',
        pathChanged: true,
        visibilityState: 'visible',
        prefersReducedMotion: true,
      }),
    ).toBe(false);

    expect(
      resolveViewTransitionTypes({
        fromPathname: '/en/practice',
        toPathname: '/en/practice/css-selector-101-id-class',
        pathChanged: true,
        visibilityState: 'visible',
        prefersReducedMotion: false,
      }),
    ).toBe(false);

    expect(
      resolveViewTransitionTypes({
        fromPathname: '/en/learn',
        toPathname: '/en/learn',
        pathChanged: false,
        visibilityState: 'visible',
        prefersReducedMotion: false,
      }),
    ).toBe(false);
  });
});
