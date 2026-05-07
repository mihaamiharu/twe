// @ts-expect-error - dist import is untyped
import server from '../dist/server/server.js';

const PORT = process.env.PORT || 3000;

import * as Sentry from "@sentry/bun";
import { getSentryConfig } from "../src/lib/sentry.config";

Sentry.init(getSentryConfig());

const env = process.env.NODE_ENV || 'development';
console.log(`🚀 ${env.charAt(0).toUpperCase() + env.slice(1)} server starting on port ${PORT}...`);

Bun.serve({
    port: PORT,
    async fetch(req) {
        const url = new URL(req.url, `http://localhost:${PORT}`);
        const path = url.pathname;

        // Security: basic directory traversal protection
        if (path.includes('..')) {
            return new Response('Not Found', { status: 404 });
        }

        // Static assets from dist/client
        // We only serve files if they aren't the root path (SSR handles /)
        // and if they actually exist in the client dist folder.
        if (path !== '/') {
            const filePath = `./dist/client${path}`;
            const file = Bun.file(filePath);
            if (await file.exists()) {
                const response = new Response(file);

                // Cache Control
                if (path.startsWith('/assets/')) {
                    // Immutable assets (hashed by Vite) - 1 year
                    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
                } else {
                    // Other static files (favicon, robots.txt, etc) - 1 hour
                    response.headers.set('Cache-Control', 'public, max-age=3600');
                }

                return response;
            }
        }

        // SSR fallback to TanStack Start handler
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            const response = (await (server as any).fetch(req)) as Response;
            const host = req.headers.get('host');

            if (host?.startsWith('qa.')) {
                // For QA subdomain, ensure no indexing by creating a new response with the header
                const headers = new Headers(response.headers);
                headers.set('X-Robots-Tag', 'noindex, nofollow');
                return new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers,
                });
            }

            return response;
        } catch (error) {
            Sentry.captureException(error);
            console.error('SSR Error:', error);
            return new Response('Internal Server Error', { status: 500 });
        }
    },
});
