import { describe, expect, it } from 'bun:test';
import { validateChallengeExecution } from '@/core/executor/challenge-validator';
import { executePlaywrightCode } from '@/core/executor/iframe-executor';
import { getChallengeCatalogDetail } from '@/server/content-catalog.server';

const challengeSlug = 'pw-debug-flaky-test';

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

describe('Module 7 Lesson 3 flaky-test debugging Core Practice', () => {
  it('runs and grades the reference solution', async () => {
    const challenge = await getChallengeCatalogDetail(challengeSlug, 'en');
    if (!challenge) throw new Error(`${challengeSlug} is unavailable`);

    const result = await runAttempt(challenge.solution);

    expect(result.execution.status).toBe('PASSED');
    expect(result.grading).toEqual({ passed: true });
  });

  it('rejects required calls hidden in dead code plus direct DOM mutation', async () => {
    const result = await runAttempt(`test('practice', async ({ page }) => {
  if (false) {
    const targetOrder = page.getByRole('article').filter({
      has: page.getByRole('heading', {
        name: 'Order ORD-1042',
        exact: true,
      }),
    });
    await expect(targetOrder).toHaveCount(1);
    await targetOrder.getByRole('button', { name: 'Submit order' }).click();
    await expect(targetOrder.getByRole('status')).toHaveText(
      'Order submitted: ORD-1042',
    );
  }

  await page.evaluate(() => {
    document.querySelector('[data-order-id="ORD-1042"] [role=status]').textContent =
      'Order submitted: ORD-1042';
  });
});`);

    expect(result.execution.status).toBe('PASSED');
    expect(result.grading.failure?.kind).toBe('direct-dom-access');
  });

  it('rejects a structural-selector shortcut backed by dead evidence', async () => {
    const result = await runAttempt(`test('practice', async ({ page }) => {
  if (false) {
    const targetOrder = page.getByRole('article').filter({
      has: page.getByRole('heading', {
        name: 'Order ORD-1042',
        exact: true,
      }),
    });
    await expect(targetOrder).toHaveCount(1);
    await targetOrder.getByRole('button', { name: 'Submit order' }).click();
  }

  await page.locator('[data-order-id="ORD-1042"] button').click();
  await expect(
    page.locator('[data-order-id="ORD-1042"] [role=status]'),
  ).toHaveText('Order submitted: ORD-1042');
});`);

    expect(result.execution.status).toBe('PASSED');
    expect(result.grading.failure?.kind).toBe('structural-locator');
  });

  it('rejects a count assertion on the full order collection', async () => {
    const result = await runAttempt(`test('practice', async ({ page }) => {
  const orders = page.getByRole('article');
  await expect(orders).toHaveCount(2);
  const targetOrder = orders.filter({
    has: page.getByRole('heading', {
      name: 'Order ORD-1042',
      exact: true,
    }),
  });
  await targetOrder.getByRole('button', { name: 'Submit order' }).click();
  await expect(targetOrder.getByRole('status')).toHaveText(
    'Order submitted: ORD-1042',
  );
});`);

    expect(result.execution.status).toBe('PASSED');
    expect(result.grading.failure?.kind).toBe('missing-required-evidence');
  });

  it('rejects a forced click', async () => {
    const result = await runAttempt(`test('practice', async ({ page }) => {
  const targetOrder = page.getByRole('article').filter({
    has: page.getByRole('heading', {
      name: 'Order ORD-1042',
      exact: true,
    }),
  });
  await expect(targetOrder).toHaveCount(1);
  await targetOrder
    .getByRole('button', { name: 'Submit order' })
    .click({ force: true });
  await expect(targetOrder.getByRole('status')).toHaveText(
    'Order submitted: ORD-1042',
  );
});`);

    expect(result.execution.status).toBe('PASSED');
    expect(result.grading.failure?.kind).toBe('forced-action');
  });

  it('rejects the masking fixed wait', async () => {
    const result = await runAttempt(`test('practice', async ({ page }) => {
  const targetOrder = page.getByRole('article').filter({
    has: page.getByRole('heading', {
      name: 'Order ORD-1042',
      exact: true,
    }),
  });
  await expect(targetOrder).toHaveCount(1);
  await targetOrder.getByRole('button', { name: 'Submit order' }).click();
  await page.waitForTimeout(1000);
  await expect(targetOrder.getByRole('status')).toHaveText(
    'Order submitted: ORD-1042',
  );
});`);

    expect(result.execution.status).toBe('PASSED');
    expect(result.grading.failure?.kind).toBe('forbidden-method');
    expect(result.grading.failure?.methods).toContain('waitForTimeout');
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
    expect(english.starterCode).toContain("test('practice'");
    expect(english.solution).toContain("from '@playwright/test'");
    expect(english.solution).toContain("test('practice'");
  });
});
