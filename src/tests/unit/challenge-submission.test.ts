import { describe, expect, test } from 'bun:test';
import { buildChallengeSubmissionPayload } from '@/lib/challenge-submission';

describe('buildChallengeSubmissionPayload', () => {
  test('omits unavailable optional submission fields', () => {
    const payload = buildChallengeSubmissionPayload({
      challengeSlug: 'css-selector-101-id-class',
      code: '#login-btn',
      isPractice: false,
      testResults: [
        { id: 'main', passed: true },
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          passed: true,
          output: null,
        },
      ],
      locale: 'en',
    });

    expect('executionTime' in payload).toBe(false);
    const firstResult = payload.testResults[0];
    const secondResult = payload.testResults[1];
    if (!firstResult || !secondResult) throw new Error('Expected two test results');
    expect('testCaseId' in firstResult).toBe(false);
    expect('output' in firstResult).toBe(false);
    expect('error' in firstResult).toBe(false);
    expect(secondResult).toEqual({
      passed: true,
      testCaseId: '123e4567-e89b-12d3-a456-426614174000',
      output: null,
    });
  });

  test('preserves defined falsy submission fields', () => {
    const payload = buildChallengeSubmissionPayload({
      challengeSlug: 'javascript-basics',
      code: 'return false;',
      isPractice: true,
      testResults: [
        { id: 'selector', passed: false, output: false, error: '' },
      ],
      executionTime: 0,
      locale: 'id',
    });

    expect(payload.executionTime).toBe(0);
    const result = payload.testResults[0];
    if (!result) throw new Error('Expected one test result');
    expect(result).toEqual({
      passed: false,
      output: false,
      error: '',
    });
  });
});
