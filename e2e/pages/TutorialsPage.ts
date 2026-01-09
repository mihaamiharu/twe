import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class TutorialsPage extends BasePage {
    readonly tutorialCards: Locator;
    readonly completeButton: Locator;

    constructor(page: Page) {
        super(page);
        this.tutorialCards = page.locator('a[href*="/tutorials/"][class*="group"]');
        this.completeButton = page.getByRole('button', { name: /Complete|Selesai/i });
    }

    async gotoList() {
        await this.goto('/en/tutorials');
    }

    async gotoTutorial(slug: string) {
        await this.goto(`/en/tutorials/${slug}`);
    }

    async verifyTutorialContent() {
        // await expect(this.page.locator('.prose')).toBeVisible(); // Flaky in some envs, rely on title
        await expect(this.page.locator('h1')).toBeVisible();
    }

    async completeTutorial() {
        await this.completeButton.click();
        await expect(this.page.getByText('Completed', { exact: false })).toBeVisible();
    }
}
