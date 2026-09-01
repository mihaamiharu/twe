import { describe, expect, it } from 'bun:test';
import { validateChallengeExecution } from '@/core/executor/challenge-validator';
import { executePlaywrightCode } from '@/core/executor/iframe-executor';
import { omitUndefined } from '@/lib/omit-undefined';
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

describe('Module 8 Lesson 1 abstraction practice grading', () => {
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

  it('rejects a correct recovery journey that remains fully inline', async () => {
    const { result, decision } = await runLoginPractice(`
      test('login-recovery', async ({ page }) => {
        await page.goto('/app/login.html');
        await page.getByLabel('Username').fill('wronguser');
        await page.getByLabel('Password').fill('wrongpass');
        await page.getByRole('button', { name: 'Sign In' }).click();
        await expect(page.getByRole('alert')).toHaveText('Invalid username or password');
        await expect(page).toHaveURL('/app/login.html');

        await page.getByLabel('Username').fill('testuser');
        await page.getByLabel('Password').fill('password123');
        await page.getByRole('button', { name: 'Sign In' }).click();
        await expect(page).toHaveURL('/app/dashboard.html');
        await expect(page.getByRole('heading', {
          name: 'Welcome, testuser!',
          exact: true,
        })).toHaveText('Welcome, testuser!');
      });
    `);

    expect(result.status).toBe('PASSED');
    expect(decision.failure?.kind).toBe('missing-required-evidence');
    expect(decision.failure?.methods).toContain('async function submitLogin');
  });

  it('rejects a structural-selector recovery even when behavior is correct', async () => {
    const { result, decision } = await runLoginPractice(`
      test('login-recovery', async ({ page }) => {
        await page.goto('/app/login.html');
        page.getByLabel('Username');
        page.getByRole('button', { name: 'Sign In' });

        await page.locator('#username').fill('wronguser');
        await page.locator('#password').fill('wrongpass');
        await page.locator('#login-form button').click();
        await expect(page.locator('#error-msg')).toHaveText('Invalid username or password');
        await expect(page).toHaveURL('/app/login.html');

        await page.locator('#username').fill('testuser');
        await page.locator('#password').fill('password123');
        await page.locator('#login-form button').click();
        await expect(page).toHaveURL('/app/dashboard.html');
        await expect(page.locator('#welcome-message')).toHaveText('Welcome, testuser!');
      });
    `);

    expect(result.status).toBe('PASSED');
    expect(decision.failure?.kind).toBe('structural-locator');
  });

  it('rejects a helper hidden in dead code while the journey stays inline', async () => {
    const { result, decision } = await runLoginPractice(`
      async function submitLogin(page, credentials) {
        await page.getByLabel('Username').fill(credentials.username);
        await page.getByLabel('Password').fill(credentials.password);
        await page.getByRole('button', { name: 'Sign In' }).click();
      }

      test('login-recovery', async ({ page }) => {
        if (false) {
          await submitLogin(page, { username: 'wronguser', password: 'wrongpass' });
          await submitLogin(page, { username: 'testuser', password: 'password123' });
        }

        await page.goto('/app/login.html');
        await page.getByLabel('Username').fill('wronguser');
        await page.getByLabel('Password').fill('wrongpass');
        await page.getByRole('button', { name: 'Sign In' }).click();
        await expect(page.getByRole('alert')).toHaveText('Invalid username or password');
        await expect(page).toHaveURL('/app/login.html');
        await page.getByLabel('Username').fill('testuser');
        await page.getByLabel('Password').fill('password123');
        await page.getByRole('button', { name: 'Sign In' }).click();
        await expect(page).toHaveURL('/app/dashboard.html');
        await expect(page.getByRole('heading', {
          name: 'Welcome, testuser!',
          exact: true,
        })).toHaveText('Welcome, testuser!');
      });
    `);

    expect(result.status).toBe('PASSED');
    expect(decision.failure?.kind).toBe('missing-required-evidence');
    expect(decision.failure?.methods).toContain(
      'getByLabel() only inside submitLogin()',
    );
  });

  it('rejects leaving the obsolete generated wrapper beside the focused helper', async () => {
    const challenge = await getChallengeCatalogDetail('pom-login-basics', 'en');
    if (!challenge) throw new Error('pom-login-basics must exist');

    const legacyWrapper = `class UiActions {
  async fillField() {}
  async clickButton() {}
}\n\n`;
    const { result, decision } = await runLoginPractice(
      challenge.solution.replace(
        "import { test, expect } from '@playwright/test';\n\n",
        `import { test, expect } from '@playwright/test';\n\n${legacyWrapper}`,
      ),
    );

    expect(result.status).toBe('PASSED');
    expect(decision.failure?.kind).toBe('forbidden-method');
    expect(decision.failure?.methods).toEqual(['fillField', 'clickButton']);
  });

  it('rejects a helper used for only one login attempt', async () => {
    const { result, decision } = await runLoginPractice(`
      async function submitLogin(page, credentials) {
        await page.getByLabel('Username').fill(credentials.username);
        await page.getByLabel('Password').fill(credentials.password);
        await page.getByRole('button', { name: 'Sign In' }).click();
      }

      test('login-recovery', async ({ page }) => {
        await page.goto('/app/login.html');
        await submitLogin(page, { username: 'wronguser', password: 'wrongpass' });
        await expect(page.getByRole('alert')).toHaveText('Invalid username or password');
        await expect(page).toHaveURL('/app/login.html');

        await page.getByLabel('Username').fill('testuser');
        await page.getByLabel('Password').fill('password123');
        await page.getByRole('button', { name: 'Sign In' }).click();
        await expect(page).toHaveURL('/app/dashboard.html');
        await expect(page.getByRole('heading', {
          name: 'Welcome, testuser!',
          exact: true,
        })).toHaveText('Welcome, testuser!');
      });
    `);

    expect(result.status).toBe('PASSED');
    expect(decision.failure?.kind).toBe('missing-required-evidence');
    expect(decision.failure?.methods).toContain(
      'await submitLogin() (2 calls)',
    );
  });

  it('rejects forced actions inside the focused helper', async () => {
    const { result, decision } = await runLoginPractice(`
      async function submitLogin(page, credentials) {
        await page.getByLabel('Username').fill(credentials.username);
        await page.getByLabel('Password').fill(credentials.password);
        await page.getByRole('button', { name: 'Sign In' }).click({ force: true });
      }

      test('login-recovery', async ({ page }) => {
        await page.goto('/app/login.html');
        await submitLogin(page, { username: 'wronguser', password: 'wrongpass' });
        await expect(page.getByRole('alert')).toHaveText('Invalid username or password');
        await expect(page).toHaveURL('/app/login.html');
        await submitLogin(page, { username: 'testuser', password: 'password123' });
        await expect(page).toHaveURL('/app/dashboard.html');
        await expect(page.getByRole('heading', {
          name: 'Welcome, testuser!',
          exact: true,
        })).toHaveText('Welcome, testuser!');
      });
    `);

    expect(result.status).toBe('PASSED');
    expect(decision.failure?.kind).toBe('forced-action');
  });

  it('rejects a recovery test that omits the unchanged URL evidence', async () => {
    const { result, decision } = await runLoginPractice(`
      async function submitLogin(page, credentials) {
        await page.getByLabel('Username').fill(credentials.username);
        await page.getByLabel('Password').fill(credentials.password);
        await page.getByRole('button', { name: 'Sign In' }).click();
      }

      test('login-recovery', async ({ page }) => {
        await page.goto('/app/login.html');
        await submitLogin(page, { username: 'wronguser', password: 'wrongpass' });
        await expect(page.getByRole('alert')).toHaveText('Invalid username or password');
        await submitLogin(page, { username: 'testuser', password: 'password123' });
        await expect(page).toHaveURL('/app/dashboard.html');
        await expect(page.getByRole('heading', {
          name: 'Welcome, testuser!',
          exact: true,
        })).toHaveText('Welcome, testuser!');
      });
    `);

    expect(result.status).toBe('PASSED');
    expect(decision.failure?.kind).toBe('missing-required-evidence');
    expect(decision.failure?.methods).toContain('toHaveURL');
  });

  it('rejects swallowed action failures inside the focused helper', async () => {
    const { result, decision } = await runLoginPractice(`
      async function submitLogin(page, credentials) {
        await page.getByLabel('Username').fill(credentials.username);
        await page.getByLabel('Password').fill(credentials.password);
        await page
          .getByRole('button', { name: 'Sign In' })
          .click()
          .catch(() => {});
      }

      test('login-recovery', async ({ page }) => {
        await page.goto('/app/login.html');
        await submitLogin(page, { username: 'wronguser', password: 'wrongpass' });
        await expect(page.getByRole('alert')).toHaveText('Invalid username or password');
        await expect(page).toHaveURL('/app/login.html');
        await submitLogin(page, { username: 'testuser', password: 'password123' });
        await expect(page).toHaveURL('/app/dashboard.html');
        await expect(page.getByRole('heading', {
          name: 'Welcome, testuser!',
          exact: true,
        })).toHaveText('Welcome, testuser!');
      });
    `);

    expect(result.status).toBe('PASSED');
    expect(decision.failure?.kind).toBe('swallowed-error');
  });

  it('rejects direct DOM access even when the focused helper also behaves correctly', async () => {
    const { result, decision } = await runLoginPractice(`
      async function submitLogin(page, credentials) {
        await page.evaluate(() => {
          document.body.dataset.touched = 'true';
        });
        await page.getByLabel('Username').fill(credentials.username);
        await page.getByLabel('Password').fill(credentials.password);
        await page.getByRole('button', { name: 'Sign In' }).click();
      }

      test('login-recovery', async ({ page }) => {
        await page.goto('/app/login.html');
        await submitLogin(page, { username: 'wronguser', password: 'wrongpass' });
        await expect(page.getByRole('alert')).toHaveText('Invalid username or password');
        await expect(page).toHaveURL('/app/login.html');
        await submitLogin(page, { username: 'testuser', password: 'password123' });
        await expect(page).toHaveURL('/app/dashboard.html');
        await expect(page.getByRole('heading', {
          name: 'Welcome, testuser!',
          exact: true,
        })).toHaveText('Welcome, testuser!');
      });
    `);

    expect(result.status).toBe('PASSED');
    expect(decision.failure?.kind).toBe('forbidden-method');
    expect(decision.failure?.methods).toContain('evaluate');
  });

  it('keeps shared starter code locale-neutral and synchronized with the editable file', async () => {
    const [english, indonesian] = await Promise.all([
      getChallengeCatalogDetail('pom-login-basics', 'en'),
      getChallengeCatalogDetail('pom-login-basics', 'id'),
    ]);
    if (!english?.files || !indonesian?.files) {
      throw new Error('pom-login-basics must provide localized detail');
    }

    expect(english.starterCode).toBe(indonesian.starterCode);
    expect(english.files).toEqual(indonesian.files);
    expect(english.files['/tests/login.spec.ts']).toBe(english.starterCode);
    expect(english.starterCode?.match(/\/\/[^\n]*/g)).toEqual([
      '// TODO 1',
      '// TODO 2',
      '// TODO 3',
      '// TODO 4',
    ]);
    expect(english.starterCode).toContain("test('login-recovery'");
  });
});
