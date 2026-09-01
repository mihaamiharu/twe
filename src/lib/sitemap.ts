import { BASE_URL } from './seo';

export const SITEMAP_LOCALES = ['en', 'id'] as const;

interface SitemapAlternate {
  locale: string;
  href: string;
}

export function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (character) => {
    switch (character) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return character;
    }
  });
}

export function buildUrlEntry(
  loc: string,
  changefreq: string,
  priority: string,
  lastmod?: string,
  alternates?: readonly SitemapAlternate[],
): string {
  let entry = '  <url>\n';
  entry += `    <loc>${escapeXml(loc)}</loc>\n`;
  if (lastmod) {
    entry += `    <lastmod>${escapeXml(lastmod)}</lastmod>\n`;
  }
  entry += `    <changefreq>${escapeXml(changefreq)}</changefreq>\n`;
  entry += `    <priority>${escapeXml(priority)}</priority>\n`;

  for (const alternate of alternates ?? []) {
    entry += `    <xhtml:link rel="alternate" hreflang="${escapeXml(alternate.locale)}" href="${escapeXml(alternate.href)}" />\n`;
  }

  return `${entry}  </url>`;
}

export function buildSitemapXml(urlEntries: readonly string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries.join('\n')}
</urlset>`;
}

export function buildFallbackSitemapXml(): string {
  const alternates = [
    ...SITEMAP_LOCALES.map((locale) => ({
      locale,
      href: `${BASE_URL}/${locale}`,
    })),
    { locale: 'x-default', href: `${BASE_URL}/en` },
  ];

  return buildSitemapXml(
    SITEMAP_LOCALES.map((locale) =>
      buildUrlEntry(
        `${BASE_URL}/${locale}`,
        'daily',
        '1.0',
        undefined,
        alternates,
      ),
    ),
  );
}
