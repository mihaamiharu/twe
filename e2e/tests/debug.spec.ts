import { test } from '../fixtures/test-fixtures';
import { ChallengesPage } from '../pages/ChallengesPage';
import fs from 'fs';
import path from 'path';

const solutionsPath = path.resolve(process.cwd(), 'e2e/fixtures/solutions.json');
const solutions = JSON.parse(fs.readFileSync(solutionsPath, 'utf-8')) as Record<string, string>;

test.describe('Challenges Debug', () => {
    let challengesPage: ChallengesPage;

    test.beforeEach(async ({ authedPage }) => {
        challengesPage = new ChallengesPage(authedPage);
    });

    test('should solve js-arrays-test-data and print diagnostics', async ({ page }) => {
        const slug = 'js-arrays-test-data';
        const solution = solutions[slug];
        await challengesPage.gotoChallenge(slug);

        // Listen for console logs
        page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));

        await challengesPage.solveChallenge(solution, slug);
    });

    test('should solve xpath-basics-101 and print status', async ({ page }) => {
        const slug = 'xpath-basics-101';
        const solution = solutions[slug];
        await challengesPage.gotoChallenge(slug);

        // Log page content roughly or take screenshot if I could (browser tool does recorded video)

        // Try solving
        await challengesPage.solveChallenge(solution, slug);

        // If we reach here, check if logged in warning appeared?
        const loginWarning = page.getByText('You must be logged in');
        if (await loginWarning.isVisible()) {
            console.log('Login warning detected!');
        }
    });
});
