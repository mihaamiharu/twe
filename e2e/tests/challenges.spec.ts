import { test, expect } from '@playwright/test';
import { ChallengesPage } from '../pages/ChallengesPage';
import fs from 'fs';
import path from 'path';

const solutionsPath = path.resolve(process.cwd(), 'e2e/fixtures/solutions.json');
const solutions = JSON.parse(fs.readFileSync(solutionsPath, 'utf-8')) as Record<string, string>;
// import { ensureLoggedIn } from '../utils/auth';

test.describe('Challenges', () => {
    let challengesPage: ChallengesPage;

    test.beforeAll(async () => {
        // Ensure solutions exist
        expect(Object.keys(solutions).length).toBeGreaterThan(0);
    });

    test.beforeEach(async ({ page, context, request }) => {
        const { loginViaApi } = await import('../utils/auth');
        await loginViaApi(context, request, page);

        challengesPage = new ChallengesPage(page);
    });

    for (const [slug, solution] of Object.entries(solutions)) {
        test(`should solve challenge: ${slug}`, async () => {
            test.slow(); // Give it more time
            await challengesPage.gotoChallenge(slug);
            await challengesPage.solveChallenge(solution, slug);
        });
    }
});
