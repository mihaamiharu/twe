import { getRuntimeEnv } from '#platform';

export function requireTestEnv(request: Request) {
  // 1. Must be running in test environment
  if (getRuntimeEnv().APP_ENV !== 'test') {
    return new Response(
      JSON.stringify({ error: 'Test API only available in test environments' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  // 2. Must provide the correct secret header
  const secretHeader = request.headers.get('x-e2e-secret');
  const expectedSecret = getRuntimeEnv().E2E_SECRET;

  if (!expectedSecret || secretHeader !== expectedSecret) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized: Invalid or missing x-e2e-secret',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  return null; // OK
}
