import { describe, expect, test } from 'bun:test';
import type { TutorialCatalogListItemWithOverlay } from '@/lib/catalog-overlays';
import { filterLearnCatalog, LEARN_DIFFICULTIES } from '@/lib/learn-catalog';
import {
  createLearnDetailSeoHead,
  createLearnFallbackSeoHead,
} from '@/lib/learn-seo';
import {
  getPreviousTutorialCatalogItem,
  getTutorialCatalogDetail,
} from '@/server/content-catalog.server';

const makeLesson = (
  overrides: Partial<TutorialCatalogListItemWithOverlay> = {},
): TutorialCatalogListItemWithOverlay => ({
  id: 'lesson-id',
  slug: 'dom-tree-hierarchy',
  title: 'Reading the DOM Tree',
  description: 'Understand browser hierarchy before writing selectors.',
  order: 2,
  estimatedMinutes: 8,
  tags: ['foundations', 'dom'],
  relatedChallenges: [],
  isPublished: true,
  viewCount: 0,
  isCompleted: false,
  readingProgress: 0,
  ...overrides,
});

describe('Learn experience contracts', () => {
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

  test('combines difficulty and completion visibility client-side', () => {
    const lessons = [
      makeLesson(),
      makeLesson({
        id: 'beginner-id',
        slug: 'javascript-fundamentals-for-qa',
        title: 'JavaScript Fundamentals',
        tags: ['beginner', 'javascript'],
        isCompleted: true,
        readingProgress: 100,
      }),
    ];

    expect(LEARN_DIFFICULTIES).toContain('beginner');
    expect(
      filterLearnCatalog(lessons, {
        difficulty: 'beginner',
        hideCompleted: true,
      }),
    ).toEqual([]);
    expect(
      filterLearnCatalog(lessons, { difficulty: 'foundations' }).map(
        (lesson) => lesson.slug,
      ),
    ).toEqual(['dom-tree-hierarchy']);
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
    expect(schemas[2]?.['timeRequired']).toBe('PT8M');
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
      title: 'Foundation 1: The Anatomy of an HTML Element',
    });
  });
});
