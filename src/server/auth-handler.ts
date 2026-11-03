import { getRuntimeEnv } from '#platform';
import { auth } from './auth.server';
import { clientIdentifier, consumeRateLimit } from './rate-limit';

export async function handleAuthRequest(request: Request): Promise<Response> {
  const env = getRuntimeEnv();
  if (env.APP_ENV === 'preview' || env.APP_ENV === 'production') {
    const path = new URL(request.url).pathname
      .replace('/api/auth', '')
      .replace(/\/+$/, '');
    const sensitive = [
      '/sign-in',
      '/sign-up',
      '/change-password',
      '/change-email',
    ].some((prefix) => path.startsWith(prefix));
    const identity = await clientIdentifier(request.headers);
    // Match Better Auth's default 10-second sliding inactivity window and
    // endpoint limits, using one atomic D1 statement instead of isolate memory.
    const limit = await consumeRateLimit(
      `auth:${path}:${identity}`,
      sensitive ? 3 : 100,
      10_000,
      true,
    );
    if (!limit.allowed)
      return Response.json(
        { message: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(
              Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000)),
            ),
          },
        },
      );
  }
  return auth.handler(request);
}
