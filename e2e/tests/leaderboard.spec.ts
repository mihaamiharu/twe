import { expect, test } from '@playwright/test';
import { LeaderboardPage } from '../pages/LeaderboardPage';
import { loginViaApi } from '../utils/auth';

test.describe('Leaderboard', () => {
  let leaderboardPage: LeaderboardPage;

  test.beforeEach(async ({ page }) => {
    leaderboardPage = new LeaderboardPage(page);
    await leaderboardPage.goto();
  });

  test('should display leaderboard', async () => {
    await leaderboardPage.verifyLeaderboardVisible();
    await leaderboardPage.verifySignedOutRowsAreReadable();
    await expect(leaderboardPage.signInPanel).toBeVisible();
    await expect(
      leaderboardPage.page.getByText('Learn together, move forward.'),
    ).toBeVisible();
  });

  test('switches between all-time and monthly progress', async () => {
    await expect(leaderboardPage.allTimeTab).toHaveAttribute(
      'data-state',
      'active',
    );

    await leaderboardPage.switchToMonthly();
    await expect(leaderboardPage.allTimeTab).toHaveAttribute(
      'data-state',
      'inactive',
    );
  });

  test('supports the Indonesian community copy', async ({ page }) => {
    await page.goto('/id/leaderboard');

    await expect(
      page.getByText('Belajar bersama, maju bersama.'),
    ).toBeVisible();
    await expect(page.getByTestId('leaderboard-header')).toContainText(
      'Progres komunitas',
    );
    await expect(page.getByTestId('leaderboard-tabs')).toContainText(
      'Bulan Ini',
    );
  });

  test('does not overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/en/leaderboard');

    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
  });

  test('highlights the signed-in learner when present in the ranking', async ({
    page,
    context,
    request,
  }) => {
    test.skip(
      !process.env.E2E_SECRET,
      'The signed-in leaderboard fixture requires the disposable E2E environment.',
    );

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const email = `leaderboard-${crypto.randomUUID()}@example.com`;
    const password = `leaderboard-password-${crypto.randomUUID()}`;
    const headers = {
      'content-type': 'application/json',
      'x-e2e-secret': process.env.E2E_SECRET || '',
    };

    const seedResponse = await request.post(`${baseUrl}/api/test/seed-user`, {
      headers,
      data: { email, password, name: 'Community Learner' },
    });
    expect(seedResponse.ok()).toBe(true);

    const progressResponse = await request.post(
      `${baseUrl}/api/test/set-progress`,
      {
        headers,
        data: {
          email,
          type: 'challenge',
          slug: 'css-selector-101-id-class',
          xp: 25,
        },
      },
    );
    expect(progressResponse.ok()).toBe(true);

    await loginViaApi(context, request, page, email, password);
    await page.goto('/en/leaderboard');

    const currentRow = page.locator(
      '[data-testid="leaderboard-item"][data-current-user="true"]',
    );
    await expect(currentRow).toBeVisible();
    await expect(
      currentRow.getByTestId('leaderboard-current-user'),
    ).toHaveText('You');
  });
});
