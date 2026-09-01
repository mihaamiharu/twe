import { describe, expect, it } from 'bun:test';
import { validateChallengeExecution } from '@/core/executor/challenge-validator';
import { executePlaywrightCode } from '@/core/executor/iframe-executor';
import { getChallengeCatalogDetail } from '@/server/content-catalog.server';

const practiceCases = [
  {
    slug: 'async-await-basics',
    hardcoded: 'const result = "ORD-104";',
    hardcodedMissingEvidence: [
      'async function getPreparedOrderId',
      'await createTestOrder()',
      'await getPreparedOrderId()',
      'const order',
    ],
  },
  {
    slug: 'async-error-handling',
    hardcoded: 'const result = "no-recommendations";',
    hardcodedMissingEvidence: [
      'async function recommendationStatus',
      'await loadRecommendations()',
      'await recommendationStatus()',
      'try/catch (1)',
    ],
  },
  {
    slug: 'async-parallel-execution',
    hardcoded: 'const result = "qa@example.com | KB-104";',
    hardcodedMissingEvidence: [
      'await Promise.all()',
      'loadTestAccount() inside awaited Promise.all()',
      'loadProductFixture() inside awaited Promise.all()',
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
    throw new Error(`${slug} must provide asynchronous source validation`);
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

describe('Module 3 Lesson 3 asynchronous practices', () => {
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
          methods: [...practice.hardcodedMissingEvidence],
        },
      });
    });
  }

  it('rejects the Core Practice when controlled setup is not awaited', async () => {
    const result = await runAttempt(
      'async-await-basics',
      `
        const createTestOrder = () =>
          Promise.resolve({ id: 'ORD-104', status: 'ready' });

        async function getPreparedOrderId() {
          const order = { id: 'ORD-104' };
          return order.id;
        }

        const result = await getPreparedOrderId();
      `,
    );

    expect(result.execution.status).toBe('PASSED');
    expect(result.grading.failure).toEqual({
      kind: 'missing-required-evidence',
      methods: ['await createTestOrder()'],
    });
  });

  it('rejects an optional fallback without awaited try/catch handling', async () => {
    const result = await runAttempt(
      'async-error-handling',
      `
        const loadRecommendations = () =>
          Promise.reject(new Error('Recommendation service unavailable'));

        async function recommendationStatus() {
          return 'no-recommendations';
        }

        const result = await recommendationStatus();
      `,
    );

    expect(result.execution.status).toBe('PASSED');
    expect(result.grading.failure).toEqual({
      kind: 'missing-required-evidence',
      methods: ['await loadRecommendations()', 'try/catch (1)'],
    });
  });

  it('rejects sequential awaits in the independent setup challenge', async () => {
    const result = await runAttempt(
      'async-parallel-execution',
      `
        const loadTestAccount = () =>
          Promise.resolve({ email: 'qa@example.com' });
        const loadProductFixture = () =>
          Promise.resolve({ sku: 'KB-104', status: 'ready' });

        const account = await loadTestAccount();
        const product = await loadProductFixture();
        const result = account.email + ' | ' + product.sku;
      `,
    );

    expect(result.execution.status).toBe('PASSED');
    expect(result.grading.failure).toEqual({
      kind: 'missing-required-evidence',
      methods: [
        'await Promise.all()',
        'loadTestAccount() inside awaited Promise.all()',
        'loadProductFixture() inside awaited Promise.all()',
      ],
    });
  });

  it('uses locale-neutral starter comments and previews', async () => {
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
      const comments = english.starterCode?.match(/\/\/[^\n]*/g) ?? [];
      expect(comments).toEqual(['// TODO']);
    }
  });
});
