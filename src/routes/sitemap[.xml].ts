import { createFileRoute } from '@tanstack/react-router';
import { db } from '@/db';
import { challenges, tutorials } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { BASE_URL } from '@/lib/seo';
import {
  SITEMAP_LOCALES,
  buildFallbackSitemapXml,
  buildSitemapXml,
  buildUrlEntry,
} from '@/lib/sitemap';

// Static pages that should appear in the sitemap

const STATIC_PAGES = [
  { path: '', changefreq: 'daily', priority: '1.0' },
  { path: '/about', changefreq: 'monthly', priority: '0.6' },
  { path: '/practice', changefreq: 'weekly', priority: '0.9' },
  { path: '/learn', changefreq: 'weekly', priority: '0.9' },
  { path: '/labs', changefreq: 'monthly', priority: '0.5' },
  { path: '/leaderboard', changefreq: 'daily', priority: '0.7' },
  { path: '/contact', changefreq: 'monthly', priority: '0.5' },
  { path: '/changelog', changefreq: 'weekly', priority: '0.5' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
];

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        try {
          // Fetch published challenges and tutorials from DB
          const [publishedChallenges, publishedTutorials] = await Promise.all([
            db
              .select({
                slug: challenges.slug,
                updatedAt: challenges.updatedAt,
              })
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
            for (const locale of SITEMAP_LOCALES) {
              const loc = `${BASE_URL}/${locale}${page.path}`;
              const alternates: { locale: string; href: string }[] =
                SITEMAP_LOCALES.map((l) => ({
                  locale: l,
                  href: `${BASE_URL}/${l}${page.path}`,
                }));
              alternates.push({
                locale: 'x-default',
                href: `${BASE_URL}/en${page.path}`,
              });

              urlEntries.push(
                buildUrlEntry(
                  loc,
                  page.changefreq,
                  page.priority,
                  undefined,
                  alternates,
                ),
              );
            }
          }

          // Challenge detail pages
          for (const challenge of publishedChallenges) {
            for (const locale of SITEMAP_LOCALES) {
              const loc = `${BASE_URL}/${locale}/practice/${challenge.slug}`;
              const lastmod = challenge.updatedAt
                ? new Date(challenge.updatedAt).toISOString().split('T')[0]
                : undefined;
              const alternates: { locale: string; href: string }[] =
                SITEMAP_LOCALES.map((l) => ({
                  locale: l,
                  href: `${BASE_URL}/${l}/practice/${challenge.slug}`,
                }));
              alternates.push({
                locale: 'x-default',
                href: `${BASE_URL}/en/practice/${challenge.slug}`,
              });

              urlEntries.push(
                buildUrlEntry(loc, 'monthly', '0.8', lastmod, alternates),
              );
            }
          }

          // Tutorial detail pages
          for (const tutorial of publishedTutorials) {
            for (const locale of SITEMAP_LOCALES) {
              const loc = `${BASE_URL}/${locale}/learn/${tutorial.slug}`;
              const lastmod = tutorial.updatedAt
                ? new Date(tutorial.updatedAt).toISOString().split('T')[0]
                : undefined;
              const alternates: { locale: string; href: string }[] =
                SITEMAP_LOCALES.map((l) => ({
                  locale: l,
                  href: `${BASE_URL}/${l}/learn/${tutorial.slug}`,
                }));
              alternates.push({
                locale: 'x-default',
                href: `${BASE_URL}/en/learn/${tutorial.slug}`,
              });

              urlEntries.push(
                buildUrlEntry(loc, 'monthly', '0.7', lastmod, alternates),
              );
            }
          }

          const xml = buildSitemapXml(urlEntries);

          return new Response(xml, {
            headers: {
              'Content-Type': 'application/xml; charset=utf-8',
              'Cache-Control': 'public, max-age=3600, s-maxage=3600',
            },
          });
        } catch (error) {
          console.error('[Sitemap] Error generating sitemap:', error);

          // Keep fallback URLs aligned with localized canonical routes.
          const xml = buildFallbackSitemapXml();

          return new Response(xml, {
            headers: {
              'Content-Type': 'application/xml; charset=utf-8',
            },
          });
        }
      },
    },
  },
});
