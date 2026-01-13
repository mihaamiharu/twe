import { createFileRoute } from '@tanstack/react-router';
import { getChallenges } from '@/server/challenges.fn';
import { getTutorials } from '@/server/tutorials.fn';

const BASE_URL = 'https://testingwithekki.com';

export const Route = createFileRoute('/sitemap.xml')({
    loader: async () => {
        const [challengesRes, tutorialsRes] = await Promise.all([
            getChallenges({ data: { limit: 1000 } }),
            getTutorials({ data: { limit: 1000 } }),
        ]);

        const challenges = challengesRes.success ? challengesRes.data : [];
        const tutorials = tutorialsRes.success ? tutorialsRes.data : [];

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static Routes -->
  <url>
    <loc>${BASE_URL}/en</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/en/tutorials</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${BASE_URL}/en/challenges</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${BASE_URL}/en/login</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${BASE_URL}/en/leaderboard</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>

  <!-- Tutorials -->
  ${tutorials
                .map(
                    (tutorial) => `
  <url>
    <loc>${BASE_URL}/en/tutorials/${tutorial.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`,
                )
                .join('')}

  <!-- Challenges -->
  ${challenges
                .map(
                    (challenge) => `
  <url>
    <loc>${BASE_URL}/en/challenges/${challenge.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`,
                )
                .join('')}
</urlset>`;

        return new Response(xml, {
            headers: {
                'Content-Type': 'application/xml',
            },
        });
    },
});
