import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createFileRoute,
  Link,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, Clock, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AuthGuardDialog } from '@/components/auth/auth-guard-dialog';
import {
  PageContainer,
  PaperSurface,
  SectionHeading,
} from '@/components/cozy-quest';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { showAchievementToasts } from '@/components/achievement-toast';
import {
  TableOfContents,
  type TOCItem,
} from '@/components/tutorials/table-of-contents';
import { TutorialProgressPanel } from '@/components/tutorials/tutorial-progress-panel';
import { authQueryOptions } from '@/lib/auth.query';
import { extractTutorialHeadings } from '@/lib/tutorial-headings';
import i18n from '@/lib/i18n';
import { getTutorial, completeTutorial } from '@/server/tutorials.fn';

export const Route = createFileRoute('/$locale/tutorials/$slug')({
  component: TutorialDetailPage,
  head: ({ params }) => {
    const slug = params.slug;
    const locale = params.locale || 'en';
    const baseUrl = 'https://testingwithekki.com';
    const url = `${baseUrl}/${locale}/tutorials/${slug}`;
    const title = slug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (character) => character.toUpperCase());
    const description = i18n.t('tutorials:page.seo.description');
    const ogImageUrl = `https://testingwithekki.com/api/og?title=${encodeURIComponent(title)}&type=Tutorial`;
    const jsonLd = [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${baseUrl}/${locale}`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Tutorials',
            item: `${baseUrl}/${locale}/tutorials`,
          },
          { '@type': 'ListItem', position: 3, name: title, item: url },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: title,
        description,
        image: ogImageUrl,
        author: {
          '@type': 'Organization',
          name: 'TestingWithEkki',
          url: baseUrl,
        },
        publisher: {
          '@type': 'Organization',
          name: 'TestingWithEkki',
          logo: { '@type': 'ImageObject', url: `${baseUrl}/logo-dark-new.png` },
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      },
    ];

    return {
      meta: [
        { title: `${title} | TestingWithEkki` },
        { name: 'description', content: description },
        { property: 'og:title', content: `${title} | TestingWithEkki` },
        { property: 'og:description', content: description },
        { property: 'og:url', content: url },
        { property: 'og:image', content: ogImageUrl },
        { property: 'twitter:card', content: 'summary_large_image' },
        { property: 'twitter:image', content: ogImageUrl },
      ],
      links: [
        { rel: 'canonical', href: url },
        {
          rel: 'alternate',
          hrefLang: 'en',
          href: `${baseUrl}/en/tutorials/${slug}`,
        },
        {
          rel: 'alternate',
          hrefLang: 'id',
          href: `${baseUrl}/id/tutorials/${slug}`,
        },
        {
          rel: 'alternate',
          hrefLang: 'x-default',
          href: `${baseUrl}/en/tutorials/${slug}`,
        },
      ],
      scripts: jsonLd.map((data) => ({
        type: 'application/ld+json',
        children: JSON.stringify(data),
      })),
    };
  },
});

interface Tutorial {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  estimatedMinutes: number;
  tags: string[] | null;
  userProgress: {
    isCompleted: boolean;
    readingProgress: number | null;
    lastAccessedAt: Date;
  } | null;
  nextTutorial: { slug: string; title: string } | null;
  challenges: Array<{
    slug: string;
    title: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    type: string;
    xpReward: number;
    category: string | null;
  }>;
}

function TutorialDetailPage() {
  const { locale, slug } = useParams({ from: '/$locale/tutorials/$slug' });
  const { t } = useTranslation(['tutorials', 'common', 'challenges', 'auth']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [readingProgress, setReadingProgress] = useState(0);
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const [showAuthGuard, setShowAuthGuard] = useState(false);
  const [activeId, setActiveId] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const hasScrolledRef = useRef(false);
  const { data: sessionData } = useSuspenseQuery(authQueryOptions);

  const {
    data: tutorialData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['tutorial', locale, slug],
    queryFn: async () => {
      const result = await getTutorial({ data: { slug, locale } });
      if (!result.success) throw new Error(result.error);
      return result.data as Tutorial;
    },
  });

  const tutorial = tutorialData;
  const markCompleteMutation = useMutation({
    mutationFn: async () => {
      const result = await completeTutorial({ data: { slug, locale } });
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: async (result) => {
      toast.success(t('tutorials:toasts.completed'));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tutorial', locale, slug] }),
        queryClient.invalidateQueries({ queryKey: ['tutorials'] }),
        queryClient.invalidateQueries({ queryKey: ['user', 'me'] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] }),
      ]);

      if (result.data?.newAchievements?.length) {
        showAchievementToasts(result.data.newAchievements);
      }
    },
    onError: () => toast.error(t('tutorials:toasts.failed')),
  });

  useEffect(() => {
    progressRef.current = readingProgress;
  }, [readingProgress]);

  useEffect(() => {
    if (tutorial?.userProgress?.isCompleted || !sessionData?.user) return;

    let attached = false;
    const updateProgress = () => {
      const element = contentRef.current;
      if (!element) return;

      if (!hasScrolledRef.current) {
        if (window.scrollY <= 50) return;
        hasScrolledRef.current = true;
      }

      const rect = element.getBoundingClientRect();
      const totalHeight = element.offsetHeight;
      const scrolled = Math.max(0, window.innerHeight - (rect.top + 100));
      let progress = Math.min(100, Math.round((scrolled / totalHeight) * 100));
      if (rect.bottom <= window.innerHeight + 100) progress = 100;

      if (progress > progressRef.current) setReadingProgress(progress);
    };

    const timeout = window.setTimeout(() => {
      hasScrolledRef.current = false;
      window.addEventListener('scroll', updateProgress, { passive: true });
      attached = true;
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      if (attached) window.removeEventListener('scroll', updateProgress);
    };
  }, [sessionData?.user, tutorial?.id, tutorial?.userProgress?.isCompleted]);

  useEffect(() => {
    setReadingProgress(0);
    progressRef.current = 0;
    hasScrolledRef.current = false;
    window.scrollTo(0, 0);
  }, [slug]);

  const toc = useMemo<TOCItem[]>(
    () => (tutorial?.content ? extractTutorialHeadings(tutorial.content) : []),
    [tutorial?.content],
  );

  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: '-100px 0px -66% 0px' },
    );

    contentElement
      .querySelectorAll('h2, h3')
      .forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [tutorial?.content]);

  if (isLoading) {
    return (
      <main className="min-h-screen py-10 sm:py-14">
        <PageContainer width="wide" className="max-w-5xl">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="mt-8 h-72 w-full rounded-[1.25rem]" />
          <Skeleton className="mt-8 h-96 w-full rounded-[1.25rem]" />
        </PageContainer>
      </main>
    );
  }

  if (error || !tutorial) {
    return (
      <main className="min-h-screen py-10 sm:py-14">
        <PageContainer width="narrow">
          <Link to="/$locale/tutorials" params={{ locale }}>
            <Button variant="ghost" className="rounded-xl">
              <ArrowLeft className="mr-2 size-4" aria-hidden="true" />
              {t('common:actions.backToTutorials')}
            </Button>
          </Link>
          <PaperSurface className="mt-6 px-6 py-14 text-center">
            <AlertCircle
              className="mx-auto size-10 text-destructive"
              aria-hidden="true"
            />
            <h1 className="mt-4 font-display text-3xl font-semibold text-foreground">
              {t('tutorials:page.notFound')}
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              {error?.message || t('tutorials:page.notFoundDescription')}
            </p>
          </PaperSurface>
        </PageContainer>
      </main>
    );
  }

  const isCompleted = tutorial.userProgress?.isCompleted || false;
  const displayProgress = isCompleted
    ? 100
    : Math.max(readingProgress, tutorial.userProgress?.readingProgress ?? 0);
  const primaryTag = tutorial.tags?.[0];

  const handleComplete = () => {
    if (!sessionData?.user) {
      setShowAuthGuard(true);
      return;
    }
    if (localSubmitting) return;
    setLocalSubmitting(true);
    markCompleteMutation.mutate(undefined, {
      onSettled: () => setLocalSubmitting(false),
    });
  };

  return (
    <main className="min-h-screen py-8 sm:py-10 lg:py-12">
      <PageContainer width="wide">
        <nav aria-label={t('common:breadcrumbs.label')}>
          <Link
            to="/$locale/tutorials"
            params={{ locale }}
            className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-muted-foreground transition hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t('common:actions.backToTutorials')}
          </Link>
        </nav>

        <PaperSurface className="relative mt-4 overflow-hidden px-6 py-9 sm:px-10 sm:py-12">
          <div
            aria-hidden="true"
            className="absolute -right-10 -top-12 size-52 rounded-full border-[18px] border-accent/20"
          />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              {primaryTag && <Badge variant="secondary">{primaryTag}</Badge>}
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="size-4" aria-hidden="true" />
                {t('tutorials:card.estimatedTime', {
                  minutes: tutorial.estimatedMinutes,
                })}
              </span>
            </div>
            <SectionHeading
              as="h1"
              align="left"
              eyebrow={t('tutorials:page.readingEyebrow')}
              title={tutorial.title}
              description={tutorial.description}
              className="mt-6"
            />
          </div>
        </PaperSurface>

        {toc.length > 0 && (
          <TableOfContents
            mode="inline"
            headers={toc}
            activeId={activeId}
            className="mt-5 lg:hidden"
          />
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-10">
          <article className="min-w-0 lg:col-span-8">
            <div
              ref={contentRef}
              className="rounded-[1.25rem] border border-border bg-card px-5 py-7 shadow-[0_16px_40px_rgba(73,62,45,0.06)] sm:px-8 sm:py-10 lg:px-10"
            >
              <MarkdownRenderer content={tutorial.content} variant="tutorial" />
            </div>
          </article>

          <aside className="space-y-5 lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
            {toc.length > 0 && (
              <PaperSurface className="hidden p-5 lg:block">
                <TableOfContents headers={toc} activeId={activeId} />
              </PaperSurface>
            )}
            <TutorialProgressPanel
              displayProgress={displayProgress}
              estimatedMinutes={tutorial.estimatedMinutes}
              isCompleted={isCompleted}
              isPending={markCompleteMutation.isPending || localSubmitting}
              onComplete={handleComplete}
              nextTutorial={tutorial.nextTutorial}
              onNext={() => {
                if (!tutorial.nextTutorial) return;
                void navigate({
                  to: '/$locale/tutorials/$slug',
                  params: { locale, slug: tutorial.nextTutorial.slug },
                });
              }}
            />

            {tutorial.challenges.length > 0 && (
              <PaperSurface className="p-5">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Sparkles className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="font-display text-xl font-semibold text-foreground">
                      {t('tutorials:sidebar.challengesTitle')}
                    </h2>
                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                      {t('tutorials:sidebar.challengesDescription')}
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-2.5">
                  {tutorial.challenges.map((challenge) => (
                    <Link
                      key={challenge.slug}
                      to="/$locale/challenges/$slug"
                      params={{ locale, slug: challenge.slug }}
                      className="block rounded-xl border border-border bg-background p-3 transition hover:border-primary/45 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-foreground">
                          {challenge.title}
                        </span>
                        <Badge
                          variant={
                            challenge.difficulty === 'EASY'
                              ? 'secondary'
                              : challenge.difficulty === 'MEDIUM'
                                ? 'default'
                                : 'destructive'
                          }
                          className="shrink-0 text-[10px]"
                        >
                          {t(`challenges:difficulty.${challenge.difficulty}`)}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>
                          {t(
                            `challenges:types.${challenge.type.toLowerCase()}`,
                          )}
                        </span>
                        <span className="font-semibold text-primary">
                          +{challenge.xpReward} XP
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </PaperSurface>
            )}
          </aside>
        </div>
      </PageContainer>

      <AuthGuardDialog
        open={showAuthGuard}
        onOpenChange={setShowAuthGuard}
        title={t('auth:guard.title')}
        description={t('auth:guard.description')}
      />
    </main>
  );
}
