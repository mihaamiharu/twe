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
      expectNonEmptyString(raw.title.id);
      expectNonEmptyString(raw.description.id);
      expectNonEmptyString(raw.instructions.id);
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
      module: {
        slug: 'module',
        order: 1,
        title: 'Module',
        description: 'Module description',
        outcome: 'Module outcome',
      },
      moduleOrder: 1,
      kind: 'core' as const,
      estimatedMinutes: 5,
      tags: ['beginner'],
      relatedChallenges: [],
      practice: [],
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

    const mergedTutorial = mergeTutorialCatalogOverlay(tutorial);
    expect(mergedTutorial).toMatchObject({
      slug: 'lesson',
      id: 'lesson',
      isCompleted: false,
    });
    expect(mergedTutorial).not.toHaveProperty('readingProgress');
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

  test('curriculum metadata distinguishes modules, core work, and optional depth', async () => {
    const [tutorials, challenges] = await Promise.all([
      getTutorialCatalogList('en'),
      getChallengeCatalogList('en'),
    ]);
    const moduleOrders = tutorials.map((tutorial) => tutorial.module.order);

    expect(new Set(moduleOrders)).toContain(1);
    expect(new Set(moduleOrders)).toContain(9);
    expect(tutorials.every((tutorial) => tutorial.moduleOrder > 0)).toBe(true);
    expect(tutorials.some((tutorial) => tutorial.kind === 'optional')).toBe(
      true,
    );
    expect(
      tutorials.some((tutorial) =>
        tutorial.practice.some((practice) => practice.role === 'core'),
      ),
    ).toBe(true);
    expect(
      tutorials.some((tutorial) =>
        tutorial.practice.some((practice) => practice.role === 'additional'),
      ),
    ).toBe(true);
    const linkedPractice = new Set(
      tutorials.flatMap((tutorial) => tutorial.relatedChallenges),
    );
    expect(
      [...linkedPractice].every((slug) =>
        challenges.some((challenge) => challenge.slug === slug),
      ),
    ).toBe(true);
    expect(
      challenges.some((challenge) => !linkedPractice.has(challenge.slug)),
    ).toBe(true);
  });

  test('module one teaches automation judgment without an early coding gate', async () => {
    const tutorials = await getTutorialCatalogList('en');
    const moduleOne = tutorials.filter(
      (tutorial) => tutorial.module.order === 1,
    );

    expect(moduleOne.map((tutorial) => tutorial.slug)).toEqual([
      'universal-mindset',
      'automation-candidate-selection',
    ]);
    expect(moduleOne.every((tutorial) => tutorial.kind === 'core')).toBe(true);
    expect(moduleOne.flatMap((tutorial) => tutorial.practice)).toEqual([]);
  });

  test('module two teaches UI inspection without gating learners on DOM coding', async () => {
    const tutorials = await getTutorialCatalogList('en');
    const moduleTwo = tutorials.filter(
      (tutorial) => tutorial.module.order === 2,
    );

    expect(moduleTwo.map((tutorial) => tutorial.slug)).toEqual([
      'html-element-anatomy',
      'dom-tree-hierarchy',
      'devtools-mastery',
    ]);
    expect(moduleTwo.every((tutorial) => tutorial.kind === 'core')).toBe(true);
    expect(moduleTwo.flatMap((tutorial) => tutorial.practice)).toEqual([
      { slug: 'dom-queryselector-vs-all', role: 'additional' },
    ]);
  });

  test('module three completes with four lessons and three focused QA practices', async () => {
    const tutorials = await getTutorialCatalogList('en');
    const moduleThree = tutorials.filter(
      (tutorial) => tutorial.module.order === 3,
    );

    expect(moduleThree.map((tutorial) => tutorial.slug)).toEqual([
      'first-playwright-test',
      'javascript-fundamentals-for-qa',
      'async-await-basics',
      'typescript-for-qa',
    ]);
    expect(moduleThree.every((tutorial) => tutorial.kind === 'core')).toBe(
      true,
    );

    const practices = moduleThree.flatMap((tutorial) => tutorial.practice);
    expect(
      practices
        .filter((practice) => practice.role === 'core')
        .map(({ slug }) => slug),
    ).toEqual(['pw-first-test', 'js-fundamentals-boss', 'async-await-basics']);
    expect(
      practices
        .filter((practice) => practice.role !== 'core')
        .every((practice) => practice.role === 'additional'),
    ).toBe(true);

    const firstPlaywrightLesson = moduleThree.find(
      (tutorial) => tutorial.slug === 'first-playwright-test',
    );
    const javascriptLesson = moduleThree.find(
      (tutorial) => tutorial.slug === 'javascript-fundamentals-for-qa',
    );
    const asyncLesson = moduleThree.find(
      (tutorial) => tutorial.slug === 'async-await-basics',
    );

    expect(firstPlaywrightLesson?.practice).toEqual([
      { slug: 'pw-first-test', role: 'core' },
    ]);
    expect(javascriptLesson?.practice).toEqual([
      { slug: 'js-fundamentals-boss', role: 'core' },
      { slug: 'js-if-else-logic', role: 'additional' },
      { slug: 'js-array-methods', role: 'additional' },
    ]);
    expect(asyncLesson?.practice).toEqual([
      { slug: 'async-await-basics', role: 'core' },
      { slug: 'async-error-handling', role: 'additional' },
      { slug: 'async-parallel-execution', role: 'additional' },
    ]);

    const typeScriptLesson = moduleThree.find(
      (tutorial) => tutorial.slug === 'typescript-for-qa',
    );
    expect(typeScriptLesson?.practice).toEqual([
      { slug: 'ts-type-annotations', role: 'additional' },
      { slug: 'ts-interfaces-basics', role: 'additional' },
      { slug: 'ts-optional-properties', role: 'additional' },
      { slug: 'ts-fundamentals-boss', role: 'additional' },
    ]);
  });

  test('module four completes with locator judgment and scoped interaction proof', async () => {
    const tutorials = await getTutorialCatalogList('en');
    const moduleFour = tutorials.filter(
      (tutorial) => tutorial.module.order === 4,
    );

    expect(moduleFour.map((tutorial) => tutorial.slug)).toEqual([
      'playwright-locator-strategy',
      'locator-composition-and-strictness',
      'css-selector-strategies',
      'xpath-strategies',
    ]);
    expect(moduleFour.map((tutorial) => tutorial.kind)).toEqual([
      'core',
      'core',
      'core',
      'optional',
    ]);

    const practices = moduleFour.flatMap((tutorial) => tutorial.practice);
    expect(
      practices
        .filter((practice) => practice.role === 'core')
        .map(({ slug }) => slug),
    ).toEqual(['pw-get-by-role', 'pw-locators-boss']);

    const locatorStrategyLesson = moduleFour.find(
      (tutorial) => tutorial.slug === 'playwright-locator-strategy',
    );
    const compositionLesson = moduleFour.find(
      (tutorial) => tutorial.slug === 'locator-composition-and-strictness',
    );
    const cssLesson = moduleFour.find(
      (tutorial) => tutorial.slug === 'css-selector-strategies',
    );
    const xpathLesson = moduleFour.find(
      (tutorial) => tutorial.slug === 'xpath-strategies',
    );

    expect(locatorStrategyLesson?.practice).toEqual([
      { slug: 'pw-get-by-role', role: 'core' },
      { slug: 'pw-get-by-label', role: 'additional' },
      { slug: 'pw-get-by-text', role: 'additional' },
      { slug: 'pw-get-by-testid', role: 'additional' },
    ]);
    expect(compositionLesson?.practice).toEqual([
      { slug: 'pw-list-items', role: 'additional' },
      { slug: 'pw-dynamic-table', role: 'additional' },
      { slug: 'pw-locators-boss', role: 'core' },
    ]);
    expect(cssLesson?.practice).toEqual([]);
    expect(xpathLesson?.practice).toEqual([]);

    expect(xpathLesson?.kind).toBe('optional');
  });

  test('module five completes with deliberate actions and observable synchronization', async () => {
    const tutorials = await getTutorialCatalogList('en');
    const moduleFive = tutorials.filter(
      (tutorial) => tutorial.module.order === 5,
    );

    expect(moduleFive.map((tutorial) => tutorial.slug)).toEqual([
      'element-interactions',
      'playwright-actionability',
      'navigation-and-events',
    ]);
    expect(moduleFive.every((tutorial) => tutorial.kind === 'core')).toBe(true);

    const practices = moduleFive.flatMap((tutorial) => tutorial.practice);
    expect(
      practices
        .filter((practice) => practice.role === 'core')
        .map(({ slug }) => slug),
    ).toEqual(['pw-actions-boss', 'pw-action-outcome-sync']);
    expect(
      practices
        .filter((practice) => practice.role !== 'core')
        .every((practice) => practice.role === 'additional'),
    ).toBe(true);

    const interactionLesson = moduleFive.find(
      (tutorial) => tutorial.slug === 'element-interactions',
    );
    const actionabilityLesson = moduleFive.find(
      (tutorial) => tutorial.slug === 'playwright-actionability',
    );
    const eventLesson = moduleFive.find(
      (tutorial) => tutorial.slug === 'navigation-and-events',
    );

    expect(interactionLesson?.practice).toEqual([
      { slug: 'pw-actions-boss', role: 'core' },
      { slug: 'pw-fill-type', role: 'additional' },
      { slug: 'pw-checkbox-radio', role: 'additional' },
      { slug: 'pw-select-dropdowns', role: 'additional' },
      { slug: 'pw-keyboard-actions', role: 'additional' },
      { slug: 'pw-file-upload', role: 'additional' },
    ]);
    expect(actionabilityLesson?.practice).toEqual([
      { slug: 'pw-action-outcome-sync', role: 'core' },
    ]);
    expect(eventLesson?.practice).toEqual([
      { slug: 'pw-iframes', role: 'additional' },
    ]);
  });

  test('module six completes with one integrated evidence and test-design proof', async () => {
    const tutorials = await getTutorialCatalogList('en');
    const moduleSix = tutorials.filter(
      (tutorial) => tutorial.module.order === 6,
    );

    expect(moduleSix.map((tutorial) => tutorial.slug)).toEqual([
      'assertions-verify',
      'test-design-for-automation',
    ]);
    expect(moduleSix.every((tutorial) => tutorial.kind === 'core')).toBe(true);

    const practices = moduleSix.flatMap((tutorial) => tutorial.practice);
    expect(
      practices
        .filter((practice) => practice.role === 'core')
        .map(({ slug }) => slug),
    ).toEqual(['pw-assertions-boss']);
    expect(
      practices
        .filter((practice) => practice.role !== 'core')
        .every((practice) => practice.role === 'additional'),
    ).toBe(true);

    const assertionLesson = moduleSix.find(
      (tutorial) => tutorial.slug === 'assertions-verify',
    );
    const testDesignLesson = moduleSix.find(
      (tutorial) => tutorial.slug === 'test-design-for-automation',
    );

    expect(assertionLesson?.practice).toEqual([
      { slug: 'pw-assertions-boss', role: 'core' },
      { slug: 'pw-to-be-visible', role: 'additional' },
      { slug: 'pw-to-have-text', role: 'additional' },
      { slug: 'pw-state-assertions', role: 'additional' },
      { slug: 'pw-to-have-value', role: 'additional' },
      { slug: 'pw-to-have-count', role: 'additional' },
      { slug: 'pw-to-have-attribute', role: 'additional' },
      { slug: 'pw-soft-assertions', role: 'additional' },
    ]);
    expect(testDesignLesson?.practice).toEqual([]);
  });

  test('module seven completes with controlled state and root-cause repair', async () => {
    const tutorials = await getTutorialCatalogList('en');
    const moduleSeven = tutorials.filter(
      (tutorial) => tutorial.module.order === 7,
    );

    expect(moduleSeven.map((tutorial) => tutorial.slug)).toEqual([
      'playwright-architecture',
      'test-isolation-and-data',
      'debugging-flaky-tests',
    ]);
    expect(moduleSeven.every((tutorial) => tutorial.kind === 'core')).toBe(
      true,
    );

    const practices = moduleSeven.flatMap((tutorial) => tutorial.practice);
    expect(practices).toEqual([{ slug: 'pw-debug-flaky-test', role: 'core' }]);

    expect(moduleSeven[0]?.practice).toEqual([]);
    expect(moduleSeven[1]?.practice).toEqual([]);
    expect(moduleSeven[2]?.practice).toEqual([
      { slug: 'pw-debug-flaky-test', role: 'core' },
    ]);
  });

  test('module eight completes with justified abstraction and explicit suite policy', async () => {
    const tutorials = await getTutorialCatalogList('en');
    const moduleEight = tutorials.filter(
      (tutorial) => tutorial.module.order === 8,
    );

    expect(moduleEight.map((tutorial) => tutorial.slug)).toEqual([
      'page-object-model',
      'test-fixtures',
      'projects-configuration',
      'advanced-fixtures',
    ]);
    expect(moduleEight.map((tutorial) => tutorial.kind)).toEqual([
      'core',
      'core',
      'core',
      'optional',
    ]);

    const practices = moduleEight.flatMap((tutorial) => tutorial.practice);
    expect(practices).toEqual([{ slug: 'pom-login-basics', role: 'core' }]);

    expect(moduleEight[0]?.practice).toEqual([
      { slug: 'pom-login-basics', role: 'core' },
    ]);
    expect(moduleEight[1]?.practice).toEqual([]);
    expect(moduleEight[2]?.practice).toEqual([]);
    expect(moduleEight[3]?.practice).toEqual([]);
  });

  test('module nine completes with a reproducible feedback contract and one honest capstone checkpoint', async () => {
    const tutorials = await getTutorialCatalogList('en');
    const moduleNine = tutorials.filter(
      (tutorial) => tutorial.module.order === 9,
    );

    expect(moduleNine.map((tutorial) => tutorial.slug)).toEqual([
      'ci-reports-cross-browser',
      'ci-feedback-policy',
      'capstone-web-automation',
    ]);
    expect(moduleNine.every((tutorial) => tutorial.kind === 'core')).toBe(true);

    expect(moduleNine[0]?.practice).toEqual([]);
    expect(moduleNine[1]?.practice).toEqual([]);
    expect(moduleNine[2]?.practice).toEqual([
      { slug: 'pw-capstone-checkout', role: 'core' },
    ]);
    expect(moduleNine.flatMap((tutorial) => tutorial.practice)).toEqual([
      { slug: 'pw-capstone-checkout', role: 'core' },
    ]);
  });

  test('runner detail preserves expected state and task-specific validation', async () => {
    const detail = await getChallengeCatalogDetail('pw-debug-flaky-test', 'en');

    expect(detail?.expectedState).toEqual([
      {
        selector: '[data-order-id="ORD-1042"] [role=status]',
        visible: true,
        containsText: 'Order submitted: ORD-1042',
      },
    ]);
    expect(detail?.validation).toMatchObject({
      requiredAssertions: ['toHaveCount', 'toHaveText'],
      requiredMethods: ['getByRole', 'filter', 'click'],
      forbiddenMethods: ['first', 'nth', 'waitForTimeout', 'textContent', 'isVisible', 'toBeTruthy'],
    });
  });

  test('capstone checkpoint requires both rejection and recovery evidence', async () => {
    const detail = await getChallengeCatalogDetail(
      'pw-capstone-checkout',
      'en',
    );

    expect(detail?.expectedState).toEqual([
      {
        selector: '#confirmation',
        visible: true,
        containsText: '2 items',
      },
      { selector: '[role=alert]', hidden: true },
    ]);
    expect(detail?.validation).toMatchObject({
      requiredAssertions: [
        'toHaveText',
        'toBeHidden',
        'toBeVisible',
        'toContainText',
      ],
      requiredMethods: ['getByLabel', 'getByRole', 'fill', 'click'],
      forbiddenMethods: ['waitForTimeout', 'textContent', 'toBeTruthy', 'evaluate'],
      policy: {
        requireExecutedEvidence: true,
        forbidStructuralLocators: true,
        forbidForcedActions: true,
        forbidDirectDomAccess: true,
        forbidSwallowedErrors: true,
      },
      interactionSequence: {
        event: 'submit',
        selector: '#checkout-form',
        steps: [
          {
            inputSelector: '#quantity',
            inputValue: '0',
            expectedState: [
              {
                selector: '[role=alert]',
                visible: true,
                containsText: 'Quantity must be at least 1',
              },
              { selector: '#confirmation', hidden: true },
            ],
          },
          {
            inputSelector: '#quantity',
            inputValue: '2',
            expectedState: [
              { selector: '[role=alert]', hidden: true },
              {
                selector: '#confirmation',
                visible: true,
                containsText: '2 items',
              },
            ],
          },
        ],
      },
    });
  });

  test('retired misleading drills are absent from the published Practice catalog', async () => {
    const slugs = new Set(
      (await getChallengeCatalogList('en')).map((challenge) => challenge.slug),
    );

    expect(slugs.has('selector-performance')).toBe(false);
    expect(slugs.has('async-testing-patterns')).toBe(false);
    expect(slugs.has('pw-frame-locators')).toBe(false);
    expect(slugs.has('ts-generics-intro')).toBe(false);
    expect(slugs.has('automation-candidate-review')).toBe(false);
    expect(slugs.has('pom-login-failures')).toBe(false);
    expect(slugs.has('pom-multi-page')).toBe(false);
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
