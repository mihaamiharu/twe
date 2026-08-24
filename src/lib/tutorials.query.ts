import { queryOptions } from '@tanstack/react-query';
import { getTutorial, getTutorials } from '@/server/tutorials.fn';

export type TutorialListResponse = Awaited<ReturnType<typeof getTutorials>>;
export type TutorialDetailResponse = Awaited<ReturnType<typeof getTutorial>>;

export interface CatalogViewerScope {
  /** Cache-only identity for the user-specific overlay returned by the server. */
  viewerId?: string | null | undefined;
}

const viewerKey = (viewerId: string | null | undefined): string =>
  viewerId ?? 'anonymous';

export const tutorialCatalogQueryKeys = {
  list: (locale: string, viewerId?: string | null) =>
    ['catalog', 'learn', 'list', locale, viewerKey(viewerId)] as const,
  detail: (slug: string, locale: string, viewerId?: string | null) =>
    ['catalog', 'learn', 'detail', slug, locale, viewerKey(viewerId)] as const,
};

export const tutorialsListQueryOptions = ({
  locale,
  viewerId,
}: { locale: string } & CatalogViewerScope) =>
  queryOptions({
    queryKey: tutorialCatalogQueryKeys.list(locale, viewerId),
    queryFn: () => getTutorials({ data: { locale } }),
  });

export const tutorialDetailQueryOptions = (
  slug: string,
  locale: string,
  viewerId?: string | null,
) =>
  queryOptions({
    queryKey: tutorialCatalogQueryKeys.detail(slug, locale, viewerId),
    queryFn: () => getTutorial({ data: { slug, locale } }),
  });
