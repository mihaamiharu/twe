import { test, expect } from '@playwright/test';
import { TutorialsPage } from '../pages/TutorialsPage';

test.describe('Tutorials', () => {
  let tutorialsPage: TutorialsPage;
  test.beforeEach(async ({ page, context, request }) => {
    const { loginViaApi } = await import('../utils/auth');
    await loginViaApi(context, request, page);

    tutorialsPage = new TutorialsPage(page);
    await tutorialsPage.gotoList();
  });

  test('should list tutorials', async () => {
    await expect(tutorialsPage.tutorialCards.first()).toBeVisible();
  });

  test('should navigate to tutorial detail', async ({ page }) => {
    const firstTutorial = tutorialsPage.tutorialCards.first();
    await firstTutorial.click();
    await page.waitForLoadState('domcontentloaded');
    await tutorialsPage.verifyTutorialContent();
  });

  test('should mark tutorial as complete', async ({ page }) => {
    const firstTutorial = tutorialsPage.tutorialCards.first();
    await firstTutorial.click();
    await tutorialsPage.verifyTutorialContent();

    // 1. Force a huge body height to ensure we can scroll a lot
    await page.evaluate(() => {
      document.body.style.minHeight = '10000px';
    });

    // 2. Scroll to the bottom where the button usually lives. The assertion
    // below waits for the app's scroll-driven progress update.
    await expect
      .poll(
        async () => {
          await page.evaluate(() =>
            window.scrollTo(0, document.body.scrollHeight),
          );
          return tutorialsPage.completeButton.isEnabled();
        },
        { timeout: 10000 },
      )
      .toBe(true);

    // 3. Verify and Click Complete
    await expect(tutorialsPage.completeButton).toBeVisible({ timeout: 10000 });
    await tutorialsPage.completeTutorial();
  });
});
