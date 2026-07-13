import { createFileRoute, getRouteApi } from '@tanstack/react-router';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Box,
  ChevronRight,
  Compass,
  FileCode2,
  Layers,
  LayoutDashboard,
  Menu,
  MousePointer2,
  Palette,
  Route as RouteIcon,
  Search,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  PageContainer,
  PaperSurface,
  SectionHeading,
  StatPill,
} from '@/components/cozy-quest';
import {
  ChallengeListCard,
  ChallengeListRow,
  QuestBoardFilters,
  type ChallengeFilterDifficulty,
  type ChallengeFilterStatus,
} from '@/components/challenges';
import { challengeListQueryOptions } from '@/lib/challenges.query';
import { useDebounce } from '@/lib/useDebounce';
import { cn } from '@/lib/utils';
import { createSeoHead } from '@/lib/seo';
import i18n from '@/lib/i18n';
import {
  CATEGORY_ORDER,
  getTierFromCategory,
  TIER_ORDER,
} from '@/lib/constants';
import {
  SIDEBAR_GROUPS,
  TRACK_CONFIG,
  TRACK_IDS,
  type TrackId,
} from '@/config/tracks';

const ChallengesSearchSchema = z.object({
  track: z.enum(TRACK_IDS).optional(),
  q: z.string().optional(),
  hideCompleted: z.coerce.boolean().optional(),
  view: z.enum(['grid', 'list']).optional(),
  tier: z.string().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  status: z.enum(['available', 'completed', 'locked']).optional(),
});

export const Route = createFileRoute('/$locale/challenges/')({
  validateSearch: ChallengesSearchSchema,
  loaderDeps: ({ search: { q } }) => ({ q }),
  loader: ({ context, params, deps: { q } }) =>
    context.queryClient.ensureQueryData(
      challengeListQueryOptions({ locale: params.locale, search: q, limit: 1000 }),
    ),
  component: ChallengesPage,
  head: ({ params }) =>
    createSeoHead({
      title: i18n.t('challenges:page.seo.title'),
      description: i18n.t('challenges:page.seo.description'),
      path: '/challenges',
      locale: params.locale || 'en',
    }),
});

const challengeTypeConfig: Record<string, { color: string; icon: ReactNode }> = {
  JAVASCRIPT: { color: 'bg-amber-500/15 text-amber-800 border-amber-500/25 dark:text-amber-300', icon: <FileCode2 className="size-3.5" /> },
  TYPESCRIPT: { color: 'bg-sky-500/15 text-sky-800 border-sky-500/25 dark:text-sky-300', icon: <FileCode2 className="size-3.5" /> },
  PLAYWRIGHT: { color: 'bg-violet-500/15 text-violet-800 border-violet-500/25 dark:text-violet-300', icon: <FileCode2 className="size-3.5" /> },
  CSS_SELECTOR: { color: 'bg-blue-500/15 text-blue-800 border-blue-500/25 dark:text-blue-300', icon: <Palette className="size-3.5" /> },
  XPATH_SELECTOR: { color: 'bg-teal-500/15 text-teal-800 border-teal-500/25 dark:text-teal-300', icon: <RouteIcon className="size-3.5" /> },
};

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

const TRACK_ICONS: Record<TrackId, ReactNode> = {
  all: <LayoutDashboard className="size-4" />,
  selectors: <MousePointer2 className="size-4" />,
  scripting: <FileCode2 className="size-4" />,
  core: <Compass className="size-4" />,
  e2e: <Layers className="size-4" />,
};

const ALL_TRACKS = TRACK_IDS.map((id) => ({ ...TRACK_CONFIG[id], id, icon: TRACK_ICONS[id] }));
const routeApi = getRouteApi('/$locale/challenges/');

const isComingSoon = (challenge: Challenge) => challenge.tags?.includes('coming-soon') ?? false;
const isBossChallenge = (challenge: Challenge) => challenge.slug.includes('boss');

