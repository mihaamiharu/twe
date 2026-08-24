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

  test('should display the guided learning path', async ({ page }) => {
    await expect(tutorialsPage.learningPath).toBeVisible();
    await expect(page.getByTestId('learning-path-step-01')).toContainText(
      'The web & DOM',
    );
    await expect(page.getByTestId('learning-path-step-02')).toContainText(
      'JavaScript fundamentals',
    );
    await expect(page.getByTestId('learning-path-step-03')).toContainText(
      'Playwright automation',
    );
    await expect(page.getByTestId('learning-path-step-04')).toContainText(
      'Hands-on challenges',
    );
  });

  test('should navigate from a guided learning step', async ({ page }) => {
    await tutorialsPage.learningPath
      .getByTestId('learning-path-step-01')
      .click();
    await expect(page).toHaveURL(/\/en\/tutorials\/dom-tree-hierarchy$/);
  });

  test('should keep the guided path usable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/en/tutorials');

    await expect(tutorialsPage.learningPath).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
  });

  test('should expose difficulty filters as pressed buttons', async ({
    page,
  }) => {
    const beginner = page.getByRole('button', { name: 'Beginner' });
    await expect(beginner).toHaveAttribute('aria-pressed', 'false');

    await beginner.click();

    await expect(page).toHaveURL(/\/en\/tutorials\?difficulty=beginner$/);
    await expect(beginner).toHaveAttribute('aria-pressed', 'true');
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
