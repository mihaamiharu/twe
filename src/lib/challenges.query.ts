import { queryOptions } from '@tanstack/react-query';
import { getChallenge, getChallenges } from '@/server/challenges.fn';

export type ChallengeListResponse = Awaited<ReturnType<typeof getChallenges>>;
export type ChallengeDetailResponse = Awaited<ReturnType<typeof getChallenge>>;

export interface CatalogViewerScope {
  /** Cache-only identity for the user-specific overlay returned by the server. */
  viewerId?: string | null | undefined;
}

const viewerKey = (viewerId: string | null | undefined): string =>
  viewerId ?? 'anonymous';

export const challengeCatalogQueryKeys = {
  list: (locale: string, viewerId?: string | null) =>
    ['catalog', 'practice', 'list', locale, viewerKey(viewerId)] as const,
  detail: (slug: string, locale: string, viewerId?: string | null) =>
    [
      'catalog',
      'practice',
      'detail',
      slug,
      locale,
      viewerKey(viewerId),
    ] as const,
};

/**
 * Keys to invalidate after a successful challenge submission. This keeps
 * cache invalidation aligned with the server's viewer-scoped progress overlay.
 */
export function challengeProgressInvalidationKeys(
  slug: string,
  locale: string,
  viewerId?: string | null,
) {
  return [
    challengeCatalogQueryKeys.detail(slug, locale, viewerId),
    challengeCatalogQueryKeys.list(locale, viewerId),
  ] as const;
}

export const challengeListQueryOptions = ({
  locale,
  viewerId,
}: { locale: string } & CatalogViewerScope) =>
  queryOptions({
    queryKey: challengeCatalogQueryKeys.list(locale, viewerId),
    queryFn: () => getChallenges({ data: { locale } }),
  });

export const challengeDetailQueryOptions = (
  slug: string,
  locale: string,
  viewerId?: string | null,
) =>
  queryOptions({
    queryKey: challengeCatalogQueryKeys.detail(slug, locale, viewerId),
    queryFn: () => getChallenge({ data: { slug, locale } }),
  });
