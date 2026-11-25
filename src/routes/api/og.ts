import { createFileRoute } from '@tanstack/react-router';
import { buildCompletionCardFilename } from '@/lib/completion-card';
import { getStaticOgPath } from '@/lib/og-image';
import { OgRenderError } from '@/server/og-errors.server';

function errorResponse(error: OgRenderError): Response {
  return new Response(error.message, {
    status: error.status,
    headers: {
      'Cache-Control': 'private, no-store',
      ...(error.status === 503 ? { 'Retry-After': '1' } : {}),
    },
  });
}

export const Route = createFileRoute('/api/og')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const query = new URL(request.url).searchParams;
        const rawType = query.get('type');

        if (rawType?.trim().toLowerCase() === 'completion') {
          try {
            const [{ resolveCompletionCardFromCatalog }, { renderCompletionOg }] =
              await Promise.all([
                import('@/server/completion-card.server'),
                import('@/server/og-renderer.server'),
              ]);
            const cardProps = await resolveCompletionCardFromCatalog({
              kind: query.get('kind'),
              slug: query.get('slug'),
              locale: query.get('locale'),
              learner: query.get('learner'),
              sig: query.get('sig'),
            });
            const image = await renderCompletionOg(cardProps);
            const filename = buildCompletionCardFilename(
              cardProps.kind,
              cardProps.slug,
            );
            const disposition =
              query.get('download') === '1' ? 'attachment' : 'inline';
            return new Response(image.slice(0), {
              headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'public, max-age=3600',
                'Content-Disposition': `${disposition}; filename="${filename}"`,
              },
            });
          } catch (error) {
            if (error instanceof OgRenderError) return errorResponse(error);
            console.error('[OG] Completion card rendering failed.');
            return new Response('Unable to render completion card.', {
              status: 500,
              headers: { 'Cache-Control': 'private, no-store' },
            });
          }
        }

        const input = {
          title: query.get('title'),
          type: rawType,
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
          if (error instanceof OgRenderError) return errorResponse(error);
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
