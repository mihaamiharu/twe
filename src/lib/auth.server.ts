import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db';
import * as schema from '@/db/schema';
import * as dotenv from 'dotenv';

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
        },
    }),

    // Email/Password authentication
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false, // Can enable later
    },

    // Social OAuth providers
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            enabled: !!(
                process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
            ),
        },
    },

    // Session configuration
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
        updateAge: 60 * 60 * 24, // Update session every 24 hours
    },

    // Base URL
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
});

// Export types for client
export type Auth = typeof auth;
