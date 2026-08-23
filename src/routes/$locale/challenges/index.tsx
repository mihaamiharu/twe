import { createFileRoute, getRouteApi } from '@tanstack/react-router';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Code2,
  LayoutGrid,
  List,
  ListChecks,
  Play,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/empty-state';
import {
  PracticeChallengeGridCard,
  PracticeChallengeRow,
} from '@/components/challenges/practice-challenge-item';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  CATEGORY_ORDER,
  getTierFromCategory,
  TIER_ORDER,
} from '@/lib/constants';
import { challengeListQueryOptions } from '@/lib/challenges.query';
import { omitUndefined } from '@/lib/omit-undefined';
import { useDebounce } from '@/lib/useDebounce';
import { cn } from '@/lib/utils';
import { TRACK_CONFIG, TRACK_IDS, type TrackId } from '@/config/tracks';
import i18n from '@/lib/i18n';
import { createSeoHead } from '@/lib/seo';

const DifficultySchema = z.enum(['EASY', 'MEDIUM', 'HARD']);

const ChallengesSearchSchema = z.object({
  track: z.enum(TRACK_IDS).optional(),
  q: z.string().optional(),
  hideCompleted: z.coerce.boolean().optional(),
  view: z.enum(['grid', 'list']).optional(),
  tier: z.string().optional(),
  difficulty: DifficultySchema.optional(),
});

export const Route = createFileRoute('/$locale/challenges/')({
  validateSearch: ChallengesSearchSchema,
  loaderDeps: ({ search: { q, difficulty } }) => ({ q, difficulty }),
  loader: ({ context, params, deps: { q, difficulty } }) => {
    return context.queryClient.ensureQueryData(
      challengeListQueryOptions({
        locale: params.locale,
        ...omitUndefined({ search: q, difficulty }),
        limit: 1000,
      }),
    );
  },
  component: ChallengesPage,
  head: ({ params }) => {
    const locale = params.locale || 'en';
    return createSeoHead({
      title: i18n.t('challenges:page.seo.title', { lng: locale }),
      description: i18n.t('challenges:page.seo.description', { lng: locale }),
      path: '/challenges',
      locale,
    });
  },
});

export interface Challenge {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  category: string | null;
  xpReward: number;
  order: number;
  completionCount: number;
  isCompleted: boolean;
  tags: string[] | null;
}

const TRACK_LABEL_KEYS: Record<TrackId, string> = {
  all: 'tracks.all.label',
  selectors: 'tracks.selectors.label',
  scripting: 'tracks.scripting.label',
  core: 'tracks.core.label',
  e2e: 'tracks.e2e.label',
};

const TRACK_DESCRIPTION_KEYS: Record<TrackId, string> = {
  all: 'tracks.all.description',
  selectors: 'tracks.selectors.description',
  scripting: 'tracks.scripting.description',
  core: 'tracks.core.description',
  e2e: 'tracks.e2e.description',
};

const ALL_TRACKS = TRACK_IDS.map((id) => ({
  ...TRACK_CONFIG[id],
  id,
}));

const PRACTICE_STEPS = [
  { key: 'choose', icon: ListChecks },
  { key: 'solve', icon: Code2 },
  { key: 'run', icon: Play },
  { key: 'review', icon: Check },
] as const;

const routeApi = getRouteApi('/$locale/challenges/');

