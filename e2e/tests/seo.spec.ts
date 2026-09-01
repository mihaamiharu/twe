import { test, expect } from '@playwright/test';

type JsonLdEntity = {
  '@id'?: string;
  '@type'?: string;
  description?: string;
  inLanguage?: string;
  mainEntity?: { '@id'?: string };
  name?: string;
  potentialAction?: unknown;
  sameAs?: string[];
};

test.describe('SEO Checks', () => {
    test.beforeEach(async ({ page }) => {
        // Optional: Block third-party scripts to speed up tests
        await page.route('**/*.{png,jpg,jpeg,svg,gif,webp}', route => route.abort());
    });

    test('Homepage should have essential SEO meta tags', async ({ page }) => {
        await page.goto('/');

        // Title
        await expect(page).toHaveTitle(/TestingWithEkki/);

        // Meta Description
        const description = page.locator('meta[name="description"]');
        await expect(description).toHaveAttribute('content', /.+/); // Not empty

        // Canonical URL
        const canonical = page.locator('link[rel="canonical"]');
        await expect(canonical).toHaveAttribute('href', /https:\/\/testingwithekki\.com\/.+/);

        // Open Graph Image
        const ogImage = page.locator('meta[property="og:image"]');
        await expect(ogImage).toHaveAttribute('content', /.+/);
    });

    test('Sitemap.xml should be accessible and valid XML', async ({ request }) => {
        const response = await request.get('/sitemap.xml');
        expect(response.status()).toBe(200);

        const contentType = response.headers()['content-type'];
        expect(contentType).toContain('application/xml');

        const text = await response.text();
        expect(text).toContain('<urlset');
        expect(text).toContain('https://testingwithekki.com');
    });

    test('Robots.txt should be accessible and allow indexing', async ({ request }) => {
        const response = await request.get('/robots.txt');
        expect(response.status()).toBe(200);

        const text = await response.text();
        expect(text).toContain('User-agent: *');
        expect(text).toContain('Allow: /');
        expect(text).toContain('Sitemap: https://testingwithekki.com/sitemap.xml');
        expect(text).toContain('Disallow: /admin/');
        expect(text).toContain('Disallow: /api/');
    });

    test('Social Image Generation (OG) should return an image', async ({ request }) => {
        // Test dynamic OG generation
        const response = await request.get('/api/og?title=Test%20Challenge&type=Challenge');
        expect(response.status()).toBe(200);

        const contentType = response.headers()['content-type'];
        expect(contentType).toBe('image/png');

        // Ensure body size is reasonable for an image > 0
        const body = await response.body();
        expect(body.length).toBeGreaterThan(100);
    });

    test('Challenges page should have correct metadata', async ({ page }) => {
        await page.goto('/en/practice');
        await expect(page).toHaveTitle(
            'Practice Test Automation — TestingWithEkki',
        );

        const canonical = page.locator('link[rel="canonical"]');
        await expect(canonical).toHaveAttribute('href', /https:\/\/testingwithekki\.com\/en\/practice/);
    });

  test('Indonesian public pages use localized metadata and hreflang pairs', async ({
    page,
  }) => {
    const pages = [
      {
        path: '/id/about',
        title: 'Tentang Ekki — TestingWithEkki',
        description:
          'Kenali Ekki, QA/SDET, mentor, dan kreator di balik TestingWithEkki.',
      },
      {
        path: '/id/contact',
        title: 'Hubungi Ekki | TestingWithEkki',
        description:
          'Hubungi Ekki untuk mentoring QA, partnership, sponsorship, peluang karier, atau pertanyaan tentang TestingWithEkki.',
      },
      {
        path: '/id/changelog',
        title: 'Catatan Perubahan | TestingWithEkki',
        description:
          'Lihat fitur, peningkatan, konten baru, dan perbaikan terbaru di TestingWithEkki.',
      },
      {
        path: '/id/privacy',
        title: 'Kebijakan Privasi | TestingWithEkki',
        description:
          'Baca cara TestingWithEkki mengumpulkan, menggunakan, dan melindungi data pribadi.',
      },
      {
        path: '/id/terms',
        title: 'Syarat dan Ketentuan | TestingWithEkki',
        description:
          'Baca ketentuan penggunaan platform pembelajaran test automation interaktif TestingWithEkki.',
      },
      {
        path: '/id/leaderboard',
        title: 'Papan Peringkat | TestingWithEkki',
        description:
          'Lihat bagaimana komunitas TestingWithEkki membangun kemampuan automasi yang lebih kuat bersama.',
      },
    ];

    for (const metadata of pages) {
      await page.goto(metadata.path);
      await expect(page).toHaveTitle(metadata.title);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        'content',
        metadata.description,
      );
      await expect(
        page.locator('meta[property="og:description"]'),
      ).toHaveAttribute('content', metadata.description);
      await expect(
        page.locator('meta[name="twitter:description"]'),
      ).toHaveAttribute('content', metadata.description);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        `https://testingwithekki.com${metadata.path}`,
      );
      await expect(
        page.locator('link[rel="alternate"][hreflang="en"]'),
      ).toHaveAttribute(
        'href',
        `https://testingwithekki.com/en${metadata.path.slice(3)}`,
      );
      await expect(page.locator('meta[name="keywords"]')).toHaveCount(0);
    }
  });

  test('account and utility pages are noindex', async ({ page }) => {
    for (const path of [
      '/id/login',
      '/id/register',
      '/id/forgot-password',
      '/id/reset-password',
      '/id/confirm-subscription',
      '/test-sentry',
      '/en/not-a-real-page',
    ]) {
      await page.goto(path);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        'content',
        'noindex, nofollow',
      );
    }
  });

  test('About emits connected localized ProfilePage and Person JSON-LD', async ({
    page,
  }) => {
    await page.goto('/id/about');

    const schemas = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((scripts): JsonLdEntity[] =>
        scripts.map(
          (script) => JSON.parse(script.textContent || '{}') as JsonLdEntity,
        ),
      );
    const profile = schemas.find((schema) => schema['@type'] === 'ProfilePage');
    const person = schemas.find((schema) => schema['@type'] === 'Person');

    expect(profile).toMatchObject({
      inLanguage: 'id',
      mainEntity: { '@id': 'https://testingwithekki.com/en/about#person' },
    });
    expect(person).toMatchObject({
      '@id': 'https://testingwithekki.com/en/about#person',
      name: 'Ekki Syam Sugiardi',
    });
    expect(person?.sameAs).toContain('https://github.com/mihaamiharu');
    expect(person?.sameAs).toContain('https://www.youtube.com/@TestingWithEkki');
  });

  test('Indonesian homepage WebSite JSON-LD is localized without SearchAction', async ({
    page,
  }) => {
    await page.goto('/id');

    const schemas = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((scripts): JsonLdEntity[] =>
        scripts.map(
          (script) => JSON.parse(script.textContent || '{}') as JsonLdEntity,
        ),
      );
    const website = schemas.find((schema) => schema['@type'] === 'WebSite');

    expect(website).toMatchObject({ inLanguage: 'id' });
    expect(website).not.toHaveProperty('potentialAction');
  });
});
