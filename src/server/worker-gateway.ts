import type { RuntimeEnv } from '@/runtime/env';

export const SPECULATION_RULES_PATH = '/speculation-rules.json';
export const SPECULATION_RULES_HEADER_VALUE = `"${SPECULATION_RULES_PATH}"`;
export const SPECULATION_RULES_CONTENT_TYPE =
  'application/speculationrules+json; charset=utf-8';

export function createEmptySpeculationRulesResponse(): Response {
  return new Response('{}', {
    status: 200,
    headers: {
      'Content-Type': SPECULATION_RULES_CONTENT_TYPE,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

export function isSpeculationRulesRequest(request: Request): boolean {
  if (request.method !== 'GET' && request.method !== 'HEAD') return false;
  return new URL(request.url).pathname === SPECULATION_RULES_PATH;
}

export function protectResponse(response: Response, preview: boolean): Response {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('X-Frame-Options', 'SAMEORIGIN');

  // Advertise an explicit empty Speculation-Rules policy on HTML documents so
  // Cloudflare Speed Brain does not inject `/cdn-cgi/speculation`, which
  // triggers `Sec-Purpose: prefetch` requests that Cloudflare immediately
  // refuses with HTTP 503 (`Cf-Speculation-Refused: disabled for worker requests`).
  const contentType = headers.get('content-type')?.toLowerCase() ?? '';
  if (contentType.includes('text/html') && !headers.has('Speculation-Rules')) {
    headers.set('Speculation-Rules', SPECULATION_RULES_HEADER_VALUE);
  }

  if (preview) {
    headers.set('X-Robots-Tag', 'noindex, nofollow');
    headers.set('Cache-Control', 'private, no-store');
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function isRetryableDurableObjectError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const candidate = error as { retryable?: unknown; overloaded?: unknown };
  return candidate.retryable === true && candidate.overloaded !== true;
}

export function isIdempotentMethod(method: string): boolean {
  const normalized = method.toUpperCase();
  return normalized === 'GET' || normalized === 'HEAD';
}

export async function forwardToAppRuntime(
  appRuntime: NonNullable<RuntimeEnv['APP_RUNTIME']>,
  request: Request,
): Promise<Response> {
  const callRuntime = () =>
    appRuntime
      .getByName('application', { locationHint: 'apac' })
      .fetch(request);

  try {
    return await callRuntime();
  } catch (error) {
    // Follow Cloudflare Durable Object retry guidance: retry idempotent reads
    // at most once when the platform marks the stub failure retryable and not
    // overloaded (for example during code updates or object migration).
    if (
      isIdempotentMethod(request.method) &&
      request.body === null &&
      isRetryableDurableObjectError(error)
    ) {
      return await callRuntime();
    }
    throw error;
  }
}
