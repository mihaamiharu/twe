import { describe, expect, test } from 'bun:test';
import {
  CATEGORY_ORDER,
  TIER_ORDER,
  categoryLabels,
  getTierFromCategory,
} from '@/lib/constants';
import { TRACK_CONFIG, type TrackId } from '@/config/tracks';
import i18n from '@/lib/i18n';
import { getChallengeCatalogList } from '@/server/content-catalog.server';
import {
  filterPracticeChallenges,
  groupPracticeChallenges,
  type PracticeChallenge,
} from '@/lib/practice-catalog';
import { PracticeSearchSchema } from '@/lib/practice-search';

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

  test('keeps tier as a typed URL filter', () => {
    expect(
      PracticeSearchSchema.parse({
        track: 'selectors',
        tier: 'intermediate',
        difficulty: 'EASY',
      }),
    ).toEqual({
      track: 'selectors',
      tier: 'intermediate',
      difficulty: 'EASY',
    });
  });

  test('recovers invalid URL filters while preserving valid search state', () => {
    const parsed = PracticeSearchSchema.parse({
      track: 'not-a-track',
      q: 'locator',
      tier: 'not-a-tier',
      difficulty: 'IMPOSSIBLE',
      hideCompleted: 'sometimes',
      view: 'table',
    });

    expect(parsed.q).toBe('locator');
    expect(parsed.track).toBeUndefined();
    expect(parsed.tier).toBeUndefined();
    expect(parsed.difficulty).toBeUndefined();
    expect(parsed.hideCompleted).toBeUndefined();
    expect(parsed.view).toBeUndefined();
  });

  test('applies search, track, difficulty, and completion locally', () => {
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

    expect(
      filterPracticeChallenges(catalog, {
        track: 'core',
        tier: 'intermediate',
        difficulty: 'MEDIUM',
        hideCompleted: false,
      }).map((item) => item.slug),
    ).toEqual(['pw-locator']);
  });

  test('searches category, type, and tag aliases', () => {
    const pom = challenge({
      slug: 'pom-login',
      title: 'Build a login page object',
      type: 'PLAYWRIGHT',
      category: 'e2e-pom',
      tags: ['page-object-model'],
    });

    for (const query of ['POM', 'page object model', 'browser automation']) {
      expect(
        filterPracticeChallenges([pom], {
          query,
          track: 'all',
          hideCompleted: false,
        }).map((item) => item.slug),
      ).toEqual(['pom-login']);
    }
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

  test('puts the category containing the earliest challenge first', () => {
    const groups = groupPracticeChallenges([
      challenge({
        slug: 'later-start',
        category: 'playwright-navigation',
        order: 3200,
      }),
      challenge({
        slug: 'first-playwright-test',
        category: 'playwright-locators',
        order: 2990,
      }),
    ]);

    expect(groups.map((group) => group.category)).toEqual([
      'playwright-locators',
      'playwright-navigation',
    ]);
  });

  test('keeps every published category complete across taxonomy and tracks', async () => {
    const catalog = await getChallengeCatalogList('en');
    const categories = [...new Set(catalog.map((item) => item.category))];
    const trackIds = Object.keys(TRACK_CONFIG) as TrackId[];

    expect(categories.length).toBeGreaterThan(0);

    for (const category of categories) {
      const tier = getTierFromCategory(category);
      const challenges = catalog.filter((item) => item.category === category);

      expect(categoryLabels[category]).toBeTruthy();
      expect(CATEGORY_ORDER[category]).toBeDefined();
      expect(TIER_ORDER).toContain(tier);

      for (const locale of ['en', 'id'] as const) {
        const label = i18n.getResource(
          locale,
          'challenges',
          `categories.${category}`,
        ) as unknown;
        expect(typeof label).toBe('string');
        expect(label).not.toBe(category);
      }

      for (const challengeItem of challenges) {
        const matchingTracks = trackIds.filter(
          (trackId) =>
            trackId !== 'all' && TRACK_CONFIG[trackId].match(challengeItem),
        );
        const expectedTrack =
          tier === 'basic'
            ? 'selectors'
            : tier === 'beginner'
              ? 'scripting'
              : tier === 'intermediate'
                ? 'core'
                : 'e2e';

        expect(matchingTracks).toEqual([expectedTrack]);
      }
    }
  });
});
