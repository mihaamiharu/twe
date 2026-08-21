import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  readonly heroTitle: Locator;
  readonly startLearningButton: Locator;
  readonly statsChallenges: Locator;
  readonly statsTutorials: Locator;
  readonly statsAchievements: Locator;
  readonly learningTiers: Locator;

  constructor(page: Page) {
    super(page);
    this.heroTitle = page.getByRole('heading', { level: 1 }).first();
    this.startLearningButton = page
      .getByRole('main')
      .getByRole('link', {
        name: /Solve Your First Challenge|Selesaikan Tantangan Pertamamu/i,
      })
      .first();
    // The label is the stable contract; its grandparent is the stat card and
    // its first child is the animated value.
    const stats = page.locator('main section').first();
    this.statsChallenges = stats
      .getByText('Real Scenarios', { exact: true })
      .locator('..')
      .locator('..')
      .locator('div')
      .first();
    this.statsTutorials = stats
      .getByText('Curated Lessons', { exact: true })
      .locator('..')
      .locator('..')
      .locator('div')
      .first();
    this.statsAchievements = stats
      .getByText('Achievements', { exact: true })
      .locator('..')
      .locator('..')
      .locator('div')
      .first();
    this.learningTiers = page.locator('.glass-card');
  }

  override async goto(locale: string = 'en') {
    await this.page.goto(`/${locale}/`);
  }

  async verifyDashboardVisible() {
    await expect(this.heroTitle).toBeVisible();
    await expect(this.startLearningButton).toBeVisible();
  }

  async verifyStats() {
    // Just verify they are visible and have some content
    await expect(this.statsChallenges).toBeVisible();
    await expect(this.statsTutorials).toBeVisible();
    await expect(this.statsAchievements).toBeVisible();
  }
}
