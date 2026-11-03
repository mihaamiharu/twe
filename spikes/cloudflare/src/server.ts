import { timingSafeEqual } from 'node:crypto';
import { env } from 'cloudflare:workers';
import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server';

const handleStart = createStartHandler(defaultStreamHandler);

function protectResponse(response: Response) {
  const headers = new Headers(response.headers);
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  headers.set('Cache-Control', 'private, no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'no-referrer');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request) {
    // Every application request is gated, including SSR and server functions.
    // A missing secret fails closed; this spike accepts synthetic data only.
    const token = env.SPIKE_ACCESS_TOKEN;
    if (!token || token.length < 32) {
      return protectResponse(new Response('Preview access is not configured.', { status: 503 }));
    }
    const encoder = new TextEncoder();
    const expected = encoder.encode(`Basic ${btoa(`preview:${token}`)}`);
    const supplied = encoder.encode(request.headers.get('authorization') ?? '');
    if (
      supplied.byteLength !== expected.byteLength ||
      !timingSafeEqual(supplied, expected)
    ) {
      return protectResponse(new Response('Preview authentication required.', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="TWE migration preview", charset="UTF-8"' },
      }));
    }
    return protectResponse(await handleStart(request));
  },
};
