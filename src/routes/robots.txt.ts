import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/robots.txt')({
    loader: () => {
        return new Response(
            `User-agent: *
Allow: /

Sitemap: https://testingwithekki.com/sitemap.xml`,
            {
                headers: {
                    'Content-Type': 'text/plain',
                },
            },
        );
    },
});
