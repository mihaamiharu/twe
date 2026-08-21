import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LeaderboardPage extends BasePage {
  readonly leaderboardTable: Locator;

  constructor(page: Page) {
    super(page);
    this.leaderboardTable = page.getByTestId('leaderboard-list');
  }

  override async goto() {
    await this.page.goto('/en/leaderboard');
  }

  async verifyLeaderboardVisible() {
    await expect(this.leaderboardTable).toBeVisible();

    // Check if we have users either in podium or list
    const podiumCount = await this.page.getByTestId('leaderboard-podium-item').count();
    const listCount = await this.page.getByTestId('leaderboard-item').count();

    expect(podiumCount + listCount).toBeGreaterThan(0);
  }
}
