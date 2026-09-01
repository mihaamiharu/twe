import { describe, expect, test } from 'bun:test';
import { buildFallbackSitemapXml, buildUrlEntry } from '@/lib/sitemap';

describe('sitemap generation', () => {
  test('escapes URL values and emits hreflang alternates', () => {
    const entry = buildUrlEntry(
      'https://testingwithekki.com/en/practice/a&b',
      'monthly',
      '0.8',
      '2026-09-01',
      [
        { locale: 'en', href: 'https://testingwithekki.com/en/practice/a&b' },
        { locale: 'id', href: 'https://testingwithekki.com/id/practice/a&b' },
      ],
    );

    expect(entry).toContain(
      '<loc>https://testingwithekki.com/en/practice/a&amp;b</loc>',
    );
    expect(entry).toContain('<lastmod>2026-09-01</lastmod>');
    expect(entry).toContain('hreflang="en"');
    expect(entry).toContain(
      'href="https://testingwithekki.com/id/practice/a&amp;b"',
    );
  });

  test('fallback sitemap uses localized canonical home URLs and alternates', () => {
    const xml = buildFallbackSitemapXml();

    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(xml).toContain('<loc>https://testingwithekki.com/en</loc>');
    expect(xml).toContain('<loc>https://testingwithekki.com/id</loc>');
    expect(xml).toContain(
      'hreflang="x-default" href="https://testingwithekki.com/en"',
    );
    expect(xml).not.toContain('<loc>https://testingwithekki.com/</loc>');
  });
});
