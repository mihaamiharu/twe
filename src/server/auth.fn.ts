/**
 * Server function to get BetterAuth session
 * Used by route beforeLoad to check authentication
 */
import { createServerFn } from '@tanstack/react-start';

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
};

export const getServerSession = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AuthSession> => {
    try {
      // Dynamic imports for server-side
      const { getRequestHeaders } =
        await import('@tanstack/react-start/server');
      const { auth } = await import('./auth.server');

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const headers = getRequestHeaders();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const session = await auth.api.getSession({ headers });

      if (session?.user) {
        return {
          user: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name || null,
            image: session.user.image || null,
            emailVerified: session.user.emailVerified || false,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
            role: (session.user as any).role || 'USER',
          },
          isAuthenticated: true,
        };
      }
    } catch (error) {
      console.error('[Auth] Failed to get session:', error);
    }

    return { user: null, isAuthenticated: false };
  },
);

// Simple in-memory rate limiting (per email, 60 second cooldown)
// Note: This resets on server restart/redeploy
const rateLimitMap = new Map<string, number>();
const COOLDOWN_MS = 60 * 1000;

export const resendVerification = createServerFn({ method: 'POST' })
  .inputValidator((data: { email: string }) => data)
  .handler(async ({ data }) => {
    try {
      const { email } = data;

      if (!email || typeof email !== 'string') {
        return { success: false, error: 'Email is required' };
      }

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

      // Dynamically import server dependencies
      const { db } = await import('@/db');
      const { users } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');
      const { sendVerificationEmail } = await import('@/server/email.server');
      const { logger } = await import('@/lib/logger');

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
      await sendVerificationEmail(
        user.email,
        verificationUrl,
        user.name || undefined,
      );

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
