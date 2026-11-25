import {
  CATEGORY_ORDER,
  getTierFromCategory,
  PRACTICE_TIER_ORDER,
} from '@/lib/constants';
import { TRACK_CONFIG, type TrackId } from '@/config/tracks';
import type { ChallengeListCatalogResponse } from '@/lib/catalog.types';

export type PracticeChallenge = ChallengeListCatalogResponse['data'][number];
export type PracticeTier = 'basic' | 'beginner' | 'intermediate' | 'e2e';

/** Minimum solve count required before displaying public solve counters on Practice items. */
export const PRACTICE_SOLVE_COUNT_THRESHOLD = 20;

/** Returns true when a challenge has enough completions to display its public solve count. */
export function shouldShowPracticeSolveCount(
  completionCount?: number | null,
): boolean {
  return (
    typeof completionCount === 'number' &&
    Number.isFinite(completionCount) &&
    completionCount >= PRACTICE_SOLVE_COUNT_THRESHOLD
  );
}

export interface PracticeCatalogFilters {
  query?: string | undefined;
  track: TrackId;
  tier?: PracticeTier | undefined;
  difficulty?: PracticeChallenge['difficulty'] | undefined;
  hideCompleted: boolean;
}

export interface PracticeChallengeGroup {
  category: string;
  tier: PracticeTier;
  challenges: PracticeChallenge[];
}

const CATEGORY_SEARCH_ALIASES: Record<string, string[]> = {
  'css-basics': ['css', 'css selector', 'selectors', 'selektor', 'dasar css'],
  'xpath-basics': [
    'xpath',
    'xpath selector',
    'selectors',
    'selektor',
    'dasar xpath',
  ],
  'xpath-advanced': ['xpath', 'advanced xpath', 'xpath lanjutan', 'selektor'],
  'selector-comparison': [
    'css vs xpath',
    'selector comparison',
    'perbandingan selector',
    'perbandingan selektor',
  ],
  'js-fundamentals': [
    'javascript',
    'js',
    'scripting',
    'programming',
    'pemrograman',
  ],
  'js-dom': ['javascript', 'js', 'dom', 'document object model', 'dasar dom'],
  'js-async': ['javascript', 'js', 'async', 'asynchronous', 'asinkron'],
  'ts-fundamentals': ['typescript', 'ts', 'javascript', 'typing', 'tipe'],
  'playwright-navigation': [
    'playwright',
    'navigation',
    'actions',
    'interaction',
    'navigasi',
    'aksi',
  ],
  'playwright-locators': [
    'playwright',
    'locator',
    'locators',
    'selector',
    'selectors',
    'selektor',
  ],
  'playwright-assertions': [
    'playwright',
    'assertion',
    'assertions',
    'expect',
    'verifikasi',
  ],
  'playwright-waits': [
    'playwright',
    'wait',
    'waits',
    'waiting',
    'synchronization',
    'timeout',
    'menunggu',
  ],
  'playwright-debugging': [
    'playwright',
    'debug',
    'debugging',
    'flaky',
    'flakiness',
    'root cause',
    'reliability',
    'investigation',
    'analisis kegagalan',
  ],
  'e2e-pom': [
    'e2e',
    'end to end',
    'app testing',
    'pom',
    'page object',
    'page object model',
    'model objek halaman',
  ],
  'e2e-integration': [
    'e2e',
    'end to end',
    'integration',
    'app testing',
    'pengujian aplikasi',
  ],
};

const TYPE_SEARCH_ALIASES: Record<string, string[]> = {
  CSS_SELECTOR: ['css', 'css selector', 'selector', 'selektor'],
  XPATH_SELECTOR: ['xpath', 'xpath selector', 'selector', 'selektor'],
  JAVASCRIPT: ['javascript', 'js', 'scripting', 'script', 'skrip'],
  TYPESCRIPT: ['typescript', 'ts', 'javascript', 'scripting', 'skrip'],
  PLAYWRIGHT: [
    'playwright',
    'pw',
    'browser automation',
    'test automation',
    'otomasi pengujian',
  ],
};

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[-_/.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getSearchAliases(
  aliases: Readonly<Record<string, string[]>>,
  key: string,
): string[] {
  for (const [aliasKey, values] of Object.entries(aliases)) {
    if (aliasKey === key) return values;
  }
  return [];
}

function getPracticeSearchText(challenge: PracticeChallenge): string {
  const category = challenge.category || 'uncategorized';
  const categoryWords = category.split(/[-_/.]+/g);
  const tags = challenge.tags ?? [];
  const aliases = [
    ...categoryWords,
    ...getSearchAliases(CATEGORY_SEARCH_ALIASES, category),
    challenge.type,
    ...getSearchAliases(TYPE_SEARCH_ALIASES, challenge.type),
    ...tags,
    ...tags.flatMap((tag) => tag.split(/[-_/.]+/g)),
  ];

  return normalizeSearchText(
    [
      challenge.title,
      challenge.description,
      category,
      challenge.categoryLabel,
      challenge.type,
      ...aliases,
    ].join(' '),
  );
}

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function getPracticeTierRank(category?: string | null): number {
  const tier = getTierFromCategory(category ?? undefined) as PracticeTier;
  const rank = PRACTICE_TIER_ORDER.indexOf(tier);
  return rank === -1 ? PRACTICE_TIER_ORDER.length : rank;
}

function compareChallengesWithinGroup(
  left: PracticeChallenge,
  right: PracticeChallenge,
): number {
  return left.order - right.order || compareStrings(left.slug, right.slug);
}

function comparePracticeChallenges(
  left: PracticeChallenge,
  right: PracticeChallenge,
): number {
  return (
    getPracticeTierRank(left.category) - getPracticeTierRank(right.category) ||
    compareChallengesWithinGroup(left, right)
  );
}

/** Apply the shareable Practice URL state to the already-loaded catalog. */
export function filterPracticeChallenges(
  challenges: readonly PracticeChallenge[],
  filters: PracticeCatalogFilters,
): PracticeChallenge[] {
  const query = filters.query ? normalizeSearchText(filters.query) : undefined;
  const track = TRACK_CONFIG[filters.track] ?? TRACK_CONFIG.all;

  return challenges
    .filter((challenge) => {
      if (query && !getPracticeSearchText(challenge).includes(query)) {
        return false;
      }

      if (!track.match(challenge)) return false;
      if (filters.hideCompleted && challenge.isCompleted) return false;
      if (filters.difficulty && challenge.difficulty !== filters.difficulty) {
        return false;
      }
      if (
        filters.tier &&
        getTierFromCategory(challenge.category) !== filters.tier
      ) {
        return false;
      }

      return true;
    })
    .sort(comparePracticeChallenges);
}

/** Group the filtered projection with modern Playwright tracks ahead of legacy selector fallbacks. */
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
      challenges: [...group].sort(compareChallengesWithinGroup),
    }))
    .sort((left, right) => {
      if (left.category === 'uncategorized') return 1;
      if (right.category === 'uncategorized') return -1;

      const leftTier = getPracticeTierRank(left.category);
      const rightTier = getPracticeTierRank(right.category);
      if (leftTier !== rightTier) return leftTier - rightTier;

      const leftFirst = left.challenges[0];
      const rightFirst = right.challenges[0];
      if (leftFirst && rightFirst) {
        const firstChallengeOrder = leftFirst.order - rightFirst.order;
        if (firstChallengeOrder !== 0) return firstChallengeOrder;
      }

      return (
        (CATEGORY_ORDER[left.category] ?? 999) -
          (CATEGORY_ORDER[right.category] ?? 999) ||
        compareStrings(left.category, right.category)
      );
    });
}
