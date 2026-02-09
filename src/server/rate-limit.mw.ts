/**
 * Rate Limit Middleware Factory
 *
 * Provides a reusable, in-memory rate limiting middleware for server functions.
 * Uses a simple Map to store request counts with automatic cleanup.
 *
 * Usage:
 * export const myFn = createServerFn({ method: "POST" })
 *   .middleware([createRateLimitMiddleware({ key: "my-fn", limit: 10, windowMinutes: 60 })])
 *   .handler(...)
 */

import { createMiddleware } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';


interface RateLimitEntry {
    count: number;
    resetAt: number;
}

// Global store for rate limits (persists across requests in the same process)
// Key format: `${endpointKey}:${identifier}`
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup interval (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;

let cleanupTimer: NodeJS.Timeout | null = null;

function cleanupStore() {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetAt) {
            rateLimitStore.delete(key);
        }
    }
}

// Ensure cleanup runs
if (!cleanupTimer) {
    cleanupTimer = setInterval(cleanupStore, CLEANUP_INTERVAL);
}

/**
 * Get client identifier (IP or User ID)
 * Prioritizes:
 * 1. User ID (if authenticated)
 * 2. X-Forwarded-For (if behind proxy/load balancer)
 * 3. Socket remote address
 */
function getClientIdentifier(
    headers: Headers,
    userId?: string | null
): string {
    if (userId) return `user:${userId}`;

    // Check standard proxy headers
    const forwardedFor = headers.get('x-forwarded-for');
    if (forwardedFor) {
        // Get the first IP in the list (client IP)
        return forwardedFor.split(',')[0].trim();
    }

    const realIp = headers.get('x-real-ip');
    if (realIp) return realIp;

    // Fallback for local dev or direct connection
    return 'unknown-ip';
}

/**
 * Create a rate limiting middleware
 */
export function createRateLimitMiddleware(options: {
    key: string; // Unique identifier for this rate limit bucket (e.g., 'bug-report')
    limit: number; // Max requests within window
    windowMinutes: number; // Time window in minutes
}) {
    return createMiddleware().server(async ({ next, context }) => {
        const headers = getRequestHeaders();

        // We try to get userId from context (if authMiddleware ran before this)
        // @ts-expect-error - context is unknown here, but we check safely
        const userId = context?.user?.id as string | undefined;

        const identifier = getClientIdentifier(headers, userId);
        const storeKey = `${options.key}:${identifier}`;
        const now = Date.now();
        const windowMs = options.windowMinutes * 60 * 1000;

        let entry = rateLimitStore.get(storeKey);

        // If entry doesn't exist or expired, create new
        if (!entry || now > entry.resetAt) {
            entry = {
                count: 0,
                resetAt: now + windowMs,
            };
            rateLimitStore.set(storeKey, entry);
        }

        // Check limit
        if (entry.count >= options.limit) {
            const resetInMinutes = Math.ceil((entry.resetAt - now) / 60000);
            throw new Error(
                `Rate limit exceeded. Please try again in ${resetInMinutes} minute${resetInMinutes !== 1 ? 's' : ''}.`
            );
        }

        // Increment count
        entry.count++;

        // Proceed
        return next();
    });
}
