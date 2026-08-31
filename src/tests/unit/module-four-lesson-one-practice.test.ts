import { describe, expect, it } from 'bun:test';
import { validateChallengeExecution } from '@/core/executor/challenge-validator';
import { executePlaywrightCode } from '@/core/executor/iframe-executor';
import { getChallengeCatalogDetail } from '@/server/content-catalog.server';

const practiceCases = [
  {
    slug: 'pw-get-by-role',
    shortcut: `
await page.getByRole('button').first().click();
await expect(page.getByRole('status')).toHaveText('Signed up!');`,
    structuralShortcut: `
if (false) {
  await page.getByRole('button', { name: 'Sign Up' }).click();
  await expect(page.getByRole('status')).toHaveText('Signed up!');
}
await page.locator('button:nth-of-type(1)').click();
await expect(page.locator('#result')).toHaveText('Signed up!');`,
  },
  {
    slug: 'pw-get-by-text',
    shortcut: `
await expect(page.getByText('Order complete')).toBeVisible();`,
    structuralShortcut: `
if (false) {
  await expect(
    page.getByText('Order complete', { exact: true }),
  ).toBeVisible();
}
await expect(page.locator('h2')).toBeVisible();`,
  },
  {
    slug: 'pw-get-by-label',
    shortcut: `
await page.getByLabel('Username').fill('testuser');
await expect(page.getByLabel('Username')).toHaveValue('testuser');`,
    structuralShortcut: `
if (false) {
  await page.getByLabel('Username').fill('testuser');
  await page.getByLabel('Password').fill('practice-pass');
  await expect(page.getByLabel('Username')).toHaveValue('testuser');
}
await page.locator('#user').fill('testuser');
await page.locator('#pass').fill('practice-pass');
await expect(page.locator('#user')).toHaveValue('testuser');`,
  },
  {
    slug: 'pw-get-by-testid',
    shortcut: `
await page.getByRole('button').first().click();
await expect(page.getByTestId('cart-count')).toHaveText('1');`,
    structuralShortcut: `
if (false) {
  await page.getByRole('button', { name: 'Add to Cart' }).click();
  await expect(page.getByTestId('cart-count')).toHaveText('1');
}
await page.locator('button:nth-of-type(1)').click();
await expect(page.locator('#cart-count')).toHaveText('1');`,
  },
] as const;

function wrapInLearnerTest(body: string): string {
  return `test('practice', async ({ page }) => {\n${body}\n});`;
}

async function runAttempt(slug: string, body: string) {
  const challenge = await getChallengeCatalogDetail(slug, 'en');
  if (!challenge?.validation) {
    throw new Error(`${slug} must provide a validation contract`);
  }

  const execution = await executePlaywrightCode(
    wrapInLearnerTest(body),
    challenge.htmlContent ?? '<div></div>',
    {
      timeout: 10_000,
      validation: challenge.validation,
      strictMode: true,
      isTypeScript: true,
    },
  );

  return {
    execution,
    grading: validateChallengeExecution(execution, challenge.validation),
  };
}

describe('Module 4 Lesson 1 locator practices', () => {
  for (const practice of practiceCases) {
    it(`${practice.slug} runs its reference solution`, async () => {
      const challenge = await getChallengeCatalogDetail(practice.slug, 'en');
      if (!challenge) throw new Error(`${practice.slug} is unavailable`);

      const result = await runAttempt(practice.slug, challenge.solution);

      expect(result.execution.status).toBe('PASSED');
      expect(result.grading).toEqual({ passed: true });
    });

    it(`${practice.slug} rejects its realistic shortcut`, async () => {
      const result = await runAttempt(practice.slug, practice.shortcut);

      expect(result.grading.passed).toBe(false);
    });

    it(`${practice.slug} rejects structural work hidden behind dead evidence`, async () => {
      const result = await runAttempt(
        practice.slug,
        practice.structuralShortcut,
      );

      expect(result.execution.status).toBe('PASSED');
      expect(result.grading).toEqual({
        passed: false,
        failure: { kind: 'structural-locator' },
      });
    });
  }

  it('keeps shared starter code locale-neutral', async () => {
    for (const practice of practiceCases) {
      const [english, indonesian] = await Promise.all([
        getChallengeCatalogDetail(practice.slug, 'en'),
        getChallengeCatalogDetail(practice.slug, 'id'),
      ]);
      if (!english || !indonesian) {
        throw new Error(`${practice.slug} is missing a locale`);
      }

      expect(english.starterCode).toBe(indonesian.starterCode);
      expect(english.htmlContent).toBe(indonesian.htmlContent);
      const comments = english.starterCode?.match(/\/\/[^\n]*/g) ?? [];
      expect(comments.length).toBeGreaterThan(0);
      expect(
        comments.every(
          (comment, index) => comment === `// TODO ${index + 1}`,
        ),
      ).toBe(true);
    }
  });
});
