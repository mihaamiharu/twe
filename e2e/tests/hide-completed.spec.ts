import { test, expect } from '@playwright/test';
import { ChallengesPage } from '../pages/ChallengesPage';
import { TutorialsPage } from '../pages/TutorialsPage';
import fs from 'fs';
import path from 'path';

const solutionsPath = path.resolve(
    process.cwd(),
    'e2e/fixtures/solutions.json',
);
const solutions = JSON.parse(fs.readFileSync(solutionsPath, 'utf-8')) as Record<
    string,
    string
>;

test.describe('Hide/Show Completed', () => {
    let challengesPage: ChallengesPage;
    let tutorialsPage: TutorialsPage;

    test.beforeEach(async ({ page, context, request }) => {
        const { loginViaApi } = await import('../utils/auth');
        await loginViaApi(context, request, page);

        challengesPage = new ChallengesPage(page);
        tutorialsPage = new TutorialsPage(page);
    });

    test('should hide completed challenges', async ({ page }) => {
        // 1. Solve a simple challenge (e.g. css-id) if not already solved
        // We pick one that is quick and stable
        const slug = 'css-id';
        const solution = solutions[slug];

        await challengesPage.gotoChallenge(slug);
        await challengesPage.solveChallenge(solution, slug);

        // 2. Go back to list
        await challengesPage.gotoList();

        // 3. Verify it is marked data-completed="true" or has check circle
        // The implementation adds CheckCircle2 which we can check, or class on the row/card
        // Let's check for the check circle icon inside a link pointing to this slug
        const challengeLink = page.locator(`a[href*="/challenges/${slug}"]`);
        const checkIcon = challengeLink.locator('.lucide-check-circle-2');

        // It should be visible initially (show completed by default or just in list)
        // Wait for list to load
        await expect(challengeLink.first()).toBeVisible();

        // 4. Toggle Hide Completed
        await challengesPage.hideCompletedToggle.click();

        // 5. Verify it is hidden
        await expect(challengeLink.first()).toBeHidden();

        // 6. Toggle back to show (optional, but good for symmetry)
        await challengesPage.hideCompletedToggle.click();
        await expect(challengeLink.first()).toBeVisible();
    });

    test('should hide completed tutorials', async ({ page }) => {
        // 1. Complete a tutorial
        await tutorialsPage.gotoList();
        const firstTutorial = tutorialsPage.tutorialCards.first();
        const firstTutorialHref = await firstTutorial.getAttribute('href');
        const slug = firstTutorialHref?.split('/').pop();

        expect(slug).toBeDefined();

        await firstTutorial.click();
        await tutorialsPage.verifyTutorialContent();

        // Force scroll and complete like in tutorials.spec.ts
        await page.evaluate(() => {
            document.body.style.minHeight = '10000px';
        });
        for (let i = 0; i < 5; i++) {
            await page.mouse.wheel(0, 2000);
            await page.waitForTimeout(200);
        }
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000);

        await expect(tutorialsPage.completeButton).toBeVisible({ timeout: 10000 });
        await tutorialsPage.completeTutorial();

        // 2. Go back to list
        await tutorialsPage.gotoList();

        // 3. Verify it is visible
        const tutorialLink = page.locator(`a[href*="/tutorials/${slug}"]`);
        await expect(tutorialLink.first()).toBeVisible();

        // 4. Toggle Hide Completed
        await tutorialsPage.hideCompletedToggle.click();

        // 5. Verify it is hidden
        await expect(tutorialLink.first()).toBeHidden();

        // 6. Toggle back
        await tutorialsPage.hideCompletedToggle.click();
        await expect(tutorialLink.first()).toBeVisible();
    });
});
