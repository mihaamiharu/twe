import { createMiddleware } from '@tanstack/react-start';
import { logger } from '@/lib/logger';

/**
 * Logging Middleware
 * Logs the duration and outcome of server functions.
 */
export const loggingMiddleware = createMiddleware({ type: 'function' }).server(
    async ({ next }) => {
        const startTime = performance.now();

        try {
            const result = await next();
            const duration = performance.now() - startTime;
            logger.info(`[ServerFn] completed in ${duration.toFixed(2)}ms`);
            return result;
        } catch (error) {
            const duration = performance.now() - startTime;
            logger.error(`[ServerFn] failed after ${duration.toFixed(2)}ms`, error);
            throw error;
        }
    },
);
