import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class SettingsPage extends BasePage {
    readonly nameInput: Locator;
    readonly emailInput: Locator;
    readonly saveButton: Locator;
    readonly backToProfileLink: Locator;

    constructor(page: Page) {
        super(page);
        this.nameInput = page.locator('#name');
        this.emailInput = page.locator('#email');
        this.saveButton = page.getByRole('button', { name: /save changes/i });
        this.backToProfileLink = page.getByRole('link', { name: /back to profile/i });
    }

    async goto(locale: string = 'en') {
        await this.page.goto(`/${locale}/settings`);
    }

    async updateName(newName: string) {
        await this.nameInput.fill(newName);
        await this.saveButton.click();
    }
}
