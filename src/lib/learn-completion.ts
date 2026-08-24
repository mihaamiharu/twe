import type {
  TutorialDetailResponse,
  TutorialListResponse,
} from './tutorials.query';

export interface LearnCompletionCacheValues {
  detail: TutorialDetailResponse | undefined;
  list: TutorialListResponse | undefined;
}

function completeDetail(
  response: TutorialDetailResponse | undefined,
): TutorialDetailResponse | undefined {
  if (!response?.success) return response;

  return {
    ...response,
    data: {
      ...response.data,
      userProgress: {
        ...(response.data.userProgress ?? { lastAccessedAt: null }),
        isCompleted: true,
        readingProgress: 100,
      },
    },
  };
}

function completeList(
  response: TutorialListResponse | undefined,
  slug: string,
): TutorialListResponse | undefined {
  if (!response?.success) return response;

  return {
    ...response,
    data: response.data.map((lesson) =>
      lesson.slug === slug
        ? { ...lesson, isCompleted: true, readingProgress: 100 }
        : lesson,
    ),
  };
}

/** Apply the viewer-scoped completion state without waiting for the server. */
export function optimisticallyCompleteLearnCaches(
  caches: LearnCompletionCacheValues,
  slug: string,
): LearnCompletionCacheValues {
  return {
    detail: completeDetail(caches.detail),
    list: completeList(caches.list, slug),
  };
}
