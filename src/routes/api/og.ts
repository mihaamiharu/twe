import { createFileRoute } from '@tanstack/react-router';
import { getStaticOgPath } from '@/lib/og-image';

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
        } catch {
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
