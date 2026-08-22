import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useSuspenseQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Crown, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { leaderboardQueryOptions } from '@/lib/leaderboard.query';
import { createSeoHead } from '@/lib/seo';
import { omitUndefined } from '@/lib/omit-undefined';

interface LeaderboardEntry {
  id: string;
  name: string | null;
  image: string | null;
  xp: number;
  monthlyXp?: number; // Added monthly XP
  level: number;
  createdAt: Date | null;
  challengesCompleted: number;
  rank: number;
  displayName: string;
  badges: {
    name: string;
    icon: string;
    slug: string;
  }[];
}

// --- Search Params Schema ---
const LeaderboardSearchSchema = z.object({
  period: z.enum(['all', 'monthly']).optional(),
});

export const Route = createFileRoute('/$locale/leaderboard')({
  validateSearch: LeaderboardSearchSchema,
  loaderDeps: ({ search: { period } }) => ({ period }),
  loader: async ({ context, params, deps: { period } }) => {
    // Prefetch specific period first (priority)
    const activePromise = context.queryClient.ensureQueryData(
      leaderboardQueryOptions({
        period: period ?? 'all',
        locale: params.locale,
        page: 1,
        limit: 50,
      }),
    );

    // Prefetch the other one in background for instant tab switch
    const otherPeriod = period === 'all' ? 'monthly' : 'all';
    void context.queryClient.prefetchQuery(
      leaderboardQueryOptions({
        period: otherPeriod,
        locale: params.locale,
        page: 1,
        limit: 50,
      }),
    );

    return activePromise;
  },
  component: LeaderboardPage,
  head: ({ params }) => {
    const locale = params.locale || 'en';
    return createSeoHead({
      title: 'Leaderboard | TestingWithEkki',
      description:
        'See who tops the charts! View the all-time and monthly leaderboard for TestingWithEkki challenges.',
      path: '/leaderboard',
      locale,
    });
  },
});

