import { useEffect, useMemo, useRef, useState } from 'react';
import { createFileRoute, getRouteApi, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  List,
  LockKeyhole,
} from 'lucide-react';
import { toast } from 'sonner';
import { completeTutorial } from '@/server/tutorials.fn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { AuthGuardDialog } from '@/components/auth/auth-guard-dialog';
import { NotFound } from '@/components/not-found';
import {
  TableOfContents,
  type TOCItem,
} from '@/components/tutorials/table-of-contents';
import { showAchievementToasts } from '@/components/achievement-toast';
import { authQueryOptions } from '@/lib/auth.query';
import {
  tutorialCatalogQueryKeys,
  type TutorialDetailResponse,
  tutorialDetailQueryOptions,
} from '@/lib/tutorials.query';
import {
  createLearnDetailSeoHead,
  createLearnFallbackSeoHead,
} from '@/lib/learn-seo';

export const Route = createFileRoute('/$locale/learn/$slug')({
  loader: async ({ context, params }) => {
    const auth = await context.queryClient.ensureQueryData(authQueryOptions);
    const response = await context.queryClient.ensureQueryData(
      tutorialDetailQueryOptions(params.slug, params.locale, auth.user?.id),
    );

    return response;
  },
  component: TutorialDetailPage,
  pendingComponent: LessonDetailSkeleton,
  head: ({ loaderData, params }) => {
    const locale = params.locale || 'en';

    if (!loaderData?.success) {
      return createLearnFallbackSeoHead({ locale, slug: params.slug });
    }

    return createLearnDetailSeoHead({
      lesson: loaderData.data,
      locale,
    });
  },
});

const routeApi = getRouteApi('/$locale/learn/$slug');
type TutorialDetail = Extract<
  TutorialDetailResponse,
  { success: true }
>['data'];

function LessonDetailSkeleton() {
  return (
    <main
      className="min-h-screen bg-background"
      aria-busy="true"
      data-testid="lesson-loading"
    >
      <div className="mx-auto max-w-6xl space-y-8 px-5 pb-20 pt-10 md:px-10 md:pt-16">
        <Skeleton className="h-5 w-40" />
        <div className="space-y-4 border-b border-border pb-12">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-16 w-4/5" />
          <Skeleton className="h-6 w-3/5" />
        </div>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-5">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-6 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </main>
  );
}

function TutorialDetailPage() {
  const response = routeApi.useLoaderData();

  if (!response.success) {
    if (response.error === 'Tutorial not found') return <NotFound />;
    return <TutorialDetailError message={response.error} />;
  }

  return <TutorialDetailContent tutorial={response.data} />;
}

