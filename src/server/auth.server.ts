import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { tanstackStartCookies } from 'better-auth/tanstack-start';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { getRuntimeEnv } from '#platform';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from '@/server/email.server';

function createAuth() {
  const env = getRuntimeEnv();
  if (!env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32)
    throw new Error('BETTER_AUTH_SECRET must contain at least 32 characters.');
  if (!env.BETTER_AUTH_URL) throw new Error('BETTER_AUTH_URL is missing.');
  const verificationRequired =
    env.APP_ENV === 'production' || env.REQUIRE_EMAIL_VERIFICATION === 'true';
  return betterAuth({
    rateLimit: { enabled: false }, // handleAuthRequest applies atomic D1 limits.
    logger: { disabled: true },
    // Database configuration with Drizzle adapter
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      transaction: false, // D1 does not support interactive transaction callbacks.
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verification,
      },
    }),

    user: {
      additionalFields: {
        role: {
          type: 'string',
          defaultValue: 'USER',
          input: false,
        },
      },
    },

    // Email/Password authentication with email verification
    // Disable email verification in development/staging for easier testing
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: verificationRequired,
      sendResetPassword: async ({ user, url }) => {
        await sendPasswordResetEmail(user.email, url, user.name || undefined);
      },
    },

    // Email verification configuration
    emailVerification: {
      sendOnSignUp: verificationRequired,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await sendVerificationEmail(user.email, url, user.name || undefined);
      },
    },

    // Google OAuth
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID || '',
        clientSecret: env.GOOGLE_CLIENT_SECRET || '',
        enabled: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
        mapProfileToUser: (profile) => {
          return {
            name: profile.name,
            email: profile.email,
            image: profile.picture,
            emailVerified: profile.email_verified,
          };
        },
      },
    },

    // Session configuration
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
      updateAge: 60 * 60 * 24, // Update session every 24 hours
    },

    // Base URL
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.BETTER_AUTH_URL],

    // Advanced options
    advanced: {
      ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] },
      database: {
        // Preserve the existing UUID identity format.
        generateId: () => crypto.randomUUID(),
      },
    },

    // TanStack Start plugin for proper cookie handling (must be last)
    plugins: [tanstackStartCookies()],
  });
}

export type Auth = ReturnType<typeof createAuth>;
let current:
  | { secret: string; url: string; database: object; auth: Auth }
  | undefined;
function getAuth(): Auth {
  const env = getRuntimeEnv();
  if (
    !current ||
    current.secret !== env.BETTER_AUTH_SECRET ||
    current.url !== env.BETTER_AUTH_URL ||
    current.database !== env.DB
  ) {
    current = {
      secret: env.BETTER_AUTH_SECRET,
      url: env.BETTER_AUTH_URL,
      database: env.DB,
      auth: createAuth(),
    };
  }
  return current.auth;
}

export const auth = new Proxy({} as Auth, {
  get(_target, property) {
    const instance = getAuth();
    const value: unknown = Reflect.get(instance, property);
    if (typeof value === 'function')
      return (...args: unknown[]): unknown => {
        const result: unknown = Reflect.apply(value, instance, args);
        return result;
      };
    return value;
  },
});
