import { describe, expect, test } from 'bun:test';
import { getUserXPProgress } from '@/server/user-xp-progress';

describe('profile XP progress', () => {
  test('shows the reported 290 XP below the Level 2 threshold', () => {
    expect(getUserXPProgress(290)).toEqual({
      level: 1,
      xpProgress: 290,
      xpNeeded: 400,
      xpProgressPercentage: 72.5,
    });
  });

  test.each([
    [0, 1, 0, 400],
    [100, 1, 100, 400],
    [399, 1, 399, 400],
    [400, 2, 0, 500],
    [650, 2, 250, 500],
    [899, 2, 499, 500],
    [900, 3, 0, 700],
  ])(
    'keeps level and progress aligned at %i total XP',
    (xp, level, earned, needed) => {
      const result = getUserXPProgress(xp);
      expect(result.level).toBe(level);
      expect(result.xpProgress).toBe(earned);
      expect(result.xpNeeded).toBe(needed);
      expect(result.xpProgressPercentage).toBeGreaterThanOrEqual(0);
      expect(result.xpProgressPercentage).toBeLessThan(100);
    },
  );
});
