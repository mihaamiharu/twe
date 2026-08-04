import { test, expect } from '@playwright/test';

test('opens the course-approved scheduling page', async ({ page }) => {
  test.skip(
    !process.env.TARGET_BASE_URL,
    'Set TARGET_BASE_URL to the course-approved public target before running smoke tests.',
  );

  await page.goto('/');
  await expect(page).toHaveTitle(/.+/);
});