function TutorialDetailError({ message }: { message: string }) {
  const { locale } = routeApi.useParams();
  const { t } = useTranslation(['tutorials', 'common']);

  return (
    <main className="min-h-screen bg-background px-5 py-10 md:px-10 md:py-16">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/$locale/learn"
          params={{ locale }}
          className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold text-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('common:actions.backToLearn')}
        </Link>
        <div
          className="mt-12 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center"
          role="alert"
        >
          <AlertCircle
            className="mx-auto h-10 w-10 text-destructive"
            aria-hidden="true"
          />
          <h1 className="mt-4 text-2xl font-semibold text-foreground">
            {t('learn.detailError.title')}
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
            {message || t('learn.detailError.description')}
          </p>
          <Button asChild className="mt-6">
            <Link to="/$locale/learn" params={{ locale }}>
              {t('common:actions.browseLessons')}
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

function TutorialDetailContent({ tutorial }: { tutorial: TutorialDetail }) {
  const { locale, slug } = routeApi.useParams();
  const { t } = useTranslation(['tutorials', 'common', 'auth']);
  const { data: auth } = useSuspenseQuery(authQueryOptions);
  const userId = auth.user?.id;
  const queryClient = useQueryClient();
  const contentRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(tutorial.userProgress?.readingProgress ?? 0);
  const hasScrolledRef = useRef(false);
  const [readingProgress, setReadingProgress] = useState(
    tutorial.userProgress?.readingProgress ?? 0,
  );
  const [isCompleted, setIsCompleted] = useState(
    tutorial.userProgress?.isCompleted ?? false,
  );
  const [showAuthGuard, setShowAuthGuard] = useState(false);
  const [activeId, setActiveId] = useState('');

  const markCompleteMutation = useMutation({
    mutationFn: async () => {
      const result = await completeTutorial({ data: { slug, locale } });
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: async (result) => {
      setIsCompleted(true);
      setReadingProgress(100);
      progressRef.current = 100;
      toast.success(t('toasts.completed'));

      await queryClient.invalidateQueries({
        queryKey: tutorialCatalogQueryKeys.detail(slug, locale, userId),
      });
      await queryClient.invalidateQueries({
        queryKey: tutorialCatalogQueryKeys.list(locale, userId),
      });
      await queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await queryClient.invalidateQueries({ queryKey: ['leaderboard'] });

      if (result.data?.newAchievements?.length) {
        showAchievementToasts(result.data.newAchievements);
      }
    },
    onError: () => {
      toast.error(t('toasts.failed'));
    },
  });

  const toc = useMemo<TOCItem[]>(() => {
    const items: TOCItem[] = [];
    let inCodeBlock = false;

    for (const line of tutorial.content.split('\n')) {
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) continue;

      const match = line.match(/^(##|###)\s+(.+)$/);
      if (!match?.[1] || !match[2]) continue;

      items.push({
        id: slugifyHeading(match[2]),
        text: match[2],
        level: match[1] === '##' ? 2 : 3,
      });
    }

    return items;
  }, [tutorial.content]);

  const displayProgress = isCompleted ? 100 : readingProgress;

  useEffect(() => {
    progressRef.current = readingProgress;
  }, [readingProgress]);

  useEffect(() => {
    setReadingProgress(tutorial.userProgress?.readingProgress ?? 0);
    progressRef.current = tutorial.userProgress?.readingProgress ?? 0;
    setIsCompleted(tutorial.userProgress?.isCompleted ?? false);
    hasScrolledRef.current = false;
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  }, [
    tutorial.slug,
    tutorial.userProgress?.isCompleted,
    tutorial.userProgress?.readingProgress,
  ]);

  useEffect(() => {
    if (!userId || isCompleted) return;

    const handleScroll = () => {
      const element = contentRef.current;
      if (!element) return;

      if (!hasScrolledRef.current) {
        if (window.scrollY <= 50) return;
        hasScrolledRef.current = true;
      }

      const rect = element.getBoundingClientRect();
      const totalHeight = Math.max(element.offsetHeight, 1);
      const visibleDistance = Math.max(0, window.innerHeight - rect.top - 100);
      let nextProgress = Math.min(
        100,
        Math.round((visibleDistance / totalHeight) * 100),
      );

      if (rect.bottom <= window.innerHeight + 100) nextProgress = 100;

      if (nextProgress > progressRef.current) {
        progressRef.current = nextProgress;
        setReadingProgress(nextProgress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isCompleted, tutorial.slug, userId]);

  useEffect(() => {
    const element = contentRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: '-100px 0px -66% 0px' },
    );
    element
      .querySelectorAll('h2, h3')
      .forEach((heading) => observer.observe(heading));

    return () => observer.disconnect();
  }, [tutorial.content]);

  const handleComplete = () => {
    if (!userId) {
      setShowAuthGuard(true);
      return;
    }
    if (displayProgress < 100 || markCompleteMutation.isPending) return;
    markCompleteMutation.mutate();
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-5 pb-20 pt-8 md:px-10 md:pt-12">
        <nav
          aria-label={t('detail.breadcrumbLabel')}
          className="flex min-w-0 items-center gap-2 overflow-hidden font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground"
        >
          <Link
            to="/$locale/learn"
            params={{ locale }}
            className="shrink-0 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t('common:navigation.learn')}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="truncate text-foreground" aria-current="page">
            {tutorial.title}
          </span>
        </nav>

        <Link
          to="/$locale/learn"
          params={{ locale }}
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold text-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('common:actions.backToLearn')}
        </Link>

        <header className="max-w-4xl border-b border-border pb-10 pt-8 md:pb-14 md:pt-12">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
            <span>{t('learn.eyebrow')}</span>
            <span className="h-px w-8 bg-border" aria-hidden="true" />
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {t('card.estimatedTime', {
                minutes: tutorial.estimatedMinutes,
              })}
            </span>
          </div>
          <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-0.05em] text-foreground sm:text-5xl md:text-6xl">
            {tutorial.title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
            {tutorial.description}
          </p>
          <div
            className="mt-6 flex flex-wrap gap-2"
            aria-label={t('detail.tagsLabel')}
          >
            {tutorial.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="rounded-md border-border bg-card font-mono text-[10px] uppercase tracking-[0.08em]"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </header>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <article
            ref={contentRef}
            aria-label={t('detail.contentLabel')}
            className="min-w-0"
          >
            <MarkdownRenderer content={tutorial.content} />
            <LessonNavigation
              locale={locale}
              previousTutorial={tutorial.previousTutorial}
              nextTutorial={tutorial.nextTutorial}
            />
          </article>

          <aside className="order-first space-y-5 lg:order-none lg:sticky lg:top-24">
            <Card data-testid="reading-progress">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span
                    className="h-2 w-2 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                  {t('sidebar.progress')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2" aria-live="polite">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-muted-foreground">
                      {t('sidebar.reading')}
                    </span>
                    <span className="font-mono font-semibold text-primary">
                      {displayProgress}%
                    </span>
                  </div>
                  <Progress
                    value={displayProgress}
                    className="h-2"
                    aria-label={t('sidebar.readingProgress', {
                      progress: displayProgress,
                    })}
                  />
                </div>

                {!isCompleted ? (
                  <Button
                    className="w-full whitespace-normal text-center"
                    onClick={handleComplete}
                    disabled={
                      markCompleteMutation.isPending ||
                      (Boolean(userId) && displayProgress < 100)
                    }
                    data-testid="complete-tutorial"
                  >
                    {!userId && <LockKeyhole aria-hidden="true" />}
                    {markCompleteMutation.isPending
                      ? t('common:messages.saving')
                      : !userId
                        ? t('auth:guard.title')
                        : displayProgress < 100
                          ? t('sidebar.readToComplete')
                          : t('sidebar.completeAndContinue')}
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 rounded-md border border-brand-success/30 bg-brand-success/10 p-4 text-brand-success">
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                    <span className="text-sm font-semibold">
                      {t('sidebar.completedTitle')}
                    </span>
                  </div>
                )}

                <div className="space-y-3 border-t border-border pt-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" aria-hidden="true" />
                      {t('sidebar.duration')}
                    </span>
                    <span className="font-medium">
                      {t('card.estimatedTimeShort', {
                        minutes: tutorial.estimatedMinutes,
                      })}
                    </span>
                  </div>
                  {isCompleted && (
                    <div className="flex items-center gap-2 text-brand-success">
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      <span className="font-medium">
                        {t('sidebar.statusCompleted')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {toc.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <List className="h-4 w-4 text-primary" aria-hidden="true" />
                    {t('detail.tocTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TableOfContents
                    headers={toc}
                    activeId={activeId}
                    showTitle={false}
                  />
                </CardContent>
              </Card>
            )}

            {tutorial.relatedChallenges.length > 0 &&
              tutorial.challenges.length > 0 && (
                <Card
                  className="border-primary/20"
                  data-testid="related-practice-links"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BookOpen
                        className="h-4 w-4 text-primary"
                        aria-hidden="true"
                      />
                      {t('sidebar.challengesTitle')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm leading-6 text-muted-foreground">
                      {t('sidebar.challengesDescription')}
                    </p>
                    {tutorial.challenges.map((challenge) => (
                      <Link
                        key={challenge.slug}
                        to="/$locale/practice/$slug"
                        params={{ locale, slug: challenge.slug }}
                        className="block rounded-lg border border-border p-3 transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="block font-medium text-foreground">
                          {challenge.title}
                        </span>
                        <span className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{challenge.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>{challenge.xpReward} XP</span>
                        </span>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}
          </aside>
        </div>
      </div>

      <AuthGuardDialog
        open={showAuthGuard}
        onOpenChange={setShowAuthGuard}
        title={t('auth:guard.title')}
        description={t('auth:guard.description')}
      />
    </main>
  );
}

function LessonNavigation({
  locale,
  previousTutorial,
  nextTutorial,
}: {
  locale: string;
  previousTutorial: TutorialDetail['previousTutorial'];
  nextTutorial: TutorialDetail['nextTutorial'];
}) {
  const { t } = useTranslation(['tutorials', 'common']);

  return (
    <nav
      aria-label={t('detail.lessonNavigationLabel')}
      className="mt-12 grid gap-3 border-t border-border pt-6 sm:grid-cols-2"
    >
      {previousTutorial ? (
        <Button
          asChild
          variant="outline"
          className="h-auto min-h-16 justify-start whitespace-normal p-4 text-left"
        >
          <Link
            to="/$locale/learn/$slug"
            params={{ locale, slug: previousTutorial.slug }}
          >
            <ArrowLeft className="mr-2 shrink-0" aria-hidden="true" />
            <span>
              <span className="block text-xs font-normal text-muted-foreground">
                {t('common:actions.previous')}
              </span>
              <span className="mt-1 block">{previousTutorial.title}</span>
            </span>
          </Link>
        </Button>
      ) : (
        <Button
          asChild
          variant="outline"
          className="h-auto min-h-16 justify-start p-4"
        >
          <Link to="/$locale/learn" params={{ locale }}>
            <ArrowLeft className="mr-2" aria-hidden="true" />
            {t('common:actions.backToLearn')}
          </Link>
        </Button>
      )}

      {nextTutorial && (
        <Button
          asChild
          className="h-auto min-h-16 justify-between whitespace-normal p-4 text-right"
        >
          <Link
            to="/$locale/learn/$slug"
            params={{ locale, slug: nextTutorial.slug }}
          >
            <span>
              <span className="block text-xs font-normal text-primary-foreground/70">
                {t('common:actions.next')}
              </span>
              <span className="mt-1 block">{nextTutorial.title}</span>
            </span>
            <ArrowRight className="ml-2 shrink-0" aria-hidden="true" />
          </Link>
        </Button>
      )}
    </nav>
  );
}

function slugifyHeading(text: string): string {
  return text.toLowerCase().replace(/[^\w]+/g, '-');
}