export function ChallengesPage() {
  const { locale } = routeApi.useParams();
  const { t } = useTranslation('challenges');
  const navigate = routeApi.useNavigate();
  const searchParams = routeApi.useSearch();
  const loaderData = routeApi.useLoaderData?.();

  const q = searchParams.q;
  const tier = searchParams.tier;
  const difficulty = searchParams.difficulty;
  const hideCompleted = searchParams.hideCompleted ?? false;
  const activeTrackId = (searchParams.track || 'all') as TrackId;
  const viewMode = searchParams.view || 'list';
  const completionToggleLabel = hideCompleted
    ? t('filters.showCompleted')
    : t('filters.hideCompleted');

  const [searchInput, setSearchInput] = useState(q ?? '');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    () => new Set(),
  );
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const debouncedSearchQuery = useDebounce(searchInput, 300);

  useEffect(() => {
    const updateLayout = () => {
      setIsMobileLayout(window.innerWidth < 1024);
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  const updateSearch = (
    updates: Partial<z.infer<typeof ChallengesSearchSchema>>,
  ) => {
    void navigate({
      to: '.',
      search: (previous) => ({ ...previous, ...updates }),
      replace: true,
    });
  };

  useEffect(() => {
    if (debouncedSearchQuery !== (q ?? '')) {
      updateSearch({ q: debouncedSearchQuery || undefined });
    }
  }, [debouncedSearchQuery, q]);

  const activeTrack =
    ALL_TRACKS.find((track) => track.id === activeTrackId) ?? ALL_TRACKS[0];

  if (!activeTrack) {
    throw new Error(
      'Challenge track configuration must define at least one track',
    );
  }

  const { data: challengesResponse } = useQuery({
    ...challengeListQueryOptions({
      locale,
      ...omitUndefined({
        search: debouncedSearchQuery || undefined,
        difficulty,
      }),
      limit: 1000,
    }),
    initialData: loaderData,
    placeholderData: keepPreviousData,
  });

  const challenges = (challengesResponse?.data ?? []) as Challenge[];
  const normalizedSearchQuery = searchInput.trim().toLocaleLowerCase();

  const filteredChallenges = useMemo(() => {
    return challenges.filter((challenge) => {
      // Keep the UI deterministic while a filtered query is using previous
      // query data. The server remains the source of truth, but applying the
      // same search predicate here prevents stale placeholder data from
      // making a no-match search look like it returned every challenge.
      if (
        normalizedSearchQuery &&
        ![challenge.title, challenge.description].some((value) =>
          value.toLocaleLowerCase().includes(normalizedSearchQuery),
        )
      ) {
        return false;
      }
      if (!activeTrack.match(challenge)) return false;
      if (hideCompleted && challenge.isCompleted) return false;
      if (difficulty && challenge.difficulty !== difficulty) return false;
      if (tier && getTierFromCategory(challenge.category || '') !== tier) {
        return false;
      }
      return true;
    });
  }, [
    activeTrack,
    challenges,
    difficulty,
    hideCompleted,
    normalizedSearchQuery,
    tier,
  ]);

  const groupedChallenges = useMemo(() => {
    const groups = new Map<string, Challenge[]>();

    for (const challenge of filteredChallenges) {
      const category = challenge.category || 'uncategorized';
      const group = groups.get(category) ?? [];
      group.push(challenge);
      groups.set(category, group);
    }

    for (const group of groups.values()) {
      group.sort((a, b) => a.order - b.order);
    }

    return [...groups.entries()].sort(([categoryA], [categoryB]) => {
      if (categoryA === 'uncategorized') return 1;
      if (categoryB === 'uncategorized') return -1;

      const tierOrderA = TIER_ORDER.indexOf(getTierFromCategory(categoryA));
      const tierOrderB = TIER_ORDER.indexOf(getTierFromCategory(categoryB));
      if (tierOrderA !== tierOrderB) return tierOrderA - tierOrderB;

      return (
        (CATEGORY_ORDER[categoryA] ?? 999) - (CATEGORY_ORDER[categoryB] ?? 999)
      );
    });
  }, [filteredChallenges]);

  const clearFilters = () => {
    setSearchInput('');
    updateSearch({
      q: undefined,
      track: undefined,
      difficulty: undefined,
      hideCompleted: undefined,
      tier: undefined,
    });
  };

  const hasActiveFilters = Boolean(
    searchInput ||
    q ||
    difficulty ||
    hideCompleted ||
    tier ||
    activeTrackId !== 'all',
  );

  const renderChallengeProps = (challenge: Challenge) => ({
    challenge,
    locale,
    typeLabel: t(`types.${challenge.type.toLowerCase()}`, {
      defaultValue: challenge.type,
    }).toUpperCase(),
    difficultyLabel: t(`difficulty.${challenge.difficulty}`, {
      defaultValue: challenge.difficulty,
    }),
    completedLabel: t('labels.completedState'),
    comingSoonLabel: t('labels.comingSoon'),
    startLabel: t('labels.start'),
    reviewLabel: t('labels.review'),
  });

  const showListView = viewMode === 'list' || isMobileLayout;
  const showGridView = viewMode === 'grid' && !isMobileLayout;
  const emptyStateTitle = t('library.emptyTitle');

  const toggleGroup = (category: string) => {
    setCollapsedGroups((previous) => {
      const next = new Set(previous);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background" data-testid="practice-library">
      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pt-12">
        <section
          className="max-w-3xl pb-8 lg:pb-10"
          aria-labelledby="practice-title"
        >
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
            {t('library.eyebrow')}
          </p>
          <h1
            id="practice-title"
            className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-foreground sm:text-5xl"
          >
            {t('library.headline')}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            {t('library.description')}
          </p>
        </section>

        <section
          aria-label={t('library.discoveryLabel')}
          className="relative flex flex-col md:sticky md:top-16 md:z-30 md:-mx-6 md:bg-background/95 md:px-6 md:backdrop-blur-sm lg:-mx-8 lg:px-8"
        >
          <nav
            aria-label={t('filters.track')}
            role="tablist"
            className="order-2 -mx-4 flex snap-x overflow-x-auto border-b border-border px-4 md:mx-0 md:px-0 lg:order-1"
          >
            {ALL_TRACKS.map((track) => {
              const isActive = activeTrack.id === track.id;
              return (
                <button
                  key={track.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="challenge-results"
                  onClick={() =>
                    updateSearch({
                      track: track.id === 'all' ? undefined : track.id,
                    })
                  }
                  className={cn(
                    'min-h-11 shrink-0 snap-start border-b-2 px-4 text-sm font-medium transition-colors first:pl-0 last:pr-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t(TRACK_LABEL_KEYS[track.id])}
                </button>
              );
            })}
          </nav>

          <div className="order-1 flex flex-col gap-3 border-b border-border bg-background/95 py-3 md:bg-transparent lg:order-2 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                aria-label={t('filters.search')}
                placeholder={t('filters.searchPlaceholder')}
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="h-11 bg-card pl-10 md:border-foreground/25"
              />
            </div>

            <div className="grid gap-2 sm:flex sm:items-center lg:shrink-0">
              <Select
                value={difficulty ?? 'all'}
                onValueChange={(value) =>
                  updateSearch({
                    difficulty:
                      value === 'all'
                        ? undefined
                        : DifficultySchema.parse(value),
                  })
                }
              >
                <SelectTrigger
                  aria-label={t('filters.difficulty')}
                  className="h-11 w-full bg-card sm:w-[170px]"
                >
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                  <SelectValue placeholder={t('filters.allDifficulties')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t('filters.allDifficulties')}
                  </SelectItem>
                  <SelectItem value="EASY">{t('difficulty.EASY')}</SelectItem>
                  <SelectItem value="MEDIUM">
                    {t('difficulty.MEDIUM')}
                  </SelectItem>
                  <SelectItem value="HARD">{t('difficulty.HARD')}</SelectItem>
                </SelectContent>
              </Select>

              <label
                htmlFor="hide-completed"
                className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground sm:min-w-[170px]"
              >
                <span>{completionToggleLabel}</span>
                <Switch
                  id="hide-completed"
                  checked={hideCompleted}
                  onCheckedChange={(checked) =>
                    updateSearch({ hideCompleted: checked ? true : undefined })
                  }
                  aria-label={completionToggleLabel}
                />
              </label>

              <div className="hidden items-center rounded-lg border border-border bg-card p-1 lg:flex">
                <Button
                  type="button"
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon-sm"
                  aria-label={t('filters.listView')}
                  aria-pressed={viewMode === 'list'}
                  onClick={() => updateSearch({ view: 'list' })}
                >
                  <List className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon-sm"
                  aria-label={t('filters.gridView')}
                  aria-pressed={viewMode === 'grid'}
                  onClick={() => updateSearch({ view: 'grid' })}
                >
                  <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-7 flex items-center justify-between gap-4 md:mt-8">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              {t(TRACK_DESCRIPTION_KEYS[activeTrack.id])}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('library.showingCount', { count: filteredChallenges.length })}
            </p>
          </div>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 text-muted-foreground"
              onClick={clearFilters}
            >
              {t('filters.clear')}
            </Button>
          )}
        </div>

        <div id="challenge-results" className="mt-5" aria-live="polite">
          {groupedChallenges.length === 0 ? (
            <EmptyState
              size="compact"
              className="rounded-xl border border-dashed border-border px-6"
              eyebrow={t('library.emptyEyebrow')}
              title={emptyStateTitle}
              description={t('library.emptyDescription')}
            />
          ) : (
            <div className="space-y-6">
              {groupedChallenges.map(([category, categoryChallenges]) => (
                <section
                  key={category}
                  aria-labelledby={`category-${category}`}
                  className="overflow-hidden rounded-xl border border-border bg-card"
                >
                  <div className="border-b border-border">
                    <button
                      type="button"
                      aria-expanded={!collapsedGroups.has(category)}
                      aria-controls={`category-content-${category}`}
                      onClick={() => toggleGroup(category)}
                      className="group flex min-h-14 w-full items-center justify-between gap-4 px-4 text-left outline-none transition-colors hover:bg-foreground/[0.025] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:px-5"
                    >
                      <span className="flex min-w-0 items-baseline gap-3">
                        <span
                          id={`category-${category}`}
                          className="truncate font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-foreground"
                        >
                          {t(`categories.${category}`, {
                            defaultValue: category,
                          })}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {t('library.challengeCount', {
                            count: categoryChallenges.length,
                          })}
                        </span>
                      </span>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                          !collapsedGroups.has(category) && 'rotate-180',
                        )}
                        aria-hidden="true"
                      />
                    </button>
                  </div>

                  <div
                    id={`category-content-${category}`}
                    hidden={collapsedGroups.has(category)}
                  >
                    {showListView && (
                      <div
                        data-testid="challenge-library-list"
                        className="block"
                      >
                        {categoryChallenges.map((challenge) => (
                          <PracticeChallengeRow
                            key={challenge.slug}
                            {...renderChallengeProps(challenge)}
                          />
                        ))}
                      </div>
                    )}

                    {showGridView && (
                      <div
                        data-testid="challenge-library-grid"
                        className="hidden gap-px bg-border lg:grid lg:grid-cols-2 xl:grid-cols-3"
                      >
                        {categoryChallenges.map((challenge) => (
                          <PracticeChallengeGridCard
                            key={challenge.slug}
                            {...renderChallengeProps(challenge)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        <section
          aria-labelledby="how-practice-works"
          className="mt-10 border border-brand-orange/20 bg-brand-orange/8 px-5 py-6 sm:px-7"
        >
          <div className="grid gap-7 lg:grid-cols-[minmax(220px,0.9fr)_minmax(0,2fr)] lg:items-center lg:gap-10">
            <div>
              <h2
                id="how-practice-works"
                className="text-xl font-semibold tracking-[-0.025em]"
              >
                {t('howPractice.title')}
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                {t('howPractice.description')}
              </p>
            </div>
            <ol className="grid grid-cols-2 gap-5 sm:grid-cols-4 sm:gap-4">
              {PRACTICE_STEPS.map(({ key, icon: Icon }, index) => (
                <li key={key} className="relative">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-orange/25 bg-background text-brand-orange">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    <span className="mr-1 font-mono text-[10px] text-brand-orange">
                      0{index + 1}
                    </span>
                    {t(`howPractice.steps.${key}.title`)}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {t(`howPractice.steps.${key}.description`)}
                  </p>
                  {index < PRACTICE_STEPS.length - 1 && (
                    <ArrowRight
                      className="absolute -right-3 top-4 hidden h-4 w-4 text-muted-foreground/60 sm:block"
                      aria-hidden="true"
                    />
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
    </div>
  );
}
