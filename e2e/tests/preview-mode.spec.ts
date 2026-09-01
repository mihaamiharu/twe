import { expect, test } from '@playwright/test';

const previewCases = [
  {
    type: 'CSS selector',
    slug: 'css-selector-101-id-class',
    expectedContent: 'System Login',
  },
  {
    type: 'XPath selector',
    slug: 'xpath-basics-101',
    expectedContent: 'Contact Us',
  },
  {
    type: 'JavaScript',
    slug: 'js-variables-types',
    expectedContent: 'Test Runner',
  },
  {
    type: 'TypeScript',
    slug: 'ts-type-annotations',
    expectedContent: 'TC-001 · 10 passed',
  },
  {
    type: 'Playwright HTML',
    slug: 'pw-locator-intro',
    expectedContent: 'Welcome to Playwright',
  },
  {
    type: 'Playwright multi-file',
    slug: 'pom-login-basics',
    expectedContent: 'Sign In',
  },
  {
    type: 'Playwright multi-file capstone',
    slug: 'pw-capstone-checkout',
    expectedContent: 'Checkout',
  },
] as const;

test.describe('Preview mode regressions', () => {
  // Keep the cross-type and cross-device matrix in one browser sequence. This
  // mirrors the user journey and avoids racing the app's challenge loader.
  test.describe.configure({ mode: 'serial' });

  test.describe('Preview source mode', () => {

  for (const previewCase of previewCases) {
    test(`${previewCase.type} survives preview to source and back`, async ({
      page,
    }) => {
      await page.goto(`/en/practice/${previewCase.slug}`);

      const targetPreview = page
        .locator('[role="tab"]:visible')
        .filter({ hasText: 'Target Preview' });
      await expect(targetPreview).toHaveCount(1, { timeout: 20_000 });
      await targetPreview.click();

      const iframe = page.locator('iframe[title="Challenge Preview"]');
      await expect(iframe).toBeVisible({ timeout: 20_000 });
      const frame = page.frameLocator('iframe[title="Challenge Preview"]');
      const frameBody = frame.locator('body');

      await expect(frameBody).toContainText(previewCase.expectedContent);

      await page.locator('button[title="View Source"]').click();
      await expect(
        page.locator('button[title="Visual Preview"]'),
      ).toBeVisible();

      await page.locator('button[title="Visual Preview"]').click();
      await expect(frameBody).toContainText(previewCase.expectedContent);

      const bodyBox = await frameBody.boundingBox();
      expect(bodyBox?.width).toBeGreaterThan(0);
      expect(bodyBox?.height).toBeGreaterThan(0);
    });
  }
  });

  test.describe('Mobile preview source mode', () => {
    test.use({ viewport: { width: 390, height: 844 } });

  test('CSS selector survives preview to source and back on mobile', async ({
    page,
  }) => {
    await page.goto('/en/practice/css-selector-101-id-class');
    await expect(
      page
        .getByRole('heading', { level: 1, name: 'Read an ID Selector' })
        .first(),
    ).toBeVisible({ timeout: 20_000 });

    const previewTab = page
      .locator('[role="tab"]:visible')
      .filter({ hasText: 'Target Preview' });
    await expect(previewTab).toHaveCount(1, { timeout: 20_000 });

    const iframe = page.locator('iframe[title="Challenge Preview"]');
    await expect(iframe).toHaveAttribute('srcdoc', /System Login/, {
      timeout: 20_000,
    });
    await previewTab.click();

    await expect(previewTab).toHaveAttribute('data-state', 'active');
    await expect(iframe).toBeVisible({ timeout: 20_000 });
    const frame = page.frameLocator('iframe[title="Challenge Preview"]');
    const frameBody = frame.locator('body');

    await expect(frameBody).toContainText('System Login');

    await page.locator('button[title="View Source"]').click();
    await page.locator('button[title="Visual Preview"]').click();
    await expect(frameBody).toContainText('System Login');

    const bodyBox = await frameBody.boundingBox();
    expect(bodyBox?.width).toBeGreaterThan(0);
    expect(bodyBox?.height).toBeGreaterThan(0);
    });
  });
});
