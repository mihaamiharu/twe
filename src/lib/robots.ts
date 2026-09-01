const SITEMAP_URL = 'https://testingwithekki.com/sitemap.xml';

export function getRobotsTxt(host: string | null | undefined): string {
  if (host?.startsWith('qa.')) {
    return `User-agent: *
Disallow: /`;
  }

  return `User-agent: *
Allow: /
Allow: /api/og
Disallow: /admin/
Disallow: /api/
Disallow: /test-sentry

# Keep training crawlers blocked while allowing search/reference retrieval.
User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: OAI-SearchBot
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /test-sentry

Sitemap: ${SITEMAP_URL}`;
}
