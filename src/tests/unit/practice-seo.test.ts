import { describe, expect, test } from 'bun:test';
import { createPracticeDetailSeoHead } from '@/lib/practice-seo';

const challenge = {
  slug: 'pw-locator-intro',
  title: 'Pengenalan Locator',
  description: 'Latih locator yang stabil.',
  difficulty: 'MEDIUM' as const,
  category: 'playwright-locators',
  xpReward: 25,
};

type JsonLdRecord = Record<string, unknown>;

function parseJsonLd(value: string): JsonLdRecord {
  const parsed: unknown = JSON.parse(value);
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Expected a JSON-LD object');
  }
  return parsed as JsonLdRecord;
}

describe('Practice detail SEO', () => {
  test('uses localized loader content and emits canonical, alternates, and structured data', () => {
    const head = createPracticeDetailSeoHead({
      locale: 'id',
      slug: challenge.slug,
      challenge,
    });

    expect(
      head.links.some(
        (link) =>
          link['rel'] === 'canonical' &&
          link['href'] ===
            'https://testingwithekki.com/id/practice/pw-locator-intro',
      ),
    ).toBe(true);
    expect(
      head.links.some(
        (link) =>
          link['rel'] === 'alternate' &&
          link['hrefLang'] === 'en' &&
          link['href'] ===
            'https://testingwithekki.com/en/practice/pw-locator-intro',
      ),
    ).toBe(true);
    expect(
      head.links.some(
        (link) =>
          link['rel'] === 'alternate' &&
          link['hrefLang'] === 'x-default' &&
          link['href'] ===
            'https://testingwithekki.com/en/practice/pw-locator-intro',
      ),
    ).toBe(true);

    const title = head.meta.find((meta) => 'title' in meta);
    expect(title?.['title']).toContain(challenge.title);
    expect(
      head.meta.some(
        (meta) =>
          meta['name'] === 'description' &&
          meta['content'] === challenge.description,
      ),
    ).toBe(true);
    expect(
      head.meta.some(
        (meta) =>
          meta['name'] === 'twitter:card' &&
          meta['content'] === 'summary_large_image',
      ),
    ).toBe(true);

    const jsonLd = head.scripts.map((script) => parseJsonLd(script.children));
    expect(jsonLd.map((item) => item['@type'])).toEqual([
      'BreadcrumbList',
      'LearningResource',
    ]);
    expect(jsonLd[1]?.['name']).toBe(challenge.title);
    expect(jsonLd[1]?.['description']).toBe(challenge.description);
    expect(jsonLd[1]?.['inLanguage']).toBe('id');
  });

  test('marks missing detail content as noindex while retaining alternate links', () => {
    const head = createPracticeDetailSeoHead({
      locale: 'en',
      slug: 'missing-challenge',
    });

    expect(head.meta).toContainEqual({
      name: 'robots',
      content: 'noindex, nofollow',
    });
    expect(head.links).toContainEqual({
      rel: 'canonical',
      href: 'https://testingwithekki.com/en/practice/missing-challenge',
    });
    expect(head.scripts).toEqual([]);
  });

  test('does not mark an operational detail failure as a 404', () => {
    const head = createPracticeDetailSeoHead({
      locale: 'en',
      slug: 'temporarily-unavailable',
      noIndex: false,
    });

    expect(head.meta).not.toContainEqual({
      name: 'robots',
      content: 'noindex, nofollow',
    });
  });
});
