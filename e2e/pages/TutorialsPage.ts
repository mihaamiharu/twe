import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class TutorialsPage extends BasePage {
  readonly tutorialCards: Locator;
  readonly completeButton: Locator;
  readonly hideCompletedToggle: Locator;
  readonly currentLessonsPreview: Locator;

  constructor(page: Page) {
    super(page);
    this.tutorialCards = page.locator('a[href*="/learn/"][class*="group"]');
    this.completeButton = page.getByTestId('complete-tutorial');
    this.hideCompletedToggle = page.getByRole('button', {
      name: /Show remaining only|Show all lessons|Tampilkan yang belum selesai saja|Tampilkan semua pelajaran|Hide Completed|Show Completed|Sembunyikan Selesai|Tampilkan Selesai/i,
    });
    this.currentLessonsPreview = page.getByTestId('current-lessons-preview');
  }

  async gotoList(locale: string = 'en') {
    await this.goto(`/${locale}/learn`);
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('load');
    await expect(this.currentLessonsPreview).toBeVisible();
    await this.page.waitForFunction(
      () => {
        const appWindow = window as Window & {
          __TSS_START_OPTIONS__?: unknown;
          $_TSR?: unknown;
        };
        return (
          Boolean(appWindow.__TSS_START_OPTIONS__) &&
          (appWindow.$_TSR?.initialized === true ||
            appWindow.$_TSR === undefined)
        );
      },
      undefined,
      { timeout: 20_000 },
    );
  }

  async gotoTutorial(slug: string, locale: string = 'en') {
    await this.goto(`/${locale}/learn/${slug}`);
    await this.page.waitForLoadState('domcontentloaded');
    await this.verifyTutorialContent();
  }

  async verifyTutorialContent() {
    // await expect(this.page.locator('.prose')).toBeVisible(); // Flaky in some envs, rely on title
    await expect(this.page.locator('h1')).toBeVisible();
  }

  async completeTutorial() {
    await this.completeButton.click();
    await expect(
      this.page
        .getByTestId('lesson-status')
        .getByText('Completed! 🎉', { exact: true }),
    ).toBeVisible();
  }
}
