import { test, expect } from '@playwright/test';
import { LeaderboardPage } from '../pages/LeaderboardPage';

test.describe('Leaderboard', () => {
    let leaderboardPage: LeaderboardPage;

    test.beforeEach(async ({ page }) => {
        leaderboardPage = new LeaderboardPage(page);
        await leaderboardPage.goto();
    });

    test('should display leaderboard', async ({ page }) => {
        await leaderboardPage.verifyLeaderboardVisible();
    });
});
