import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { AdminPage } from '../pages/AdminPage';
import { loginViaApi } from '../utils/auth';

test.describe('Bug Reporting Flow', () => {
  let dashboardPage: DashboardPage;
  let adminPage: AdminPage;

  test.beforeEach(async ({ page, context, request }) => {
    // Log in as admin to verify admin visibility later
    await loginViaApi(context, request, page);
    dashboardPage = new DashboardPage(page);
    adminPage = new AdminPage(page);
  });

  test('should submit a bug report successfully', async ({ page }) => {
    test.skip(); // Skipped for manual verification later
    await dashboardPage.goto();

    // Open the bug report dialog
    // Try footer first
    const footerBugButton = page
      .locator('footer')
      .getByRole('button', { name: /Report a Bug|Laporkan Bug/i });
    await footerBugButton.scrollIntoViewIfNeeded();
    await footerBugButton.click();

    // Check if dialog appeared, if not, try the user menu (header)
    try {
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    } catch {
      // Click avatar to open menu
      await page
        .locator('header')
        .getByRole('button', { name: /avatar|user menu/i })
        .first()
        .click();
      await page
        .getByRole('menuitem', { name: /Report Bug|Laporkan Bug/i })
        .click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    }

    // Fill the form
    await page.getByLabel(/Bug Title|Judul Bug/i).fill('E2E Test Bug Report');
    await page
      .getByLabel(/Steps to Reproduce|Langkah/i)
      .fill('1. Open app\n2. Click button\n3. See error');
    await page
      .getByLabel(/Expected Behavior|Perilaku yang diharapkan/i)
      .fill('It should work');
    await page
      .getByLabel(/Actual Behavior|Perilaku sebenarnya/i)
      .fill('It failed');

    // Submit
    await page
      .getByRole('button', { name: /Submit Bug Report|Kirim Laporan Bug/i })
      .click();

    // Verify success toast/message
    await expect(
      page.getByText(/submitted successfully|berhasil dikirim/i),
    ).toBeVisible();
  });

  test('admin should be able to see the bug report', async ({ page }) => {
    // Skipping as the test user relies on seed data and may not have admin privileges in all environments
    test.skip();

    // We assume we are logged in as admin from beforeEach
    await adminPage.goto();
    await adminPage.verifyAdminVisible();

    // Navigate to bug reports
    await adminPage.bugReportsLink.click();

    // Verify the bug report we just submitted (or at least the table exists)
    await expect(page.locator('h1')).toContainText(/bug reports|laporan bug/i);

    // Check if the report is in the table (Wait a bit for DB sync)
    await expect(page.getByText('E2E Test Bug Report')).toBeVisible({
      timeout: 10000,
    });
  });
});
