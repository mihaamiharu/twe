import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  readonly heroTitle: Locator;
  readonly startLearningButton: Locator;
  readonly learningPathHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.heroTitle = page.getByRole('heading', { level: 1 }).first();
    this.startLearningButton = page
      .getByRole('main')
      .getByRole('link', { name: 'Start Web Automation', exact: true })
      .first();
    this.learningPathHeading = page.getByRole('heading', {
      name: 'The Web Automation Learning Path',
      exact: true,
    });
  }

  override async goto(locale: string = 'en') {
    await this.page.goto(`/${locale}/`);
  }

  async verifyDashboardVisible() {
    await expect(this.heroTitle).toBeVisible();
    await expect(this.startLearningButton).toBeVisible();
  }

  async verifyLearningSurface() {
    await expect(this.learningPathHeading).toBeVisible();
    await expect(
      this.page.getByRole('link', { name: 'Explore Practice', exact: true }).first(),
    ).toBeVisible();
  }
}
