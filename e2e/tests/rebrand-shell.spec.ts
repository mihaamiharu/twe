import { test, expect } from '@playwright/test';
import { loginViaApi } from '../utils/auth';

test.describe('Rebrand V1 global shell', () => {
  test('renders the signed-out desktop shell and footer', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/en');

    const primary = page.getByRole('navigation', { name: 'Primary' });
    await expect(primary).toContainText('Learn');
    await expect(primary).toContainText('Practice');
    await expect(primary).toContainText('Labs');
    await expect(primary).toContainText('Soon');
    await expect(primary).toContainText('About');
    await expect(
      primary.getByRole('link', { name: 'Leaderboard' }),
    ).toHaveCount(0);

    await expect(
      page.getByRole('button', { name: /Switch language/ }),
    ).toContainText('EN');
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
    await expect(
      page
        .locator('header')
        .getByRole('link', { name: /Start Web Automation/ }),
    ).toBeVisible();
    await expect(page.locator('[aria-label*="theme" i]')).toHaveCount(0);

    const footer = page.locator('footer');
    await expect(footer).toContainText(
      'Practical software testing education for QA engineers who want to grow technically.',
    );
    await expect(footer).toContainText('Explore');
    await expect(footer).toContainText('Connect');
    await expect(footer).toContainText('Legal');
    await expect(footer).toContainText('© TestingWithEkki · Built by Ekki');
    await expect(footer).not.toContainText('Leaderboard');
    await expect(footer).not.toContainText('Subscribe');
    await expect(footer).not.toContainText('Changelog');
    await expect(
      footer.getByRole('button', { name: /Report a Bug/i }),
    ).toBeVisible();
  });

  test('renders the signed-in desktop shell with account access', async ({
    page,
    context,
    request,
  }) => {
    await loginViaApi(context, request);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/en');

    await expect(
      page.getByRole('navigation', { name: 'Primary' }),
    ).toContainText('Practice');
    await expect(
      page.getByRole('button', { name: 'Open account menu' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign In' })).toHaveCount(0);
    await expect(page.locator('header')).not.toContainText('XP');
    await expect(page.locator('[aria-label*="theme" i]')).toHaveCount(0);
  });

  test('supports the mobile menu, contact access, locale switching, and focus return', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/en');
    await page.waitForFunction(
      () => {
        const appWindow = window as Window & {
          __TSS_START_OPTIONS__?: unknown;
          $_TSR?: unknown;
        };
        return Boolean(appWindow.__TSS_START_OPTIONS__) && !appWindow.$_TSR;
      },
      undefined,
      { timeout: 20_000 },
    );

    const menuButton = page.locator(
      'button[aria-controls="mobile-navigation"]',
    );
    await expect(menuButton).toBeVisible();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    await menuButton.click();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true');

    const mobileNavigation = page.getByRole('navigation', {
      name: 'Mobile navigation',
    });
    await expect(mobileNavigation).toContainText('Learn');
    await expect(mobileNavigation).toContainText('Practice');
    await expect(mobileNavigation).toContainText('Labs');
    await expect(mobileNavigation).toContainText('Soon');
    await expect(mobileNavigation).toContainText('About');
    await expect(mobileNavigation).toContainText('Contact');
    await expect(mobileNavigation).toContainText('Sign In');

    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('navigation', { name: 'Mobile navigation' }),
    ).toHaveCount(0);
    await expect(menuButton).toBeFocused();

    await menuButton.click();
    await mobileNavigation
      .getByRole('button', { name: /Switch language/ })
      .click();
    await page.getByRole('menuitem', { name: 'Bahasa Indonesia' }).click();
    await expect(page).toHaveURL(/\/id\/?$/);
    await page.waitForFunction(
      () => {
        const appWindow = window as Window & {
          __TSS_START_OPTIONS__?: unknown;
          $_TSR?: unknown;
        };
        return Boolean(appWindow.__TSS_START_OPTIONS__) && !appWindow.$_TSR;
      },
      undefined,
      { timeout: 20_000 },
    );
    const localizedMenuButton = page.locator(
      'button[aria-controls="mobile-navigation"]',
    );
    await localizedMenuButton.click();
    await expect(
      page.getByRole('navigation', { name: 'Mobile navigation' }),
    ).toContainText('Belajar');
  });

  test('keeps the challenge page warm around dark technical surfaces', async ({
    page,
  }) => {
    await page.goto('/en/challenges/css-selector-101-id-class');

    await expect(page.locator('.workspace-shell')).toBeVisible();
    await expect(page.locator('footer')).toHaveCount(0);
    await expect
      .poll(() =>
        page.evaluate(() => getComputedStyle(document.body).backgroundColor),
      )
      .toBe('rgb(244, 240, 232)');
  });
});
