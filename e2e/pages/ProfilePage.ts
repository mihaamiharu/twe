import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProfilePage extends BasePage {
  readonly avatar: Locator;
  readonly userName: Locator;
  readonly userLevel: Locator;
  readonly xpProgress: Locator;
  readonly statsCards: Locator;
  readonly journalHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.avatar = page.locator('main [data-slot="avatar"]').first();
    this.journalHeading = page.getByRole('heading', {
      level: 1,
      name: /adventure journal/i,
    });
    this.userName = page.getByRole('heading', { level: 2 }).first();
    this.userLevel = page.getByText(/level \d+/i).first();
    this.xpProgress = page.getByRole('progressbar').first();
    this.statsCards = page.locator('main section[aria-label] > div');
  }

  async goto(locale: string = 'en') {
    await this.page.goto(`/${locale}/profile`);
  }

  async verifyProfileVisible() {
    // Wait for the skeleton to disappear or the username to appear with a longer timeout
    await expect(this.journalHeading).toBeVisible({ timeout: 15000 });
    await expect(this.userName).toBeVisible();
    await expect(this.avatar).toBeVisible();
  }
}
