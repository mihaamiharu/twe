import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { TutorialsPage } from '../pages/TutorialsPage';
import { ChallengesPage } from '../pages/ChallengesPage';
import { ProfilePage } from '../pages/ProfilePage';
import { loginViaApi } from '../utils/auth';

test.describe('Indonesian (ID) Locale Scenarios', () => {
  let dashboardPage: DashboardPage;
  let tutorialsPage: TutorialsPage;
  let challengesPage: ChallengesPage;
  let profilePage: ProfilePage;

  test.beforeEach(async ({ page, context, request }) => {
    await loginViaApi(context, request, page);
    dashboardPage = new DashboardPage(page);
    tutorialsPage = new TutorialsPage(page);
    challengesPage = new ChallengesPage(page);
    profilePage = new ProfilePage(page);
  });

  test('ID Dashboard: should display Indonesian content', async ({ page }) => {
    await dashboardPage.goto('id');
    // The rebranded Indonesian homepage starts with the Phase 3 source-of-truth copy.
    await expect(dashboardPage.heroTitle).toContainText(
      /Melampaui sekadar menjalankan test/i,
    );
    await expect(page).toHaveURL(/\/id\/?$/);
  });

  test('ID Tutorials: should list tutorials in ID', async () => {
    await tutorialsPage.gotoList('id');
    await expect(tutorialsPage.tutorialCards.first()).toBeVisible();
    // Check for "Mulai Belajar" or similar ID-specific text if applicable
  });

  test('ID Challenges: should list challenges in ID', async ({ page }) => {
    await challengesPage.gotoList('id');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Semua Tantangan' }),
    ).toBeVisible();
    await expect(
      page.locator('a[href*="/id/challenges/"]').first(),
    ).toBeVisible();

    await page.getByRole('button', { name: /Selektor/ }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Selektor' }),
    ).toBeVisible();
    await expect(page.getByText('Kuasai Selektor CSS dan XPath')).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 3, name: 'Keahlian Inti' }),
    ).toBeVisible();
  });

  test('ID Profile: should display profile in ID context', async ({ page }) => {
    await profilePage.goto('id');
    await profilePage.verifyProfileVisible();
    // Tabs in ID: "Progress", "Aktivitas", "Pencapaian"
    await expect(page.getByRole('tab', { name: /Pencapaian/i })).toBeVisible();
  });
});
