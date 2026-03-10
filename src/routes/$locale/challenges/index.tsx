import { createFileRoute, Link, getRouteApi } from '@tanstack/react-router';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { challengeListQueryOptions } from '@/lib/challenges.query';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Code,
  Trophy,
  Zap,
  CheckCircle2,
  Palette,
  Route as RouteIcon,
  LayoutGrid,
  List,
  Search,
  Lock,
  Swords,
  LayoutDashboard,
  Layers,
  Box,
  Compass,
  Menu,
  ChevronRight,
  MousePointer2,
  FileCode2,
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useDebounce,
} from '@/lib/useDebounce';
import {
  difficultyColors,
  getTierFromCategory,
  TIER_ORDER,
  CATEGORY_ORDER,
} from '@/lib/constants';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  TRACK_CONFIG,
  SIDEBAR_GROUPS,
  TRACK_IDS,
  type TrackId,
} from '@/config/tracks';
import i18n from '@/lib/i18n';
import { createSeoHead } from '@/lib/seo';

// --- Search Params Schema ---
const ChallengesSearchSchema = z.object({
  track: z.enum(TRACK_IDS).optional().default('all'),
  q: z.string().optional(),
  hideCompleted: z.coerce.boolean().optional().default(false),
  view: z.enum(['grid', 'list']).optional().default('grid'),
  tier: z.string().optional(),
});

export const Route = createFileRoute('/$locale/challenges/')({
  validateSearch: ChallengesSearchSchema,
  loaderDeps: ({ search: { q } }) => ({ q }),
  loader: ({ context, params, deps: { q } }) => {
    return context.queryClient.ensureQueryData(
      challengeListQueryOptions({
        locale: params.locale,
        search: q,
        limit: 1000,
      }),
    );
  },
  component: ChallengesPage,
  head: ({ params }) => {
    const locale = params.locale || 'en';
    return createSeoHead({
      title: i18n.t('challenges:page.seo.title'),
      description: i18n.t('challenges:page.seo.description'),
      path: '/challenges',
      locale,
    });
  },
});

// --- Configuration ---

// Detailed badge config for challenge cards (kept for cards/table)
const challengeTypeConfig: Record<
  string,
  { color: string; icon: React.ReactNode; label: string }
> = {
  JAVASCRIPT: {
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    icon: <Code className="h-4 w-4" />,
    label: 'JavaScript',
  },
  PLAYWRIGHT: {
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    icon: <Code className="h-4 w-4" />,
    label: 'Playwright',
  },
  CSS_SELECTOR: {
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: <Palette className="h-4 w-4" />,
    label: 'CSS Selector',
  },
  XPATH_SELECTOR: {
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    icon: <RouteIcon className="h-4 w-4" />,
    label: 'XPath',
  },
};

