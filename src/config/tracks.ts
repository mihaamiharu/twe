import { getTierFromCategory } from '@/lib/constants';

export type TrackId = 'all' | 'selectors' | 'scripting' | 'core' | 'e2e';
export type TrackGroupId = 'overview' | 'coreSkills' | 'playwright';

interface ChallengeLike {
  type: string;
  category: string | null | undefined;
}

export interface TrackConfig {
  id: TrackId;
  match: (challenge: ChallengeLike) => boolean;
}

export interface TrackGroup {
  id: TrackGroupId;
  tracks: TrackId[];
}

export const TRACK_CONFIG: Record<TrackId, Omit<TrackConfig, 'id'>> = {
  all: {
    match: () => true,
  },
  selectors: {
    match: (c) =>
      ['CSS_SELECTOR', 'XPATH_SELECTOR'].includes(c.type) ||
      getTierFromCategory(c.category ?? undefined) === 'basic',
  },
  scripting: {
    match: (c) =>
      c.type === 'JAVASCRIPT' ||
      c.type === 'TYPESCRIPT' ||
      getTierFromCategory(c.category ?? undefined) === 'beginner' ||
      (c.category?.startsWith('ts-') ?? false),
  },
  core: {
    match: (c) => {
      const cat = c.category ?? '';
      return (
        c.type === 'PLAYWRIGHT' &&
        (cat.startsWith('playwright-navigation') ||
          cat.startsWith('playwright-locators') ||
          cat.startsWith('playwright-assertions') ||
          cat.startsWith('playwright-waits'))
      );
    },
  },
  e2e: {
    match: (c) => {
      return getTierFromCategory(c.category ?? undefined) === 'e2e';
    },
  },
};

export const SIDEBAR_GROUPS: TrackGroup[] = [
  {
    id: 'overview',
    tracks: ['all'],
  },
  {
    id: 'coreSkills',
    tracks: ['selectors', 'scripting'],
  },
  {
    id: 'playwright',
    tracks: ['core', 'e2e'],
  },
];

export const TRACK_IDS = Object.keys(TRACK_CONFIG) as [TrackId, ...TrackId[]];
