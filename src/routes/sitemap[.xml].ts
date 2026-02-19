import { createFileRoute } from '@tanstack/react-router';
import { db } from '@/db';
import { challenges, tutorials } from '@/db/schema';
import { eq } from 'drizzle-orm';

const BASE_URL = 'https://testingwithekki.com';

// Static pages that should appear in the sitemap
const STATIC_PAGES = [
  { path: '', changefreq: 'daily', priority: '1.0' },
  { path: '/about', changefreq: 'monthly', priority: '0.6' },
  { path: '/challenges', changefreq: 'weekly', priority: '0.9' },
  { path: '/tutorials', changefreq: 'weekly', priority: '0.9' },
  { path: '/leaderboard', changefreq: 'daily', priority: '0.7' },
  { path: '/contact', changefreq: 'monthly', priority: '0.5' },
  { path: '/changelog', changefreq: 'weekly', priority: '0.5' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
];

const LOCALES = ['en', 'id'];

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function buildUrlEntry(
  loc: string,
  changefreq: string,
  priority: string,
  lastmod?: string,
  alternates?: { locale: string; href: string }[],
): string {
  let entry = '  <url>\n';
  entry += `    <loc>${escapeXml(loc)}</loc>\n`;
  if (lastmod) {
    entry += `    <lastmod>${escapeXml(lastmod)}</lastmod>\n`;
  }
  entry += `    <changefreq>${escapeXml(changefreq)}</changefreq>\n`;
  entry += `    <priority>${escapeXml(priority)}</priority>\n`;

  // Add xhtml:link alternates for each locale
  if (alternates) {
    for (const alt of alternates) {
      entry += `    <xhtml:link rel="alternate" hreflang="${escapeXml(alt.locale)}" href="${escapeXml(alt.href)}" />\n`;
    }
  }

  entry += '  </url>';
  return entry;
}

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        try {
          // Fetch published challenges and tutorials from DB
          const [publishedChallenges, publishedTutorials] = await Promise.all([
            db
              .select({ slug: challenges.slug, updatedAt: challenges.updatedAt })
              .from(challenges)
              .where(eq(challenges.isPublished, true)),
            db
              .select({ slug: tutorials.slug, updatedAt: tutorials.updatedAt })
              .from(tutorials)
              .where(eq(tutorials.isPublished, true)),
          ]);

          const urlEntries: string[] = [];

          // Static pages — generate for each locale with alternates
          for (const page of STATIC_PAGES) {
            for (const locale of LOCALES) {
              const loc = `${BASE_URL}/${locale}${page.path}`;
              const alternates = LOCALES.map((l) => ({
                locale: l,
                href: `${BASE_URL}/${l}${page.path}`,
              }));
              alternates.push({
                locale: 'x-default',
                href: `${BASE_URL}/en${page.path}`,
              });

              urlEntries.push(
                buildUrlEntry(loc, page.changefreq, page.priority, undefined, alternates),
              );
            }
          }

          // Challenge detail pages
          for (const challenge of publishedChallenges) {
            for (const locale of LOCALES) {
              const loc = `${BASE_URL}/${locale}/challenges/${challenge.slug}`;
              const lastmod = challenge.updatedAt
                ? new Date(challenge.updatedAt).toISOString().split('T')[0]
                : undefined;
              const alternates = LOCALES.map((l) => ({
                locale: l,
                href: `${BASE_URL}/${l}/challenges/${challenge.slug}`,
              }));
              alternates.push({
                locale: 'x-default',
                href: `${BASE_URL}/en/challenges/${challenge.slug}`,
              });

              urlEntries.push(
                buildUrlEntry(loc, 'monthly', '0.8', lastmod, alternates),
              );
            }
          }

          // Tutorial detail pages
          for (const tutorial of publishedTutorials) {
            for (const locale of LOCALES) {
              const loc = `${BASE_URL}/${locale}/tutorials/${tutorial.slug}`;
              const lastmod = tutorial.updatedAt
                ? new Date(tutorial.updatedAt).toISOString().split('T')[0]
                : undefined;
              const alternates = LOCALES.map((l) => ({
                locale: l,
                href: `${BASE_URL}/${l}/tutorials/${tutorial.slug}`,
              }));
              alternates.push({
                locale: 'x-default',
                href: `${BASE_URL}/en/tutorials/${tutorial.slug}`,
              });

              urlEntries.push(
                buildUrlEntry(loc, 'monthly', '0.7', lastmod, alternates),
              );
            }
          }

          const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries.join('\n')}
</urlset>`;

          return new Response(xml, {
            headers: {
              'Content-Type': 'application/xml',
              'Cache-Control': 'public, max-age=3600, s-maxage=3600',
            },
          });
        } catch (error) {
          console.error('[Sitemap] Error generating sitemap:', error);

          // Fallback to minimal sitemap on error
          const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

          return new Response(xml, {
            headers: {
              'Content-Type': 'application/xml',
            },
          });
        }
      },
    },
  },
});
