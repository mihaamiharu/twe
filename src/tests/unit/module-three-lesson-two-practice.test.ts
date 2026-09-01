import { describe, expect, it } from 'bun:test';
import { validateChallengeExecution } from '@/core/executor/challenge-validator';
import { executePlaywrightCode } from '@/core/executor/iframe-executor';
import { getChallengeCatalogDetail } from '@/server/content-catalog.server';

const practiceCases = [
  {
    slug: 'js-fundamentals-boss',
    hardcoded: 'const result = "Mechanical Keyboard: 240";',
    missingEvidence: [
      'expectedSubtotal()',
      'const selectedCase',
      'const subtotal',
    ],
  },
  {
    slug: 'js-if-else-logic',
    hardcoded: 'const result = "ALL_PASSED | PARTIAL | ALL_FAILED";',
    missingEvidence: [
      'classifyRun()',
      '.map()',
      '.join()',
      'const statuses',
      'if/else (3 branches)',
    ],
  },
  {
    slug: 'js-array-methods',
    hardcoded: 'const result = 3;',
    missingEvidence: ['.filter()'],
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
    throw new Error(`${slug} must provide JavaScript source validation`);
  }

  const execution = await executePlaywrightCode(
    `${code}\nif (typeof result !== 'undefined') return result;`,
    challenge.htmlContent ?? '<div></div>',
    {
      timeout: 10_000,
      validation: challenge.validation,
      strictMode: false,
      isTypeScript: false,
    },
  );

  return {
    challenge,
    execution,
    grading: validateChallengeExecution(execution, challenge.validation),
  };
}

describe('Module 3 Lesson 2 JavaScript Practices', () => {
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

    it(`${practice.slug} rejects its former hardcoded shortcut`, async () => {
      const challenge = await getChallengeCatalogDetail(practice.slug, 'en');
      if (!challenge?.starterCode) {
        throw new Error(`${practice.slug} is missing starter code`);
      }
      const result = await runAttempt(
        practice.slug,
        `${challenge.starterCode}\n${practice.hardcoded}`,
      );

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

  it('uses locale-neutral starter comments for all three mapped practices', async () => {
    for (const practice of practiceCases) {
      const [english, indonesian] = await Promise.all([
        getChallengeCatalogDetail(practice.slug, 'en'),
        getChallengeCatalogDetail(practice.slug, 'id'),
      ]);
      if (!english || !indonesian) {
        throw new Error(`${practice.slug} is missing a locale`);
      }

      expect(english.starterCode).toBe(indonesian.starterCode);
      const comments = english.starterCode?.match(/\/\/[^\n]*/g) ?? [];
      expect(comments.length).toBeGreaterThan(0);
      expect(comments.every((comment) => comment.includes('TODO'))).toBe(true);
    }
  });
});
