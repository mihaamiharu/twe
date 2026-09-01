import { describe, expect, test } from 'bun:test';
import {
  BASE_URL,
  ORGANIZATION_ID,
  PERSON_ID,
  WEBSITE_ID,
  createPersonSchema,
  createProfilePageSchema,
  createSeoHead,
  createWebsiteSchema,
} from '@/lib/seo';

describe('SEO head and entity schemas', () => {
  test('localizes social metadata and pairs canonical/hreflang URLs', () => {
    const head = createSeoHead({
      title: 'Tentang Ekki — TestingWithEkki',
      description: 'Kenali Ekki di balik TestingWithEkki.',
      path: '/about',
      locale: 'id',
      noIndex: true,
    });

    expect(head.meta).toContainEqual({
      name: 'description',
      content: 'Kenali Ekki di balik TestingWithEkki.',
    });
    expect(head.meta).toContainEqual({
      property: 'og:locale',
      content: 'id_ID',
    });
    expect(head.meta).toContainEqual({
      property: 'og:locale:alternate',
      content: 'en_US',
    });
    expect(head.meta).toContainEqual({
      name: 'twitter:description',
      content: 'Kenali Ekki di balik TestingWithEkki.',
    });
    expect(head.meta).toContainEqual({
      name: 'robots',
      content: 'noindex, nofollow',
    });
    expect(head.links).toContainEqual({
      rel: 'canonical',
      href: `${BASE_URL}/id/about`,
    });
    expect(head.links).toContainEqual({
      rel: 'alternate',
      hrefLang: 'en',
      href: `${BASE_URL}/en/about`,
    });
    expect(head.links).toContainEqual({
      rel: 'alternate',
      hrefLang: 'x-default',
      href: `${BASE_URL}/en/about`,
    });
    expect(head.meta.some((meta) => meta['name'] === 'keywords')).toBe(false);
  });

  test('connects localized profile data to stable person and website entities', () => {
    const profile = createProfilePageSchema({
      locale: 'id',
      title: 'Tentang Ekki — TestingWithEkki',
      description: 'Kenali Ekki di balik TestingWithEkki.',
    });
    const person = createPersonSchema({
      description: 'Kenali Ekki di balik TestingWithEkki.',
    });

    expect(profile['@type']).toBe('ProfilePage');
    expect(profile['inLanguage']).toBe('id');
    expect(profile['mainEntity']).toEqual({ '@id': PERSON_ID });
    expect(profile['isPartOf']).toEqual({ '@id': WEBSITE_ID });
    expect(person['@id']).toBe(PERSON_ID);
    expect(person['name']).toBe('Ekki Syam Sugiardi');
    expect(person['sameAs']).toContain('https://github.com/mihaamiharu');
    expect(person['sameAs']).toContain(
      'https://www.youtube.com/@TestingWithEkki',
    );
  });

  test('localizes the homepage WebSite entity and removes SearchAction', () => {
    const website = createWebsiteSchema({
      locale: 'id',
      description: 'Belajar software testing secara praktis.',
    });

    expect(website).toMatchObject({
      '@type': 'WebSite',
      '@id': WEBSITE_ID,
      inLanguage: 'id',
      description: 'Belajar software testing secara praktis.',
      publisher: { '@id': ORGANIZATION_ID },
    });
    expect('potentialAction' in website).toBe(false);
  });
});
