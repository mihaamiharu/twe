import { describe, expect, test } from 'bun:test';
import {
  practiceDetailNotFoundFailure,
  practiceDetailOperationalFailure,
} from '@/lib/practice-detail-errors';

describe('Practice detail read failures', () => {
  test('keeps missing content distinguishable from operational failures', () => {
    expect(practiceDetailNotFoundFailure()).toMatchObject({
      success: false,
      errorCode: 'not-found',
    });
    expect(practiceDetailOperationalFailure()).toMatchObject({
      success: false,
      errorCode: 'operational',
    });
  });

  test('preserves a safe operational message for localized error rendering', () => {
    expect(practiceDetailOperationalFailure('Database unavailable')).toEqual({
      success: false,
      errorCode: 'operational',
      error: 'Database unavailable',
    });
  });
});
