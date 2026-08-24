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
    await expect(page).toHaveURL(/\/en\/learn\/dom-tree-hierarchy$/);
  });

  test('should keep the guided path usable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/en/learn');

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

    await expect(page).toHaveURL(/\/en\/learn\?difficulty=beginner$/);
    await expect(beginner).toHaveAttribute('aria-pressed', 'true');
  });

  test('should keep grid and list presentation in URL state', async ({
    page,
  }) => {
    await page.goto('/en/learn?view=list');
    await expect(page.getByTestId('learn-results')).toHaveAttribute(
      'data-view-mode',
      'list',
    );
    await expect(
      page.getByRole('button', { name: 'List View' }),
    ).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('button', { name: 'Grid View' }).click();
    await expect(page).toHaveURL(/\/en\/learn\/?$/);
    await expect(page.getByTestId('learn-results')).toHaveAttribute(
      'data-view-mode',
      'grid',
    );
  });

  test('should preserve lesson search in URL state and filter the list', async ({
    page,
  }) => {
    const search = page.getByRole('textbox');
    await search.fill('DOM Tree');

    await expect
      .poll(() => new URL(page.url()).searchParams.get('q'))
      .toBe('DOM Tree');
    await expect(
      page.getByRole('link', { name: /Reading the DOM Tree/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Anatomy of an HTML Element/i }),
    ).toHaveCount(0);
  });

  test('should navigate to tutorial detail', async ({ page }) => {
    const firstTutorial = tutorialsPage.tutorialCards.first();
    await firstTutorial.click();
    await page.waitForLoadState('domcontentloaded');
    await tutorialsPage.verifyTutorialContent();
  });

  test('should render localized detail metadata and declared Practice links', async ({
    page,
  }) => {
    await page.goto('/id/learn/javascript-fundamentals-for-qa');
    await expect(page.locator('h1')).toContainText(
      'Fundamental Modern JavaScript',
    );
    await expect(
      page.locator('meta[name="description"]').last(),
    ).toHaveAttribute('content', /Pahami dasar-dasar ES6/);
    await expect(page.getByTestId('related-practice-links')).toContainText(
      'Latihan',
    );
    await expect(
      page.locator('a[href*="/id/practice/js-variables-types"]'),
    ).toBeVisible();
    await expect(page.getByTestId('reading-progress')).toBeVisible();
  });

  test('should guard completion for signed-out readers', async ({
    page,
    context,
  }) => {
    const consentCookies = (await context.cookies()).filter(
      (cookie) => cookie.name === 'twe-consent',
    );
    await context.clearCookies();
    await context.addCookies(consentCookies);
    await page.goto('about:blank');
    await page.goto('/en/learn/dom-tree-hierarchy');
    await page.waitForLoadState('networkidle');

    const completeButton = page.getByRole('button', {
      name: 'Sign in to Save Progress',
    });
    await expect(completeButton).toBeVisible();
    await completeButton.click();
    await expect(page.getByRole('dialog')).toContainText(
      'Sign in to Save Progress',
    );
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
