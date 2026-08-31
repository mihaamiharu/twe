import { describe, expect, it } from 'bun:test';
import { validateChallengeExecution } from '@/core/executor/challenge-validator';
import { executePlaywrightCode } from '@/core/executor/iframe-executor';
import { getChallengeCatalogDetail } from '@/server/content.server';

async function runLoginPractice(code: string) {
  const challenge = await getChallengeCatalogDetail('pom-login-basics', 'en');
  if (!challenge?.files || !challenge.validation) {
    throw new Error('pom-login-basics must provide files and validation');
  }

  const result = await executePlaywrightCode(
    code,
    challenge.files['/index.html'] ?? '<div></div>',
    {
      timeout: 4_000,
      files: challenge.files,
      expectedState: challenge.expectedState,
      validation: challenge.validation,
      interactionSequence: challenge.validation.interactionSequence,
      strictMode: true,
      isTypeScript: false,
    },
  );

  return {
    result,
    decision: validateChallengeExecution(result, challenge.validation),
  };
}

describe('POM login practice grading', () => {
  it('passes the canonical invalid-login recovery sequence', async () => {
    const challenge = await getChallengeCatalogDetail('pom-login-basics', 'en');
    if (!challenge) throw new Error('pom-login-basics must exist');

    const { result, decision } = await runLoginPractice(challenge.solution);

    expect(result.status, result.output).toBe('PASSED');
    expect(decision).toEqual({ passed: true });
  });

  it('rejects asserting the initial alert and submitting only valid credentials', async () => {
    const { result, decision } = await runLoginPractice(`
      await page.goto('/app/login.html');
      await expect(page.locator('#error-msg')).toHaveText('Invalid username or password');

      await page.getByLabel('Username').fill('testuser');
      await page.getByLabel('Password').fill('password123');
      await page.getByRole('button', { name: 'Sign In' }).click();

      await expect(page).toHaveURL('/app/dashboard.html');
      await expect(page.getByRole('heading', { name: /Welcome/ })).toHaveText(
        'Welcome, testuser!',
      );
    `);

    expect(result.status).toBe('FAILED');
    expect(result.output).toContain('Interaction Sequence Validation Failed');
    expect(decision.passed).toBe(false);
  });
});
