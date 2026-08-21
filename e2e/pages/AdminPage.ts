import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
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
    this.statsCards = page.locator(
      'div.grid.gap-4.md\\:grid-cols-2.lg\\:grid-cols-4 > [data-slot="card"]',
    );
    this.submissionsTable = page.locator('table');
    this.bugReportsLink = page.getByRole('link', {
      name: 'Bug Reports',
      exact: true,
    });
    this.userModerationLink = page.getByRole('link', {
      name: /user moderation/i,
    });
    this.challengeManagerLink = page.getByRole('link', {
      name: /challenge manager/i,
    });
  }

  override async goto() {
    await this.page.goto('/admin');
  }

  async verifyAdminVisible() {
    await expect(this.dashboardTitle).toBeVisible();
  }
}
