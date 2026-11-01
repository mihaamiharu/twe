import { createFileRoute } from '@tanstack/react-router';
import { getStaticOgPath } from '@/lib/og-image';
import { OgRenderError } from '@/server/og-errors.server';

export const Route = createFileRoute('/api/og')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const query = new URL(request.url).searchParams;
        const input = {
          title: query.get('title'),
          type: query.get('type'),
          difficulty: query.get('difficulty'),
          xp: query.get('xp'),
        };
        const staticPath = getStaticOgPath(input);
        if (staticPath) {
          // Old query URLs remain usable; current SEO links go straight to assets.
          return new Response(null, {
            status: 302,
            headers: { Location: staticPath, 'Cache-Control': 'no-cache' },
          });
        }
        try {
          const { renderDynamicOg } =
            await import('@/server/og-renderer.server');
          const image = await renderDynamicOg(input);
          return new Response(image.slice(0), {
            headers: {
              'Content-Type': 'image/png',
              'Cache-Control': 'public, max-age=3600',
            },
          });
        } catch (error) {
          if (error instanceof OgRenderError)
            return new Response(error.message, {
              status: error.status,
              headers: {
                'Cache-Control': 'private, no-store',
                ...(error.status === 503 ? { 'Retry-After': '1' } : {}),
              },
            });
          console.error('[OG] Image rendering failed.');
          return new Response(null, {
            status: 302,
            headers: {
              Location: '/twe-banner.png',
              'Cache-Control': 'no-cache',
            },
          });
        }
      },
    },
  },
});
