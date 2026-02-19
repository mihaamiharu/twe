import { createServerFn } from '@tanstack/react-start';
import { db } from '@/db';
import { challenges } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getTutorialList } from '@/server/content.server';

const BASE_URL = 'https://testingwithekki.com';

export const getSitemapXml = createServerFn({ method: 'GET' })
  .handler(async () => {
    // Get all published challenges directly from DB
    const challengesData = await db
      .select({
        slug: challenges.slug,
        updatedAt: challenges.updatedAt,
      })
      .from(challenges)
      .where(eq(challenges.isPublished, true));

    // Get all tutorials from file system (localized)
    const [tutorialsEn, tutorialsId] = await Promise.all([
      getTutorialList('en'),
      getTutorialList('id')
    ]);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static Routes -->
  ${['en', 'id'].map(locale => `
  <url>
    <loc>${BASE_URL}/${locale}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/${locale}/tutorials</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${BASE_URL}/${locale}/challenges</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${BASE_URL}/${locale}/login</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${BASE_URL}/${locale}/leaderboard</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}

  <!-- Tutorials (EN) -->
  ${tutorialsEn.map(tutorial => `
  <url>
    <loc>${BASE_URL}/en/tutorials/${tutorial.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}

  <!-- Tutorials (ID) -->
  ${tutorialsId.map(tutorial => `
  <url>
    <loc>${BASE_URL}/id/tutorials/${tutorial.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}

  <!-- Challenges -->
  ${challengesData
        .flatMap((challenge) => ['en', 'id'].map(locale => `
  <url>
    <loc>${BASE_URL}/${locale}/challenges/${challenge.slug}</loc>
    <lastmod>${challenge.updatedAt ? new Date(challenge.updatedAt).toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`))
        .join('')}
</urlset>`;

    return xml;
  });
