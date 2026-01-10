import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProfilePage extends BasePage {
  readonly avatar: Locator;
  readonly userName: Locator;
  readonly userLevel: Locator;
  readonly xpProgress: Locator;
  readonly settingsButton: Locator;
  readonly statsCards: Locator;
  readonly tabsList: Locator;

  constructor(page: Page) {
    super(page);
    this.avatar = page.locator(
      '.flex-col.md\\:flex-row.items-start.md\\:items-center.gap-6 >> .h-24.w-24',
    );
    this.userName = page.getByRole('heading', { level: 1 });
    this.userLevel = page.locator('.badge, .bg-primary\\/20');
    this.xpProgress = page.locator('.progress, .h-2');
    this.settingsButton = page.getByRole('link', { name: /settings/i });
    this.statsCards = page.locator('.glass-card.card-hover');
    this.tabsList = page.getByRole('tablist');
  }

  async goto(locale: string = 'en') {
    await this.page.goto(`/${locale}/profile`);
  }

  async verifyProfileVisible() {
    // Wait for the skeleton to disappear or the username to appear with a longer timeout
    await expect(this.userName).toBeVisible({ timeout: 15000 });
    await expect(this.avatar).toBeVisible();
  }

  async switchTab(tabName: 'progress' | 'activity' | 'achievements') {
    await this.page
      .getByRole('tab', { name: new RegExp(tabName, 'i') })
      .click();
  }
}
