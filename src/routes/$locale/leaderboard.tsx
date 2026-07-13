import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  Medal,
  RotateCcw,
  Shield,
  Trophy,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CTAButton,
  PageContainer,
  PaperSurface,
  SectionHeading,
  StatePanel,
} from '@/components/cozy-quest';
import { cn } from '@/lib/utils';
import { leaderboardQueryOptions } from '@/lib/leaderboard.query';
import { createSeoHead } from '@/lib/seo';

type Period = 'all' | 'monthly';

interface LeaderboardEntry {
  id: string;
  name: string | null;
  image: string | null;
  xp: number;
  monthlyXp: number;
  level: number;
  challengesCompleted: number;
  rank: number;
  badges: Array<{ name: string; icon: string; slug: string }>;
}

const LeaderboardSearchSchema = z.object({
  period: z.enum(['all', 'monthly']).optional(),
  page: z.coerce.number().int().min(1).optional(),
});

export const Route = createFileRoute('/$locale/leaderboard')({
  validateSearch: LeaderboardSearchSchema,
  loaderDeps: ({ search }) => ({
    period: (search.period ?? 'all') as Period,
    page: search.page ?? 1,
  }),
  loader: async ({ context, params, deps: { period, page } }) => {
    const activePromise = context.queryClient.ensureQueryData(
      leaderboardQueryOptions({
        period,
        locale: params.locale,
        page,
        limit: 50,
      }),
    );

    const otherPeriod: Period = period === 'all' ? 'monthly' : 'all';
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
  pendingComponent: LeaderboardLoading,
  component: LeaderboardPage,
  head: ({ params }) =>
    createSeoHead({
      title: 'Leaderboard | TestingWithEkki',
      description:
        'See all-time and monthly XP rankings for TestingWithEkki challenges.',
      path: '/leaderboard',
      locale: params.locale || 'en',
    }),
});

function LeaderboardPage() {
  const { locale } = useParams({ from: '/$locale/leaderboard' });
  const { t } = useTranslation(['leaderboard', 'common']);
  const { auth } = Route.useRouteContext();
  const navigate = Route.useNavigate();
  const { period: requestedPeriod, page: requestedPage } = Route.useSearch();
  const period: Period = requestedPeriod ?? 'all';
  const page = requestedPage ?? 1;
  const query = useSuspenseQuery(
    leaderboardQueryOptions({ page, limit: 50, period, locale }),
  );

  if (!query.data.success) {
    return (
      <main className="min-h-screen py-10 sm:py-14">
        <PageContainer width="narrow">
          <PaperSurface className="px-6 py-14 sm:px-10" texture={false}>
            <StatePanel
              icon={RotateCcw}
              tone="danger"
              title={t('error.title')}
              description={query.data.error || t('error.description')}
              actions={
                <Button onClick={() => void query.refetch()}>
                  <RotateCcw className="size-4" aria-hidden="true" />
                  {t('common:actions.tryAgain')}
                </Button>
              }
            />
          </PaperSurface>
        </PageContainer>
      </main>
    );
  }

  const users = query.data.data as LeaderboardEntry[];
  const pagination = query.data.pagination;
  const isAuthenticated = Boolean(auth?.user);
  const currentUserId = auth?.user?.id;
  const podium = page === 1 ? users.slice(0, 3) : [];
  const rows = page === 1 ? users.slice(3) : users;

  const setPeriod = (nextPeriod: Period) => {
    void navigate({
      to: '.',
      search: { period: nextPeriod, page: 1 },
      replace: true,
    });
  };

  const setPage = (nextPage: number) => {
    void navigate({
      to: '.',
      search: { period, page: nextPage },
      replace: true,
    });
  };

  return (
    <main className="min-h-screen py-8 sm:py-10 lg:py-12">
      <PageContainer width="wide">
        <PaperSurface className="relative overflow-hidden px-6 py-8 sm:px-10 sm:py-10">
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-16 size-56 rounded-full border-[18px] border-[color:var(--quest-gold)]/20"
          />
          <SectionHeading
            as="h1"
            eyebrow={t('header.eyebrow')}
            title={t('header.title')}
            description={t('header.subtitle')}
          />
        </PaperSurface>

        <Tabs
          value={period}
          onValueChange={(value) => setPeriod(value as Period)}
          className="mt-6 gap-6"
        >
          <div className="flex justify-center">
            <TabsList aria-label={t('tabs.label')}>
              <TabsTrigger value="all">{t('tabs.allTime')}</TabsTrigger>
              <TabsTrigger value="monthly">{t('tabs.thisMonth')}</TabsTrigger>
            </TabsList>
          </div>

          {users.length === 0 ? (
            <PaperSurface className="px-6 py-14 sm:px-10" texture={false}>
              <StatePanel
                icon={Trophy}
                title={t('table.emptyState')}
                description={t('table.emptyDescription')}
                actions={
                  <CTAButton asChild>
                    <Link to="/$locale/challenges" params={{ locale }}>
                      {t('emptyAction')}
                    </Link>
                  </CTAButton>
                }
              />
            </PaperSurface>
          ) : (
            <>
              {podium.length > 0 && (
                <section aria-labelledby="podium-heading">
                  <h2 id="podium-heading" className="sr-only">
                    {t('podium.label')}
                  </h2>
                  <ol className="grid gap-4 md:grid-cols-3 md:items-end">
                    {podium.map((user) => (
                      <li
                        key={user.id}
                        className={cn(
                          user.rank === 1 && 'md:order-2 md:-mt-6',
                          user.rank === 2 && 'md:order-1',
                          user.rank === 3 && 'md:order-3',
                        )}
                      >
                        <PodiumEntry
                          user={user}
                          period={period}
                          isAuthenticated={isAuthenticated}
                          isCurrentUser={currentUserId === user.id}
                        />
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              <PaperSurface className="overflow-hidden p-0" texture={false}>
                <div className="border-b border-border bg-secondary/45 px-4 py-3 sm:px-6">
                  <h2 className="font-display text-xl font-semibold">
                    {t('table.title')}
                  </h2>
                </div>
                <ol
                  data-testid="leaderboard-list"
                  className="divide-y divide-border"
                  start={rows[0]?.rank || 1}
                >
                  {rows.map((user) => (
                    <LeaderboardRow
                      key={user.id}
                      user={user}
                      period={period}
                      isAuthenticated={isAuthenticated}
                      isCurrentUser={currentUserId === user.id}
                    />
                  ))}
                </ol>
                <LeaderboardPagination
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  total={pagination.total}
                  onPageChange={setPage}
                />
              </PaperSurface>

              {!isAuthenticated && (
                <PaperSurface
                  className="border-dashed px-6 py-10 text-center"
                  texture={false}
                >
                  <Shield
                    className="mx-auto size-9 text-primary"
                    aria-hidden="true"
                  />
                  <h2 className="mt-4 font-display text-2xl font-semibold">
                    {t('gating.title')}
                  </h2>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                    {t('gating.description')}
                  </p>
                  <CTAButton asChild className="mt-6">
                    <Link
                      to="/$locale/login"
                      params={{ locale }}
                      search={{ redirect: '/leaderboard' }}
                    >
                      {t('gating.button')}
                    </Link>
                  </CTAButton>
                </PaperSurface>
              )}
            </>
          )}
        </Tabs>
      </PageContainer>
    </main>
  );
}

function PodiumEntry({
  user,
  period,
  isAuthenticated,
  isCurrentUser,
}: {
  user: LeaderboardEntry;
  period: Period;
  isAuthenticated: boolean;
  isCurrentUser: boolean;
}) {
  const { t } = useTranslation(['leaderboard', 'common']);
  const score = period === 'monthly' ? user.monthlyXp : user.xp;
  const crown = user.rank === 1;

  return (
    <PaperSurface
      data-testid="leaderboard-podium-item"
      aria-current={isCurrentUser || undefined}
      className={cn(
        'relative p-5',
        crown &&
          'border-[color:var(--quest-gold)]/70 shadow-[0_18px_42px_rgba(200,163,93,0.18)]',
        isCurrentUser &&
          'ring-2 ring-primary ring-offset-2 ring-offset-background',
      )}
      texture={false}
    >
      <div className="flex items-start justify-between gap-3">
        <RankMarker rank={user.rank} />
        {crown && (
          <Crown
            className="size-6 text-[color:var(--quest-gold)]"
            aria-label={t('podium.firstPlace')}
          />
        )}
      </div>
      <div className="mt-5 flex items-center gap-3">
        <UserAvatar user={user} isAuthenticated={isAuthenticated} />
        <div className="min-w-0">
          <p
            className={cn(
              'truncate text-lg font-bold',
              !isAuthenticated && 'blur-[3px]',
            )}
          >
            {isAuthenticated
              ? user.name || t('table.anonymous')
              : t('table.hiddenUser')}
          </p>
          {isCurrentUser && <Badge className="mt-1">{t('table.you')}</Badge>}
        </div>
      </div>
      <p className="mt-5 text-2xl font-bold tabular-nums text-primary">
        {score.toLocaleString()}{' '}
        <span className="text-sm font-semibold">XP</span>
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {t('common:labels.level')} {user.level} ·{' '}
        {t('table.challengesCount', { count: user.challengesCompleted })}
      </p>
      <AchievementBadges badges={user.badges} />
    </PaperSurface>
  );
}

function LeaderboardRow({
  user,
  period,
  isAuthenticated,
  isCurrentUser,
}: {
  user: LeaderboardEntry;
  period: Period;
  isAuthenticated: boolean;
  isCurrentUser: boolean;
}) {
  const { t } = useTranslation(['leaderboard', 'common']);
  const score = period === 'monthly' ? user.monthlyXp : user.xp;

  return (
    <li
      data-testid="leaderboard-item"
      aria-current={isCurrentUser || undefined}
      className={cn(
        'grid grid-cols-[auto_minmax(0,1fr)_auto] gap-x-3 gap-y-3 px-4 py-4 sm:grid-cols-[3.5rem_minmax(0,1fr)_auto_auto] sm:items-center sm:gap-5 sm:px-6',
        isCurrentUser && 'bg-primary/8 shadow-[inset_4px_0_0_var(--primary)]',
      )}
    >
      <RankMarker rank={user.rank} />
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar user={user} isAuthenticated={isAuthenticated} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={cn(
                'truncate font-bold',
                !isAuthenticated && 'blur-[3px]',
              )}
            >
              {isAuthenticated
                ? user.name || t('table.anonymous')
                : t('table.hiddenUser')}
            </p>
            {isCurrentUser && <Badge>{t('table.you')}</Badge>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('common:labels.level')} {user.level} ·{' '}
            {t('table.challengesCount', { count: user.challengesCompleted })}
          </p>
        </div>
      </div>
      <AchievementBadges badges={user.badges} className="hidden sm:flex" />
      <p className="text-right font-bold tabular-nums text-primary">
        {score.toLocaleString()}{' '}
        <span className="text-xs font-semibold">XP</span>
      </p>
      <AchievementBadges
        badges={user.badges}
        className="col-span-3 sm:hidden"
      />
    </li>
  );
}

function RankMarker({ rank }: { rank: number }) {
  const markerClass =
    rank === 1
      ? 'bg-[color:var(--quest-gold)]/20 text-foreground'
      : rank === 2
        ? 'bg-secondary text-foreground'
        : rank === 3
          ? 'bg-[color:var(--quest-clay)]/15 text-foreground'
          : 'bg-muted text-muted-foreground';

  return (
    <span
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-xl font-mono-tech text-sm font-bold',
        markerClass,
      )}
    >
      <Medal className="mr-1 size-3.5" aria-hidden="true" />
      {rank}
    </span>
  );
}

function UserAvatar({
  user,
  isAuthenticated,
}: {
  user: LeaderboardEntry;
  isAuthenticated: boolean;
}) {
  const { t } = useTranslation('leaderboard');
  const name = isAuthenticated
    ? user.name || t('table.anonymous')
    : t('table.hiddenUser');
  return (
    <Avatar className="size-11 border border-border bg-secondary">
      {isAuthenticated && user.image && (
        <AvatarImage src={user.image} alt={name} className="object-cover" />
      )}
      <AvatarFallback className="bg-secondary font-bold text-primary">
        {isAuthenticated ? name.charAt(0).toUpperCase() : '?'}
      </AvatarFallback>
    </Avatar>
  );
}

function AchievementBadges({
  badges,
  className,
}: {
  badges: LeaderboardEntry['badges'];
  className?: string;
}) {
  const { t } = useTranslation('leaderboard');
  if (!badges.length) return null;
  return (
    <div
      className={cn('mt-4 flex flex-wrap gap-1.5', className)}
      aria-label={t('table.badgesLabel')}
    >
      {badges.slice(0, 3).map((badge) => (
        <Badge
          key={badge.slug}
          variant="secondary"
          title={badge.name}
          aria-label={badge.name}
        >
          <span aria-hidden="true">{badge.icon}</span>
          <span className="sr-only">{badge.name}</span>
        </Badge>
      ))}
    </div>
  );
}

function LeaderboardPagination({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const { t } = useTranslation('leaderboard');
  if (totalPages <= 1) return null;
  return (
    <nav
      className="flex flex-col gap-3 border-t border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
      aria-label={t('pagination.label')}
    >
      <p className="text-sm text-muted-foreground">
        {t('pagination.summary', { page, totalPages, total })}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          {t('pagination.previous')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          {t('pagination.next')}
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}

function LeaderboardLoading() {
  return (
    <main className="min-h-screen py-8 sm:py-10" aria-busy="true">
      <PageContainer width="wide">
        <span className="sr-only">Loading leaderboard</span>
        <Skeleton className="h-56 rounded-[1.25rem]" />
        <div className="mt-6 flex justify-center">
          <Skeleton className="h-11 w-56 rounded-xl" />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-48 rounded-[1.25rem]" />
          ))}
        </div>
        <Skeleton className="mt-6 h-80 rounded-[1.25rem]" />
      </PageContainer>
    </main>
  );
}
