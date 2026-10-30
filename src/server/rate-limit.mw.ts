import { createMiddleware } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { getContainedAuthUser } from './auth-user';
import { clientIdentifier, consumeRateLimit } from './rate-limit';

export function createRateLimitMiddleware(options: {
  key: string;
  limit: number;
  windowMinutes: number;
}) {
  return createMiddleware().server(async ({ next, context }) => {
    const identity = await clientIdentifier(
      getRequest().headers,
      getContainedAuthUser(context)?.id,
    );
    const result = await consumeRateLimit(
      `${options.key}:${identity}`,
      options.limit,
      options.windowMinutes * 60_000,
    );
    if (!result.allowed) {
      const minutes = Math.max(
        1,
        Math.ceil((result.resetAt - Date.now()) / 60_000),
      );
      throw new Error(
        `Rate limit exceeded. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
      );
    }
    return next();
  });
}
