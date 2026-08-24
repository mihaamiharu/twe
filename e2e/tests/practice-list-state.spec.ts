import { expect, test } from '@playwright/test';

test.describe('Practice list state', () => {
  test('preserves search, track, view, and completion filters in the URL', async ({
    page,
    context,
    request,
  }) => {
    const { loginViaApi } = await import('../utils/auth');
    await loginViaApi(context, request, page);

    await page.goto('/en/practice');
    await page.waitForLoadState('networkidle');

    const search = page.getByRole('textbox', {
      name: /Search practice challenges/i,
    });
    await search.fill('ID & Class');
    await expect
      .poll(() => new URL(page.url()).searchParams.get('q'))
      .toBe('ID & Class');

    await page.getByRole('tab', { name: /Selectors/i }).click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get('track'))
      .toBe('selectors');

    await page.getByRole('button', { name: /Grid view/i }).click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get('view'))
      .toBe('grid');

    const completionToggle = page.getByRole('switch', {
      name: /Hide Completed|Show Completed/i,
    });
    await completionToggle.click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get('hideCompleted'))
      .toBe('true');
    await expect(completionToggle).toHaveAttribute('aria-checked', 'true');

    await completionToggle.click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get('hideCompleted'))
      .toBe('false');
    await expect(completionToggle).toHaveAttribute('aria-checked', 'false');

    await page.goBack();
    await expect
      .poll(() => new URL(page.url()).searchParams.get('hideCompleted'))
      .toBe('true');
    await expect(completionToggle).toHaveAttribute('aria-checked', 'true');

    await page.goForward();
    await expect
      .poll(() => new URL(page.url()).searchParams.get('hideCompleted'))
      .toBe('false');
    await expect(completionToggle).toHaveAttribute('aria-checked', 'false');
  });

  test('round-trips an explicit false completion filter from the URL', async ({
    page,
    context,
    request,
  }) => {
    const { loginViaApi } = await import('../utils/auth');
    await loginViaApi(context, request, page);

    await page.goto('/en/practice?hideCompleted=false');
    await page.waitForLoadState('networkidle');

    const completionToggle = page.getByRole('switch', {
      name: /Hide Completed|Show Completed/i,
    });
    await expect(completionToggle).toHaveAttribute('aria-checked', 'false');
    await expect
      .poll(() => new URL(page.url()).searchParams.get('hideCompleted'))
      .toBe('false');
  });

  for (const locale of ['en', 'id'] as const) {
    test(`${locale} guests cannot use completion filtering`, async ({
      page,
      context,
      request,
    }) => {
      const { loginViaApi } = await import('../utils/auth');
      await loginViaApi(context, request, page);
      await context.clearCookies();

      await page.goto(`/${locale}/practice?hideCompleted=true`);
      await page.waitForLoadState('networkidle');

      await expect(page.getByRole('switch')).toHaveCount(0);
      await expect(page.locator('#challenge-results')).toBeVisible();
    });

    test(`${locale} ignores the removed tier URL parameter`, async ({
      page,
    }) => {
      await page.goto(
        `/${locale}/practice?track=selectors&tier=intermediate&difficulty=EASY`,
      );
      await page.waitForLoadState('networkidle');

      await expect(page.locator('[data-not-found-page]')).toHaveCount(0);
      await expect(
        page.getByRole('combobox', { name: /Tier|Tingkat/i }),
      ).toHaveCount(0);
      await expect(page.locator('#challenge-results')).toBeVisible();
    });
  }

  test('navigates from the practice list to a challenge detail workspace', async ({
    page,
  }) => {
    await page.goto('/en/practice');
    await page.waitForLoadState('networkidle');
    const firstChallenge = page.locator('a[href*="/en/practice/"]').first();
    await expect(firstChallenge).toBeVisible();
    await firstChallenge.click();

    await expect(page).toHaveURL(/\/en\/practice\/[^/?]+$/);
    await expect(page.locator('.workspace-shell')).toBeVisible();
  });
});
