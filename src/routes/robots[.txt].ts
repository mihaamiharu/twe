import { createFileRoute } from '@tanstack/react-router';
import { getRobotsTxt } from '@/lib/robots';

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: ({ request }) => {
        return new Response(getRobotsTxt(request.headers.get('host')), {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      },
    },
  },
});
