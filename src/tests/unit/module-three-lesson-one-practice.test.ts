import { describe, expect, it } from 'bun:test';
import { validateChallengeExecution } from '@/core/executor/challenge-validator';
import { executePlaywrightCode } from '@/core/executor/iframe-executor';
import { getChallengeCatalogDetail } from '@/server/content-catalog.server';

const challengeSlug = 'pw-first-test';

async function runAttempt(code: string) {
  const challenge = await getChallengeCatalogDetail(challengeSlug, 'en');
  if (!challenge?.files || !challenge.expectedState || !challenge.validation) {
    throw new Error(
      `${challengeSlug} must provide files, final state, and runtime validation`,
    );
  }

  const execution = await executePlaywrightCode(code, '<div></div>', {
    timeout: 10_000,
    files: challenge.files,
    expectedState: challenge.expectedState,
    validation: challenge.validation,
    strictMode: true,
    isTypeScript: false,
  });

  return {
    challenge,
    execution,
    grading: validateChallengeExecution(execution, challenge.validation),
  };
}

describe('Module 3 Lesson 1 Core Practice', () => {
  it('passes the reference Cart action followed by its visible outcome', async () => {
    const challenge = await getChallengeCatalogDetail(challengeSlug, 'en');
    if (!challenge) throw new Error(`${challengeSlug} is unavailable`);

    const { execution, grading } = await runAttempt(challenge.solution);

    expect(execution.status).toBe('PASSED');
    expect(grading).toEqual({ passed: true });
  });

  it('rejects an assertion made before the Cart action', async () => {
    const { execution, grading } = await runAttempt(`
      import { test, expect } from '@playwright/test';

      test('customer can open the cart', async ({ page }) => {
        await page.goto('/app/products.html');
        await expect(
          page.getByRole('heading', { name: 'Products' }),
        ).toBeVisible();
        await page.getByRole('link', { name: 'Cart' }).click();
      });
    `);

    expect(execution.status).toBe('PASSED');
    expect(grading).toEqual({
      passed: false,
      failure: {
        kind: 'missing-required-evidence',
        methods: ['toBeVisible'],
      },
    });
  });

  it('rejects direct navigation backed by a dead-code Cart click', async () => {
    const { execution, grading } = await runAttempt(`
      import { test, expect } from '@playwright/test';

      test('customer can open the cart', async ({ page }) => {
        await page.goto('/app/products.html');
        if (false) {
          await page.getByRole('link', { name: 'Cart' }).click();
        }
        await page.goto('/app/cart.html');
        await expect(
          page.getByRole('heading', { name: 'Your cart' }),
        ).toBeVisible();
      });
    `);

    expect(execution.status).toBe('PASSED');
    expect(grading).toEqual({
      passed: false,
      failure: {
        kind: 'missing-required-evidence',
        methods: ['click', 'toBeVisible'],
      },
    });
  });
});
