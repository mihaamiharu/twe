import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LeaderboardPage extends BasePage {
  readonly leaderboardTable: Locator;
  readonly allTimeTab: Locator;
  readonly monthlyTab: Locator;

  constructor(page: Page) {
    super(page);
    this.leaderboardTable = page.getByTestId('leaderboard-list');
    this.allTimeTab = page.getByRole('tab', { name: /all time/i });
    this.monthlyTab = page.getByRole('tab', { name: /this month/i });
  }

  async goto() {
    await this.page.goto('/en/leaderboard');
  }

  async verifyLeaderboardVisible() {
    await expect(
      this.page.getByRole('heading', { level: 1, name: /leaderboard/i }),
    ).toBeVisible();
    await expect(this.leaderboardTable).toBeVisible();

    // Check if we have users either in podium or list
    const podiumCount = await this.page
      .getByTestId('leaderboard-podium-item')
      .count();
    const listCount = await this.page.getByTestId('leaderboard-item').count();

    expect(podiumCount + listCount).toBeGreaterThan(0);
  }

  async showMonthlyRankings() {
    await this.monthlyTab.click();
    await expect(this.monthlyTab).toHaveAttribute('data-state', 'active');
  }
}
