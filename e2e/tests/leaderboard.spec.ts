import { test, expect } from '@playwright/test';
import { LeaderboardPage } from '../pages/LeaderboardPage';

test.describe('Leaderboard', () => {
  let leaderboardPage: LeaderboardPage;

  test.beforeEach(async ({ page }) => {
    leaderboardPage = new LeaderboardPage(page);
    await leaderboardPage.goto();
  });

  test('should display leaderboard', async () => {
    await leaderboardPage.verifyLeaderboardVisible();
  });

  test('should retain the monthly period in the URL', async ({ page }) => {
    await leaderboardPage.showMonthlyRankings();
    await expect(page).toHaveURL(/period=monthly/);
  });
});
