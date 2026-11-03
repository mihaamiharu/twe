import { DurableObject } from 'cloudflare:workers';
import { scrypt, timingSafeEqual } from 'node:crypto';
import { verifyPassword } from 'better-auth/crypto';

interface ProbeEnv {
  PREVIEW_ACCESS_TOKEN: string;
  COMPUTE: {
    getByName(
      name: string,
      options: { locationHint: 'apac' },
    ): {
      fetch(request: Request): Promise<Response>;
    };
  };
}

// Public synthetic interoperability vector; never an application credential.
const PASSWORD = 'Synthetic benchmark only: Cafe\u0301 2026';
const HASH =
  '0123456789abcdef0123456789abcdef:33b140355d2fae9f30ab21751f66ef72f21a2bd82a4438c2e9407b7e4bc287819b19477ec192652472a56f6e74edc4e186bc4a26d4a31f6655d746f8681079a6';

export class FreeRuntimeProbe extends DurableObject<ProbeEnv> {
  override async fetch(request: Request): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path === '/noble') {
      return Response.json({
        implementation: 'existing Better Auth scrypt',
        matches: await verifyPassword({ hash: HASH, password: PASSWORD }),
      });
    }
    if (path === '/native') {
      const [salt, expected] = HASH.split(':');
      if (!salt || !expected)
        throw new Error('Synthetic vector is incomplete.');
      const key = await new Promise<Buffer>((resolve, reject) => {
        scrypt(
          PASSWORD.normalize('NFKC'),
          salt,
          64,
          { N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2 },
          (error, value) => {
            if (error) reject(error);
            else resolve(value);
          },
        );
      });
      return Response.json({
        implementation: 'native Node scrypt',
        matches: timingSafeEqual(key, Buffer.from(expected, 'hex')),
      });
    }
    if (path === '/ping') return Response.json({ ok: true });
    return new Response('Not found', { status: 404 });
  }
}

export default {
  async fetch(request: Request, env: ProbeEnv): Promise<Response> {
    const headers = {
      'X-Robots-Tag': 'noindex, nofollow',
      'Cache-Control': 'private, no-store',
    };
    const token = env.PREVIEW_ACCESS_TOKEN;
    if (!token || token.length < 32)
      return new Response('Access is not configured', { status: 503, headers });
    const actual = new TextEncoder().encode(
      request.headers.get('authorization') ?? '',
    );
    const expected = new TextEncoder().encode(
      `Basic ${btoa(`preview:${token}`)}`,
    );
    if (
      actual.byteLength !== expected.byteLength ||
      !timingSafeEqual(actual, expected)
    )
      return new Response('Authentication required', { status: 401, headers });
    if (request.method !== 'GET')
      return new Response('Method not allowed', { status: 405, headers });
    try {
      const result = await env.COMPUTE.getByName('single-synthetic-probe', {
        locationHint: 'apac',
      }).fetch(request);
      return new Response(result.body, {
        status: result.status,
        headers: { ...Object.fromEntries(result.headers), ...headers },
      });
    } catch {
      console.error(JSON.stringify({ event: 'synthetic_probe_failed' }));
      return new Response('Synthetic probe failed', { status: 500, headers });
    }
  },
};
