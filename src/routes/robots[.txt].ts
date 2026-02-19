import { createFileRoute } from '@tanstack/react-router';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Route = createFileRoute('/robots.txt' as any)({
    server: {
        handlers: {
            GET: () => {
                return new Response(
                    `User-agent: *
Allow: /

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
