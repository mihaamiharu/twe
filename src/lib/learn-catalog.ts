import type { TutorialCatalogListItemWithOverlay } from './catalog-overlays';

export const LEARN_DIFFICULTIES = [
  'foundations',
  'beginner',
  'intermediate',
  'advanced',
] as const;

export type LearnDifficulty = (typeof LEARN_DIFFICULTIES)[number];

export interface LearnCatalogFilters {
  query?: string;
  difficulty?: LearnDifficulty | 'all';
  hideCompleted?: boolean;
}

const matchesDifficulty = (
  lesson: TutorialCatalogListItemWithOverlay,
  difficulty: LearnCatalogFilters['difficulty'],
): boolean => {
  if (!difficulty || difficulty === 'all') return true;

  return lesson.tags.some(
    (tag) => tag.toLocaleLowerCase() === difficulty.toLocaleLowerCase(),
  );
};

/**
 * Apply the public Learn filters to the already-loaded localized catalog.
 * Search intentionally uses only the fields rendered as the lesson title and
 * description so URL filters cannot disagree with what a learner sees.
 */
export function filterLearnCatalog(
  lessons: ReadonlyArray<TutorialCatalogListItemWithOverlay>,
  filters: LearnCatalogFilters,
): TutorialCatalogListItemWithOverlay[] {
  const query = filters.query?.trim().toLocaleLowerCase() ?? '';

  return lessons.filter((lesson) => {
    if (
      query &&
      ![lesson.title, lesson.description].some((value) =>
        value.toLocaleLowerCase().includes(query),
      )
    ) {
      return false;
    }

    if (filters.hideCompleted && lesson.isCompleted) return false;

    return matchesDifficulty(lesson, filters.difficulty);
  });
}
