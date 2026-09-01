import { describe, expect, it } from 'bun:test';
import { validateChallengeExecution } from '@/core/executor/challenge-validator';
import { executePlaywrightCode } from '@/core/executor/iframe-executor';
import { getChallengeCatalogDetail } from '@/server/content-catalog.server';

const mappedPractices = [
  'pw-assertions-boss',
  'pw-to-be-visible',
  'pw-to-have-text',
  'pw-state-assertions',
  'pw-to-have-value',
  'pw-to-have-count',
  'pw-to-have-attribute',
  'pw-soft-assertions',
] as const;

const deadEvidence = `test('practice', async ({ page }) => {
  if (false) {
    const role = page.getByRole('button');
    const label = page.getByLabel('Email');
    const text = page.getByText('Name: Ready');
    await role.click();
    await label.fill('value');
    await label.check();
    await expect(role).toBeVisible();
    await expect(role).toHaveText('value');
    await expect(role).toContainText('value');
    await expect(role).toHaveValue('value');
    await expect(role).toBeDisabled();
    await expect(role).toBeChecked();
    await expect(role).toBeEnabled();
    await expect(role).toBeHidden();
    await expect(role).toHaveAttribute('href', '/value');
    await expect(role).toHaveCount(1);
    await expect.soft(text).toBeVisible();
  }
});`;

const misleadingAttempts = [
  {
    slug: 'pw-assertions-boss',
    code: `test('practice', async ({ page }) => {
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('password123');
  await expect(page.getByRole('alert')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Register' })).toBeEnabled();
});`,
  },
  {
    slug: 'pw-to-be-visible',
    code: `test('practice', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Show shipping details' });
  await trigger.click();
  await expect(trigger).toBeVisible();
});`,
  },
  {
    slug: 'pw-to-have-text',
    code: `test('practice', async ({ page }) => {
  await expect(page.getByRole('status')).toHaveText(
    'Order 1042 is ready for pickup',
  );
  await expect(page.getByRole('heading')).toContainText('Order');
});`,
  },
  {
    slug: 'pw-state-assertions',
    code: `test('practice', async ({ page }) => {
  const terms = page.getByLabel('Accept Terms');
  const submit = page.getByRole('button', { name: 'Submit' });
  await expect(submit).toBeDisabled();
  await terms.click();
  await expect(terms).toBeChecked();
  await expect(submit).toBeEnabled();
});`,
  },
  {
    slug: 'pw-to-have-value',
    code: `test('practice', async ({ page }) => {
  const email = page.getByLabel('Notification email');
  await email.fill('wrong@example.com');
  await expect(email).toHaveValue('wrong@example.com');
});`,
  },
  {
    slug: 'pw-to-have-count',
    code: `test('practice', async ({ page }) => {
  const items = page.getByRole('listitem');
  await page.getByRole('button', { name: 'Add matching customer' }).click();
  await expect(items).toHaveCount(5);
  await expect(items).toHaveCount(5);
});`,
  },
  {
    slug: 'pw-to-have-attribute',
    code: `test('practice', async ({ page }) => {
  const privacyPolicy = page.getByRole('link');
  await expect(privacyPolicy).toHaveAttribute('href', '/legal/privacy');
  await expect(privacyPolicy).toHaveAttribute('target', '_blank');
});`,
  },
  {
    slug: 'pw-soft-assertions',
    code: `test('practice', async ({ page }) => {
  await expect(page.getByText('Name: Ready', { exact: true })).toBeVisible();
  await expect(page.getByText('Email: Ready', { exact: true })).toBeVisible();
  await expect(page.getByText('Password: Ready', { exact: true })).toBeVisible();
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

describe('Module 6 Lesson 1 assertion practices', () => {
  for (const slug of mappedPractices) {
    it(`${slug} runs and grades its reference solution`, async () => {
      const challenge = await getChallengeCatalogDetail(slug, 'en');
      if (!challenge) throw new Error(`${slug} is unavailable`);

      const result = await runAttempt(slug, challenge.solution);

      expect(result.execution.status).toBe('PASSED');
      expect(result.grading).toEqual({ passed: true });
    });

    it(`${slug} rejects evidence hidden entirely in dead code`, async () => {
      const result = await runAttempt(slug, deadEvidence);

      expect(result.execution.status).toBe('PASSED');
      expect(result.grading.failure?.kind).toBe('missing-required-evidence');
    });
  }

  for (const attempt of misleadingAttempts) {
    it(`${attempt.slug} rejects passing but incorrect evidence`, async () => {
      const result = await runAttempt(attempt.slug, attempt.code);

      expect(result.execution.status).toBe('PASSED');
      expect(result.grading.failure?.kind).toBe('missing-required-evidence');
    });
  }

  it('allows independent text evidence in either order', async () => {
    const result = await runAttempt(
      'pw-to-have-text',
      `test('practice', async ({ page }) => {
  await expect(page.getByRole('status')).toContainText('ready for pickup');
  await expect(page.getByRole('heading')).toHaveText('Order confirmed');
});`,
    );

    expect(result.execution.status).toBe('PASSED');
    expect(result.grading).toEqual({ passed: true });
  });

  it('allows the two valid form values to be filled in either order', async () => {
    const result = await runAttempt(
      'pw-assertions-boss',
      `test('practice', async ({ page }) => {
  const emailError = page.getByRole('alert');
  const register = page.getByRole('button', { name: 'Register' });
  await expect(emailError).toBeVisible();
  await expect(emailError).toHaveText('Invalid email format');
  await expect(register).toBeDisabled();
  await page.getByLabel('Password').fill('password123');
  await page.getByLabel('Email').fill('user@example.com');
  await expect(emailError).toBeHidden();
  await expect(register).toBeEnabled();
});`,
    );

    expect(result.execution.status).toBe('PASSED');
    expect(result.grading).toEqual({ passed: true });
  });

  it('rejects a direct-DOM Core Practice shortcut', async () => {
    const result = await runAttempt(
      'pw-assertions-boss',
      `test('practice', async ({ page }) => {
  await page.evaluate(() => {
    document.getElementById('email').value = 'user@example.com';
    document.getElementById('password').value = 'password123';
    document.getElementById('email-error').style.display = 'none';
    document.getElementById('submit').disabled = false;
  });
});`,
    );

    expect(result.execution.status).toBe('PASSED');
    expect(result.grading.failure?.kind).toBe('direct-dom-access');
  });

  it('rejects structural assertion targets', async () => {
    const result = await runAttempt(
      'pw-to-be-visible',
      `test('practice', async ({ page }) => {
  await page.getByRole('button', { name: 'Show shipping details' }).click();
  await expect(page.locator('#shipping-dialog')).toBeVisible();
});`,
    );

    expect(result.execution.status).toBe('PASSED');
    expect(result.grading.failure?.kind).toBe('structural-locator');
  });

  it('keeps shared code locale-neutral and all solutions complete', async () => {
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
