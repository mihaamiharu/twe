import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { ProfilePage } from '../pages/ProfilePage';
import { SettingsPage } from '../pages/SettingsPage';
import { loginViaApi } from '../utils/auth';

/**
 * Basic Application Scenarios
 * Covers core visibility and navigation checks across Dashboard, Profile, and Settings
 */
test.describe('Expanded Application Scenarios', () => {
  let dashboardPage: DashboardPage;
  let profilePage: ProfilePage;
  let settingsPage: SettingsPage;

  test.beforeEach(async ({ page, context, request }) => {
    // Log in before each test to ensure access to authenticated routes
    console.log('Attempting E2E login...');
    await loginViaApi(context, request, page);

    dashboardPage = new DashboardPage(page);
    profilePage = new ProfilePage(page);
    settingsPage = new SettingsPage(page);
  });

  test('Dashboard: should display core components and stats', async ({
    page,
  }) => {
    await dashboardPage.goto();
    console.log('Dashboard URL:', page.url());
    await dashboardPage.verifyDashboardVisible();
    await dashboardPage.verifyStats();

    // Check if featured challenges are present
    const section = dashboardPage.page
      .locator('section')
      .filter({
        has: dashboardPage.page.getByRole('heading', {
          name: /Featured Challenges/i,
        }),
      });
    const challenges = section.locator('a.glass-card');
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

  test('Settings: should allow navigating back to profile', async ({
    page,
  }) => {
    await settingsPage.goto();
    console.log('Settings URL:', page.url());

    // Verify we are on settings page
    await expect(
      settingsPage.page
        .getByRole('heading', { level: 1, name: /Settings/i })
        .first(),
    ).toBeVisible();

    // Test back to profile link
    await settingsPage.backToProfile();
    await expect(page).toHaveURL(/.*profile$/);
  });
});
