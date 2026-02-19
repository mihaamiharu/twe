import { test, expect } from '@playwright/test';

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
        await page.goto('/en/challenges');
        await expect(page).toHaveTitle(/Challenges/);

        const canonical = page.locator('link[rel="canonical"]');
        await expect(canonical).toHaveAttribute('href', /https:\/\/testingwithekki\.com\/en\/challenges/);
    });
});