const isBossChallenge = (challenge: Challenge) => {
  return challenge.slug.includes('boss');
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

// --- Sidebar / Tracks Configuration ---

// --- Configuration ---

// Map icons purely for UI (keeps config serializable/clean)
const TRACK_ICONS: Record<TrackId, React.ReactNode> = {
  all: <LayoutDashboard className="h-4 w-4" />,
  selectors: <MousePointer2 className="h-4 w-4" />,
  scripting: <FileCode2 className="h-4 w-4" />,
  core: <Compass className="h-4 w-4" />,
  e2e: <Layers className="h-4 w-4" />,
};

// Reconstruct full track objects with icons for the UI
const ALL_TRACKS = TRACK_IDS.map((id) => ({
  ...TRACK_CONFIG[id],
  id,
  icon: TRACK_ICONS[id],
}));

const routeApi = getRouteApi('/$locale/challenges/');

export function ChallengesPage() {
  const { locale } = routeApi.useParams();
  const { t } = useTranslation('challenges');
  const navigate = routeApi.useNavigate();

  // URL-based State
  const { track, q, hideCompleted, view, tier } = routeApi.useSearch();
  const activeTrackId = track as TrackId;
  const viewMode = view;

  // Local state for search input (debounced to URL)
  const [searchInput, setSearchInput] = useState(q ?? '');
  const debouncedSearchQuery = useDebounce(searchInput, 300);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Helper to update URL search params
  const updateSearch = (updates: Partial<z.infer<typeof ChallengesSearchSchema>>) => {
    void navigate({
      to: '.',
      search: (prev) => ({ ...prev, ...updates }),
      replace: true,
    });
  };

  // Sync debounced search to URL
  useEffect(() => {
    if (debouncedSearchQuery !== (q ?? '')) {
      updateSearch({ q: debouncedSearchQuery || undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- updateSearch is stable, q is intentionally excluded to prevent loops
  }, [debouncedSearchQuery]);


  // Derive active track
  const activeTrack = ALL_TRACKS.find(t => t.id === activeTrackId) || ALL_TRACKS[0];

  const { data: challengesResponse } = useQuery({
    ...challengeListQueryOptions({
      locale,
      search: debouncedSearchQuery || undefined,
      limit: 1000,
    }),
    placeholderData: keepPreviousData,
  });

  const challenges = challengesResponse?.data ?? [];

  // Filter challenges based on Active Track & Search & Completed status
  const filteredChallenges = useMemo(() => {
    if (!challenges) return [];

    return challenges.filter((c: Challenge) => {
      // Track Filter
      if (!activeTrack.match(c)) return false;

      // Hide Completed Filter
      if (hideCompleted && c.isCompleted) return false;

      // Tier Filter
      if (tier && getTierFromCategory(c.category || '') !== tier) return false;

      return true;
    });
  }, [challenges, activeTrack, hideCompleted, tier]);

  // Group challenges by category (for display)
  const groupedChallenges = useMemo(() => {
    const groups: Record<string, Challenge[]> = {};

    for (const challenge of filteredChallenges) {
      const category = challenge.category || 'uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(challenge);
    }

    // Sort challenges within groups by order
    for (const category in groups) {
      groups[category].sort((a, b) => a.order - b.order);
    }

    // Sort Categories themselves
    return Object.entries(groups).sort(([catA], [catB]) => {
      // Special case: uncategorized last
      if (catA === 'uncategorized') return 1;
      if (catB === 'uncategorized') return -1;

      const tierA = getTierFromCategory(catA);
      const tierB = getTierFromCategory(catB);
      const tierOrderA = TIER_ORDER.indexOf(tierA);
      const tierOrderB = TIER_ORDER.indexOf(tierB);

      if (tierOrderA !== tierOrderB) {
        return tierOrderA - tierOrderB;
      }
      // Within same tier, use CATEGORY_ORDER
      const catOrderA = CATEGORY_ORDER[catA] ?? 999;
      const catOrderB = CATEGORY_ORDER[catB] ?? 999;
      return catOrderA - catOrderB;
    });
  }, [filteredChallenges]);

  // Calculate counts for Sidebar Badges
  const trackCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    challenges.forEach(c => {
      ALL_TRACKS.forEach(track => {
        if (track.match(c)) {
          counts[track.id] = (counts[track.id] || 0) + 1;
        }
      });
    });
    return counts;
  }, [challenges]);


  // Helper component for Sidebar Item
  const SidebarItem = ({ track }: { track: typeof ALL_TRACKS[number] }) => (
    <button
      onClick={() => {
        updateSearch({ track: track.id });
        setIsMobileMenuOpen(false);
      }}
      className={cn(
        "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium",
        activeTrackId === track.id
          ? "bg-primary/10 text-primary shadow-sm"
          : "text-muted-foreground/80 hover:bg-muted/50 hover:text-foreground"
      )}
    >
      <div className="flex items-start gap-3 text-left">
        {track.icon}
        <span className="leading-tight">{track.label}</span>
      </div>
      <Badge
        variant="secondary"
        className={cn(
          "ml-auto text-[10px] h-5 px-1.5 min-w-[24px] justify-center shadow-none",
          activeTrackId === track.id ? "bg-background text-primary" : "bg-muted text-muted-foreground"
        )}
      >
        {trackCounts[track.id] || 0}
      </Badge>
    </button>
  );

  const SidebarContent = () => (
    <div className='flex flex-col h-full'>
      <div className="mb-6 lg:mb-8 lg:px-2">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Box className="h-6 w-6 fill-primary/20 text-primary" />
          Challenges
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Level up your automation skills</p>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto">
        {SIDEBAR_GROUPS.map((group) => (
          <div key={group.title}>
            {group.title !== 'Overview' && (
              <h3 className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider mb-2 px-3">
                {group.title}
              </h3>
            )}

            <div className="space-y-1">
              {group.tracks.map((trackId) => {
                const track = ALL_TRACKS.find((t) => t.id === trackId);
                if (!track) return null;
                return <SidebarItem key={track.id} track={track} />;
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-border/50 bg-background/95 backdrop-blur-sm sticky bottom-0 pb-2">
        <div className="px-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Overall Progress</span>
            <span>{challenges.length > 0 ? Math.round((challenges.filter(c => c.isCompleted).length / challenges.length) * 100) : 0}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${challenges.length > 0 ? (challenges.filter(c => c.isCompleted).length / challenges.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">

        {/* --- Desktop Sidebar --- */}
        <aside className="hidden lg:flex flex-col w-[260px] h-[calc(100vh-64px)] shrink-0 border-r border-border/50 sticky top-[64px] bg-card/10 backdrop-blur-xl p-4 overflow-hidden">
          <SidebarContent />
        </aside>

        {/* --- Main Content Area --- */}
        <main className="flex-1 p-4 md:p-8 lg:p-10 max-w-[1600px] mx-auto w-full min-h-[calc(100vh-64px)]">

          {/* Mobile Header / Controls */}
          <div className="lg:hidden flex items-center justify-between mb-6 gap-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-4 pt-10">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <div className="flex-1">
              <h1 className="text-lg font-bold truncate">{activeTrack.label}</h1>
            </div>
          </div>


          {/* Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="hidden lg:block">
              <div className="flex items-center gap-2 mb-1">
                {/* Breadcrumb-ish */}
                {SIDEBAR_GROUPS.find(g => g.tracks.includes(activeTrackId))?.title !== 'Overview' && (
                  <>
                    <span className="text-sm font-medium text-muted-foreground">
                      {SIDEBAR_GROUPS.find(g => g.tracks.includes(activeTrackId))?.title}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                  </>
                )}
                <h1 className="text-2xl font-bold tracking-tight">
                  {activeTrack.label}
                </h1>
              </div>

              <p className="text-muted-foreground text-sm">
                {activeTrack.description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-1 sm:min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search challenges..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 bg-card/50"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => updateSearch({ hideCompleted: !hideCompleted })}
                  className={cn(
                    "flex-1 sm:flex-none",
                    hideCompleted && "bg-primary/5 border-primary/30 text-primary"
                  )}
                >
                  {hideCompleted ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2 opacity-30" />}
                  <span className="sr-only sm:not-sr-only sm:inline">Hide Done</span>
                </Button>

                <div className="flex p-1 bg-muted/50 rounded-lg border border-border/50">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateSearch({ view: 'grid' })}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateSearch({ view: 'list' })}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          {groupedChallenges.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-muted/30 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold">No challenges found</h3>
              <p className="text-muted-foreground mt-1">Try adjusting your filters or search query.</p>
              {(searchInput || hideCompleted) && (
                <Button
                  variant="link"
                  className="mt-4"
                  onClick={() => {
                    setSearchInput('');
                    updateSearch({ q: undefined, hideCompleted: false });
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-12">
              {groupedChallenges.map(([category, categoryChallenges]) => (
                <div key={category} className="space-y-4">
                  <div className="flex items-center gap-3 pb-2 border-b border-border/30">
                    <div className="h-8 w-1 rounded-full bg-gradient-to-b from-primary to-transparent" />
                    <h2 className="text-xl font-semibold tracking-tight">
                      {t(`categories.${category}`) || category}
                    </h2>
                    <Badge variant="outline" className="ml-auto text-xs font-normal text-muted-foreground">
                      {categoryChallenges.length} items
                    </Badge>
                  </div>

                  {viewMode === 'grid' ? (
                    <motion.div
                      layout
                      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4"
                    >
                      <AnimatePresence mode="popLayout">
                        {categoryChallenges.map((challenge, idx) => {
                          const config = challengeTypeConfig[challenge.type] || challengeTypeConfig.JAVASCRIPT;
                          const isComingSoon = challenge.tags?.includes('coming-soon');
                          const isBoss = isBossChallenge(challenge);

                          return (
                            <ChallengeCard
                              key={challenge.slug}
                              challenge={challenge}
                              index={idx}
                              config={config}
                              isComingSoon={!!isComingSoon}
                              isBoss={isBoss}
                              params={{ locale, slug: challenge.slug }}
                              t={t}
                            />
                          )
                        })}
                      </AnimatePresence>
                    </motion.div>
                  ) : (
                    <div className="rounded-xl border bg-card/50 overflow-hidden w-full">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[60px] pl-4">#</TableHead>
                            <TableHead className="w-full min-w-[300px]">Challenge</TableHead>
                            {/* Type Column Restored */}
                            <TableHead className="w-[120px]">Type</TableHead>
                            <TableHead className="w-[80px]">Difficulty</TableHead>
                            <TableHead className="w-[80px] text-right">XP</TableHead>
                            {/* Spacer Column REMOVED */}
                            <TableHead className="w-[40px] px-2"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <AnimatePresence mode="popLayout">
                            {categoryChallenges.map((challenge, idx) => {
                              const config = challengeTypeConfig[challenge.type] || challengeTypeConfig.JAVASCRIPT;
                              const isComingSoon = challenge.tags?.includes('coming-soon');
                              const isBoss = isBossChallenge(challenge);

                              return (
                                <ChallengeRow
                                  key={challenge.slug}
                                  challenge={challenge}
                                  index={idx}
                                  config={config}
                                  isComingSoon={!!isComingSoon}
                                  isBoss={isBoss}
                                  params={{ locale, slug: challenge.slug }}
                                  t={t}
                                />
                              )
                            })}
                          </AnimatePresence>
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// --- Sub-components for Cleaner Render ---

export function ChallengeCard({ challenge, config, isComingSoon, isBoss, params, t }: any) {
  const CardContentWrapper = (
    <Card
      className={cn(
        "h-full transition-all duration-200 overflow-hidden border-border/50",
        isComingSoon ? "opacity-60 bg-muted/20" : "hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 bg-card/50 hover:bg-card",
        isBoss && !isComingSoon && "border-red-500/20 bg-red-500/5 hover:border-red-500/40 hover:shadow-red-500/10",
        challenge.isCompleted && !isComingSoon && "bg-green-500/5 border-green-500/20"
      )}
    >
      <CardHeader className="p-5 pb-3 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <Badge
            variant="outline"
            className={cn(
              "rounded-md px-2 py-0.5 text-[10px] font-medium border-transparent",
              isComingSoon ? "bg-muted text-muted-foreground" : config.color
            )}
          >
            {config.icon}
            <span className="ml-1.5">{t(`types.${challenge.type.toLowerCase()}`)}</span>
          </Badge>
          {challenge.isCompleted && !isComingSoon && (
            <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-600 shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <CardTitle className={cn(
            "text-base font-bold leading-tight line-clamp-1",
            isBoss ? "text-red-600 dark:text-red-400" : ""
          )}>
            {isBoss && <Swords className="inline-block h-4 w-4 mr-1.5 -mt-0.5" />}
            {challenge.title}
          </CardTitle>
          <CardDescription className="text-xs line-clamp-2 min-h-[2.5em]">
            {challenge.description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-0">
        <div className="flex items-center justify-between mt-4">
          <Badge variant="secondary" className={cn("text-[10px] h-5 font-medium", difficultyColors[challenge.difficulty])}>
            {t(`difficulty.${challenge.difficulty}`)}
          </Badge>

          {!isComingSoon && (
            <div className="flex items-center gap-3 text-xs font-medium">
              <div className="flex items-center gap-1 text-muted-foreground/70">
                <Trophy className="h-3.5 w-3.5" />
                <span>{challenge.completionCount}</span>
              </div>
              <div className="flex items-center gap-1 text-amber-500">
                <Zap className="h-3.5 w-3.5 fill-current" />
                <span>{challenge.xpReward}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isComingSoon) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="cursor-not-allowed h-full"
      >
        {CardContentWrapper}
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Link to="/$locale/challenges/$slug" params={params} className="block h-full group outline-none">
        {CardContentWrapper}
      </Link>
    </motion.div>
  );
}

export function ChallengeRow({ challenge, index, config, isComingSoon, isBoss, params, t }: any) {
  const RowContent = (
    <>
      <TableCell className="font-mono text-xs text-muted-foreground w-[60px] pl-4">
        <div className="flex items-center gap-2">
          {String(index + 1).padStart(2, '0')}
          {challenge.isCompleted && <CheckCircle2 className="h-3 w-3 text-green-500" />}
        </div>
      </TableCell>
      <TableCell className="w-full min-w-[300px]">
        <div className="flex flex-col">
          <Link to="/$locale/challenges/$slug" params={params} className={cn("font-medium text-sm flex items-center gap-2 w-fit hover:underline decoration-primary/50 underline-offset-4", isBoss && "text-red-500")}>
            {challenge.title}
            {isBoss && <Swords className="h-3 w-3" />}
            {isComingSoon && <Lock className="h-3 w-3 text-muted-foreground" />}
          </Link>
          <span className="text-xs text-muted-foreground mt-0.5">{challenge.description}</span>
        </div>
      </TableCell>
      {/* Type Column Restored */}
      <TableCell className="w-[120px]">
        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0.5 gap-1 font-normal w-fit", isComingSoon ? "opacity-50" : "", config.color, "bg-transparent border-current/20")}>
          {config.icon}
          {t(`types.${challenge.type.toLowerCase()}`)}
        </Badge>
      </TableCell>
      <TableCell className="w-[80px]">
        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", difficultyColors[challenge.difficulty])}>
          {t(`difficulty.${challenge.difficulty}`)}
        </span>
      </TableCell>
      <TableCell className="w-[80px] text-right font-medium text-amber-500 tabular-nums text-xs">
        {isComingSoon ? '-' : <span className="flex items-center justify-end gap-1"><Zap className="h-3 w-3" /> {challenge.xpReward}</span>}
      </TableCell>

      <TableCell className="w-[40px] px-2">
        <Link to="/$locale/challenges/$slug" params={params} className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-muted transition-colors">
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
        </Link>
      </TableCell>
    </>
  );


  if (isComingSoon) {
    return (
      <motion.tr
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        className="opacity-50 cursor-not-allowed hover:bg-transparent border-b transition-colors"
        style={{ display: 'table-row' }} // Ensure motion doesn't override display
      >
        {RowContent}
      </motion.tr>
    );
  }

  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="group hover:bg-muted/50 transition-colors border-b"
      style={{ display: 'table-row' }}
    >
      {RowContent}
    </motion.tr>
  );
}
