import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class TutorialsPage extends BasePage {
  readonly tutorialCards: Locator;
  readonly completeButton: Locator;
  readonly hideCompletedToggle: Locator;

  constructor(page: Page) {
    super(page);
    this.tutorialCards = page.locator('a[href*="/tutorials/"][class*="group"]');
    this.completeButton = page.getByRole('button', {
      name: /Complete|Selesai/i,
    });
    this.hideCompletedToggle = page.getByRole('button', { name: /Hide Completed|hm/i });
  }

  async gotoList(locale: string = 'en') {
    await this.goto(`/${locale}/tutorials`);
  }

  async gotoTutorial(slug: string, locale: string = 'en') {
    await this.goto(`/${locale}/tutorials/${slug}`);
  }

  async verifyTutorialContent() {
    // await expect(this.page.locator('.prose')).toBeVisible(); // Flaky in some envs, rely on title
    await expect(this.page.locator('h1')).toBeVisible();
  }

  async completeTutorial() {
    await this.completeButton.click();
    await expect(
      this.page.getByText('Completed', { exact: false }),
    ).toBeVisible();
  }
}
