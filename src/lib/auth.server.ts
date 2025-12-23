import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db';
import * as schema from '@/db/schema';
import * as dotenv from 'dotenv';
import { sendVerificationEmail, sendPasswordResetEmail } from '@/lib/email.server';

dotenv.config();

// Validate required environment variables
if (!process.env.BETTER_AUTH_SECRET) {
    throw new Error(
        'BETTER_AUTH_SECRET is not set. Please add it to your .env file.',
    );
}

if (!process.env.BETTER_AUTH_URL) {
    throw new Error(
        'BETTER_AUTH_URL is not set. Please add it to your .env file.',
    );
}

export const auth = betterAuth({
    // Database configuration with Drizzle adapter
    database: drizzleAdapter(db, {
        provider: 'pg', // PostgreSQL
        schema: {
            user: schema.users,
            session: schema.sessions,
            account: schema.accounts,
            verification: schema.verification,
        },
    }),

    // Email/Password authentication with email verification
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        sendResetPassword: async ({ user, url }) => {
            await sendPasswordResetEmail(user.email, url, user.name || undefined);
        },
    },

    // Email verification configuration
    emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url }) => {
            await sendVerificationEmail(user.email, url, user.name || undefined);
        },
    },

    // Google OAuth removed - using email verification only
    // To re-enable, uncomment and set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
    // socialProviders: {
    //     google: {
    //         clientId: process.env.GOOGLE_CLIENT_ID || '',
    //         clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    //         enabled: !!(
    //             process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    //         ),
    //     },
    // },

    // Session configuration
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
        updateAge: 60 * 60 * 24, // Update session every 24 hours
    },

    // Base URL
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,

    // Advanced options
    advanced: {
        database: {
            // Generate UUIDs for IDs (our schema uses uuid type)
            generateId: () => crypto.randomUUID(),
        },
    },
});

// Export types for client
export type Auth = typeof auth;

