import { Page, Locator, expect } from '@playwright/test';
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
        this.startLearningButton = page.getByRole('main').getByRole('link', { name: /start learning/i }).first();
        // Targeted stats based on the structure in index.tsx
        this.statsChallenges = page.locator('div.text-center').filter({ hasText: /Challenges/i }).locator('.text-3xl, .text-4xl').first();
        this.statsTutorials = page.locator('div.text-center').filter({ hasText: /Tutorials/i }).locator('.text-3xl, .text-4xl').first();
        this.statsAchievements = page.locator('div.text-center').filter({ hasText: /Achievements/i }).locator('.text-3xl, .text-4xl').first();
        this.learningTiers = page.locator('.glass-card');
    }

    async goto(locale: string = 'en') {
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
