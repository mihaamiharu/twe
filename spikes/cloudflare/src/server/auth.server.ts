import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { tanstackStartCookies } from 'better-auth/tanstack-start';
import type { PreviewContext } from './context.server';
import * as schema from '../db/schema';

// Public fixture password, exclusively for generated @example.invalid accounts.
export const SYNTHETIC_PASSWORD = 'TWE-synthetic-preview-only-2026';

export function getPreviewAuth(context: PreviewContext) {
  return betterAuth({
    database: drizzleAdapter(context.db, {
      provider: 'sqlite',
      schema,
      transaction: false,
    }),
    baseURL: context.config.BETTER_AUTH_URL,
    secret: context.config.BETTER_AUTH_SECRET,
    trustedOrigins: [context.config.BETTER_AUTH_URL],
    emailAndPassword: { enabled: true, requireEmailVerification: false },
    rateLimit: { enabled: false },
    session: { expiresIn: 60 * 60, updateAge: 60 * 5 },
    advanced: {
      cookiePrefix: 'twe-migration-spike',
      database: { generateId: () => crypto.randomUUID() },
    },
    plugins: [tanstackStartCookies()],
  });
}
