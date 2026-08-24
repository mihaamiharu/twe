import { describe, expect, test } from 'bun:test';
import {
  filterPracticeChallenges,
  groupPracticeChallenges,
  type PracticeChallenge,
} from '@/lib/practice-catalog';

function challenge(
  overrides: Partial<PracticeChallenge> = {},
): PracticeChallenge {
  return {
    id: overrides.id ?? overrides.slug ?? 'challenge',
    slug: overrides.slug ?? 'challenge',
    title: overrides.title ?? 'Challenge',
    description: overrides.description ?? 'Practice challenge',
    type: overrides.type ?? 'JAVASCRIPT',
    difficulty: overrides.difficulty ?? 'EASY',
    category: overrides.category ?? 'js-fundamentals',
    xpReward: overrides.xpReward ?? 10,
    order: overrides.order ?? 1,
    tags: overrides.tags ?? [],
    isPublished: overrides.isPublished ?? true,
    completionCount: overrides.completionCount ?? 0,
    isCompleted: overrides.isCompleted ?? false,
    ...(overrides.tutorialSlug ? { tutorialSlug: overrides.tutorialSlug } : {}),
  };
}

describe('Practice catalog projection', () => {
  const catalog = [
    challenge({
      slug: 'pw-locator',
      title: 'Locator assertions',
      description: 'Find a stable locator',
      type: 'PLAYWRIGHT',
      category: 'playwright-locators',
      difficulty: 'MEDIUM',
      order: 3,
      isCompleted: true,
    }),
    challenge({
      slug: 'css-card',
      title: 'Kartu CSS',
      description: 'Pilih kartu dengan selektor CSS',
      type: 'CSS_SELECTOR',
      category: 'css-basics',
      order: 2,
    }),
    challenge({
      slug: 'js-async',
      title: 'Async basics',
      description: 'Wait for a result',
      category: 'js-async',
      order: 1,
    }),
  ];

  test('applies search, track, tier, difficulty, and completion locally', () => {
    expect(
      filterPracticeChallenges(catalog, {
        query: 'KARTU',
        track: 'selectors',
        tier: 'basic',
        difficulty: 'EASY',
        hideCompleted: false,
      }).map((item) => item.slug),
    ).toEqual(['css-card']);

    expect(
      filterPracticeChallenges(catalog, {
        query: 'locator',
        track: 'core',
        tier: 'intermediate',
        difficulty: 'MEDIUM',
        hideCompleted: true,
      }),
    ).toEqual([]);
  });

  test('groups deterministically by tier, category, order, and slug', () => {
    const shuffled = [
      challenge({
        slug: 'b',
        category: 'css-basics',
        order: 2,
      }),
      challenge({
        slug: 'z',
        category: 'css-basics',
        order: 1,
      }),
      challenge({
        slug: 'a',
        category: 'css-basics',
        order: 1,
      }),
      challenge({
        slug: 'playwright',
        category: 'playwright-locators',
        order: 1,
      }),
    ];

    const groups = groupPracticeChallenges(shuffled);
    expect(groups.map((group) => group.category)).toEqual([
      'css-basics',
      'playwright-locators',
    ]);
    expect(groups[0]?.challenges.map((item) => item.slug)).toEqual([
      'a',
      'z',
      'b',
    ]);
  });
});
