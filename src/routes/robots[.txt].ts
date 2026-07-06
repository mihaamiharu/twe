import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/robots.txt')({
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
