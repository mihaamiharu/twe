import { describe, expect, test } from 'bun:test';
import type { TutorialCatalogListItemWithOverlay } from '@/lib/catalog-overlays';
import { filterLearnCatalog } from '@/lib/learn-catalog';
import { LearnSearchSchema } from '@/lib/learn-search';
import {
  optimisticallyCompleteLearnCaches,
  type LearnCompletionCacheValues,
} from '@/lib/learn-completion';
import i18n from '@/lib/i18n';
import type {
  TutorialDetailResponse,
  TutorialListResponse,
} from '@/lib/tutorials.query';
import {
  createLearnDetailSeoHead,
  createLearnFallbackSeoHead,
} from '@/lib/learn-seo';
import {
  getNextTutorialCatalogItem,
  getPreviousTutorialCatalogItem,
  getTutorialCatalogList,
  getTutorialCatalogDetail,
} from '@/server/content-catalog.server';

const module = {
  slug: 'read-the-ui',
  order: 2,
  title: 'Read the Web UI',
  description: 'Understand the live interface.',
  outcome: 'Explain what automation can reliably locate.',
};

const makeLesson = (
  overrides: Partial<TutorialCatalogListItemWithOverlay> = {},
): TutorialCatalogListItemWithOverlay => ({
  id: 'lesson-id',
  slug: 'dom-tree-hierarchy',
  title: 'Reading the DOM Tree',
  description: 'Understand browser hierarchy before writing selectors.',
  order: 2,
  module,
  moduleOrder: 2,
  kind: 'core',
  estimatedMinutes: 8,
  tags: ['foundations', 'dom'],
  relatedChallenges: [],
  practice: [],
  isPublished: true,
  viewCount: 0,
  isCompleted: false,
  ...overrides,
});

const makeDetailResponse = (): TutorialDetailResponse => ({
  success: true,
  data: {
    id: 'lesson-id',
    slug: 'dom-tree-hierarchy',
    title: 'Reading the DOM Tree',
    description: 'Understand browser hierarchy before writing selectors.',
    content: '## Read the DOM',
    estimatedMinutes: 8,
    module,
    moduleOrder: 2,
    kind: 'core',
    tags: ['foundations', 'dom'],
    relatedChallenges: [],
    practice: [],
    order: 2,
    viewCount: 0,
    challenges: [],
    userProgress: {
      isCompleted: false,
      lastAccessedAt: null,
    },
    previousTutorial: null,
    nextTutorial: { slug: 'next-lesson', title: 'Next lesson' },
  },
});

const makeListResponse = (): TutorialListResponse => ({
  success: true,
  data: [makeLesson()],
  meta: {
    availableTags: ['dom', 'foundations'],
    modules: [
      {
        ...module,
        coreLessons: 1,
        completedCoreLessons: 0,
        corePractice: 0,
        completedCorePractice: 0,
        isCompleted: false,
      },
    ],
    completion: {
      coreLessons: 1,
      completedCoreLessons: 0,
      corePractice: 0,
      completedCorePractice: 0,
      isCompleted: false,
    },
  },
  pagination: {
    page: 1,
    limit: 1,
    total: 1,
    totalPages: 1,
  },
});

