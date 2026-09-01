import { describe, expect, it } from 'bun:test';
import { validateChallengeExecution } from '@/core/executor/challenge-validator';
import { executePlaywrightCode } from '@/core/executor/iframe-executor';
import { getChallengeCatalogDetail } from '@/server/content-catalog.server';

const mappedPractices = [
  'pw-actions-boss',
  'pw-fill-type',
  'pw-checkbox-radio',
  'pw-select-dropdowns',
  'pw-keyboard-actions',
  'pw-file-upload',
] as const;

const misleadingAttempts = [
  {
    slug: 'pw-fill-type',
    code: `test('practice', async ({ page }) => {
  await page.getByLabel('Email').fill('qa@test.com');
  await page.getByLabel('Password').fill('secret123');
  await expect(page.getByLabel('Password')).toHaveValue('secret123');
});`,
  },
  {
    slug: 'pw-checkbox-radio',
    code: `test('practice', async ({ page }) => {
  const terms = page.getByLabel('Accept Terms & Conditions');
  await terms.click();
  await expect(terms).toBeChecked();
});`,
  },
  {
    slug: 'pw-select-dropdowns',
    code: `test('practice', async ({ page }) => {
  const language = page.getByLabel('Choose Language:');
  await language.selectOption('javascript');
  await expect(language).toHaveValue(/java/);
});`,
  },
  {
    slug: 'pw-keyboard-actions',
    code: `test('practice', async ({ page }) => {
  const search = page.getByRole('searchbox');
  await search.fill('Playwright');
  await search.press('Enter');
  await expect(page.getByRole('status')).toContainText('Playwright');
});`,
  },
  {
    slug: 'pw-file-upload',
    code: `test('practice', async ({ page }) => {
  await page.getByLabel('Upload Resume').setInputFiles('resume.pdf');
  await expect(page.getByRole('status')).toContainText('Selected');
});`,
  },
  {
    slug: 'pw-actions-boss',
    code: `test('practice', async ({ page }) => {
  await page.getByRole('button', { name: 'Add to Cart' }).click();
  await page.getByLabel('Quantity').fill('3');
  await page.getByLabel('Express Shipping').check();
  await page.getByRole('button', { name: 'Checkout' }).click();
  await expect(page.getByRole('status')).toContainText('Express');
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
      ...(challenge.expectedState === undefined
        ? {}
        : { expectedState: challenge.expectedState }),
      strictMode: true,
      isTypeScript: true,
    },
  );

  return {
    execution,
    grading: validateChallengeExecution(execution, challenge.validation),
  };
}

describe('Module 5 Lesson 1 interaction practices', () => {
  for (const slug of mappedPractices) {
    it(`${slug} runs its reference solution`, async () => {
      const challenge = await getChallengeCatalogDetail(slug, 'en');
      if (!challenge) throw new Error(`${slug} is unavailable`);

      const result = await runAttempt(slug, challenge.solution);

      expect(result.execution.status).toBe('PASSED');
      expect(result.grading).toEqual({ passed: true });
    });
  }

  for (const attempt of misleadingAttempts) {
    it(`${attempt.slug} rejects passing but incomplete evidence`, async () => {
      const result = await runAttempt(attempt.slug, attempt.code);

      expect(result.execution.status).toBe('PASSED');
      expect(result.grading.passed).toBe(false);
      expect(result.grading.failure?.kind).toBe('missing-required-evidence');
    });
  }

  it('rejects the former direct-DOM checkout shortcut', async () => {
    const result = await runAttempt(
      'pw-actions-boss',
      `test('practice', async ({ page }) => {
  if (false) {
    await page.getByRole('button').click();
    await page.getByLabel('Quantity').fill('3');
    await page.getByLabel('Express Shipping').check();
    await expect(page.getByRole('status')).toContainText('3 items (Express)');
  }

  await page.evaluate(() => {
    document.querySelector('.cart').style.display = 'block';
    document.getElementById('qty').value = '3';
    document.getElementById('express').checked = true;
    document.getElementById('confirmation').style.display = 'block';
    document.getElementById('confirmation').textContent =
      'Order confirmed: 3 items (Express)';
  });
});`,
    );

    expect(result.execution.status).toBe('PASSED');
    expect(result.grading.failure?.kind).toBe('direct-dom-access');
  });

  it('keeps shared code locale-neutral and reference solutions complete', async () => {
    for (const slug of mappedPractices) {
      const [english, indonesian] = await Promise.all([
        getChallengeCatalogDetail(slug, 'en'),
        getChallengeCatalogDetail(slug, 'id'),
      ]);
      if (!english || !indonesian) {
        throw new Error(`${slug} is missing a locale`);
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
