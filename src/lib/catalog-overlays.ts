import type {
  ChallengeCatalogListItem,
  TutorialCatalogListItem,
} from './catalog.types';

/** Dynamic database/user state kept separate from editorial catalog content. */
export interface TutorialCatalogOverlay {
  slug: string;
  id?: string;
  isPublished?: boolean;
  viewCount: number;
  isCompleted: boolean;
}

export interface ChallengeCatalogOverlay {
  slug: string;
  id?: string;
  isPublished?: boolean;
  completionCount: number;
  isCompleted: boolean;
}

export type TutorialCatalogListItemWithOverlay = TutorialCatalogListItem &
  Omit<Required<TutorialCatalogOverlay>, 'slug'>;

export type ChallengeCatalogListItemWithOverlay = ChallengeCatalogListItem &
  Omit<Required<ChallengeCatalogOverlay>, 'slug'>;

export function mergeTutorialCatalogOverlay(
  item: TutorialCatalogListItem,
  overlay?: TutorialCatalogOverlay,
): TutorialCatalogListItemWithOverlay {
  return {
    ...item,
    id: overlay?.id ?? item.slug,
    isPublished: overlay?.isPublished ?? true,
    viewCount: overlay?.viewCount ?? 0,
    isCompleted: overlay?.isCompleted ?? false,
  };
}

export function mergeChallengeCatalogOverlay(
  item: ChallengeCatalogListItem,
  overlay?: ChallengeCatalogOverlay,
): ChallengeCatalogListItemWithOverlay {
  return {
    ...item,
    id: overlay?.id ?? item.slug,
    isPublished: overlay?.isPublished ?? true,
    completionCount: overlay?.completionCount ?? 0,
    isCompleted: overlay?.isCompleted ?? false,
  };
}
