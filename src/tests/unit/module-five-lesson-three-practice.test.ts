import { describe, expect, it } from 'bun:test';
import { validateChallengeExecution } from '@/core/executor/challenge-validator';
import { executePlaywrightCode } from '@/core/executor/iframe-executor';
import { getChallengeCatalogDetail } from '@/server/content-catalog.server';

const challengeSlug = 'pw-iframes';

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

describe('Module 5 Lesson 3 iframe Additional Practice', () => {
  it('runs and grades the reference solution', async () => {
    const challenge = await getChallengeCatalogDetail(challengeSlug, 'en');
    if (!challenge) throw new Error(`${challengeSlug} is unavailable`);

    const result = await runAttempt(challenge.solution);

    expect(result.execution.status).toBe('PASSED');
    expect(result.grading).toEqual({ passed: true });
  });

  it('rejects required calls hidden in dead code', async () => {
    const result = await runAttempt(`test('practice', async ({ page }) => {
  if (false) {
    const frame = page.frameLocator('[title="Secure payment"]');
    const cardNumber = frame.getByLabel('Card number');
    await cardNumber.fill('1234');
    await expect(cardNumber).toHaveValue('1234');
  }
});`);

    expect(result.execution.status).toBe('PASSED');
    expect(result.grading.failure?.kind).toBe('missing-required-evidence');
  });

  it('rejects a passing interaction with the wrong value', async () => {
    const result = await runAttempt(`test('practice', async ({ page }) => {
  const frame = page.frameLocator('[title="Secure payment"]');
  const cardNumber = frame.getByLabel('Card number');
  await cardNumber.fill('9999');
  await expect(cardNumber).toHaveValue('9999');
});`);

    expect(result.execution.status).toBe('PASSED');
    expect(result.grading.failure?.kind).toBe('missing-required-evidence');
  });

  it('requires the confirmed frame title rather than a generic iframe selector', async () => {
    const result = await runAttempt(`test('practice', async ({ page }) => {
  const frame = page.frameLocator('iframe');
  const cardNumber = frame.getByLabel('Card number');
  await cardNumber.fill('1234');
  await expect(cardNumber).toHaveValue('1234');
});`);

    expect(result.execution.status).toBe('PASSED');
    expect(result.grading.failure?.kind).toBe('missing-required-evidence');
  });

  it('rejects a structural field locator inside the frame', async () => {
    const result = await runAttempt(`test('practice', async ({ page }) => {
  const frame = page.frameLocator('[title="Secure payment"]');
  const cardNumber = frame.locator('input');
  await cardNumber.fill('1234');
  await expect(cardNumber).toHaveValue('1234');
});`);

    expect(result.execution.status).toBe('PASSED');
    expect(result.grading.failure?.kind).toBe('structural-locator');
  });

  it('rejects a direct-DOM frame shortcut backed by dead evidence', async () => {
    const result = await runAttempt(`test('practice', async ({ page }) => {
  if (false) {
    const frame = page.frameLocator('[title="Secure payment"]');
    const cardNumber = frame.getByLabel('Card number');
    await cardNumber.fill('1234');
    await expect(cardNumber).toHaveValue('1234');
  }

  await page.evaluate(() => {
    const frame = document.querySelector('iframe');
    const input = frame.contentDocument.querySelector('input');
    input.value = '1234';
  });
});`);

    expect(result.execution.status).toBe('PASSED');
    expect(result.grading.failure?.kind).toBe('direct-dom-access');
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
      '// TODO 3',
    ]);
    expect(english.solution).toContain("from '@playwright/test'");
    expect(english.solution).toContain("test('practice'");
  });
});
