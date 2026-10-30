import { createMiddleware } from '@tanstack/react-start';

// Server errors use Workers Logs; client Sentry is configured separately.
export function createServerErrorEvent() {
  return { event: 'server_function_failed', requestId: crypto.randomUUID() };
}

export const sentryMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    console.error(JSON.stringify(createServerErrorEvent()));
    throw error;
  }
});
