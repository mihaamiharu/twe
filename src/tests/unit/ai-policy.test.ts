import { describe, expect, test } from 'bun:test';
import { dailyHintLimit, GetHintSchema } from '@/lib/ai/policy';

describe('AI spending configuration and request boundaries', () => {
  test('missing, ambiguous and excessive caps keep generation disabled', () => {
    for (const value of [
      undefined,
      '',
      '0',
      '-1',
      '1.5',
      '1e3',
      ' 1',
      '01',
      '10000',
      'Infinity',
    ]) {
      expect(dailyHintLimit(value)).toBe(0);
    }
    expect(dailyHintLimit('1')).toBe(1);
    expect(dailyHintLimit('9999')).toBe(9999);
  });

  test('rejects oversized attempts and caller-supplied context before generation', () => {
    const valid = {
      challengeSlug: 'synthetic-challenge',
      userAttempt: '.example',
      locale: 'id',
    };
    expect(GetHintSchema.safeParse(valid).success).toBe(true);
    for (const input of [
      { ...valid, challengeSlug: 'x'.repeat(161) },
      { ...valid, userAttempt: 'x'.repeat(16_001) },
      { ...valid, staticHints: ['x'.repeat(2_001)] },
      { ...valid, staticHints: Array.from({ length: 11 }, () => 'hint') },
      { ...valid, locale: 'unexpected-locale' },
    ]) {
      expect(GetHintSchema.safeParse(input).success).toBe(false);
    }
  });
});
