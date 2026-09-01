import { describe, expect, it } from 'bun:test';
import { validateChallengeExecution } from '@/core/executor/challenge-validator';
import { executePlaywrightCode } from '@/core/executor/iframe-executor';
import { omitUndefined } from '@/lib/omit-undefined';
import { getChallengeCatalogDetail } from '@/server/content.server';

const challengeSlug = 'pw-api-request-recovery';

async function runNetworkRecovery(code: string) {
  const challenge = await getChallengeCatalogDetail(challengeSlug, 'en');
  if (!challenge?.files || !challenge.validation) {
    throw new Error(`${challengeSlug} must provide files and validation`);
  }

  const result = await executePlaywrightCode(
    code,
    challenge.files['/index.html'] ?? '<div></div>',
    {
      timeout: 5_000,
      files: challenge.files,
      validation: challenge.validation,
      strictMode: true,
      isTypeScript: false,
      ...omitUndefined({
        expectedState: challenge.expectedState,
        interactionSequence: challenge.validation.interactionSequence,
      }),
    },
  );

  return {
    result,
    decision: validateChallengeExecution(result, challenge.validation),
  };
}

describe('API request recovery practice grading', () => {
  it('passes the canonical 503 retry recovery solution', async () => {
    const challenge = await getChallengeCatalogDetail(challengeSlug, 'en');
    if (!challenge) throw new Error(`${challengeSlug} is unavailable`);

    const { result, decision } = await runNetworkRecovery(challenge.solution);

    expect(result.status, result.output).toBe('PASSED');
    expect(decision).toEqual({ passed: true });
  });

  it('rejects a success-path-only route that never proves the outage', async () => {
    const { result, decision } = await runNetworkRecovery(`
      test('recommendations-recovery', async ({ page }) => {
        await page.goto('/app/recommendations.html');
        await page.route('/api/recommendations', async (route) => {
          await route.fulfill({
            status: 200,
            json: {
              items: ['Release health dashboard', 'Checkout recovery'],
            },
          });
        });

        await page.getByRole('button', { name: 'Load recommendations' }).click();
        await expect(
          page.getByRole('list', { name: 'Recommended checks' }),
        ).toBeVisible();
      });
    `);

    expect(result.status).toBe('PASSED');
    expect(decision.passed).toBe(false);
    expect(decision.failure?.kind).toBe('missing-required-evidence');
    expect(decision.failure?.methods).toContain('toHaveText');
    expect(decision.failure?.methods).toContain('click');
  });

  it('rejects hard-coded final DOM mutation even when recovery assertions pass', async () => {
    const { result, decision } = await runNetworkRecovery(`
      test('recommendations-recovery', async ({ page }) => {
        await page.goto('/app/recommendations.html');
        let requestCount = 0;
        await page.route('/api/recommendations', async (route) => {
          requestCount += 1;
          await route.fulfill({
            status: requestCount === 1 ? 503 : 200,
            json: requestCount === 1
              ? { error: 'Service unavailable' }
              : { items: ['Release health dashboard', 'Checkout recovery'] },
          });
        });

        await page.getByRole('button', { name: 'Load recommendations' }).click();
        const alert = page.getByRole('alert');
        await expect(alert).toHaveText(
          'Recommendations are temporarily unavailable. Try again.',
        );
        await page.getByRole('button', { name: 'Retry' }).click();
        await expect(alert).toBeHidden();

        await page.evaluate(() => {
          const list = document.querySelector('#recommendations');
          if (list) list.innerHTML = '<li>Release health dashboard</li><li>Checkout recovery</li>';
        });

        const recommendations = page.getByRole('list', {
          name: 'Recommended checks',
        });
        await expect(recommendations).toBeVisible();
        await expect(recommendations).toContainText('Release health dashboard');
        await expect(recommendations).toContainText('Checkout recovery');
      });
    `);

    expect(result.status).toBe('PASSED');
    expect(decision.failure?.kind).toBe('forbidden-method');
    expect(decision.failure?.methods).toContain('evaluate');
  });

  it('does not accept the error path and retry assertions hidden in dead code', async () => {
    const { result, decision } = await runNetworkRecovery(`
      test('recommendations-recovery', async ({ page }) => {
        await page.goto('/app/recommendations.html');
        await page.route('/api/recommendations', async (route) => {
          await route.fulfill({
            status: 200,
            json: {
              items: ['Release health dashboard', 'Checkout recovery'],
            },
          });
        });

        await page.getByRole('button', { name: 'Load recommendations' }).click();
        if (false) {
          await expect(page.getByRole('alert')).toHaveText(
            'Recommendations are temporarily unavailable. Try again.',
          );
          await page.getByRole('button', { name: 'Retry' }).click();
        }

        const recommendations = page.getByRole('list', {
          name: 'Recommended checks',
        });
        await expect(recommendations).toBeVisible();
        await expect(recommendations).toContainText('Release health dashboard');
        await expect(recommendations).toContainText('Checkout recovery');
      });
    `);

    expect(result.status).toBe('PASSED');
    expect(decision.passed).toBe(false);
    expect(decision.failure?.kind).toBe('missing-required-evidence');
    expect(decision.failure?.methods).toContain('toHaveText');
    expect(decision.failure?.methods).toContain('click');
  });

  it('keeps the first-failure route state isolated across reset-style runs', async () => {
    const challenge = await getChallengeCatalogDetail(challengeSlug, 'en');
    if (!challenge) throw new Error(`${challengeSlug} is unavailable`);

    const firstRun = await runNetworkRecovery(challenge.solution);
    const secondRun = await runNetworkRecovery(challenge.solution);

    expect(firstRun.result.status, firstRun.result.output).toBe('PASSED');
    expect(firstRun.decision).toEqual({ passed: true });
    expect(secondRun.result.status, secondRun.result.output).toBe('PASSED');
    expect(secondRun.decision).toEqual({ passed: true });
  });

  it('keeps the shared VFS data and code stable across locales', async () => {
    const [english, indonesian] = await Promise.all([
      getChallengeCatalogDetail(challengeSlug, 'en'),
      getChallengeCatalogDetail(challengeSlug, 'id'),
    ]);
    if (!english || !indonesian) {
      throw new Error(`${challengeSlug} is missing a locale`);
    }

    expect(english.starterCode).toBe(indonesian.starterCode);
    expect(english.files).toEqual(indonesian.files);
    expect(english.starterCode).toContain("test('recommendations-recovery'");
    expect(english.solution).toContain("status: 503");
    expect(english.solution).toContain("status: 200");
  });
});
