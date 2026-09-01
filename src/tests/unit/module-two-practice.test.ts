import { describe, expect, it } from 'bun:test';
import { validateChallengeExecution } from '@/core/executor/challenge-validator';
import { executePlaywrightCode } from '@/core/executor/iframe-executor';
import { getChallengeCatalogDetail } from '@/server/content-catalog.server';

const challengeSlug = 'dom-queryselector-vs-all';

async function runAttempt(code: string) {
  const challenge = await getChallengeCatalogDetail(challengeSlug, 'en');
  if (!challenge?.htmlContent || !challenge.validation) {
    throw new Error(
      `${challengeSlug} is missing its runnable DOM fixture or validation contract`,
    );
  }

  const execution = await executePlaywrightCode(
    `${code}\nif (typeof result !== "undefined") return result;`,
    challenge.htmlContent,
    {
      timeout: 10_000,
      strictMode: false,
      validation: challenge.validation,
    },
  );

  return { challenge, execution };
}

describe('Module 2 DevTools Additional Practice', () => {
  it('runs the reference investigation and returns all required evidence', async () => {
    const { challenge, execution } = await runAttempt(
      (await getChallengeCatalogDetail(challengeSlug, 'en'))?.solution ?? '',
    );

    expect(validateChallengeExecution(execution, challenge.validation)).toEqual(
      {
        passed: true,
      },
    );
    expect(execution.returnValue).toBe(challenge.testCases[0]?.expectedOutput);
    expect(execution.sourceAnalysis?.calledMethods).toContain('querySelector');
    expect(execution.sourceAnalysis?.calledMethods).toContain('querySelectorAll');
  });

  it('rejects the former hardcoded count shortcut', async () => {
    const { challenge, execution } = await runAttempt('const result = 4;');

    expect(validateChallengeExecution(execution, challenge.validation)).toEqual(
      {
        passed: false,
        failure: {
          kind: 'missing-required-evidence',
          methods: ['querySelector', 'querySelectorAll'],
        },
      },
    );
    expect(execution.returnValue).not.toBe(
      challenge.testCases[0]?.expectedOutput,
    );
  });
});
