import { expect, test } from '@playwright/test';

test.describe('Practice list state', () => {
  test('preserves search, track, view, and completion filters in the URL', async ({
    page,
  }) => {
    await page.goto('/en/challenges');
    await page.waitForLoadState('networkidle');

    const search = page.getByRole('textbox', { name: /Search challenges/i });
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
  });

  test('navigates from the practice list to a challenge detail workspace', async ({
    page,
  }) => {
    await page.goto('/en/challenges');
    await page.waitForLoadState('networkidle');
    const firstChallenge = page.locator('a[href*="/en/challenges/"]').first();
    await expect(firstChallenge).toBeVisible();
    await firstChallenge.click();

    await expect(page).toHaveURL(/\/en\/challenges\/[^/?]+$/);
    await expect(page.locator('.workspace-shell')).toBeVisible();
  });
});
