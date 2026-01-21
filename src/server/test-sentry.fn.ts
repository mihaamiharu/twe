import { createServerFn } from '@tanstack/react-start';
import { sentryMiddleware } from './sentry.mw';

export const testServerError = createServerFn({ method: 'POST' })
    .middleware([sentryMiddleware])
    .handler(async () => {
        console.log('Throwing test server error...');
        throw new Error('Test Server Error from Bun!');
    });
