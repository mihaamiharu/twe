import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class AdminPage extends BasePage {
  readonly dashboardTitle: Locator;
  readonly statsCards: Locator;
  readonly submissionsTable: Locator;
  readonly bugReportsLink: Locator;
  readonly userModerationLink: Locator;
  readonly challengeManagerLink: Locator;

  constructor(page: Page) {
    super(page);
    this.dashboardTitle = page
      .locator('h1')
      .filter({ hasText: /admin dashboard|dashboard admin/i });
    this.statsCards = page.locator('.grid.gap-4 .border');
    this.submissionsTable = page.locator('table');
    this.bugReportsLink = page.getByRole('link', { name: /bug reports/i });
    this.userModerationLink = page.getByRole('link', {
      name: /user moderation/i,
    });
    this.challengeManagerLink = page.getByRole('link', {
      name: /challenge manager/i,
    });
  }

  async goto() {
    await this.page.goto('/admin');
  }

  async verifyAdminVisible() {
    await expect(this.dashboardTitle).toBeVisible();
  }
}
