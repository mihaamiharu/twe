import { describe, expect, it } from 'bun:test';
import { validateChallengeExecution } from '@/core/executor/challenge-validator';
import { executePlaywrightCode } from '@/core/executor/iframe-executor';
import { getChallengeCatalogDetail } from '@/server/content-catalog.server';

const practiceCases = [
  {
    slug: 'ts-type-annotations',
    hardcoded: 'const result = "TC-001: 10 passed";',
    missingEvidence: [
      'formatRunSummary()',
      'const testId',
      'testId inferred',
      'formatRunSummary(id: string)',
      'formatRunSummary(passCount: number)',
      'formatRunSummary(): string',
    ],
  },
  {
    slug: 'ts-interfaces-basics',
    hardcoded: 'const result = "Login flow: 8/10 passed";',
    missingEvidence: [
      'const loginRun',
      'const total',
      'TestRunSummary.name: string',
      'TestRunSummary.passed: number',
      'TestRunSummary.failed: number',
      'loginRun: TestRunSummary',
    ],
  },
  {
    slug: 'ts-optional-properties',
    hardcoded: 'const result = 0;',
    missingEvidence: [
      'const myConfig',
      'AppConfig.apiUrl: string',
      'AppConfig.retryLimit?: number',
      'myConfig: AppConfig',
      'strict undefined check (!== undefined)',
    ],
  },
  {
    slug: 'ts-fundamentals-boss',
    hardcoded: 'const result = "user_5@test.com | guest";',
    missingEvidence: [
      'createUser()',
      'const adminUser',
      'const guestUser',
      'User.id: number',
      'User.email: string',
      'User.role: "admin" | "guest"',
      'createUser(id: number)',
      'createUser(role?: "admin" | "guest")',
      'createUser(): User',
      'nullish coalescing (??)',
    ],
  },
] as const;

function comparableOutput(value: unknown): string | undefined {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return `${value}`;
  }
  if (value === null) return 'null';
  if (value === undefined) return undefined;
  return JSON.stringify(value);
}

async function runAttempt(slug: string, code: string) {
  const challenge = await getChallengeCatalogDetail(slug, 'en');
  if (!challenge?.validation) {
    throw new Error(`${slug} must provide TypeScript source validation`);
  }

  const execution = await executePlaywrightCode(
    `${code}\nif (typeof result !== 'undefined') return result;`,
    challenge.htmlContent ?? '<div></div>',
    {
      timeout: 10_000,
      validation: challenge.validation,
      strictMode: false,
      isTypeScript: true,
    },
  );

  return {
    challenge,
    execution,
    grading: validateChallengeExecution(execution, challenge.validation),
  };
}

describe('Module 3 Lesson 4 TypeScript practices', () => {
  it('handles an empty TypeScript attempt without shadowing the learner result', async () => {
    const execution = await executePlaywrightCode(
      'if (typeof result !== "undefined") return result;',
      '<div></div>',
      { strictMode: false, isTypeScript: true },
    );

    expect(execution.status).toBe('PASSED');
    expect(execution.returnValue).toBeUndefined();
    expect(execution.error).toBeUndefined();
  });

  for (const practice of practiceCases) {
    it(`${practice.slug} runs its reference solution`, async () => {
      const challenge = await getChallengeCatalogDetail(practice.slug, 'en');
      if (!challenge) throw new Error(`${practice.slug} is unavailable`);

      const result = await runAttempt(practice.slug, challenge.solution);

      expect(result.execution.status).toBe('PASSED');
      expect(result.grading).toEqual({ passed: true });
      expect(comparableOutput(result.execution.returnValue)).toBe(
        comparableOutput(result.challenge.testCases[0]?.expectedOutput),
      );
    });

    it(`${practice.slug} rejects hardcoded output`, async () => {
      const result = await runAttempt(practice.slug, practice.hardcoded);

      expect(result.execution.status).toBe('PASSED');
      expect(comparableOutput(result.execution.returnValue)).toBe(
        comparableOutput(result.challenge.testCases[0]?.expectedOutput),
      );
      expect(result.grading).toEqual({
        passed: false,
        failure: {
          kind: 'missing-required-evidence',
          methods: [...practice.missingEvidence],
        },
      });
    });
  }

  it('keeps shared starter comments and previews locale-neutral', async () => {
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
      expect(english.starterCode?.match(/\/\/[^\n]*/g)).toEqual(['// TODO']);
    }
  });
});
