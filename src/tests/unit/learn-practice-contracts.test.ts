import { describe, expect, test } from 'bun:test';
import {
  getChallengeCatalogDetail,
  getChallengeCatalogList,
  getChallengeContent,
  getChallengeList,
  getRawChallengeContent,
  getTutorialCatalogDetail,
  getTutorialCatalogList,
  getTutorialContent,
  getTutorialList,
  getNextTutorial,
  validateCatalogRelationships,
} from '@/server/content.server';
import {
  challengeCatalogQueryKeys,
  challengeDetailQueryOptions,
  challengeListQueryOptions,
} from '@/lib/challenges.query';
import {
  tutorialCatalogQueryKeys,
  tutorialDetailQueryOptions,
  tutorialsListQueryOptions,
  tutorialProgressInvalidationKeys,
} from '@/lib/tutorials.query';
import { challengeProgressInvalidationKeys } from '@/lib/challenges.query';
import {
  mergeChallengeCatalogOverlay,
  mergeTutorialCatalogOverlay,
} from '@/lib/catalog-overlays';
import { challengeSubmissionHandler } from '@/server/submissions.fn';

const REQUIRED_TUTORIAL_SUMMARY_FIELDS = [
  'slug',
  'title',
  'description',
  'order',
  'estimatedMinutes',
  'tags',
] as const;

const REQUIRED_CHALLENGE_SUMMARY_FIELDS = [
  'slug',
  'title',
  'description',
  'type',
  'difficulty',
  'category',
  'xpReward',
  'order',
  'tags',
] as const;

function expectNonEmptyString(value: unknown): void {
  expect(typeof value).toBe('string');
  expect((value as string).trim().length).toBeGreaterThan(0);
}

function expectSortedByOrder(items: ReadonlyArray<{ order: number }>): void {
  for (let index = 1; index < items.length; index += 1) {
    const previous = items[index - 1];
    const current = items[index];
    if (!previous || !current)
      throw new Error('Expected adjacent catalog items');
    expect(current.order).toBeGreaterThanOrEqual(previous.order);
  }
}

