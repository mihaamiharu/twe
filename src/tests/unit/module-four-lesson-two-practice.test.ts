import { describe, expect, it } from 'bun:test';
import { validateChallengeExecution } from '@/core/executor/challenge-validator';
import { executePlaywrightCode } from '@/core/executor/iframe-executor';
import { getChallengeCatalogDetail } from '@/server/content-catalog.server';

const practiceCases = [
  {
    slug: 'pw-list-items',
    shortcut: `test('practice', async ({ page }) => {
  if (false) page.getByRole('listitem');
  await expect(page.locator('li')).toHaveCount(5);
});`,
  },
  {
    slug: 'pw-dynamic-table',
    shortcut: `test('practice', async ({ page }) => {
  const row = page.getByRole('row').filter({ hasText: 'Project' }).first();
  await expect(row).toHaveCount(1);
  await row.getByRole('button', { name: 'Complete' }).click();
  await expect(row.getByRole('status')).toHaveText('Done');
});`,
  },
  {
    slug: 'pw-locators-boss',
    shortcut: `test('practice', async ({ page }) => {
  const card = page
    .getByRole('article')
    .filter({ hasText: 'Widget Pro' })
    .first();
  await expect(card).toHaveCount(1);
  await card.getByRole('button', { name: 'Add to Cart' }).click();
  await expect(page.getByRole('status')).toHaveText('Added Widget Pro!');
});`,
  },
] as const;

async function runAttempt(slug: string, code: string) {
  const challenge = await getChallengeCatalogDetail(slug, 'en');
  if (!challenge?.validation) {
    throw new Error(`${slug} must provide a validation contract`);
  }

  const execution = await executePlaywrightCode(
    code,
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

describe('Module 4 Lesson 2 composed locator practices', () => {
  for (const practice of practiceCases) {
    it(`${practice.slug} runs its reference solution`, async () => {
      const challenge = await getChallengeCatalogDetail(practice.slug, 'en');
      if (!challenge) throw new Error(`${practice.slug} is unavailable`);

      const result = await runAttempt(practice.slug, challenge.solution);

      expect(result.execution.status).toBe('PASSED');
      expect(result.grading).toEqual({ passed: true });
    });

    it(`${practice.slug} rejects its former shortcut`, async () => {
      const result = await runAttempt(practice.slug, practice.shortcut);

      expect(result.execution.status).toBe('PASSED');
      expect(result.grading.passed).toBe(false);
    });
  }

  it('requires the Project X action and assertion to stay inside its row', async () => {
    const result = await runAttempt(
      'pw-dynamic-table',
      `test('practice', async ({ page }) => {
  const projectX = page.getByRole('row').filter({ hasText: 'Project X' });
  await expect(projectX).toHaveCount(1);

  const projectY = page.getByRole('row').filter({ hasText: 'Project Y' });
  await projectY.getByRole('button', { name: 'Complete' }).click();
  await expect(projectY.getByRole('status')).toHaveText('Done');
});`,
    );

    expect(result.execution.status).toBe('PASSED');
    expect(result.grading).toEqual({
      passed: false,
      failure: {
        kind: 'missing-required-evidence',
        methods: ['click', 'toHaveText'],
      },
    });
  });

  it('requires the product action to remain inside the filtered card', async () => {
    const result = await runAttempt(
      'pw-locators-boss',
      `test('practice', async ({ page }) => {
  const card = page
    .getByRole('article')
    .filter({
      has: page.getByRole('heading', { name: 'Widget Pro', exact: true }),
    })
    .filter({ has: page.getByText('In Stock', { exact: true }) });
  await expect(card).toHaveCount(1);

  const implementationCard = page.getByTestId('product-2');
  await implementationCard
    .getByRole('button', { name: 'Add to Cart' })
    .click();
  await expect(page.getByRole('status')).toHaveText('Added Widget Pro!');
});`,
    );

    expect(result.execution.status).toBe('PASSED');
    expect(result.grading).toEqual({
      passed: false,
      failure: {
        kind: 'missing-required-evidence',
        methods: ['click', 'toHaveText'],
      },
    });
  });

  it('keeps shared starter code locale-neutral and solutions complete', async () => {
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
      expect(english.solution).toContain("from '@playwright/test'");
      expect(english.solution).toContain("test('practice'");
    }
  });
});
