import { timingSafeEqual } from 'node:crypto';
import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server';
import { getRuntimeEnv } from '#platform';

const handleStart = createStartHandler(defaultStreamHandler);

function protect(response: Response, preview: boolean): Response {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
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

export default {
  async scheduled() {
    const env = getRuntimeEnv();
    if (env.MAINTENANCE_MODE === 'true') return;
    const now = Date.now();
    await env.DB.batch([
      env.DB.prepare('DELETE FROM rate_limit_buckets WHERE reset_at < ?').bind(
        now - 86_400_000,
      ),
      env.DB.prepare('DELETE FROM reward_operations WHERE created_at < ?').bind(
        now - 30 * 86_400_000,
      ),
    ]);
  },
  async fetch(request: Request): Promise<Response> {
    const env = getRuntimeEnv();
    const preview = env.APP_ENV === 'preview';
    if (preview) {
      if (!env.PREVIEW_ACCESS_TOKEN || env.PREVIEW_ACCESS_TOKEN.length < 32)
        return protect(
          new Response('Preview access is not configured.', { status: 503 }),
          true,
        );
      const expected = new TextEncoder().encode(
        `Basic ${btoa(`preview:${env.PREVIEW_ACCESS_TOKEN}`)}`,
      );
      const actual = new TextEncoder().encode(
        request.headers.get('authorization') ?? '',
      );
      if (
        expected.byteLength !== actual.byteLength ||
        !timingSafeEqual(expected, actual)
      )
        return protect(
          new Response('Preview authentication required.', {
            status: 401,
            headers: {
              'WWW-Authenticate': 'Basic realm="TWE preview", charset="UTF-8"',
            },
          }),
          true,
        );
      // Preview runs the Worker first so access protects assets too.
      // Asset lookup consumes a request body. Keep mutation bodies untouched
      // for Start/Better Auth; only GET/HEAD can resolve a static asset.
      if (request.method === 'GET' || request.method === 'HEAD') {
        const asset = await env.ASSETS?.fetch(request);
        if (asset && asset.status !== 404) return protect(asset, true);
      }
    }
    // Block every application request: even a session read can refresh auth data.
    if (env.MAINTENANCE_MODE === 'true')
      return protect(
        new Response('Maintenance in progress. Please try again shortly.', {
          status: 503,
          headers: {
            'Retry-After': '300',
            'Cache-Control': 'private, no-store',
          },
        }),
        preview,
      );
    try {
      return protect(await handleStart(request), preview);
    } catch {
      // No exception payload, query, headers, user data or credentials in logs.
      console.error(
        JSON.stringify({
          event: 'worker_request_failed',
          requestId: crypto.randomUUID(),
        }),
      );
      return protect(
        new Response('Internal server error', {
          status: 500,
          headers: { 'Cache-Control': 'private, no-store' },
        }),
        preview,
      );
    }
  },
};
