/**
 * Server function to get BetterAuth session
 * Used by route beforeLoad to check authentication
 */
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getRequest } from '@tanstack/react-start/server';
import { auth } from './auth.server';
import { db } from '@/db';
import { users, accounts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getRuntimeEnv } from '#platform';
import { consumeRateLimit, hashIdentifier } from './rate-limit';
import { buildAuthSession, type AuthSession } from './auth-session';

export type { AuthSession, SessionUser } from './auth-session';

// Helper to update user image from Google if missing (Lazy Migration)
async function ensureUserImage(userId: string): Promise<string | null> {
  try {
    // Check for Google account
    const account = await db.query.accounts.findFirst({
      where: and(
        eq(accounts.userId, userId),
        eq(accounts.providerId, 'google'),
      ),
    });

    if (account?.idToken) {
      // Decode ID Token to get picture
      try {
        const encodedPayload = account.idToken.split('.')[1];
        if (!encodedPayload) return null;
        const payload: unknown = JSON.parse(
          new TextDecoder().decode(
            Uint8Array.from(
              atob(encodedPayload.replaceAll('-', '+').replaceAll('_', '/')),
              (character) => character.charCodeAt(0),
            ),
          ),
        );
        if (
          typeof payload === 'object' &&
          payload !== null &&
          'picture' in payload &&
          typeof payload.picture === 'string'
        ) {
          await db
            .update(users)
            .set({ image: payload.picture })
            .where(eq(users.id, userId));
          return payload.picture;
        }
      } catch {
        // Ignore decoding errors
      }
    }
  } catch {
    console.error('[Auth] Failed to lazy update user image:');
  }
  return null;
}

export const getServerSession = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AuthSession> => {
    try {
      const headers = getRequest().headers;
      const session = await auth.api.getSession({ headers });

      if (session?.user) {
        let image = session.user.image;
        if (!image) {
          const newImage = await ensureUserImage(session.user.id);
          if (newImage) image = newImage;
        }

        return buildAuthSession(
          {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name || null,
            image: image || null,
            emailVerified: session.user.emailVerified || false,
            role: session.user.role || 'USER',
          },
          getRuntimeEnv().VITE_GA_MEASUREMENT_ID,
        );
      }
    } catch {
      console.error('[Auth] Failed to get session:');
    }

    return buildAuthSession(null, getRuntimeEnv().VITE_GA_MEASUREMENT_ID);
  },
);

// Zod schema for email validation
const ResendVerificationSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const resendVerification = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => ResendVerificationSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const { email } = data;

      const normalizedEmail = email.toLowerCase().trim();

      const rate = await consumeRateLimit(
        `verification-email:${await hashIdentifier(normalizedEmail)}`,
        1,
        60_000,
      );
      if (!rate.allowed) {
        const remainingSeconds = Math.max(
          1,
          Math.ceil((rate.resetAt - Date.now()) / 1000),
        );
        return {
          success: false,
          error: `Please wait ${remainingSeconds} seconds before requesting another email`,
          cooldownRemaining: remainingSeconds,
        };
      }

      // Find user by email
      const user = await db.query.users.findFirst({
        where: eq(users.email, normalizedEmail),
      });

      if (!user) {
        // Don't reveal if email exists - return success anyway
        return {
          success: true,
          message:
            'If an account with that email exists, a verification email has been sent.',
        };
      }

      // Check if already verified
      if (user.emailVerified) {
        return {
          success: true,
          message: 'Your email is already verified. You can sign in.',
          alreadyVerified: true,
        };
      }

      // Better Auth signs the token; arbitrary UUIDs are not verification tokens.
      await auth.api.sendVerificationEmail({
        body: { email: normalizedEmail, callbackURL: '/en/login' },
        headers: getRequest().headers,
      });

      return {
        success: true,
        message: 'Verification email sent! Please check your inbox.',
      };
    } catch {
      console.error('Error resending verification email:');
      return { success: false, error: 'Failed to resend verification email' };
    }
  });
