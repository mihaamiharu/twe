import { expect, test } from '@playwright/test';

test.describe('Challenge list row layout', () => {
  test('keeps desktop metadata columns aligned', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/en/challenges');

    const list = page.getByTestId('challenge-library-list').first();
    await expect(list).toBeVisible();
    await expect(page.getByTestId('challenge-list-row').first()).toBeVisible();

    const readEdge = async (
      testId: string,
      edge: 'left' | 'right',
    ): Promise<number[]> =>
      page.getByTestId(testId).evaluateAll(
        (elements, selectedEdge) =>
          elements.map((element) => {
            const rect = element.getBoundingClientRect();
            return Math.round(
              selectedEdge === 'left' ? rect.left : rect.right,
            );
          }),
        edge,
      );

    const difficultyLeft = await readEdge('challenge-row-difficulty', 'left');
    const completionLeft = await readEdge('challenge-row-completion', 'left');
    const xpRight = await readEdge('challenge-row-xp', 'right');
    const actionRight = await readEdge('challenge-row-action', 'right');

    expect(new Set(difficultyLeft).size).toBe(1);
    expect(new Set(completionLeft).size).toBe(1);
    expect(new Set(xpRight).size).toBe(1);
    expect(new Set(actionRight).size).toBe(1);

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });

  test('does not overflow on mobile rows', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/en/challenges');

    const firstRow = page.getByTestId('challenge-list-row').first();
    await expect(firstRow).toBeVisible();
    await expect(firstRow.getByTestId('challenge-row-action')).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
});
