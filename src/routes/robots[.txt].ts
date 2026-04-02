import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/robots[.txt]')({
    server: {
        handlers: {
            GET: () => {
                return new Response(
                    `User-agent: *
Allow: /
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
