// @ts-ignore
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
        const url = new URL(req.url);
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
            return await server.fetch(req);
        } catch (error) {
            Sentry.captureException(error);
            console.error('SSR Error:', error);
            return new Response('Internal Server Error', { status: 500 });
        }
    },
});
