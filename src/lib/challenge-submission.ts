import type { JsonValue } from '@/lib/content.types';
import { omitUndefined } from '@/lib/omit-undefined';

export interface ChallengeSubmissionTestResult {
  testCaseId?: string;
  passed: boolean;
  output?: JsonValue;
  error?: string;
}

export interface ChallengeSubmissionPayload {
  challengeSlug: string;
  code: string;
  isPractice: boolean;
  testResults: ChallengeSubmissionTestResult[];
  executionTime?: number;
  locale: string;
}

interface BuildChallengeSubmissionPayloadInput {
  challengeSlug: string;
  code: string;
  isPractice: boolean;
  testResults: {
    id: string;
    passed: boolean;
    output?: JsonValue;
    error?: string;
  }[];
  executionTime?: number;
  locale: string;
}

export function buildChallengeSubmissionPayload({
  challengeSlug,
  code,
  isPractice,
  testResults,
  executionTime,
  locale,
}: BuildChallengeSubmissionPayloadInput): ChallengeSubmissionPayload {
  return {
    challengeSlug,
    code,
    isPractice,
    testResults: testResults.map(({ id, passed, output, error }) => ({
      passed,
      ...omitUndefined({
        testCaseId: id === 'main' || id === 'selector' ? undefined : id,
        output,
        error,
      }),
    })),
    ...omitUndefined({ executionTime }),
    locale,
  };
}
