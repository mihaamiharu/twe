/**
 * Server function to get BetterAuth session
 * Used by route beforeLoad to check authentication
 */
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getRequestHeaders } from '@tanstack/react-start/server';
import { auth } from './auth.server';
import { db } from '@/db';
import { users, accounts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendVerificationEmail } from '@/server/email.server';
import { logger } from '@/lib/logger';

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: boolean;
  role: string | null;
};

export type AuthSession = {
  user: SessionUser | null;
  isAuthenticated: boolean;
  gaMeasurementId?: string;
};

// Helper to update user image from Google if missing (Lazy Migration)
async function ensureUserImage(userId: string): Promise<string | null> {
  try {
    // Check for Google account
    const account = await db.query.accounts.findFirst({
      where: and(eq(accounts.userId, userId), eq(accounts.providerId, 'google')),
    });

    if (account?.idToken) {
      // Decode ID Token to get picture
      try {
        const payload = JSON.parse(
          Buffer.from(account.idToken.split('.')[1], 'base64').toString(),
        ) as { picture?: string };

        if (payload.picture) {
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
    } catch (error) {
    console.error('[Auth] Failed to lazy update user image:', error);
    }
    return null;
    }

    export const getServerSession = createServerFn({ method: 'GET' }).handler(
    async (): Promise<AuthSession> => {
    try {
      const headers = getRequestHeaders();
      const session = await auth.api.getSession({ headers });

      if (session?.user) {        let image = session.user.image;
        if (!image) {
          const newImage = await ensureUserImage(session.user.id);
          if (newImage) image = newImage;
        }

        return {
          user: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name || null,
            image: image || null,
            emailVerified: session.user.emailVerified || false,
            // Cast to include role from additionalFields
            role: (session.user as { role?: string }).role || 'USER',
          },
          isAuthenticated: true,
          gaMeasurementId: process.env.VITE_GA_MEASUREMENT_ID,
        };
      }
    } catch (error) {
      console.error('[Auth] Failed to get session:', error);
    }

    return {
      user: null,
      isAuthenticated: false,
      gaMeasurementId: process.env.VITE_GA_MEASUREMENT_ID,
    };
  },
);

// Simple in-memory rate limiting (per email, 60 second cooldown)
// Note: This resets on server restart/redeploy
const rateLimitMap = new Map<string, number>();
const COOLDOWN_MS = 60 * 1000;

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

      // Rate limiting check
      const lastSent = rateLimitMap.get(normalizedEmail);
      const now = Date.now();

      if (lastSent && now - lastSent < COOLDOWN_MS) {
        const remainingSeconds = Math.ceil(
          (COOLDOWN_MS - (now - lastSent)) / 1000,
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

      // Generate verification URL
      const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
      const token = crypto.randomUUID();
      const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}&callbackURL=/login`;

      // Send the verification email
      // Fire and forget email sending
      sendVerificationEmail(
        user.email,
        verificationUrl,
        user.name || undefined,
      ).catch((error) => {
        console.error(
          '[Auth] Background resend verification email failed:',
          error,
        );
      });

      // Update rate limit
      rateLimitMap.set(normalizedEmail, now);
      logger.info(`[Auth] Resent verification email to ${normalizedEmail}`);

      return {
        success: true,
        message: 'Verification email sent! Please check your inbox.',
      };
    } catch (error) {
      console.error('Error resending verification email:', error);
      return { success: false, error: 'Failed to resend verification email' };
    }
  });
