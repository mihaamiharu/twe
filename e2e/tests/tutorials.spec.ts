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
    await expect(tutorialsPage.currentLessonsPreview).toBeVisible();
    await expect(
      page.locator('[data-testid^="learning-path-step-"]'),
    ).toHaveCount(4);
    await expect(page.getByTestId('learning-path-step-01')).toContainText(
      'Automation Foundations & Judgment',
    );
  });

  test('should navigate from a guided learning step', async ({ page }) => {
    await tutorialsPage.currentLessonsPreview
      .getByTestId('learning-path-step-01')
      .click();
    await expect(page).toHaveURL(/\/en\/learn\/universal-mindset$/);
  });

  test('should keep the guided path usable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/en/learn');

    await expect(tutorialsPage.currentLessonsPreview).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 2,
        ),
      )
      .toBe(true);
  });

  test('should preserve explicit completion visibility booleans in the URL', async ({
    page,
  }) => {
    await page.goto('/en/learn?hideCompleted=false');
    await expect(page).toHaveURL(/hideCompleted=false/);
    await expect(page.getByTestId('learn-completion-filter')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await expect(
      page.getByText('Show remaining only', { exact: true }),
    ).toBeVisible();

    await page.reload();
    await expect(page.getByTestId('learn-completion-filter')).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    await page.goto('/en/learn?hideCompleted=true');
    await expect(page).toHaveURL(/hideCompleted=true/);
    await expect(page.getByTestId('learn-completion-filter')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(
      page.getByText('Show all lessons', { exact: true }),
    ).toBeVisible();
  });

  for (const locale of ['en', 'id'] as const) {
    test(`${locale} should ignore removed difficulty and view parameters`, async ({
      page,
    }) => {
      await page.goto(`/${locale}/learn?difficulty=beginner&view=grid`);
      await expect(page.getByTestId('learn-results')).toHaveAttribute(
        'data-view-mode',
        'list',
      );
      await expect(
        page.getByRole('button', { name: /Beginner|Pemula/i }),
      ).toHaveCount(0);
      await expect(
        page.getByRole('button', { name: /Grid View|Tampilan Grid/i }),
      ).toHaveCount(0);
    });
  }

  for (const locale of ['en', 'id'] as const) {
    test(`${locale} guests should not see completion controls`, async ({
      page,
      context,
    }) => {
      await context.clearCookies();
      await page.goto(`/${locale}/learn?hideCompleted=true`);

      await expect(page.getByTestId('learn-completion-filter')).toHaveCount(0);
      await expect(page.getByTestId('learn-results')).toBeVisible();
    });
  }

  test('should preserve lesson search in URL state and filter the list', async ({
    page,
  }) => {
    const search = page.getByTestId('learn-search');
    await search.fill('DOM Tree');

    await expect
      .poll(() => new URL(page.url()).searchParams.get('q'))
      .toBe('DOM Tree');
    const results = page.getByTestId('learn-results');
    await expect(
      results.getByRole('link', { name: /Reading the DOM Tree/i }),
    ).toBeVisible();
    await expect(
      results.getByRole('link', { name: /Anatomy of an HTML Element/i }),
    ).toHaveCount(0);
  });

  test('should navigate to tutorial detail', async ({ page }) => {
    const firstTutorial = tutorialsPage.tutorialCards.first();
    await firstTutorial.click();
    await page.waitForLoadState('domcontentloaded');
    await tutorialsPage.verifyTutorialContent();
  });

  test('should highlight the section selected from the table of contents', async ({
    page,
  }) => {
    await page.goto('/en/learn/universal-mindset');
    await tutorialsPage.verifyTutorialContent();
    await expect(
      page.getByRole('link', {
        name: 'After this lesson, you can',
        exact: true,
      }),
    ).toHaveClass(/text-primary/);

    const sectionLink = page.getByRole('link', {
      name: 'Why this matters for QA',
      exact: true,
    });

    await sectionLink.scrollIntoViewIfNeeded();
    await sectionLink.click();

    await expect(page).toHaveURL(/#why-this-matters-for-qa$/);
    await expect(sectionLink).toHaveClass(/text-primary/);

    const laterSectionLink = page.getByRole('link', {
      name: 'When to use it—and when not to',
      exact: true,
    });

    await laterSectionLink.scrollIntoViewIfNeeded();
    await laterSectionLink.click();

    await expect(page).toHaveURL(/#when-to-use-it-and-when-not-to$/);
    await expect(laterSectionLink).toHaveClass(/text-primary/);
  });

  test('should keep the active section aligned while scrolling', async ({
    page,
  }) => {
    await page.goto('/en/learn/universal-mindset');
    await tutorialsPage.verifyTutorialContent();
    await expect(
      page.getByRole('link', {
        name: 'After this lesson, you can',
        exact: true,
      }),
    ).toHaveClass(/text-primary/);

    const targetHeading = page.locator('#when-to-use-it-and-when-not-to');
    const targetTop = await targetHeading.evaluate(
      (heading) => heading.getBoundingClientRect().top,
    );
    await page.mouse.wheel(0, targetTop - 100);

    await expect(
      page.getByRole('link', {
        name: 'When to use it—and when not to',
        exact: true,
      }),
    ).toHaveClass(/text-primary/);
  });

  test('should render localized detail metadata and declared Practice links', async ({
    page,
  }) => {
    await page.goto('/id/learn/javascript-fundamentals-for-qa');
    await expect(page.locator('h1')).toContainText(
      'JavaScript yang Perlu Kamu Tahu untuk QA Automation',
    );
    await expect(
      page.locator('meta[name="description"]').last(),
    ).toHaveAttribute('content', /Gunakan JavaScript untuk mengatur test data/);
    await expect(page.getByTestId('related-practice-links')).toContainText(
      'Latihan',
    );
    await expect(
      page.locator('a[href*="/id/practice/js-variables-types"]'),
    ).toBeVisible();
    await expect(page.getByTestId('lesson-status')).toBeVisible();
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

    await expect(page.getByTestId('lesson-status-value')).toHaveText(
      'Not completed',
    );
    await expect(
      page.getByTestId('lesson-status').getByRole('button'),
    ).toHaveCount(0);

    const completeButton = page
      .getByTestId('lesson-completion-footer')
      .getByRole('button', { name: 'Sign in to Save Progress' });
    await expect(completeButton).toBeVisible();
    await completeButton.click();
    await expect(page.getByRole('dialog')).toContainText(
      'Sign in to Save Progress',
    );
  });

  test('should offer completion after the lesson content at every breakpoint', async ({
    page,
  }) => {
    for (const viewport of [
      { width: 753, height: 1044 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/en/learn/css-selector-strategies');

      const completionFooter = page.getByTestId('lesson-completion-footer');
      await completionFooter.scrollIntoViewIfNeeded();

      await expect(completionFooter).toBeVisible();
      await expect(page.getByTestId('lesson-status-value')).toHaveText(
        'Not completed',
      );
      await expect(
        page.getByTestId('lesson-status').getByRole('button'),
      ).toHaveCount(0);
      await expect(
        page.getByRole('button', { name: 'Mark lesson complete' }),
      ).toHaveCount(1);
      await expect(
        completionFooter.getByRole('button', {
          name: 'Mark lesson complete',
        }),
      ).toBeVisible();
      await expect(
        completionFooter.getByRole('heading', { name: 'Finished reading?' }),
      ).toBeVisible();
    }
  });

  test('should mark tutorial as complete and persist it', async ({ page }) => {
    const firstTutorial = tutorialsPage.tutorialCards.first();
    await firstTutorial.click();
    await tutorialsPage.verifyTutorialContent();

    await expect(tutorialsPage.completeButton).toBeEnabled();
    await expect(tutorialsPage.completeButton).toBeVisible({ timeout: 10000 });
    await tutorialsPage.completeTutorial();
    await expect(
      page.getByText('Lesson completed! 🎉', { exact: true }),
    ).toBeVisible();

    await page.reload();
    await tutorialsPage.verifyTutorialContent();
    await expect(page.getByTestId('lesson-status-value')).toHaveText(
      'Completed',
    );
  });
});
