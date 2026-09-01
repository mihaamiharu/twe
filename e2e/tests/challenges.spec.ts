import { test, expect } from '@playwright/test';
import { ChallengesPage } from '../pages/ChallengesPage';
import fs from 'fs';
import path from 'path';

const solutionsPath = path.resolve(
  process.cwd(),
  'e2e/fixtures/solutions.json',
);
const allSolutions = JSON.parse(fs.readFileSync(solutionsPath, 'utf-8')) as Record<
  string,
  string
>;

type ChallengeCatalog = {
  challenges: Array<{ slug: string; status?: string }>;
};

const challengeContentDirectory = path.resolve(
  process.cwd(),
  'content/challenges',
);
const publishedChallengeSlugs = new Set(
  fs
    .readdirSync(challengeContentDirectory)
    .filter((file) => file.endsWith('.json') && !file.startsWith('_'))
    .flatMap((file) => {
      const catalog = JSON.parse(
        fs.readFileSync(path.join(challengeContentDirectory, file), 'utf-8'),
      ) as ChallengeCatalog;
      return catalog.challenges
        .filter((challenge) => challenge.status !== 'draft')
        .map((challenge) => challenge.slug);
    }),
);

const solutions = Object.entries(allSolutions).filter(([slug]) =>
  publishedChallengeSlugs.has(slug),
);
// import { ensureLoggedIn } from '../utils/auth';

test.describe('Challenges', () => {
  let challengesPage: ChallengesPage;

  test.beforeAll(() => {
    // Ensure solutions exist
    expect(solutions.length).toBeGreaterThan(0);
  });

  test.beforeEach(async ({ page, context, request }) => {
    const { loginViaApi } = await import('../utils/auth');
    await loginViaApi(context, request, page);

    challengesPage = new ChallengesPage(page);
  });

  for (const [slug, solution] of solutions) {
    test(`should solve challenge: ${slug}`, async () => {
      test.slow(); // Give it more time
      await challengesPage.gotoChallenge(slug);
      await challengesPage.solveChallenge(solution, slug);
    });
  }
});
