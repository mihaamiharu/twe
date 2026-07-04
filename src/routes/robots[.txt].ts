import { createFileRoute } from '@tanstack/react-router';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped external data or library API -- untyped external data or library API
export const Route = createFileRoute('/robots.txt' as any)({
    server: {
        handlers: {
            GET: ({ request }) => {
                const host = request.headers.get('host');
                if (host?.startsWith('qa.')) {
                    return new Response(
                        `User-agent: *
Disallow: /`,
                        {
                            headers: {
                                'Content-Type': 'text/plain',
                            },
                        }
                    );
                }

                return new Response(
                    `User-agent: *
Allow: /
Allow: /api/og
Disallow: /admin/
Disallow: /api/

Sitemap: https://testingwithekki.com/sitemap.xml`,
                    {
                        headers: {
                            'Content-Type': 'text/plain',
                        },
                    }
                );
            },
        },
    },
});
