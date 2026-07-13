import { expect, test } from '@playwright/test';

test.describe('quality regressions', () => {
  test('home has one main landmark and does not report hydration mismatches', async ({
    page,
  }) => {
    const hydrationErrors: string[] = [];
    page.on('console', (message) => {
      if (
        message.type() === 'error' &&
        /hydration|did not match/i.test(message.text())
      ) {
        hydrationErrors.push(message.text());
      }
    });

    await page.goto('/en');

    await expect(page.locator('main')).toHaveCount(1);
    await expect(
      page.getByRole('link', { name: 'Skip to content' }),
    ).toBeVisible();
    expect(hydrationErrors).toEqual([]);
  });

  test('quest board keeps its loader-backed count through hydration', async ({
    page,
  }) => {
    const hydrationErrors: string[] = [];
    page.on('console', (message) => {
      if (
        message.type() === 'error' &&
        /hydration|did not match/i.test(message.text())
      ) {
        hydrationErrors.push(message.text());
      }
    });

    await page.goto('/en/challenges');

    await expect(page.locator('main')).toHaveCount(1);
    await expect(
      page.getByText(/challenges found|challenge found/),
    ).toBeVisible();
    expect(hydrationErrors).toEqual([]);
  });
});

test.describe('mobile navigation accessibility', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('traps focus, closes with Escape, and restores focus to its trigger', async ({
    page,
  }) => {
    await page.goto('/en');

    const menuButton = page.getByRole('button', { name: 'Open menu' });
    await menuButton.click();

    const menu = page.getByRole('dialog', { name: 'Mobile navigation' });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Tutorials' })).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(menu).toBeHidden();
    await expect(menuButton).toBeFocused();
  });
});
