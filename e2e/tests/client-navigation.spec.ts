import { expect, test } from '@playwright/test';

test.describe('Consecutive client-side navigations (Issue #263)', () => {
  test('navigates /en -> /en/learn -> /en/learn/$slug -> /en/practice -> /en/practice/$slug via Link clicks without 503s or frozen main', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    const serverErrors: Array<{ status: number; url: string }> = [];
    const pageErrors: string[] = [];
    const serverFnCallsAfterHydration: string[] = [];
    let trackServerFn = false;

    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });
    page.on('response', (response) => {
      if (response.status() >= 500) {
        serverErrors.push({ status: response.status(), url: response.url() });
      }
      if (trackServerFn && response.url().includes('/_serverFn/')) {
        serverFnCallsAfterHydration.push(response.url());
      }
    });

    const initialResponse = await page.goto('/en');
    expect(initialResponse?.status()).toBe(200);
    expect(initialResponse?.headers()['speculation-rules']).toBe(
      '"/speculation-rules.json"',
    );

    // Verify the empty speculation-rules manifest serves with the required MIME type.
    const rulesResponse = await page.request.get('/speculation-rules.json');
    expect(rulesResponse.status()).toBe(200);
    expect(rulesResponse.headers()['content-type']).toContain(
      'application/speculationrules+json',
    );
    expect(await rulesResponse.json()).toEqual({});

    await expect(page.locator('body')).toHaveAttribute(
      'data-app-hydrated',
      'true',
      { timeout: 20_000 },
    );

    // SSR query hydration should populate auth + tutorialsList caches so
    // clicking Learn from /en does not require redundant server-function calls.
    trackServerFn = true;
    const primaryNav = page.getByRole('navigation', { name: 'Primary' });

    await primaryNav.getByRole('link', { name: 'Learn' }).click();
    await expect(page).toHaveURL(/\/en\/learn\/?$/);
    await expect(page.locator('#learn-title')).toBeVisible();
    await expect(page.getByTestId('lesson-row').first()).toBeVisible();
    expect(serverFnCallsAfterHydration).toHaveLength(0);

    // /en/learn -> /en/learn/$slug
    trackServerFn = false;
    await page.getByTestId('lesson-row').first().click();
    await expect(page).toHaveURL(/\/en\/learn\/[^/]+$/);
    await expect(page.locator('article')).toBeVisible();
    await expect(page.locator('[data-testid="lesson-loading"]')).toHaveCount(0);

    // /en/learn/$slug -> /en/practice
    await primaryNav.getByRole('link', { name: 'Practice' }).click();
    await expect(page).toHaveURL(/\/en\/practice\/?$/);
    await expect(page.locator('#practice-title')).toBeVisible();
    await expect(page.getByTestId('practice-library')).toBeVisible();

    // /en/practice -> /en/practice/$slug
    const challengeLink = page
      .locator('a[href*="/en/practice/css-selector-101-id-class"]')
      .first();
    await expect(challengeLink).toBeVisible();
    await challengeLink.click();
    await expect(page).toHaveURL(/\/en\/practice\/css-selector-101-id-class$/);
    await expect(page.locator('.workspace-shell')).toBeVisible({
      timeout: 20_000,
    });
    await expect(
      page.locator('.workspace-shell .animate-pulse'),
    ).toHaveCount(0, { timeout: 20_000 });

    expect(serverErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test('hydrates localized /id pages without a language hydration mismatch', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    for (const path of ['/id', '/id/learn']) {
      const response = await page.goto(path, { waitUntil: 'networkidle' });
      expect(response?.status()).toBe(200);
      await expect(
        page.getByRole('navigation', { name: 'Primary' }).getByRole('link', {
          name: 'Belajar',
        }),
      ).toBeVisible();
    }

    expect(pageErrors).toEqual([]);
  });
});
