import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { ProfilePage } from '../pages/ProfilePage';
import { loginViaApi } from '../utils/auth';

/**
 * Basic Application Scenarios
 * Covers core visibility and profile checks across the authenticated experience
 */
test.describe('Expanded Application Scenarios', () => {
  let dashboardPage: DashboardPage;
  let profilePage: ProfilePage;

  test.beforeEach(async ({ page, context, request }) => {
    // Log in before each test to ensure access to authenticated routes
    console.log('Attempting E2E login...');
    await loginViaApi(context, request, page);

    dashboardPage = new DashboardPage(page);
    profilePage = new ProfilePage(page);
  });

  test('Dashboard: should display core components and stats', async ({
    page,
  }) => {
    await dashboardPage.goto();
    console.log('Dashboard URL:', page.url());
    await dashboardPage.verifyDashboardVisible();
    await dashboardPage.verifyStats();

    // Check if featured challenges are present
    const section = dashboardPage.page.locator('section').filter({
      has: dashboardPage.page.getByRole('heading', {
        name: /Real Problem/i,
      }),
    });
    const challenges = section.locator('a[href*="/challenges/"]');
    await expect(challenges).toHaveCount(3);
  });

  test('Profile: should display user information and tabs', async ({
    page,
  }) => {
    await profilePage.goto();
    console.log('Profile URL:', page.url());
    await profilePage.verifyProfileVisible();

    // Basic check for tabs
    await expect(profilePage.tabsList).toBeVisible();

    // Ensure user name matches expectation (case-insensitive or regex)
    await expect(profilePage.userName).toContainText(/kikkawa23/i);
  });

  test('Profile: should expose all progress tabs', async () => {
    await profilePage.goto();

    await expect(profilePage.tabsList).toBeVisible();
    await expect(
      profilePage.page.getByRole('tab', { name: /Progress/i }),
    ).toBeVisible();
    await expect(
      profilePage.page.getByRole('tab', { name: /Activity/i }),
    ).toBeVisible();
    await expect(
      profilePage.page.getByRole('tab', { name: /Achievements/i }),
    ).toBeVisible();
  });
});
