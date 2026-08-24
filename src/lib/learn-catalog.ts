import type { TutorialCatalogListItemWithOverlay } from './catalog-overlays';

export interface LearnCatalogFilters {
  query?: string;
  hideCompleted?: boolean;
}

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

    return true;
  });
}