describe('Learn and Practice catalog contracts', () => {
  test('tutorial lists are unique, localized, deterministic, and detail-compatible', async () => {
    const [english, indonesian, repeatedEnglish] = await Promise.all([
      getTutorialList('en'),
      getTutorialList('id'),
      getTutorialList('en'),
    ]);

    expect(english.length).toBeGreaterThan(0);
    expect(new Set(english.map((tutorial) => tutorial.slug)).size).toBe(
      english.length,
    );
    expect(english.map((tutorial) => tutorial.slug)).toEqual(
      repeatedEnglish.map((tutorial) => tutorial.slug),
    );
    expect(english.map((tutorial) => tutorial.slug)).toEqual(
      indonesian.map((tutorial) => tutorial.slug),
    );
    expectSortedByOrder(english);
    expectSortedByOrder(indonesian);

    for (const locale of ['en', 'id'] as const) {
      const summaries = locale === 'en' ? english : indonesian;
      for (const summary of summaries) {
        for (const field of REQUIRED_TUTORIAL_SUMMARY_FIELDS) {
          expect(summary).toHaveProperty(field);
        }
        expectNonEmptyString(summary.title);
        expectNonEmptyString(summary.description);

        const detail = await getTutorialContent(summary.slug, locale);
        expect(detail).not.toBeNull();
        if (!detail)
          throw new Error(`Missing tutorial detail: ${summary.slug}`);

        expect(detail).toMatchObject(summary);
        expectNonEmptyString(detail.content);
        expect(detail.slug).toBe(summary.slug);
        expect(detail.order).toBe(summary.order);
      }
    }

    const first = english[0];
    const last = english.at(-1);
    if (!first || !last) throw new Error('Expected tutorial boundaries');
    const firstNext = await getNextTutorial(first.slug, 'en');
    const lastNext = await getNextTutorial(last.slug, 'en');
    expect(firstNext?.slug).toBe(english[1]?.slug);
    expect(lastNext).toBeNull();
  });

  test('challenge lists and details keep stable projections across locales', async () => {
    const [english, indonesian, repeatedEnglish] = await Promise.all([
      getChallengeList('en'),
      getChallengeList('id'),
      getChallengeList('en'),
    ]);

    expect(english.length).toBeGreaterThan(0);
    expect(new Set(english.map((challenge) => challenge.slug)).size).toBe(
      english.length,
    );
    expect(english.map((challenge) => challenge.slug)).toEqual(
      repeatedEnglish.map((challenge) => challenge.slug),
    );
    expect(english.map((challenge) => challenge.slug)).toEqual(
      indonesian.map((challenge) => challenge.slug),
    );
    expectSortedByOrder(english);
    expectSortedByOrder(indonesian);

    for (const locale of ['en', 'id'] as const) {
      const summaries = locale === 'en' ? english : indonesian;
      for (const summary of summaries) {
        for (const field of REQUIRED_CHALLENGE_SUMMARY_FIELDS) {
          expect(summary).toHaveProperty(field);
        }
        expectNonEmptyString(summary.title);
        expectNonEmptyString(summary.description);

        const detail = await getChallengeContent(summary.slug, locale);
        expect(detail).not.toBeNull();
        if (!detail)
          throw new Error(`Missing challenge detail: ${summary.slug}`);

        expect(detail).toMatchObject({
          slug: summary.slug,
          type: summary.type,
          difficulty: summary.difficulty,
          category: summary.category,
          xpReward: summary.xpReward,
          order: summary.order,
          title: summary.title,
          description: summary.description,
        });
        expectNonEmptyString(detail.instructions);
        expect(Array.isArray(detail.testCases)).toBe(true);

        if (detail.tutorialSlug) {
          // Tutorial links are optional content metadata; when present, the
          // detail response must keep the slug stable for navigation.
          expect(typeof detail.tutorialSlug).toBe('string');
        }
        if (detail.slug !== summary.slug) {
          throw new Error('Detail slug changed during projection');
        }
      }
    }

    for (const summary of english) {
      const raw = await getRawChallengeContent(summary.slug);
      expect(raw).not.toBeNull();
      if (!raw) throw new Error(`Missing raw challenge: ${summary.slug}`);
      expectNonEmptyString(raw.title.en);
      expectNonEmptyString(raw.description.en);
      expectNonEmptyString(raw.instructions.en);
      // Legacy content may rely on the service's English fallback for an
      // absent Indonesian instruction block. The user-facing projection must
      // still be populated in both locales.
      expectNonEmptyString(raw.title.id ?? raw.title.en);
      expectNonEmptyString(raw.description.id ?? raw.description.en);
      expectNonEmptyString(raw.instructions.id ?? raw.instructions.en);
    }
  });

  test('challenge query keys isolate locale and list/detail dimensions', () => {
    const englishList = challengeListQueryOptions({ locale: 'en' });
    const indonesianList = challengeListQueryOptions({ locale: 'id' });
    const clientFilteredList = challengeListQueryOptions({ locale: 'en' });
    const englishDetail = challengeDetailQueryOptions('pw-locator-intro', 'en');
    const indonesianDetail = challengeDetailQueryOptions(
      'pw-locator-intro',
      'id',
    );

    expect(englishList.queryKey).not.toEqual(indonesianList.queryKey);
    expect(englishList.queryKey).toEqual(clientFilteredList.queryKey);
    expect(englishDetail.queryKey).not.toEqual(indonesianDetail.queryKey);
    expect([...englishList.queryKey]).toEqual([
      ...challengeCatalogQueryKeys.list('en'),
    ]);
    expect([...englishDetail.queryKey]).toEqual([
      ...challengeCatalogQueryKeys.detail('pw-locator-intro', 'en'),
    ]);
  });

  test('catalog query keys include viewer scope for dynamic overlays', () => {
    const anonymous = tutorialsListQueryOptions({ locale: 'en' });
    const authenticated = tutorialsListQueryOptions({
      locale: 'en',
      viewerId: 'user-1',
    });

    expect(anonymous.queryKey).not.toEqual(authenticated.queryKey);
    expect([...anonymous.queryKey]).toEqual([
      ...tutorialCatalogQueryKeys.list('en'),
    ]);
    expect([...authenticated.queryKey]).toEqual([
      ...tutorialCatalogQueryKeys.list('en', 'user-1'),
    ]);
    expect([
      ...tutorialDetailQueryOptions('dom-tree-hierarchy', 'id').queryKey,
    ]).toEqual([
      ...tutorialCatalogQueryKeys.detail('dom-tree-hierarchy', 'id'),
    ]);

    expect(tutorialProgressInvalidationKeys('lesson', 'en', 'user-1')).toEqual([
      tutorialCatalogQueryKeys.detail('lesson', 'en', 'user-1'),
      tutorialCatalogQueryKeys.list('en', 'user-1'),
    ]);
    expect(
      challengeProgressInvalidationKeys('challenge', 'id', 'user-1'),
    ).toEqual([
      ['catalog', 'practice', 'detail', 'challenge', 'id', 'user-1'],
      ['catalog', 'practice', 'list', 'id', 'user-1'],
    ]);
  });

  test('pure catalog contracts stay free of database and user overlays', async () => {
    const [tutorialList, tutorialDetail, challengeList, challengeDetail] =
      await Promise.all([
        getTutorialCatalogList('en'),
        getTutorialCatalogDetail('dom-tree-hierarchy', 'en'),
        getChallengeCatalogList('en'),
        getChallengeCatalogDetail('pw-locator-intro', 'en'),
      ]);

    expect(tutorialList[0]).not.toHaveProperty('id');
    expect(tutorialDetail).not.toBeNull();
    expect(tutorialDetail).not.toHaveProperty('viewCount');
    expect(challengeList[0]).not.toHaveProperty('completionCount');
    expect(challengeDetail).not.toBeNull();
    expect(challengeDetail).not.toHaveProperty('isCompleted');
  });

  test('catalog overlays merge by slug without changing editorial fields', () => {
    const tutorial = {
      slug: 'lesson',
      title: 'Localized lesson',
      description: 'Description',
      order: 1,
      estimatedMinutes: 5,
      tags: ['beginner'],
      relatedChallenges: [],
    };
    const challenge = {
      slug: 'challenge',
      type: 'JAVASCRIPT' as const,
      difficulty: 'EASY' as const,
      category: 'js-fundamentals',
      xpReward: 10,
      order: 1,
      title: 'Localized challenge',
      description: 'Description',
      tags: ['javascript'],
    };

    expect(mergeTutorialCatalogOverlay(tutorial)).toMatchObject({
      slug: 'lesson',
      id: 'lesson',
      isCompleted: false,
      readingProgress: 0,
    });
    expect(
      mergeChallengeCatalogOverlay(challenge, {
        slug: 'challenge',
        id: 'db-id',
        completionCount: 4,
        isCompleted: true,
      }),
    ).toMatchObject({
      slug: 'challenge',
      id: 'db-id',
      title: 'Localized challenge',
      completionCount: 4,
      isCompleted: true,
    });
  });

  test('all declared Learn and Practice relationships resolve', async () => {
    await validateCatalogRelationships();
    const [tutorials, challenges] = await Promise.all([
      getTutorialCatalogList('en'),
      getChallengeCatalogList('en'),
    ]);
    const tutorialSlugs = new Set(tutorials.map((tutorial) => tutorial.slug));
    const challengeSlugs = new Set(
      challenges.map((challenge) => challenge.slug),
    );

    for (const tutorial of tutorials) {
      for (const challengeSlug of tutorial.relatedChallenges) {
        expect(challengeSlugs.has(challengeSlug)).toBe(true);
      }
    }
    for (const challenge of challenges) {
      if (challenge.tutorialSlug) {
        expect(tutorialSlugs.has(challenge.tutorialSlug)).toBe(true);
      }
    }
  });

  test('practice submissions skip persistence and XP awards', async () => {
    const passed = await challengeSubmissionHandler({
      data: {
        challengeSlug: 'pw-locator-intro',
        code: "await expect(page.locator('h1')).toBeVisible();",
        isPractice: true,
        testResults: [{ passed: true, output: null }],
        executionTime: 12,
        locale: 'en',
      },
      context: { user: { id: '00000000-0000-0000-0000-000000000001' } },
    });

    expect(passed.success).toBe(true);
    if (!passed.success || !passed.data) {
      throw new Error(passed.error ?? 'Practice submission failed');
    }
    expect(passed.data.isPracticeMode).toBe(true);
    expect(passed.data.isFirstCompletion).toBe(false);
    expect(passed.data.submission).toMatchObject({
      id: 'practice',
      isPassed: true,
      testsPassed: 1,
      testsTotal: 1,
      xpEarned: 0,
      executionTime: 12,
    });

    const failed = await challengeSubmissionHandler({
      data: {
        challengeSlug: 'pw-locator-intro',
        code: "await expect(page.locator('.missing')).toBeVisible();",
        isPractice: true,
        testResults: [{ passed: false, error: 'not found' }],
        locale: 'id',
      },
      context: { user: { id: '00000000-0000-0000-0000-000000000001' } },
    });

    expect(failed.success).toBe(true);
    if (!failed.success || !failed.data) {
      throw new Error(
        failed.error ?? 'Failed practice submission did not return',
      );
    }
    expect(failed.data.isPracticeMode).toBe(true);
    expect(failed.data.submission.isPassed).toBe(false);
    expect(failed.data.submission.xpEarned).toBe(0);
  });
});
