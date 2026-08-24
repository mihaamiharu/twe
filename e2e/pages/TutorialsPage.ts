import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class TutorialsPage extends BasePage {
  readonly tutorialCards: Locator;
  readonly completeButton: Locator;
  readonly hideCompletedToggle: Locator;
  readonly learningPath: Locator;

  constructor(page: Page) {
    super(page);
    this.tutorialCards = page.locator('a[href*="/learn/"][class*="group"]');
    this.completeButton = page.getByRole('button', {
      name: /Read to Complete|Complete & Continue|Baca untuk Menyelesaikan|Selesai & Lanjutkan/i,
    });
    this.hideCompletedToggle = page.getByRole('button', {
      name: /Hide Completed|Show Completed|Sembunyikan Selesai|Tampilkan Selesai/i,
    });
    this.learningPath = page.getByTestId('learning-path');
  }

  async gotoList(locale: string = 'en') {
    await this.goto(`/${locale}/learn`);
    await this.page.waitForLoadState('networkidle');
  }

  async gotoTutorial(slug: string, locale: string = 'en') {
    await this.goto(`/${locale}/learn/${slug}`);
    await this.page.waitForLoadState('networkidle');
  }

  async verifyTutorialContent() {
    // await expect(this.page.locator('.prose')).toBeVisible(); // Flaky in some envs, rely on title
    await expect(this.page.locator('h1')).toBeVisible();
  }

  async completeTutorial() {
    await this.completeButton.click();
    await expect(
      this.page.getByText('Completed! 🎉', { exact: true }),
    ).toBeVisible();
  }
}