describe('Learn experience contracts', () => {
  test('parses URL completion visibility as a typed boolean', () => {
    expect(LearnSearchSchema.parse({}).hideCompleted).toBeUndefined();
    expect(
      LearnSearchSchema.parse({ hideCompleted: 'false' }).hideCompleted,
    ).toBe(false);
    expect(
      LearnSearchSchema.parse({ hideCompleted: 'true' }).hideCompleted,
    ).toBe(true);
    expect(
      LearnSearchSchema.parse({ hideCompleted: false }).hideCompleted,
    ).toBe(false);
  });

  test('ignores removed Learn difficulty and view URL parameters', () => {
    expect(
      LearnSearchSchema.parse({
        q: 'DOM',
        difficulty: 'beginner',
        view: 'grid',
      }),
    ).toEqual({ q: 'DOM' });
  });

  test('keeps catalog and detail error copy localized and safe', () => {
    const englishCatalogError = i18n.t(
      'tutorials:learn.lessons.errorDescription',
      { lng: 'en' },
    );
    const indonesianCatalogError = i18n.t(
      'tutorials:learn.lessons.errorDescription',
      { lng: 'id' },
    );
    const englishDetailError = i18n.t(
      'tutorials:learn.detailError.description',
      {
        lng: 'en',
      },
    );
    const indonesianDetailError = i18n.t(
      'tutorials:learn.detailError.description',
      { lng: 'id' },
    );

    expect(englishCatalogError).toBe(
      "We couldn't load the lesson catalog. Please try again later.",
    );
    expect(indonesianCatalogError).toBe(
      'Katalog pelajaran tidak dapat dimuat. Silakan coba lagi nanti.',
    );
    expect(englishDetailError).toBe(
      "We couldn't load this lesson. Please return to Learn and try again.",
    );
    expect(indonesianDetailError).toBe(
      'Pelajaran ini tidak dapat dimuat. Kembali ke Belajar dan coba lagi.',
    );
    expect(englishCatalogError).not.toContain('An error occurred');
    expect(englishDetailError).not.toContain('Error fetching');
  });

  test('optimistically completes viewer-scoped detail and list caches', () => {
    const caches: LearnCompletionCacheValues = {
      detail: makeDetailResponse(),
      list: makeListResponse(),
    };

    const optimistic = optimisticallyCompleteLearnCaches(
      caches,
      'dom-tree-hierarchy',
    );

    expect(optimistic.detail?.success).toBe(true);
    if (!optimistic.detail?.success) throw new Error('Expected detail cache');
    expect(optimistic.detail.data.userProgress?.isCompleted).toBe(true);
    expect(optimistic.list?.success).toBe(true);
    if (!optimistic.list?.success) throw new Error('Expected list cache');
    expect(optimistic.list.data[0]?.isCompleted).toBe(true);
  });

  test('preserves the cache snapshot for completion rollback', () => {
    const caches: LearnCompletionCacheValues = {
      detail: makeDetailResponse(),
      list: makeListResponse(),
    };
    const snapshot = { ...caches };

    void optimisticallyCompleteLearnCaches(caches, 'dom-tree-hierarchy');

    expect(snapshot.detail).toEqual(caches.detail);
    expect(snapshot.list).toEqual(caches.list);
    expect(snapshot.detail?.success).toBe(true);
    if (!snapshot.detail?.success) throw new Error('Expected detail snapshot');
    expect(snapshot.detail.data.userProgress?.isCompleted).toBe(false);
  });

  test('filters the loaded localized catalog by displayed title and description', () => {
    const lessons = [
      makeLesson(),
      makeLesson({
        id: 'css-id',
        slug: 'css-selector-strategies',
        title: 'CSS Selector Strategies',
        description: 'Choose robust selectors for automation.',
        order: 5,
        tags: ['beginner', 'css'],
      }),
    ];

    expect(
      filterLearnCatalog(lessons, { query: 'robust selectors' }).map(
        (lesson) => lesson.slug,
      ),
    ).toEqual(['css-selector-strategies']);
    expect(
      filterLearnCatalog(lessons, { query: 'dom' }).map(
        (lesson) => lesson.slug,
      ),
    ).toEqual(['dom-tree-hierarchy']);
    expect(filterLearnCatalog(lessons, { query: 'foundations' })).toHaveLength(
      0,
    );
  });

  test('preserves registry order while applying authenticated completion filtering', () => {
    const lessons = [
      makeLesson({
        id: 'beginner-id',
        slug: 'javascript-fundamentals-for-qa',
        title: 'JavaScript Fundamentals',
        tags: ['beginner', 'javascript'],
        isCompleted: true,
      }),
      makeLesson({
        order: 1,
        slug: 'html-element-anatomy',
        title: 'HTML Element Anatomy',
        tags: ['foundations', 'html'],
      }),
      makeLesson({ order: 3, slug: 'playwright-basics' }),
    ];

    expect(
      filterLearnCatalog(lessons, {}).map((lesson) => lesson.slug),
    ).toEqual([
      'javascript-fundamentals-for-qa',
      'html-element-anatomy',
      'playwright-basics',
    ]);
    expect(
      filterLearnCatalog(lessons, {
        hideCompleted: true,
      }),
    ).toEqual(lessons.slice(1));
    expect(
      filterLearnCatalog(lessons, { hideCompleted: false }).map(
        (lesson) => lesson.slug,
      ),
    ).toEqual(lessons.map((lesson) => lesson.slug));
  });

  test('detail SEO uses localized catalog data and includes both learning schemas', async () => {
    const [english, indonesian] = await Promise.all([
      getTutorialCatalogDetail('dom-tree-hierarchy', 'en'),
      getTutorialCatalogDetail('dom-tree-hierarchy', 'id'),
    ]);

    expect(english).not.toBeNull();
    expect(indonesian).not.toBeNull();
    if (!english || !indonesian) throw new Error('Expected localized lessons');

    const englishHead = createLearnDetailSeoHead({
      lesson: english,
      locale: 'en',
    });
    const indonesianHead = createLearnDetailSeoHead({
      lesson: indonesian,
      locale: 'id',
    });
    const englishScripts = englishHead.scripts ?? [];

    expect(englishHead.meta).toContainEqual({
      name: 'description',
      content: english.description,
    });
    expect(indonesianHead.meta).toContainEqual({
      name: 'description',
      content: indonesian.description,
    });
    expect(englishHead.links).toContainEqual({
      rel: 'alternate',
      hrefLang: 'id',
      href: 'https://testingwithekki.com/id/learn/dom-tree-hierarchy',
    });
    expect(englishHead.meta).not.toContainEqual({
      title: 'Dom Tree Hierarchy | TestingWithEkki',
    });
    expect(englishScripts).toHaveLength(3);

    const schemas = englishScripts.map(
      (script) => JSON.parse(script.children) as Record<string, unknown>,
    );
    expect(schemas.map((schema) => schema['@type'])).toEqual([
      'BreadcrumbList',
      'Article',
      'LearningResource',
    ]);
    expect(schemas[1]?.['headline']).toBe(english.title);
    expect(schemas[1]?.['author']).toEqual({
      '@id': 'https://testingwithekki.com/en/about#person',
    });
    expect(schemas[1]?.['publisher']).toEqual({
      '@id': 'https://testingwithekki.com/#organization',
    });
    expect(schemas[2]?.['author']).toEqual({
      '@id': 'https://testingwithekki.com/en/about#person',
    });
    expect(schemas[2]?.['timeRequired']).toBe('PT18M');
  });

  test('missing-content metadata stays generic and noindex', () => {
    const head = createLearnFallbackSeoHead({
      locale: 'id',
      slug: 'not-a-real-lesson',
    });

    expect(head.meta).toContainEqual({
      name: 'robots',
      content: 'noindex, nofollow',
    });
    expect(head.meta).not.toContainEqual({
      title: 'Not A Real Lesson | TestingWithEkki',
    });
  });

  test('deterministic catalog navigation exposes the previous item', async () => {
    const previous = await getPreviousTutorialCatalogItem(
      'dom-tree-hierarchy',
      'en',
    );
    expect(previous).toEqual({
      slug: 'html-element-anatomy',
      title: 'Read HTML Through Role, Accessible Name, and State',
    });
  });

  test('catalog navigation handles first, last, and missing items', async () => {
    const catalog = await getTutorialCatalogList('en');
    const first = catalog[0];
    const last = catalog.at(-1);
    if (!first || !last) throw new Error('Expected catalog boundaries');

    expect(await getPreviousTutorialCatalogItem(first.slug, 'en')).toBeNull();
    expect(await getNextTutorialCatalogItem(last.slug, 'en')).toBeNull();
    expect(
      await getPreviousTutorialCatalogItem('not-a-real-lesson', 'en'),
    ).toBeNull();
    expect(
      await getNextTutorialCatalogItem('not-a-real-lesson', 'en'),
    ).toBeNull();
  });
});
