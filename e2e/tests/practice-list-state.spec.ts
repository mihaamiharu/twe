import { expect, test } from '@playwright/test';

test.describe('Practice list state', () => {
  for (const locale of ['en', 'id'] as const) {
    test(`${locale} recovers from malformed filter URLs`, async ({ page }) => {
      await page.goto(
        `/${locale}/practice?track=unknown&tier=invalid&difficulty=IMPOSSIBLE&hideCompleted=maybe&view=table&q=locator`,
      );

      await expect(page.locator('[data-not-found-page]')).toHaveCount(0);
      await expect(
        page.getByRole('heading', { level: 1 }).first(),
      ).toBeVisible();
      await expect(page.locator('#challenge-results')).toBeVisible();
      await expect(page.locator('body')).not.toContainText(
        'Invalid enum value',
      );
      await expect(page.locator('body')).not.toContainText('ZodError');
    });

    test(`${locale} exposes mobile view controls and all track tabs`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/${locale}/practice?view=grid`);
      await page.waitForLoadState('networkidle');

      await expect(page.getByRole('tab')).toHaveCount(5);
      await expect(
        page.getByText(/Swipe horizontally|Geser ke samping/i),
      ).toBeVisible();

      const gridView = page.getByRole('button', {
        name: /Grid view|Tampilan grid/i,
      });
      const listView = page.getByRole('button', {
        name: /List view|Tampilan daftar/i,
      });
      await expect(gridView).toBeVisible();
      await expect(gridView).toHaveAttribute('aria-pressed', 'true');
      await listView.click();
      await expect(listView).toHaveAttribute('aria-pressed', 'true');
      await expect
        .poll(() => new URL(page.url()).searchParams.get('view'))
        .toBe('list');

      await expect(page.locator('main')).toHaveCount(1);
    });

    test(`${locale} searches by a catalog category alias`, async ({ page }) => {
      await page.goto(`/${locale}/practice`);
      await page
        .getByRole('textbox', {
          name: /Search practice challenges|Cari tantangan praktik/i,
        })
        .fill('POM');

      await expect(page.getByText(/Page Object Model/i).first()).toBeVisible();
      await expect(
        page.locator('a[href*="/practice/pom-login-basics"]'),
      ).toBeVisible();
    });
  }

  test('supports keyboard navigation across track tabs', async ({ page }) => {
    await page.goto('/en/practice');
    await page.waitForLoadState('networkidle');
    const firstTab = page.getByRole('tab').first();
    await firstTab.focus();
    await firstTab.press('End');
    const lastTab = page.getByRole('tab').last();
    await expect(lastTab).toBeFocused();
    await expect(lastTab).toHaveAttribute('aria-selected', 'true');
    await lastTab.press('Home');
    await expect(firstTab).toBeFocused();
    await expect(firstTab).toHaveAttribute('aria-selected', 'true');
  });

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

    test(`${locale} preserves the tier URL parameter`, async ({
      page,
    }) => {
      await page.goto(
        `/${locale}/practice?track=selectors&tier=intermediate&difficulty=EASY`,
      );
      await page.waitForLoadState('networkidle');

      await expect(page.locator('[data-not-found-page]')).toHaveCount(0);
      await expect(
        page.getByRole('combobox', { name: /Tier|Tingkat/i }),
      ).toHaveCount(1);
      await expect
        .poll(() => new URL(page.url()).searchParams.get('tier'))
        .toBe('intermediate');
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
