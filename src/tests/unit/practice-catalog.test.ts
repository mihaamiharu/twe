import { describe, expect, test } from 'bun:test';
import {
  CATEGORY_ORDER,
  PRACTICE_TIER_ORDER,
  TIER_ORDER,
  categoryLabels,
  getTierFromCategory,
} from '@/lib/constants';
import { TRACK_CONFIG, TRACK_IDS, type TrackId } from '@/config/tracks';
import i18n from '@/lib/i18n';
import { getChallengeCatalogList } from '@/server/content-catalog.server';
import {
  PRACTICE_SOLVE_COUNT_THRESHOLD,
  filterPracticeChallenges,
  groupPracticeChallenges,
  shouldShowPracticeSolveCount,
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
    ...(overrides.categoryLabel
      ? { categoryLabel: overrides.categoryLabel }
      : {}),
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

  test('indexes localized rendered category labels without broad e2e matches', async () => {
    const [englishCatalog, indonesianCatalog] = await Promise.all([
      getChallengeCatalogList('en'),
      getChallengeCatalogList('id'),
    ]);
    const english = englishCatalog.map((item) => ({
      ...item,
      id: item.slug,
      isPublished: true,
      completionCount: 0,
      isCompleted: false,
    }));
    const indonesian = indonesianCatalog.map((item) => ({
      ...item,
      id: item.slug,
      isPublished: true,
      completionCount: 0,
      isCompleted: false,
    }));
    const filter = (
      challenges: typeof english,
      query: string,
      track: TrackId = 'all',
    ) =>
      filterPracticeChallenges(challenges, {
        query,
        track,
        hideCompleted: false,
      });

    const englishIntegration = filter(english, 'Integration Patterns', 'e2e');
    const indonesianIntegration = filter(indonesian, 'Pola Integrasi', 'e2e');
    expect(englishIntegration.length).toBeGreaterThan(0);
    expect(indonesianIntegration.map((item) => item.slug)).toEqual(
      englishIntegration.map((item) => item.slug),
    );
    expect(
      englishIntegration.every(
        (item) => item.category === 'e2e-integration',
      ),
    ).toBe(true);
    expect(
      indonesianIntegration.every(
        (item) => item.category === 'e2e-integration',
      ),
    ).toBe(true);

    const englishNavigation = filter(english, 'Navigation & Actions', 'core');
    const indonesianNavigation = filter(indonesian, 'Navigasi & Aksi', 'core');
    expect(englishNavigation.length).toBeGreaterThan(0);
    expect(indonesianNavigation.map((item) => item.slug)).toEqual(
      englishNavigation.map((item) => item.slug),
    );
    expect(
      englishNavigation.every(
        (item) => item.category === 'playwright-navigation',
      ),
    ).toBe(true);
    expect(
      indonesianNavigation.every(
        (item) => item.category === 'playwright-navigation',
      ),
    ).toBe(true);

    const e2eSearchResults = filter(english, 'e2e');
    expect(e2eSearchResults.length).toBeGreaterThan(0);
    expect(e2eSearchResults.every((item) => item.category.startsWith('e2e-'))).toBe(
      true,
    );
  });

  test('hides cold-start solve counts below threshold and shows counts at or above threshold', () => {
    expect(PRACTICE_SOLVE_COUNT_THRESHOLD).toBe(20);
    expect(shouldShowPracticeSolveCount(undefined)).toBe(false);
    expect(shouldShowPracticeSolveCount(null)).toBe(false);
    expect(shouldShowPracticeSolveCount(Number.NaN)).toBe(false);
    expect(shouldShowPracticeSolveCount(-1)).toBe(false);
    expect(shouldShowPracticeSolveCount(0)).toBe(false);
    expect(shouldShowPracticeSolveCount(1)).toBe(false);
    expect(shouldShowPracticeSolveCount(19)).toBe(false);
    expect(shouldShowPracticeSolveCount(20)).toBe(true);
    expect(shouldShowPracticeSolveCount(21)).toBe(true);
    expect(shouldShowPracticeSolveCount(150)).toBe(true);
  });

  test('orders track tabs with modern Playwright tracks ahead of legacy selectors', () => {
    expect(TRACK_IDS).toEqual(['all', 'core', 'e2e', 'scripting', 'selectors']);
    expect(PRACTICE_TIER_ORDER).toEqual([
      'intermediate',
      'e2e',
      'beginner',
      'basic',
    ]);
  });

  test('groups deterministically with modern Playwright tracks ahead of legacy selectors', () => {
    const shuffled = [
      challenge({
        slug: 'b',
        category: 'css-basics',
        type: 'CSS_SELECTOR',
        order: 2,
      }),
      challenge({
        slug: 'z',
        category: 'css-basics',
        type: 'CSS_SELECTOR',
        order: 1,
      }),
      challenge({
        slug: 'a',
        category: 'css-basics',
        type: 'CSS_SELECTOR',
        order: 1,
      }),
      challenge({
        slug: 'e2e-pom-login',
        category: 'e2e-pom',
        type: 'PLAYWRIGHT',
        order: 4000,
      }),
      challenge({
        slug: 'js-intro',
        category: 'js-fundamentals',
        type: 'JAVASCRIPT',
        order: 2000,
      }),
      challenge({
        slug: 'playwright',
        category: 'playwright-locators',
        type: 'PLAYWRIGHT',
        order: 2990,
      }),
    ];

    const groups = groupPracticeChallenges(shuffled);
    expect(groups.map((group) => group.category)).toEqual([
      'playwright-locators',
      'e2e-pom',
      'js-fundamentals',
      'css-basics',
    ]);
    expect(groups[3]?.challenges.map((item) => item.slug)).toEqual([
      'a',
      'z',
      'b',
    ]);
  });

  test('puts the category containing the earliest challenge first within the same tier', () => {
    const groups = groupPracticeChallenges([
      challenge({
        slug: 'later-start',
        category: 'playwright-navigation',
        type: 'PLAYWRIGHT',
        order: 3200,
      }),
      challenge({
        slug: 'first-playwright-test',
        category: 'playwright-locators',
        type: 'PLAYWRIGHT',
        order: 2990,
      }),
    ]);

    expect(groups.map((group) => group.category)).toEqual([
      'playwright-locators',
      'playwright-navigation',
    ]);
  });

  test('leads the real All catalog with Playwright while keeping CSS/XPath accessible via Selectors track and search', async () => {
    const [englishCatalog, indonesianCatalog] = await Promise.all([
      getChallengeCatalogList('en'),
      getChallengeCatalogList('id'),
    ]);

    for (const rawCatalog of [englishCatalog, indonesianCatalog]) {
      const items: PracticeChallenge[] = rawCatalog.map((item) => ({
        ...item,
        id: item.slug,
        isPublished: true,
        completionCount: 0,
        isCompleted: false,
      }));

      const allFiltered = filterPracticeChallenges(items, {
        track: 'all',
        hideCompleted: false,
      });
      const allGroups = groupPracticeChallenges(allFiltered);
      const groupCategories = allGroups.map((group) => group.category);

      expect(groupCategories[0]).toBe('playwright-locators');
      expect(groupCategories.indexOf('playwright-locators')).toBeLessThan(
        groupCategories.indexOf('e2e-pom'),
      );
      expect(groupCategories.indexOf('e2e-pom')).toBeLessThan(
        groupCategories.indexOf('js-fundamentals'),
      );
      expect(groupCategories.indexOf('js-fundamentals')).toBeLessThan(
        groupCategories.indexOf('css-basics'),
      );
      expect(groupCategories.indexOf('css-basics')).toBeLessThan(
        groupCategories.indexOf('xpath-basics'),
      );

      const selectorTrack = filterPracticeChallenges(items, {
        track: 'selectors',
        hideCompleted: false,
      });
      expect(selectorTrack.length).toBeGreaterThan(0);
      expect(
        selectorTrack.some((item) => item.category === 'css-basics'),
      ).toBe(true);
      expect(
        selectorTrack.some((item) => item.category === 'xpath-basics'),
      ).toBe(true);

      for (const query of ['css', 'xpath', 'selektor']) {
        const matches = filterPracticeChallenges(items, {
          query,
          track: 'all',
          hideCompleted: false,
        });
        expect(matches.length).toBeGreaterThan(0);
      }
    }
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
