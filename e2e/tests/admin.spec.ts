import { test, expect } from '@playwright/test';
import { AdminPage } from '../pages/AdminPage';
import { loginViaApi } from '../utils/auth';

test.describe('Admin Panel', () => {
  let adminPage: AdminPage;

  test.beforeEach(async ({ page, context, request }) => {
    await loginViaApi(
      context,
      request,
      page,
      'ekkithedestroyer@gmail.com',
      'ekkithedestroyer@gmail.com',
    );
    adminPage = new AdminPage(page);
  });

  test('Admin Dashboard: should display stats and core links', async () => {
    await adminPage.goto();

    // Verify we are on admin page (might redirect if not admin, but let's assume kikkawa23 is)
    await adminPage.verifyAdminVisible();
    await expect(adminPage.statsCards).toHaveCount(4); // Users, Solved, Feedback, Reports

    await expect(adminPage.bugReportsLink).toBeVisible();
    await expect(adminPage.userModerationLink).toBeVisible();
    await expect(adminPage.challengeManagerLink).toBeVisible();
  });

  test('Admin: should show recent submissions table', async () => {
    await adminPage.goto();
    await expect(adminPage.submissionsTable).toBeVisible();

    const rows = adminPage.submissionsTable.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
