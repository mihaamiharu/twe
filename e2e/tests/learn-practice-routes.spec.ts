import { expect, test } from '@playwright/test';

const routeCases = [
  {
    kind: 'learn',
    listPath: '/learn',
    detailPath: '/learn/dom-tree-hierarchy',
  },
  {
    kind: 'practice',
    listPath: '/practice',
    detailPath: '/practice/css-selector-101-id-class',
  },
] as const;

test.describe('Learn and Practice public routes', () => {
  for (const locale of ['en', 'id'] as const) {
    for (const routeCase of routeCases) {
      test(`${locale} ${routeCase.kind} list and detail resolve`, async ({
        page,
      }) => {
        await page.goto(`/${locale}${routeCase.listPath}`);
        await expect(page.locator('[data-not-found-page]')).toHaveCount(0);
        await expect(
          page.getByRole('heading', { level: 1 }).first(),
        ).toBeVisible();

        await page.goto(`/${locale}${routeCase.detailPath}`);
        await expect(page.locator('[data-not-found-page]')).toHaveCount(0);
        await expect(
          page.getByRole('heading', { level: 1 }).first(),
        ).toBeVisible();
      });
    }
  }

  for (const locale of ['en', 'id'] as const) {
    test(`${locale} unknown Learn lesson uses the branded not-found state`, async ({
      page,
    }) => {
      const requestedUrl = `/${locale}/learn/not-a-real-lesson`;
      await page.goto(requestedUrl);

      await expect.poll(() => new URL(page.url()).pathname).toBe(requestedUrl);
      await expect(page.locator('[data-not-found-page]')).toBeVisible();
    });

    test(`${locale} unknown practice challenge uses the app not-found state`, async ({
      page,
    }) => {
      await page.goto(`/${locale}/practice/does-not-exist`);
      await expect(page.locator('[data-not-found-page]')).toBeVisible();
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        'content',
        'noindex, nofollow',
      );
      await expect(page).toHaveURL(`/${locale}/practice/does-not-exist`);
    });

    for (const legacyPath of [
      '/tutorials',
      '/tutorials/dom-tree-hierarchy',
      '/challenges',
      '/challenges/css-selector-101-id-class',
    ]) {
      test(`${locale}${legacyPath} stays not found without redirect`, async ({
        page,
      }) => {
        const requestedUrl = `/${locale}${legacyPath}`;
        await page.goto(requestedUrl);

        await expect
          .poll(() => new URL(page.url()).pathname)
          .toBe(requestedUrl);
        await expect(page.locator('[data-not-found-page]')).toBeVisible();
      });
    }
  }
});
