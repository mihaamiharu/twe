import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useSuspenseQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { UsersRound } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { leaderboardQueryOptions } from '@/lib/leaderboard.query';
import { createSeoHead } from '@/lib/seo';

interface LeaderboardEntry {
  id: string;
  name: string | null;
  image: string | null;
  xp: number;
  monthlyXp?: number;
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

const LeaderboardSearchSchema = z.object({
  period: z.enum(['all', 'monthly']).optional(),
});

export const Route = createFileRoute('/$locale/leaderboard')({
  validateSearch: LeaderboardSearchSchema,
  loaderDeps: ({ search: { period } }) => ({ period }),
  loader: async ({ context, params, deps: { period } }) => {
    const activePromise = context.queryClient.ensureQueryData(
      leaderboardQueryOptions({
        period: period ?? 'all',
        locale: params.locale,
        page: 1,
        limit: 50,
      }),
    );

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
        'See how the TestingWithEkki community is building stronger automation skills together.',
      path: '/leaderboard',
      locale,
    });
  },
});

function LeaderboardPage() {
  const { locale } = useParams({ from: '/$locale/leaderboard' });
  const { t } = useTranslation(['leaderboard', 'common']);
  const { auth } = Route.useRouteContext();
  const currentUserId = auth?.user?.id;
  const isAuthenticated = !!currentUserId;
  const navigate = Route.useNavigate();
  const searchParams = Route.useSearch();
  const period = searchParams.period ?? 'all';

  const { data: leaderboardData } = useSuspenseQuery(
    leaderboardQueryOptions({ page: 1, limit: 50, period, locale }),
  );

  const users: LeaderboardEntry[] = leaderboardData?.data ?? [];
  const formatXp = (user: LeaderboardEntry) =>
    ((period === 'monthly' ? user.monthlyXp : user.xp) || 0).toLocaleString(
      locale,
    );
  const getDelay = (index: number) => ({
    animationDelay: `${index * 45}ms`,
  });

  return (
    <div
      data-testid="leaderboard-page"
      className="min-h-screen overflow-hidden bg-[var(--warm-canvas)] px-4 py-8 text-[var(--graphite)] sm:px-6 md:py-12 lg:px-8"
    >
      <main className="mx-auto max-w-6xl">
        <header
          data-testid="leaderboard-header"
          className="grid items-center gap-8 border-b border-[var(--soft-border)] pb-9 lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)] lg:gap-12"
        >
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.18em] text-[var(--brand-orange)]">
              <UsersRound className="h-4 w-4" aria-hidden="true" />
              {t('leaderboard:header.eyebrow')}
            </p>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
              {t('leaderboard:header.title')}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[var(--muted-graphite)] sm:text-lg">
              {t('leaderboard:header.subtitle')}
            </p>
          </div>

          <div className="flex justify-center lg:justify-end">
            <img
              data-testid="leaderboard-illustration"
              src="/illustrations/twe-leaderboard-community.png"
              alt=""
              aria-hidden="true"
              width="1536"
              height="1024"
              className="h-auto w-full max-w-[280px] object-contain"
              loading="eager"
            />
          </div>
        </header>

        <Tabs
          data-testid="leaderboard-tabs-root"
          value={period === 'all' ? 'all-time' : 'monthly'}
          className="mt-8 space-y-6"
          onValueChange={(value) => {
            void navigate({
              to: '/$locale/leaderboard',
              params: { locale },
              search: (previous) => ({
                ...previous,
                period: value === 'monthly' ? 'monthly' : 'all',
              }),
              replace: true,
            });
          }}
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted-graphite)]">
                {t('leaderboard:table.eyebrow')}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                {t('leaderboard:table.title')}
              </h2>
            </div>

            <TabsList
              data-testid="leaderboard-tabs"
              className="h-11 w-full rounded-lg border-[var(--soft-border)] bg-[var(--paper-surface)] p-1 sm:w-fit"
            >
              <TabsTrigger
                data-testid="leaderboard-tab-all-time"
                value="all-time"
                className="h-full flex-1 rounded-md px-4 font-mono text-xs uppercase tracking-[0.08em] text-[var(--muted-graphite)] data-[state=active]:bg-[var(--graphite)] data-[state=active]:text-[var(--paper-surface)] sm:flex-none"
              >
                {t('leaderboard:tabs.allTime')}
              </TabsTrigger>
              <TabsTrigger
                data-testid="leaderboard-tab-monthly"
                value="monthly"
                className="h-full flex-1 rounded-md px-4 font-mono text-xs uppercase tracking-[0.08em] text-[var(--muted-graphite)] data-[state=active]:bg-[var(--graphite)] data-[state=active]:text-[var(--paper-surface)] sm:flex-none"
              >
                {t('leaderboard:tabs.thisMonth')}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            data-testid="leaderboard-panel"
            value={period === 'all' ? 'all-time' : 'monthly'}
            className="space-y-6"
          >
            <section
              data-testid="leaderboard-list"
              aria-label={t('leaderboard:table.title')}
              className="overflow-hidden rounded-xl border border-[var(--soft-border)] bg-[var(--paper-surface)]"
            >
              {users.length === 0 ? (
                <div
                  data-testid="leaderboard-empty-state"
                  className="flex flex-col items-center justify-center px-6 py-20 text-center"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--brand-orange)]/30 bg-[var(--orange-tint)] text-[var(--brand-orange)]">
                    <UsersRound className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="mt-6 font-mono text-xs font-medium uppercase tracking-[0.16em] text-[var(--brand-orange)]">
                    {t('leaderboard:table.emptyEyebrow')}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold">
                    {t('leaderboard:table.emptyState')}
                  </h3>
                  <p className="mt-3 max-w-md text-sm leading-6 text-[var(--muted-graphite)]">
                    {t('leaderboard:table.emptyDescription')}
                  </p>
                </div>
              ) : (
                <>
                  <div className="hidden grid-cols-[72px_minmax(0,1fr)_180px_120px] items-center gap-4 border-b border-[var(--soft-border)] px-5 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted-graphite)] md:grid">
                    <span>{t('leaderboard:table.rank')}</span>
                    <span>{t('leaderboard:table.learner')}</span>
                    <span className="text-right">
                      {t('leaderboard:table.activity')}
                    </span>
                    <span className="text-right">
                      {t('leaderboard:table.score')}
                    </span>
                  </div>

                  <div className="divide-y divide-[var(--soft-border)]">
                    {users.map((user, index) => {
                      const isCurrentUser = currentUserId === user.id;
                      const displayName =
                        user.name || t('leaderboard:table.anonymous');

                      return (
                        <div
                          key={user.id}
                          data-testid="leaderboard-item"
                          data-current-user={isCurrentUser ? 'true' : undefined}
                          style={getDelay(index)}
                          className={cn(
                            'group grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 transition-colors animate-in fade-in slide-in-from-bottom-1 fill-mode-backwards motion-reduce:animate-none motion-reduce:opacity-100 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:gap-4 sm:px-5 md:grid-cols-[72px_minmax(0,1fr)_180px_120px]',
                            isCurrentUser
                              ? 'bg-[var(--orange-tint)]/55'
                              : 'bg-[var(--paper-surface)] hover:bg-[var(--warm-canvas)]/60',
                          )}
                        >
                          <div className="flex items-center justify-center">
                            <span
                              className={cn(
                                'font-mono text-sm font-medium',
                                isCurrentUser
                                  ? 'text-[var(--brand-orange)]'
                                  : 'text-[var(--muted-graphite)]',
                              )}
                            >
                              {user.rank || index + 1}
                            </span>
                          </div>

                          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                            <div className="h-11 w-11 flex-none overflow-hidden rounded-lg border border-[var(--soft-border)] bg-[var(--warm-canvas)] sm:h-12 sm:w-12">
                              {user.image ? (
                                <img
                                  src={user.image}
                                  alt={displayName}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center font-semibold text-[var(--brand-orange)]">
                                  {displayName.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="truncate font-semibold">
                                {displayName}
                              </span>
                              {isCurrentUser && (
                                <span
                                  data-testid="leaderboard-current-user"
                                  className="flex-none rounded-full bg-[var(--brand-orange)] px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-white"
                                >
                                  {t('leaderboard:table.you')}
                                </span>
                              )}
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--muted-graphite)]">
                              <span>
                                {t('common:labels.level')} {user.level}
                              </span>
                              <span
                                className="h-1 w-1 rounded-full bg-[var(--soft-border)] md:hidden"
                                aria-hidden="true"
                              />
                              <span className="md:hidden">
                                {user.challengesCompleted}{' '}
                                {t('leaderboard:table.challenges')}
                              </span>
                            </div>

                            {user.badges.length > 0 && (
                              <div className="mt-2 flex -space-x-1">
                                {user.badges.slice(0, 3).map((badge) => (
                                  <span
                                    key={badge.slug}
                                    title={badge.name}
                                    aria-label={badge.name}
                                    className="flex h-5 w-5 items-center justify-center rounded-full border border-[var(--soft-border)] bg-[var(--paper-surface)] text-[10px]"
                                  >
                                    {badge.icon}
                                  </span>
                                ))}
                              </div>
                            )}
                            </div>
                          </div>

                          <div className="hidden flex-none text-right md:block">
                            <p className="font-semibold">
                              {user.challengesCompleted}
                            </p>
                            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--muted-graphite)]">
                              {t('leaderboard:table.challenges')}
                            </p>
                          </div>

                          <div className="flex-none text-right">
                            <p className="font-semibold text-[var(--brand-orange)]">
                              {formatXp(user)}
                            </p>
                            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--muted-graphite)]">
                              XP
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </section>

            {!isAuthenticated && (
              <div
                data-testid="leaderboard-sign-in"
                className="flex flex-col gap-5 rounded-xl border border-[var(--brand-orange)]/25 bg-[var(--orange-tint)]/45 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7"
              >
                <div className="max-w-xl">
                  <p className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-[var(--brand-orange)]">
                    {t('leaderboard:gating.eyebrow')}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold">
                    {t('leaderboard:gating.title')}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-graphite)]">
                    {t('leaderboard:gating.description')}
                  </p>
                </div>
                <Link
                  to="/$locale/login"
                  params={{ locale }}
                  search={{ redirect: '/leaderboard' }}
                  className="flex-none"
                >
                  <Button className="h-11 w-full rounded-lg bg-[var(--brand-orange)] px-5 text-white hover:bg-[#d9502d] sm:w-auto">
                    {t('leaderboard:gating.button')}
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
