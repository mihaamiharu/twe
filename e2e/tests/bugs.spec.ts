import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { AdminPage } from '../pages/AdminPage';
import { getE2EAdminCredentials, loginViaApi } from '../utils/auth';

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
    await dashboardPage.goto();
    await page.waitForLoadState('networkidle');

    // Open the bug report dialog
    // Try footer first
    const footerBugButton = page
      .locator('footer')
      .getByRole('button', { name: /Report Bug|Report a Bug|Laporkan Bug/i });
    await footerBugButton.scrollIntoViewIfNeeded();
    await footerBugButton.click();

    await expect(page.getByRole('dialog')).toBeVisible();

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
      .fill('The issue still occurs');

    // Submit
    await page
      .getByRole('button', { name: /Submit Bug Report|Kirim Laporan Bug/i })
      .click();

    // Verify success toast/message
    await expect(
      page.getByText('Bug report submitted!', { exact: true }),
    ).toBeVisible();
  });

  test('admin should be able to see a submitted bug report', async ({
    page,
    context,
    request,
  }) => {
    const { email, password } = getE2EAdminCredentials();
    await loginViaApi(context, request, page, email, password);

    await dashboardPage.goto();
    await page.waitForLoadState('networkidle');

    const footerBugButton = page
      .locator('footer')
      .getByRole('button', { name: /Report Bug|Report a Bug|Laporkan Bug/i });
    await footerBugButton.scrollIntoViewIfNeeded();
    await footerBugButton.click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByLabel(/Bug Title|Judul Bug/i).fill('Admin E2E Bug Report');
    await page
      .getByLabel(/Steps to Reproduce|Langkah/i)
      .fill('1. Open the app\n2. Submit a report\n3. Review the admin table');
    await page
      .getByLabel(/Expected Behavior|Perilaku yang diharapkan/i)
      .fill('The admin should see the submitted report');
    await page
      .getByLabel(/Actual Behavior|Perilaku sebenarnya/i)
      .fill('The report is available in the admin table');
    await page
      .getByRole('button', { name: /Submit Bug Report|Kirim Laporan Bug/i })
      .click();
    await expect(
      page.getByText('Bug report submitted!', { exact: true }),
    ).toBeVisible();

    await adminPage.goto();
    await adminPage.verifyAdminVisible();

    // Navigate to bug reports
    await adminPage.bugReportsLink.click();

    await expect(
      page.getByRole('heading', { level: 1, name: 'Bug Reports' }),
    ).toBeVisible();
    await expect(
      page
        .getByRole('cell', { name: 'Admin E2E Bug Report', exact: true })
        .first(),
    ).toBeVisible();
  });
});