export function ChallengesPage() {
  const { locale } = routeApi.useParams();
  const { t } = useTranslation('challenges');
  const navigate = routeApi.useNavigate();
  const searchParams = routeApi.useSearch();
  const q = searchParams.q;
  const activeTrackId = (searchParams.track || 'all') as TrackId;
  const viewMode = searchParams.view || 'grid';
  const difficulty = (searchParams.difficulty || 'all') as ChallengeFilterDifficulty;
  const status = (searchParams.status || (searchParams.hideCompleted ? 'available' : 'all')) as ChallengeFilterStatus;
  const tier = searchParams.tier;
  const [searchInput, setSearchInput] = useState(q ?? '');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const debouncedSearchQuery = useDebounce(searchInput, 300);

  const updateSearch = (updates: Partial<z.infer<typeof ChallengesSearchSchema>>) => {
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
    // The query is intentionally debounced before it reaches the URL and loader.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery]);

  const activeTrack = ALL_TRACKS.find((track) => track.id === activeTrackId) ?? ALL_TRACKS[0];
  const { data: challengesResponse } = useQuery({
    ...challengeListQueryOptions({ locale, search: debouncedSearchQuery || undefined, limit: 1000 }),
    placeholderData: keepPreviousData,
  });
  const challenges = challengesResponse?.data ?? [];

  const filteredChallenges = useMemo(
    () => challenges.filter((challenge: Challenge) => {
      if (!activeTrack.match(challenge)) return false;
      if (tier && getTierFromCategory(challenge.category || '') !== tier) return false;
      if (difficulty !== 'all' && challenge.difficulty !== difficulty) return false;

      if (status === 'completed') return challenge.isCompleted;
      if (status === 'locked') return isComingSoon(challenge);
      if (status === 'available') return !challenge.isCompleted && !isComingSoon(challenge);
      return true;
    }),
    [activeTrack, challenges, difficulty, status, tier],
  );

  const groupedChallenges = useMemo(() => {
    const groups: Record<string, Challenge[]> = {};
    for (const challenge of filteredChallenges) {
      const category = challenge.category || 'uncategorized';
      groups[category] ??= [];
      groups[category].push(challenge);
    }
    for (const group of Object.values(groups)) group.sort((a, b) => a.order - b.order);
    return Object.entries(groups).sort(([a], [b]) => {
      if (a === 'uncategorized') return 1;
      if (b === 'uncategorized') return -1;
      const tierDifference = TIER_ORDER.indexOf(getTierFromCategory(a)) - TIER_ORDER.indexOf(getTierFromCategory(b));
      return tierDifference || (CATEGORY_ORDER[a] ?? 999) - (CATEGORY_ORDER[b] ?? 999);
    });
  }, [filteredChallenges]);

  const trackCounts = useMemo(() => ALL_TRACKS.reduce<Record<string, number>>((counts, track) => {
    counts[track.id] = challenges.filter((challenge: Challenge) => track.match(challenge)).length;
    return counts;
  }, {}), [challenges]);

  const completedCount = challenges.filter((challenge: Challenge) => challenge.isCompleted).length;
  const progress = challenges.length ? Math.round((completedCount / challenges.length) * 100) : 0;
  const hasActiveFilters = Boolean(searchInput || difficulty !== 'all' || status !== 'all' || tier || activeTrackId !== 'all');

  const clearFilters = () => {
    setSearchInput('');
    updateSearch({ q: undefined, track: undefined, tier: undefined, difficulty: undefined, status: undefined, hideCompleted: undefined });
  };

  const SidebarItem = ({ track }: { track: typeof ALL_TRACKS[number] }) => (
    <button
      type="button"
      onClick={() => {
        updateSearch({ track: track.id === 'all' ? undefined : track.id });
        setIsMobileMenuOpen(false);
      }}
      className={cn(
        'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
        activeTrackId === track.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
      )}
      aria-pressed={activeTrackId === track.id}
    >
      <span className="flex items-center gap-3 text-left">
        {track.icon}
        {t(`tracks.${track.id}.label`)}
      </span>
      <span className={cn('rounded-full px-2 py-0.5 text-[10px] tabular-nums', activeTrackId === track.id ? 'bg-primary-foreground/15 text-primary-foreground' : 'bg-muted text-muted-foreground')}>
        {trackCounts[track.id] || 0}
      </span>
    </button>
  );

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="mb-7 px-1">
        <div className="mb-2 flex items-center gap-2 text-primary">
          <Box className="size-5" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-[0.18em]">{t('board.eyebrow')}</span>
        </div>
        <p className="font-serif text-xl font-semibold leading-tight">{t('page.title')}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t('board.sidebarDescription')}</p>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto pr-1" aria-label={t('board.trackNavigation')}>
        {SIDEBAR_GROUPS.map((group) => (
          <section key={group.title}>
            {group.title !== 'Overview' && <h2 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{t(`groups.${group.title}`)}</h2>}
            <div className="space-y-1">
              {group.tracks.map((id) => {
                const track = ALL_TRACKS.find((item) => item.id === id);
                return track ? <SidebarItem key={id} track={track} /> : null;
              })}
            </div>
          </section>
        ))}
      </nav>
      <div className="mt-6 border-t border-border pt-5">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{t('page.overallProgress')}</span>
          <span className="font-semibold tabular-nums text-foreground">{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={t('page.overallProgress')}>
          <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background py-5 md:py-8">
      <PageContainer className="max-w-[1600px]">
        <div className="grid gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
          <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] lg:block">
            <PaperSurface className="h-full p-5"><SidebarContent /></PaperSurface>
          </aside>

          <main className="min-w-0">
            <div className="mb-6 flex items-start gap-3 lg:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild><Button variant="outline" size="icon" className="mt-1 shrink-0"><Menu className="size-5" /><span className="sr-only">{t('board.openTracks')}</span></Button></SheetTrigger>
                <SheetContent side="left" className="w-[320px] p-5"><SidebarContent /></SheetContent>
              </Sheet>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{t('board.eyebrow')}</p>
                <h1 className="font-serif text-2xl font-semibold">{t('page.title')}</h1>
              </div>
            </div>

            <section className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <SectionHeading
                eyebrow={t('board.eyebrow')}
                title={t('page.title')}
                description={t('board.description')}
                align="left"
                as="h1"
                className="hidden lg:block"
              />
              <div className="flex flex-wrap gap-2">
                <StatPill value={challenges.length} label={t('board.challengeCount')} />
                <StatPill value={`${progress}%`} label={t('page.overallProgress')} />
              </div>
            </section>

            <QuestBoardFilters
              search={searchInput}
              status={status}
              difficulty={difficulty}
              view={viewMode}
              onSearchChange={setSearchInput}
              onStatusChange={(value) => updateSearch({ status: value === 'all' ? undefined : value, hideCompleted: undefined })}
              onDifficultyChange={(value) => updateSearch({ difficulty: value === 'all' ? undefined : value })}
              onViewChange={(value) => updateSearch({ view: value })}
            />

            <div className="mt-5 flex items-center justify-between gap-3 text-sm text-muted-foreground" aria-live="polite">
              <span>{t('board.resultsCount', { count: filteredChallenges.length })}</span>
              {hasActiveFilters && groupedChallenges.length > 0 && <Button variant="link" className="h-auto p-0 text-sm" onClick={clearFilters}>{t('filters.clear')}</Button>}
            </div>

            {groupedChallenges.length === 0 ? (
              <PaperSurface className="mt-5 p-10 text-center">
                <Search aria-hidden="true" className="mx-auto mb-4 size-10 text-muted-foreground" />
                <h2 className="font-serif text-xl font-semibold">{t('empty.title')}</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t('empty.description')}</p>
                {hasActiveFilters && <Button variant="outline" className="mt-5" onClick={clearFilters}>{t('filters.clear')}</Button>}
              </PaperSurface>
            ) : (
              <div className="mt-7 space-y-10">
                {groupedChallenges.map(([category, categoryChallenges]) => (
                  <section key={category} aria-labelledby={`category-${category}`}>
                    <div className="mb-4 flex items-center gap-3">
                      <span className="h-8 w-1 rounded-full bg-primary" aria-hidden="true" />
                      <div>
                        <h2 id={`category-${category}`} className="font-serif text-xl font-semibold">{t(`categories.${category}`, { defaultValue: category })}</h2>
                        <p className="text-xs text-muted-foreground">{t('board.categoryLabel')}</p>
                      </div>
                      <Badge variant="outline" className="ml-auto rounded-full text-xs font-medium">{t('board.itemsCount', { count: categoryChallenges.length })}</Badge>
                    </div>
                    {viewMode === 'grid' ? (
                      <motion.div layout className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <AnimatePresence mode="popLayout">
                          {categoryChallenges.map((challenge) => <ChallengeListCard key={challenge.slug} challenge={challenge} config={challengeTypeConfig[challenge.type] || challengeTypeConfig.JAVASCRIPT} isComingSoon={isComingSoon(challenge)} isBoss={isBossChallenge(challenge)} params={{ locale, slug: challenge.slug }} t={t} />)}
                        </AnimatePresence>
                      </motion.div>
                    ) : (
                      <PaperSurface className="overflow-x-auto p-0">
                        <Table>
                          <TableHeader><TableRow className="hover:bg-transparent"><TableHead className="w-[60px] pl-4">#</TableHead><TableHead>{t('labels.challenge')}</TableHead><TableHead>{t('filters.status')}</TableHead><TableHead>{t('labels.type')}</TableHead><TableHead>{t('labels.difficulty')}</TableHead><TableHead className="text-right">XP</TableHead><TableHead><span className="sr-only">{t('labels.open')}</span></TableHead></TableRow></TableHeader>
                          <TableBody><AnimatePresence mode="popLayout">{categoryChallenges.map((challenge, index) => <ChallengeListRow key={challenge.slug} challenge={challenge} index={index} config={challengeTypeConfig[challenge.type] || challengeTypeConfig.JAVASCRIPT} isComingSoon={isComingSoon(challenge)} isBoss={isBossChallenge(challenge)} params={{ locale, slug: challenge.slug }} t={t} />)}</AnimatePresence></TableBody>
                        </Table>
                      </PaperSurface>
                    )}
                  </section>
                ))}
              </div>
            )}
          </main>
        </div>
      </PageContainer>
    </div>
  );
}
