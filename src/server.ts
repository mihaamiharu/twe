import { timingSafeEqual } from 'node:crypto';
import { DurableObject } from 'cloudflare:workers';
import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server';
import { getRuntimeEnv } from '#platform';
import type { RuntimeEnv } from './runtime/env';
import {
  createEmptySpeculationRulesResponse,
  forwardToAppRuntime,
  isSpeculationRulesRequest,
  protectResponse,
} from './server/worker-gateway';

const handleStart = createStartHandler(defaultStreamHandler);

// D1 remains the database. The SQLite-backed class supplies a Free-compatible
// compute boundary for SSR, existing password hashes and arbitrary OG images.
// Never create an object per user/request: one stable instance bounds duration.
export class AppRuntime extends DurableObject<RuntimeEnv> {
  private readonly bootId = crypto.randomUUID();
  private hasHandledRequest = false;

  override async fetch(request: Request): Promise<Response> {
    if (!this.hasHandledRequest) {
      this.hasHandledRequest = true;
      // One non-sensitive event per object lifetime lets a live preview tail
      // distinguish a real cold object start from repeated warm requests.
      console.info(
        JSON.stringify({
          event: 'application_runtime_started',
          level: 'info',
          scope: 'AppRuntime',
          bootId: this.bootId,
          appEnv: this.env.APP_ENV,
        }),
      );
    }
    try {
      return await handleStart(request);
    } catch {
      // Catch before the object boundary: a rejected fetch can otherwise put a
      // raw database/auth exception into platform logs before the gateway sees it.
      console.error(
        JSON.stringify({
          event: 'application_request_failed',
          level: 'error',
          scope: 'AppRuntime',
          requestId: crypto.randomUUID(),
        }),
      );
      return new Response('Internal server error', {
        status: 500,
        headers: { 'Cache-Control': 'private, no-store' },
      });
    }
  }
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
        return protectResponse(
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
        return protectResponse(
          new Response('Preview authentication required.', {
            status: 401,
            headers: {
              'WWW-Authenticate': 'Basic realm="TWE preview", charset="UTF-8"',
            },
          }),
          true,
        );
      if (isSpeculationRulesRequest(request)) {
        return protectResponse(createEmptySpeculationRulesResponse(), true);
      }
      // Preview runs the Worker first so access protects assets too.
      // Asset lookup consumes a request body. Keep mutation bodies untouched
      // for Start/Better Auth; only GET/HEAD can resolve a static asset.
      if (request.method === 'GET' || request.method === 'HEAD') {
        const asset = await env.ASSETS?.fetch(request);
        if (asset && asset.status !== 404) return protectResponse(asset, true);
      }
    }
    // Serve the empty Speculation-Rules manifest directly from the gateway
    // when requests reach the Worker (local dev or fallback) without waking DO.
    if (isSpeculationRulesRequest(request)) {
      return protectResponse(createEmptySpeculationRulesResponse(), preview);
    }
    // Block every application request: even a session read can refresh auth data.
    if (env.MAINTENANCE_MODE === 'true')
      return protectResponse(
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
      if (!env.APP_RUNTIME)
        throw new Error('Application runtime is unavailable.');
      const response = await forwardToAppRuntime(env.APP_RUNTIME, request);
      return protectResponse(response, preview);
    } catch {
      // No exception payload, query, headers, user data or credentials in logs.
      console.error(
        JSON.stringify({
          event: 'worker_request_failed',
          requestId: crypto.randomUUID(),
        }),
      );
      return protectResponse(
        new Response('Internal server error', {
          status: 500,
          headers: { 'Cache-Control': 'private, no-store' },
        }),
        preview,
      );
    }
  },
};
