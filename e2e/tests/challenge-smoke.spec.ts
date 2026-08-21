import { expect, test } from '@playwright/test';

test.describe('Challenge smoke', () => {
  test('loads and executes a selector challenge without a session', async ({
    page,
  }) => {
    await page.goto('/en/challenges/css-selector-101-id-class');
    await page.waitForLoadState('networkidle');

    const xpathButton = page.getByRole('button', {
      name: 'XPath',
      exact: true,
    });
    await expect(xpathButton).toBeVisible({ timeout: 20_000 });
    await xpathButton.click();
    await expect(page.getByPlaceholder(/Enter XPath/i)).toBeVisible();

    await page.getByRole('button', { name: 'CSS', exact: true }).click();
    const selectorInput = page.getByPlaceholder(/Enter CSS selector/i);
    await selectorInput.fill('#login-btn');
    await page.getByRole('button', { name: 'Test Selector' }).click();

    await expect(page.getByText(/Correct/i)).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole('button', { name: 'Submit' })).toBeEnabled();
  });
});
