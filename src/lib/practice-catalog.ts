import {
  CATEGORY_ORDER,
  getTierFromCategory,
  TIER_ORDER,
} from '@/lib/constants';
import { TRACK_CONFIG, type TrackId } from '@/config/tracks';
import type { ChallengeListCatalogResponse } from '@/lib/catalog.types';

export type PracticeChallenge = ChallengeListCatalogResponse['data'][number];
export type PracticeTier = 'basic' | 'beginner' | 'intermediate' | 'e2e';

export interface PracticeCatalogFilters {
  query?: string | undefined;
  track: TrackId;
  difficulty?: PracticeChallenge['difficulty'] | undefined;
  hideCompleted: boolean;
}

export interface PracticeChallengeGroup {
  category: string;
  tier: PracticeTier;
  challenges: PracticeChallenge[];
}

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function compareChallenges(
  left: PracticeChallenge,
  right: PracticeChallenge,
): number {
  return left.order - right.order || compareStrings(left.slug, right.slug);
}

/** Apply the shareable Practice URL state to the already-loaded catalog. */
export function filterPracticeChallenges(
  challenges: readonly PracticeChallenge[],
  filters: PracticeCatalogFilters,
): PracticeChallenge[] {
  const query = filters.query?.trim().toLowerCase();
  const track = TRACK_CONFIG[filters.track] ?? TRACK_CONFIG.all;

  return challenges
    .filter((challenge) => {
      if (
        query &&
        ![challenge.title, challenge.description].some((value) =>
          value.toLowerCase().includes(query),
        )
      ) {
        return false;
      }

      if (!track.match(challenge)) return false;
      if (filters.hideCompleted && challenge.isCompleted) return false;
      if (filters.difficulty && challenge.difficulty !== filters.difficulty) {
        return false;
      }

      return true;
    })
    .sort(compareChallenges);
}

/** Group the filtered projection with an explicit, stable display order. */
export function groupPracticeChallenges(
  challenges: readonly PracticeChallenge[],
): PracticeChallengeGroup[] {
  const groups = new Map<string, PracticeChallenge[]>();

  for (const challenge of challenges) {
    const category = challenge.category || 'uncategorized';
    const group = groups.get(category) ?? [];
    group.push(challenge);
    groups.set(category, group);
  }

  return [...groups.entries()]
    .map(([category, group]) => ({
      category,
      tier: getTierFromCategory(category) as PracticeTier,
      challenges: [...group].sort(compareChallenges),
    }))
    .sort((left, right) => {
      if (left.category === 'uncategorized') return 1;
      if (right.category === 'uncategorized') return -1;

      const leftTier = TIER_ORDER.indexOf(
        getTierFromCategory(left.category) as PracticeTier,
      );
      const rightTier = TIER_ORDER.indexOf(
        getTierFromCategory(right.category) as PracticeTier,
      );

      return (
        leftTier - rightTier ||
        (CATEGORY_ORDER[left.category] ?? 999) -
          (CATEGORY_ORDER[right.category] ?? 999) ||
        compareStrings(left.category, right.category)
      );
    });
}