function LeaderboardPage() {
  const { locale } = useParams({ from: '/$locale/leaderboard' });
  const { t } = useTranslation(['leaderboard', 'common']);
  const { auth } = Route.useRouteContext();
  const session = auth;
  const isAuthenticated = !!session?.user;
  const navigate = Route.useNavigate();

  // URL-based State
  const searchParams = Route.useSearch();
  const period = searchParams.period ?? 'all';

  const { data: leaderboardData } = useSuspenseQuery(
    leaderboardQueryOptions({ page: 1, limit: 50, period, locale }),
  );

  const users: LeaderboardEntry[] = leaderboardData?.data ?? [];

  const TopThree = users.slice(0, 3);
  const RestUsers = users.slice(3);
  const firstUser = TopThree[0];

  // Animation delay utility
  const getDelay = (index: number) => ({ animationDelay: `${index * 50}ms` });
  const getDisplayXpProps = (user: LeaderboardEntry) => {
    const displayXp = period === 'monthly' ? user.monthlyXp : user.xp;
    return omitUndefined({ displayXp });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black tracking-tight flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
            <span className="text-primary">~</span>
            {t('leaderboard:header.title')}
          </h1>
          <p className="text-muted-foreground text-lg animate-in fade-in slide-in-from-top-4 duration-700 delay-100">
            {t('leaderboard:header.subtitle')}
          </p>
        </div>

        <Tabs
          value={period === 'all' ? 'all-time' : 'monthly'}
          className="space-y-8"
          onValueChange={(val) => {
            void navigate({
              to: '.',
              search: { period: val === 'monthly' ? 'monthly' : 'all' },
              replace: true,
            });
          }}
        >
          <div className="flex justify-center">
            <TabsList className="h-12 rounded-md border border-border bg-muted/30 p-1 animate-in fade-in zoom-in-50 duration-500 delay-200">
              <TabsTrigger
                value="all-time"
                className="h-10 rounded-sm px-6 font-semibold data-[state=active]:bg-background data-[state=active]:shadow-none transition-colors"
              >
                {t('leaderboard:tabs.allTime')}
              </TabsTrigger>
              <TabsTrigger
                value="monthly"
                className="h-10 rounded-sm px-6 font-semibold data-[state=active]:bg-background data-[state=active]:shadow-none transition-colors"
              >
                {t('leaderboard:tabs.thisMonth')}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value={period === 'all' ? 'all-time' : 'monthly'}
            className="space-y-8"
          >
            {users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-md bg-muted/50">
                  <Trophy className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {t('leaderboard:table.emptyState')}
                </h3>
                <p className="text-muted-foreground max-w-xs">
                  {t('leaderboard:table.emptyDescription', {
                    defaultValue:
                      'No one has climbed the leaderboard yet. Be the first!',
                  })}
                </p>
              </div>
            ) : (
              <>
                {/* Top 3 Podium - Compact & Floating */}
                {TopThree.length > 0 && firstUser && (
                  <div className="relative pt-10 pb-4">
                    <div
                      className={cn(
                        'flex flex-col md:flex-row gap-4 items-end justify-center',
                        TopThree.length === 1 ? 'max-w-xs mx-auto' : '',
                      )}
                    >
                      {TopThree.length === 1 ? (
                        <div className="animate-in fade-in zoom-in-75 duration-500 delay-300">
                          <PodiumCard
                            user={firstUser}
                            rank={1}
                            isCenter
                            isAuthenticated={isAuthenticated}
                            {...getDisplayXpProps(firstUser)}
                          />
                        </div>
                      ) : (
                        <>
                          {/* Rank 2 (Left) */}
                          <div className="order-2 md:order-1 w-full md:w-auto flex justify-center animate-in fade-in slide-in-from-right-8 duration-500 delay-400">
                            {TopThree[1] ? (
                              <PodiumCard
                                user={TopThree[1]}
                                rank={2}
                                isAuthenticated={isAuthenticated}
                                {...getDisplayXpProps(TopThree[1])}
                              />
                            ) : (
                              <div className="w-[200px]" />
                            )}
                          </div>

                          {/* Rank 1 (Center) */}
                          <div className="order-1 md:order-2 w-full md:w-auto flex justify-center -mt-8 mb-4 md:mb-8 z-10 animate-in fade-in zoom-in-75 duration-500 delay-300">
                            <PodiumCard
                              user={firstUser}
                              rank={1}
                              isCenter
                              isAuthenticated={isAuthenticated}
                              {...getDisplayXpProps(firstUser)}
                            />
                          </div>

                          {/* Rank 3 (Right) */}
                          <div className="order-3 w-full md:w-auto flex justify-center animate-in fade-in slide-in-from-left-8 duration-500 delay-500">
                            {TopThree[2] ? (
                              <PodiumCard
                                user={TopThree[2]}
                                rank={3}
                                isAuthenticated={isAuthenticated}
                                {...getDisplayXpProps(TopThree[2])}
                              />
                            ) : (
                              <div className="hidden md:block w-[200px]" />
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Rest of Leaderboard - List View */}
                <div
                  className="space-y-2 rounded-md border border-border/60 bg-muted/10 p-2 md:p-6"
                  data-testid="leaderboard-list"
                >
                  {RestUsers.map((user, index) => (
                    <div
                      key={user.id}
                      data-testid="leaderboard-item"
                      style={getDelay(index)}
                      className={cn(
                        'group flex items-center gap-4 rounded-md border border-border/40 bg-card p-3 transition-colors hover:border-border md:p-4 animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards',
                        !isAuthenticated && 'opacity-60 blur-[1px]',
                      )}
                    >
                      {/* Rank */}
                      <div className="flex-none w-8 md:w-12 flex justify-center">
                        <div className="h-8 w-8 rounded-full bg-accent/10 text-accent font-black flex items-center justify-center text-sm transition-transform group-hover:scale-110">
                          {index + 4}
                        </div>
                      </div>

                      {/* Avatar */}
                      <div className="flex-none">
                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-muted overflow-hidden transition-transform group-hover:rotate-3">
                          {isAuthenticated ? (
                            user.image ? (
                              <img
                                src={user.image}
                                alt={user.name || ''}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-primary/5 text-primary font-bold">
                                (user.name || 'A').charAt(0).toUpperCase()
                              </div>
                            )
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground">
                              ?
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold truncate">
                            {isAuthenticated
                              ? user.name || t('leaderboard:table.anonymous')
                              : t('leaderboard:table.hiddenUser')}
                          </span>
                          {/* Badges inline on mobile, hidden on very small screens */}
                          <div className="flex -space-x-1">
                            {user.badges.slice(0, 3).map((badge, i) => (
                              <div
                                key={i}
                                className="h-5 w-5 rounded-full bg-background border border-border flex items-center justify-center text-[10px]"
                                title={badge.name}
                              >
                                {badge.icon}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                          <span>
                            {t('common:labels.level')} {user.level}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-border" />
                          <span>
                            {user.challengesCompleted}{' '}
                            {t('leaderboard:table.challenges')}
                          </span>
                        </div>
                      </div>

                      {/* XP */}
                      <div className="flex-none text-right">
                        <div className="font-black text-primary">
                          {(
                            (period === 'monthly' ? user.monthlyXp : user.xp) ||
                            0
                          ).toLocaleString()}{' '}
                          <span className="text-xs text-muted-foreground font-medium">
                            XP
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {RestUsers.length === 0 && (
                    <div className="text-center p-8 text-muted-foreground animate-in fade-in zoom-in-95 duration-500">
                      {t('leaderboard:table.emptyState')}
                    </div>
                  )}

                  {!isAuthenticated && (
                    <div className="relative mt-8 overflow-hidden rounded-md border border-dashed border-border bg-card/50 p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
                      <div className="relative z-10 max-w-md mx-auto space-y-4">
                        <Shield className="h-12 w-12 text-primary mx-auto opacity-50" />
                        <h3 className="text-xl font-bold">
                          {t('leaderboard:gating.title')}
                        </h3>
                        <p className="text-muted-foreground">
                          {t('leaderboard:gating.description')}
                        </p>
                        <Link
                          to="/$locale/login"
                          params={{ locale }}
                          search={{ redirect: '/leaderboard' }}
                        >
                          <Button
                            size="lg"
                            className="rounded-md px-8 font-semibold"
                          >
                            {t('leaderboard:gating.button')}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function PodiumCard({
  user,
  rank,
  isCenter = false,
  isAuthenticated = false,
  displayXp,
}: {
  user: LeaderboardEntry;
  rank: number;
  isCenter?: boolean;
  isAuthenticated?: boolean;
  displayXp?: number;
}) {
  const { t } = useTranslation(['leaderboard', 'common']);

  // Keep rank one distinct while the rest stay quiet in the editorial palette.
  const accentColor =
    rank === 1 ? 'text-brand-orange' : 'text-muted-foreground';

  const displayName = isAuthenticated
    ? user.name || t('leaderboard:table.anonymous')
    : t('leaderboard:table.hiddenUser');
  const displayAvatar = isAuthenticated ? user.image : null;
  const xpToShow = displayXp !== undefined ? displayXp : user.xp;

  return (
    <div
      data-testid="leaderboard-podium-item"
      className={cn(
        'relative flex min-w-[240px] flex-row items-center gap-4 rounded-md bg-card p-4 transition-colors hover:border-border',
        isCenter
          ? 'min-w-[280px] border border-brand-orange/40'
          : 'border border-border/50 opacity-90',
      )}
    >
      {/* Rank Badge */}
      <div
        className={cn(
          'absolute -left-3 -top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
          rank === 1
            ? 'bg-brand-orange text-[var(--paper-surface)]'
            : 'border border-border bg-card text-muted-foreground',
        )}
      >
        {rank}
      </div>

      {isCenter && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 animate-bounce">
          <Crown className="h-8 w-8 text-brand-orange" />
        </div>
      )}

      {/* Avatar - Compact */}
      <div
        className={cn(
          'h-16 w-16 flex-none overflow-hidden rounded-md',
          rank === 1 ? 'border-2 border-brand-orange' : 'border border-border',
        )}
      >
        {displayAvatar ? (
          <img
            src={displayAvatar}
            alt={displayName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-muted flex items-center justify-center text-xl font-bold">
            {isAuthenticated ? user.name?.[0] || '?' : '?'}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            'font-bold text-lg truncate',
            !isAuthenticated && 'blur-[2px]',
          )}
        >
          {displayName}
        </div>
        <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
          <span className={cn('font-bold', accentColor)}>
            {xpToShow.toLocaleString()}
          </span>{' '}
          XP
        </div>
        {/* Badges */}
        <div className="flex -space-x-1 mt-1">
          {user.badges.slice(0, 2).map((b, i) => (
            <div
              key={i}
              className="h-4 w-4 bg-background rounded-full border border-border flex items-center justify-center text-[8px]"
            >
              {b.icon}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
