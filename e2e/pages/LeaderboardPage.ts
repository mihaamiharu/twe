import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LeaderboardPage extends BasePage {
    readonly leaderboardTable: Locator;

    constructor(page: Page) {
        super(page);
        this.leaderboardTable = page.locator('table');
    }

    async goto() {
        await this.page.goto('/en/leaderboard');
    }

    async verifyLeaderboardVisible() {
        await expect(this.leaderboardTable).toBeVisible();
        await expect(this.page.locator('tbody tr')).not.toHaveCount(0);
    }
}
