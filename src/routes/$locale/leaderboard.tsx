import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Calendar, AlertCircle, Crown, Shield } from 'lucide-react';
import { authQueryOptions } from '@/lib/auth.query';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { getLeaderboard } from '@/server/leaderboard.fn';
import { leaderboardQueryOptions } from '@/lib/leaderboard.query';
import { type RootContext } from '../__root';

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
  period: z.enum(['all', 'monthly']).optional().default('all'),
});

export const Route = createFileRoute('/$locale/leaderboard')({
  validateSearch: LeaderboardSearchSchema,
  loader: async ({ context, params }) => {
    console.log('[Leaderboard Loader] context keys:', Object.keys(context || {}));

    // Check if queryClient exists (should be provided by router)
    if (!context?.queryClient) {
      console.error('[Leaderboard Loader] queryClient missing! Params:', params);
      return;
    }

    // Prefetch both all-time and monthly by default to make tabs instant
    await Promise.all([
      context.queryClient.ensureQueryData(
        leaderboardQueryOptions({ period: 'all', locale: params.locale }),
      ),
      context.queryClient.ensureQueryData(
        leaderboardQueryOptions({ period: 'monthly', locale: params.locale }),
      ),
    ]);
  },
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const { locale } = useParams({ from: '/$locale/leaderboard' });
  const { t } = useTranslation(['leaderboard', 'common']);
  const { auth } = Route.useRouteContext();
  const session = auth;
  const isAuthenticated = !!session?.user;
  const navigate = Route.useNavigate();

  // URL-based State
  const { period } = Route.useSearch();

  const { data: leaderboardData } = useSuspenseQuery(
    leaderboardQueryOptions({ page: 1, limit: 50, period, locale }),
  );

  const users: LeaderboardEntry[] = leaderboardData?.data ?? [];

  const TopThree = users.slice(0, 3);
  const RestUsers = users.slice(3);

  // Animation delay utility
  const getDelay = (index: number) => ({ animationDelay: `${index * 50}ms` });

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden bg-background">
      {/* Background decoration - softer gradient */}
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-primary/5 to-transparent -z-10" />

      <div className="max-w-4xl mx-auto space-y-8">
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
            <TabsList className="bg-muted/30 p-1 h-12 rounded-2xl animate-in fade-in zoom-in-50 duration-500 delay-200">
              <TabsTrigger
                value="all-time"
                className="px-6 h-10 rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                {t('leaderboard:tabs.allTime')}
              </TabsTrigger>
              <TabsTrigger
                value="monthly"
                className="px-6 h-10 rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
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
                <div className="h-20 w-20 rounded-3xl bg-muted/50 flex items-center justify-center mb-4">
                  <Trophy className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {t('leaderboard:table.emptyState')}
                </h3>
                <p className="text-muted-foreground max-w-xs">
                  {t('leaderboard:table.emptyDescription', {
                    defaultValue: 'No one has climbed the leaderboard yet. Be the first!',
                  })}
                </p>
              </div>
            ) : (
              <>
                {/* Top 3 Podium - Compact & Floating */}
                {TopThree.length > 0 && (
                  <div className="relative pt-10 pb-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                    {/* Glow effect for rank 1 */}
                    <div className="absolute left-1/2 top-4 -translate-x-1/2 w-64 h-64 bg-accent/20 blur-[80px] rounded-full -z-10" />

                    <div
                      className={cn(
                        'flex flex-col md:flex-row gap-4 items-end justify-center',
                        TopThree.length === 1 ? 'max-w-xs mx-auto' : ''
                      )}
                    >
                      {TopThree.length === 1 ? (
                        <div className="animate-in fade-in zoom-in-75 duration-500 delay-300">
                          <PodiumCard
                            user={TopThree[0]}
                            rank={1}
                            isCenter
                            isAuthenticated={isAuthenticated}
                            displayXp={period === 'monthly' ? TopThree[0].monthlyXp : TopThree[0].xp}
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
                                displayXp={period === 'monthly' ? TopThree[1].monthlyXp : TopThree[1].xp}
                              />
                            ) : (
                              <div className="w-[200px]" />
                            )}
                          </div>

                          {/* Rank 1 (Center) */}
                          <div className="order-1 md:order-2 w-full md:w-auto flex justify-center -mt-8 mb-4 md:mb-8 z-10 animate-in fade-in zoom-in-75 duration-500 delay-300">
                            <PodiumCard
                              user={TopThree[0]}
                              rank={1}
                              isCenter
                              isAuthenticated={isAuthenticated}
                              displayXp={period === 'monthly' ? TopThree[0].monthlyXp : TopThree[0].xp}
                            />
                          </div>

                          {/* Rank 3 (Right) */}
                          <div className="order-3 w-full md:w-auto flex justify-center animate-in fade-in slide-in-from-left-8 duration-500 delay-500">
                            {TopThree[2] ? (
                              <PodiumCard
                                user={TopThree[2]}
                                rank={3}
                                isAuthenticated={isAuthenticated}
                                displayXp={period === 'monthly' ? TopThree[2].monthlyXp : TopThree[2].xp}
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
                  className="bg-muted/10 rounded-3xl p-2 md:p-6 space-y-2"
                  data-testid="leaderboard-list"
                >
                  {RestUsers.map((user, index) => (
                    <div
                      key={user.id}
                      data-testid="leaderboard-item"
                      style={getDelay(index)}
                      className={cn(
                        'group flex items-center gap-4 p-3 md:p-4 rounded-2xl bg-card border border-border/40 hover:border-border transition-all hover:translate-x-1 hover:shadow-md animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards',
                        !isAuthenticated && 'opacity-60 blur-[1px]'
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
                                {(user.name || 'A')[0].toUpperCase()}
                              </div>
                            )
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground">?</div>
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold truncate">
                            {isAuthenticated ? user.name || t('leaderboard:table.anonymous') : t('leaderboard:table.hiddenUser')}
                          </span>
                          {/* Badges inline on mobile, hidden on very small screens */}
                          <div className="flex -space-x-1">
                            {user.badges.slice(0, 3).map((badge, i) => (
                              <div key={i} className="h-5 w-5 rounded-full bg-background border border-border flex items-center justify-center text-[10px]" title={badge.name}>
                                {badge.icon}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                          <span>{t('common:labels.level')} {user.level}</span>
                          <span className="w-1 h-1 rounded-full bg-border" />
                          <span>{user.challengesCompleted} {t('leaderboard:table.challenges')}</span>
                        </div>
                      </div>

                      {/* XP */}
                      <div className="flex-none text-right">
                        <div className="font-black text-primary">
                          {((period === 'monthly' ? user.monthlyXp : user.xp) || 0).toLocaleString()} <span className="text-xs text-muted-foreground font-medium">XP</span>
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
                    <div className="mt-8 text-center p-8 bg-card/50 backdrop-blur-sm rounded-3xl border border-dashed border-border relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
                      <div className="relative z-10 max-w-md mx-auto space-y-4">
                        <Shield className="h-12 w-12 text-primary mx-auto opacity-50" />
                        <h3 className="text-xl font-bold">{t('leaderboard:gating.title')}</h3>
                        <p className="text-muted-foreground">{t('leaderboard:gating.description')}</p>
                        <Link to="/$locale/login" params={{ locale }} search={{ redirect: '/leaderboard' }}>
                          <Button size="lg" className="rounded-xl px-8 font-bold hover:scale-105 transition-transform">
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

  // Compact styling
  // Rank 1 gets special teal accent, others are more muted
  const accentColor = rank === 1 ? 'text-teal-400' : rank === 2 ? 'text-slate-400' : 'text-amber-700';
  const ringColor = rank === 1 ? 'ring-teal-500' : rank === 2 ? 'ring-slate-400' : 'ring-amber-700';

  const displayName = isAuthenticated
    ? user.name || t('leaderboard:table.anonymous')
    : t('leaderboard:table.hiddenUser');
  const displayAvatar = isAuthenticated ? user.image : null;
  const xpToShow = displayXp !== undefined ? displayXp : user.xp;

  return (
    <div
      data-testid="leaderboard-podium-item"
      className={cn(
        'relative bg-card rounded-3xl p-4 flex flex-row items-center gap-4 transition-all hover:-translate-y-1',
        isCenter ? 'ring-2 ring-teal-500/20 shadow-lg shadow-teal-500/10 min-w-[280px]' : 'border border-border/50 min-w-[240px] opacity-90',
      )}
    >
      {/* Rank Badge */}
      <div className={cn(
        "absolute -top-3 -left-3 h-8 w-8 rounded-full flex items-center justify-center font-black text-sm shadow-sm z-10",
        rank === 1 ? "bg-teal-500 text-black" : "bg-card border border-border text-muted-foreground"
      )}>
        {rank}
      </div>

      {isCenter && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 animate-bounce">
          <Crown className="h-8 w-8 text-teal-400 drop-shadow-[0_0_10px_rgba(45,212,191,0.5)]" />
        </div>
      )}

      {/* Avatar - Compact */}
      <div className={cn(
        "h-16 w-16 rounded-2xl overflow-hidden flex-none",
        rank === 1 ? "ring-2 ring-offset-2 ring-offset-card ring-teal-500" : ""
      )}>
        {displayAvatar ? (
          <img src={displayAvatar} alt={displayName} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-muted flex items-center justify-center text-xl font-bold">
            {isAuthenticated ? (user.name?.[0] || '?') : '?'}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className={cn("font-bold text-lg truncate", !isAuthenticated && "blur-[2px]")}>
          {displayName}
        </div>
        <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
          <span className={cn("font-bold", accentColor)}>{xpToShow.toLocaleString()}</span> XP
        </div>
        {/* Badges */}
        <div className="flex -space-x-1 mt-1">
          {user.badges.slice(0, 2).map((b, i) => (
            <div key={i} className="h-4 w-4 bg-background rounded-full border border-border flex items-center justify-center text-[8px]">
              {b.icon}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[300px] items-end">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-full w-full opacity-30 rounded-3xl" />
        ))}
      </div>
      <Card className="glass-card rounded-3xl border-2">
        <CardContent className="p-6">
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

function LeaderboardError() {
  const { t } = useTranslation(['leaderboard', 'common']);
  return (
    <Card className="glass-card border-2 border-destructive/20 bg-destructive/5">
      <CardContent className="p-12 text-center">
        <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center border-2 border-destructive/20">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">
          {t('common:messages.unavailable')}
        </h3>
        <p className="text-muted-foreground mb-6 text-lg">
          {t('leaderboard:error.description')}
        </p>
        <Button
          variant="outline"
          size="lg"
          className="rounded-xl border-2 hover:bg-background"
          onClick={() => window.location.reload()}
        >
          {t('common:actions.refresh')}
        </Button>
      </CardContent>
    </Card>
  );
}
