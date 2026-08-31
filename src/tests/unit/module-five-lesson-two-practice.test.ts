import { describe, expect, it } from 'bun:test';
import { validateChallengeExecution } from '@/core/executor/challenge-validator';
import { executePlaywrightCode } from '@/core/executor/iframe-executor';
import { getChallengeCatalogDetail } from '@/server/content-catalog.server';

const challengeSlug = 'pw-action-outcome-sync';

async function runAttempt(code: string) {
  const challenge = await getChallengeCatalogDetail(challengeSlug, 'en');
  if (!challenge?.validation) {
    throw new Error(`${challengeSlug} must provide a validation contract`);
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

describe('Module 5 Lesson 2 actionability practice', () => {
  it('runs and grades the reference solution', async () => {
    const challenge = await getChallengeCatalogDetail(challengeSlug, 'en');
    if (!challenge) throw new Error(`${challengeSlug} is unavailable`);

    const result = await runAttempt(challenge.solution);

    expect(result.execution.status).toBe('PASSED');
    expect(result.grading).toEqual({ passed: true });
  });

  it('rejects the former dead-code and direct-DOM shortcut', async () => {
    const result = await runAttempt(`test('practice', async ({ page }) => {
  if (false) {
    await page.getByRole('button', { name: 'Save profile' }).click();
    await expect(page.getByRole('status')).toHaveText('Profile saved');
  }

  await page.evaluate(() => {
    document.querySelector('[role=status]').textContent = 'Profile saved';
  });
});`);

    expect(result.execution.status).toBe('PASSED');
    expect(result.grading.failure?.kind).toBe('direct-dom-access');
  });

  it('rejects a forced click', async () => {
    const result = await runAttempt(`test('practice', async ({ page }) => {
  await page
    .getByRole('button', { name: 'Save profile' })
    .click({ force: true });
  await expect(page.getByRole('status')).toHaveText('Profile saved');
});`);

    expect(result.execution.status).toBe('PASSED');
    expect(result.grading.failure?.kind).toBe('forced-action');
  });

  it('rejects a fixed sleep even when the observable outcome is asserted', async () => {
    const result = await runAttempt(`test('practice', async ({ page }) => {
  await page.getByRole('button', { name: 'Save profile' }).click();
  await page.waitForTimeout(200);
  await expect(page.getByRole('status')).toHaveText('Profile saved');
});`);

    expect(result.execution.status).toBe('PASSED');
    expect(result.grading.failure?.kind).toBe('forbidden-method');
    expect(result.grading.failure?.methods).toContain('waitForTimeout');
  });

  it('rejects a passing assertion with the wrong expected value', async () => {
    const result = await runAttempt(`test('practice', async ({ page }) => {
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByRole('status')).toHaveText(/saved/);
});`);

    expect(result.execution.status).toBe('PASSED');
    expect(result.grading.failure?.kind).toBe('missing-required-evidence');
  });

  it('rejects evidence recorded before the action outcome', async () => {
    const result = await runAttempt(`test('practice', async ({ page }) => {
  const status = page.getByRole('status');
  await expect(status).toHaveText('Not saved');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await new Promise((resolve) => setTimeout(resolve, 200));
});`);

    expect(result.execution.status).toBe('PASSED');
    expect(result.grading.failure?.kind).toBe('missing-required-evidence');
  });

  it('keeps shared code locale-neutral and the solution complete', async () => {
    const [english, indonesian] = await Promise.all([
      getChallengeCatalogDetail(challengeSlug, 'en'),
      getChallengeCatalogDetail(challengeSlug, 'id'),
    ]);
    if (!english || !indonesian) {
      throw new Error(`${challengeSlug} is missing a locale`);
    }

    expect(english.starterCode).toBe(indonesian.starterCode);
    expect(english.htmlContent).toBe(indonesian.htmlContent);
    expect(english.starterCode?.match(/\/\/[^\n]*/g)).toEqual([
      '// TODO 1',
      '// TODO 2',
    ]);
    expect(english.solution).toContain("from '@playwright/test'");
    expect(english.solution).toContain("test('practice'");
  });
});
