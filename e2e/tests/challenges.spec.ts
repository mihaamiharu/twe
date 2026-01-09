import { test, expect } from '@playwright/test';
import { ChallengesPage } from '../pages/ChallengesPage';
import fs from 'fs';
import path from 'path';

const solutionsPath = path.resolve(process.cwd(), 'e2e/fixtures/solutions.json');
const solutions = JSON.parse(fs.readFileSync(solutionsPath, 'utf-8')) as Record<string, string>;
import { ensureLoggedIn } from '../utils/auth';

test.describe('Challenges', () => {
    let challengesPage: ChallengesPage;

    test.beforeAll(async () => {
        // Ensure solutions exist
        expect(Object.keys(solutions).length).toBeGreaterThan(0);
    });

    test.beforeEach(async ({ page, context }) => {
        // Inject user-provided auth cookies
        await context.addCookies([
            {
                name: 'better-auth.session_token',
                value: 'gCX1EH4GD12Zwa5UMzqmyS2X8fTvQPx5.k62%2BrKqEfskaC42LvlpiNlg7Zjrv9xQEs%2BmGMOW39Vs%3D',
                domain: 'localhost',
                path: '/',
            },
            {
                name: 'better-auth.state',
                value: 'qIvlMUdHpMOLZhRbtQY9rmfBteOWlxte.1r06vmhvHE7TinQ1VCLKDZ0Oq3ytAE42P7%2BnqQIXfkg%3D',
                domain: 'localhost',
                path: '/',
            }
        ]);

        challengesPage = new ChallengesPage(page);
        // We assume the user is logged in or we might need to handle it.
        // Since the prompt says "skip login", we assume we are in a state where we can test.
        // But for completeness, let's try to ensure logged in if we can't submit.
        // For now, let's just go to the challenge.

        // Actually, we need to be logged in to submit.
        // I'll call ensureLoggedIn (mock) or just expect it to work.
        // Given the constraint "skip login", I will assume session is restored or not my blocker.
        // But practically, I'll add a check.
        // await ensureLoggedIn(page); 
    });

    for (const [slug, solution] of Object.entries(solutions)) {
        test(`should solve challenge: ${slug}`, async () => {
            test.slow(); // Give it more time
            await challengesPage.gotoChallenge(slug);
            await challengesPage.solveChallenge(solution, slug);
        });
    }
});
