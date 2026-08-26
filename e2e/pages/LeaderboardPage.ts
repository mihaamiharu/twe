import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LeaderboardPage extends BasePage {
  readonly leaderboardTable: Locator;
  readonly illustration: Locator;
  readonly allTimeTab: Locator;
  readonly monthlyTab: Locator;
  readonly signInPanel: Locator;

  constructor(page: Page) {
    super(page);
    this.leaderboardTable = page.getByTestId('leaderboard-list');
    this.illustration = page.getByTestId('leaderboard-illustration');
    this.allTimeTab = page.getByTestId('leaderboard-tab-all-time');
    this.monthlyTab = page.getByTestId('leaderboard-tab-monthly');
    this.signInPanel = page.getByTestId('leaderboard-sign-in');
  }

  override async goto() {
    await this.page.goto('/en/leaderboard');
    await this.page.waitForLoadState('load');
    await this.waitForHydration();
  }

  async waitForHydration() {
    await this.page.waitForFunction(
      () => {
        const appWindow = window as Window & {
          __TSS_START_OPTIONS__?: unknown;
          $_TSR?: unknown;
        };
        return Boolean(appWindow.__TSS_START_OPTIONS__) &&
          (appWindow.$_TSR?.initialized === true ||
            appWindow.$_TSR === undefined);
      },
      undefined,
      { timeout: 20_000 },
    );
  }

  async verifyLeaderboardVisible() {
    await expect(this.leaderboardTable).toBeVisible();
    await expect(this.illustration).toBeVisible();
    await expect(
      this.page.getByTestId('leaderboard-podium-item'),
    ).toHaveCount(0);

    const listCount = await this.page.getByTestId('leaderboard-item').count();
    const emptyStateCount = await this.page
      .getByTestId('leaderboard-empty-state')
      .count();

    expect(listCount > 0 || emptyStateCount === 1).toBe(true);
  }

  async switchToMonthly() {
    await this.monthlyTab.click();
    await expect(this.page).toHaveURL(/\/en\/leaderboard\?period=monthly/);
    await expect(this.monthlyTab).toHaveAttribute('data-state', 'active');
  }

  async verifySignedOutRowsAreReadable() {
    const blurredRows = await this.page
      .getByTestId('leaderboard-item')
      .evaluateAll((rows: HTMLElement[]) =>
        rows.filter((row) => row.className.includes('blur')).length,
      );

    expect(blurredRows).toBe(0);
  }
}
