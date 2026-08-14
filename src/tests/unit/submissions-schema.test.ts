import { describe, expect, test } from 'bun:test';
import { CreateSubmissionSchema } from '@/server/submissions.fn';

const baseSubmission = {
  challengeSlug: 'json-contract',
  code: 'return true;',
  testResults: [{ passed: true }],
};

describe('CreateSubmissionSchema JSON output', () => {
  test('preserves recursive JSON result values', () => {
    const output = {
      result: [1, true, null, { nested: 'value' }],
    };
    const parsed = CreateSubmissionSchema.parse({
      ...baseSubmission,
      testResults: [{ passed: true, output }],
    });

    expect(parsed.testResults[0]?.output).toEqual(output);
  });

  test('allows an omitted result output', () => {
    expect(CreateSubmissionSchema.parse(baseSubmission).testResults[0]?.output)
      .toBeUndefined();
  });

  test.each([
    1n,
    new Date('2026-01-01T00:00:00Z'),
    Number.NaN,
    Number.POSITIVE_INFINITY,
    () => 'not JSON',
  ])('rejects non-JSON output %#', (output) => {
    const result = CreateSubmissionSchema.safeParse({
      ...baseSubmission,
      testResults: [{ passed: true, output }],
    });

    expect(result.success).toBe(false);
  });
});
