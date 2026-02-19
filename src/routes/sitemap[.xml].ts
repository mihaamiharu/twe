import { createFileRoute } from '@tanstack/react-router';
import { getSitemapXml } from '@/server/sitemap.fn';

export const Route = createFileRoute('/sitemap.xml')({
  loader: async () => {
    const xml = await getSitemapXml();

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  },
});
