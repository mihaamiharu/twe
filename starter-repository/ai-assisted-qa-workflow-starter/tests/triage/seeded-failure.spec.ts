import { test, expect } from '@playwright/test';

test('triage: repair this deliberately broken locator', async ({ page }) => {
  test.fixme(
    true,
    'Remove this marker after reading docs/reports/failure-packet.md.',
  );

  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'This deliberately incorrect heading' }),
  ).toBeVisible();
});
