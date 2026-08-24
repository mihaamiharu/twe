import { useMemo } from 'react';
import { createFileRoute, getRouteApi, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  Search,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  LearningPathPreview,
  type LearningPathPreviewKind,
} from '@/components/learning-path-preview';
import { tutorialsListQueryOptions } from '@/lib/tutorials.query';
import { authQueryOptions } from '@/lib/auth.query';
import { createSeoHead } from '@/lib/seo';
import i18n from '@/lib/i18n';
import { localeParams, LocaleRoutes } from '@/lib/navigation';
import { filterLearnCatalog } from '@/lib/learn-catalog';
import { LearnSearchSchema, type LearnSearch } from '@/lib/learn-search';
import type { TutorialCatalogListItemWithOverlay } from '@/lib/catalog-overlays';

export { LearnSearchSchema } from '@/lib/learn-search';

export const Route = createFileRoute('/$locale/learn/')({
  validateSearch: LearnSearchSchema,
  loader: async ({ context, params }) => {
    const auth = await context.queryClient.ensureQueryData(authQueryOptions);

    return context.queryClient.ensureQueryData(
      tutorialsListQueryOptions({
        locale: params.locale,
        viewerId: auth.user?.id,
      }),
    );
  },
  component: LearnPage,
  pendingComponent: LearnCatalogSkeleton,
  head: ({ params }) => {
    const locale = params.locale || 'en';

    return createSeoHead({
      title: i18n.t('tutorials:learn.seo.title', { lng: locale }),
      description: i18n.t('tutorials:learn.seo.description', { lng: locale }),
      path: '/learn',
      locale,
    });
  },
});

const routeApi = getRouteApi('/$locale/learn/');

interface LearningPathStep {
  number: string;
  kind: LearningPathPreviewKind;
  label: string;
  title: string;
  description: string;
  slug?: string;
}

function LearnCatalogSkeleton() {
  return (
    <main
      className="min-h-screen bg-background"
      aria-busy="true"
      data-testid="learn-loading"
    >
      <div className="mx-auto max-w-7xl space-y-8 px-5 pb-20 pt-10 md:px-10 md:pt-16">
        <div className="space-y-4 border-b border-border pb-12">
          <div className="h-3 w-28 animate-pulse rounded bg-muted" />
          <div className="h-14 max-w-2xl animate-pulse rounded bg-muted" />
          <div className="h-5 max-w-xl animate-pulse rounded bg-muted" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-56 animate-pulse rounded-xl border border-border bg-card"
            />
          ))}
        </div>
      </div>
    </main>
  );
}

function LearnPage() {
  const { locale } = routeApi.useParams();
  const { t } = useTranslation('tutorials');
  const { data: auth } = useQuery(authQueryOptions);
  const navigate = routeApi.useNavigate();
  const searchParams = routeApi.useSearch();
  const tutorialsResponse = routeApi.useLoaderData();
  const query = searchParams.q ?? '';
  const canFilterCompleted = Boolean(auth?.user);
  const hideCompleted = canFilterCompleted
    ? (searchParams.hideCompleted ?? false)
    : false;

  const updateSearch = (updates: LearnSearch) => {
    void navigate({
      to: '.',
      search: (previous) => {
        const next = { ...previous, ...updates };
        for (const key of Object.keys(next) as Array<keyof LearnSearch>) {
          if (next[key] === undefined) delete next[key];
        }
        return next;
      },
      replace: true,
    });
  };

  const clearFilters = () => {
    void navigate({ to: '.', search: {}, replace: true });
  };

  const filteredLessons = useMemo(() => {
    if (!tutorialsResponse.success) return [];

    return filterLearnCatalog(tutorialsResponse.data, {
      query,
      hideCompleted,
    });
  }, [hideCompleted, query, tutorialsResponse]);

  const hasActiveFilters = Boolean(query.trim() || hideCompleted);

  const learningPathSteps: LearningPathStep[] = [
    {
      number: '01',
      kind: 'understand',
      label: t('learn.stack.steps.understand.label'),
      title: t('learn.stack.steps.understand.title'),
      description: t('learn.stack.steps.understand.description'),
      slug: 'dom-tree-hierarchy',
    },
    {
      number: '02',
      kind: 'build',
      label: t('learn.stack.steps.build.label'),
      title: t('learn.stack.steps.build.title'),
      description: t('learn.stack.steps.build.description'),
      slug: 'javascript-fundamentals-for-qa',
    },
    {
      number: '03',
      kind: 'automate',
      label: t('learn.stack.steps.automate.label'),
      title: t('learn.stack.steps.automate.title'),
      description: t('learn.stack.steps.automate.description'),
      slug: 'playwright-interaction-fundamentals',
    },
    {
      number: '04',
      kind: 'practice',
      label: t('learn.stack.steps.practice.label'),
      title: t('learn.stack.steps.practice.title'),
      description: t('learn.stack.steps.practice.description'),
    },
  ];

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-5 pb-20 pt-10 md:px-10 md:pt-16">
        <section
          id="learning-stack"
          aria-labelledby="learn-title"
          className="grid gap-12 border-b border-border pb-12 md:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] md:gap-14 md:pb-20"
        >
          <div className="max-w-2xl md:pt-10">
            <div className="mb-6 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
              <span>{t('learn.eyebrow')}</span>
              <span className="h-px w-10 bg-border" aria-hidden="true" />
              <span className="text-muted-foreground">
                {t('learn.eyebrowNote')}
              </span>
            </div>

            <h1
              id="learn-title"
              className="max-w-xl text-4xl font-semibold tracking-[-0.045em] text-foreground sm:text-5xl md:text-6xl md:leading-[1.02]"
            >
              {t('learn.title')}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              {t('learn.description')}
            </p>

            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
              {(
                ['webFundamentals', 'handsOnPractice', 'builtForQa'] as const
              ).map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {t(`learn.metadata.${item}`)}
                </span>
              ))}
            </div>

            <a
              href="#web-automation-lessons"
              className="mt-9 inline-flex min-h-11 items-center gap-3 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t('learn.primaryCta')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>

          <div className="relative md:pt-2">
            <div className="flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
              <span>{t('learn.stack.note')}</span>
              <span className="h-px flex-1 bg-border" aria-hidden="true" />
              <span
                className="h-1.5 w-1.5 rounded-full bg-primary"
                aria-hidden="true"
              />
            </div>

            <div
              data-testid="learning-path"
              className="relative mt-8 space-y-3 md:pl-10"
            >
              <div
                className="absolute bottom-8 left-3 top-8 hidden border-l border-dashed border-[var(--brand-orange)]/45 md:block"
                aria-hidden="true"
              />
              {learningPathSteps.map((step, index) => (
                <LearningPathCard
                  key={step.number}
                  step={step}
                  index={index}
                  locale={locale}
                  totalSteps={learningPathSteps.length}
                />
              ))}
            </div>
          </div>
        </section>

        <section
          id="web-automation-lessons"
          className="scroll-mt-24 pt-14 md:pt-20"
          aria-labelledby="lesson-catalog-title"
        >
          <div className="flex flex-col gap-6 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
                {t('learn.lessons.eyebrow')}
              </p>
              <h2
                id="lesson-catalog-title"
                className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-foreground sm:text-3xl"
              >
                {t('learn.lessons.title')}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                {t('learn.lessons.description')}
              </p>
              <Link
                to={LocaleRoutes.practice}
                params={localeParams(locale)}
                className="mt-3 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t('learn.lessons.practiceLink')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[34rem]">
              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="relative min-w-0 flex-1">
                  <span className="sr-only">
                    {t('learn.lessons.searchLabel')}
                  </span>
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    placeholder={t('learn.lessons.searchPlaceholder')}
                    value={query}
                    onChange={(event) =>
                      updateSearch({ q: event.target.value || undefined })
                    }
                    className="h-11 rounded-md border-border bg-card pl-9 pr-9 shadow-none"
                    data-testid="learn-search"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => updateSearch({ q: undefined })}
                      className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={t('learn.lessons.clearSearch')}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </label>
                {canFilterCompleted && (
                  <Button
                    variant="outline"
                    aria-pressed={hideCompleted}
                    onClick={() =>
                      updateSearch({
                        hideCompleted: hideCompleted ? undefined : true,
                      })
                    }
                    className="h-11 justify-start rounded-md border-border bg-card px-3 shadow-none hover:bg-accent hover:text-accent-foreground sm:justify-center"
                    data-testid="learn-completion-filter"
                  >
                    {hideCompleted ? (
                      <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                    ) : (
                      <Circle className="mr-2 h-4 w-4 text-muted-foreground" />
                    )}
                    {t(
                      hideCompleted
                        ? 'filters.showAll'
                        : 'filters.showRemaining',
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              {t('learn.lessons.results', { count: filteredLessons.length })}
            </p>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-9 px-2 text-muted-foreground"
                data-testid="learn-clear-filters"
              >
                <X aria-hidden="true" />
                {t('filters.clear')}
              </Button>
            )}
          </div>

          {!tutorialsResponse.success ? (
            <LearnCatalogError />
          ) : filteredLessons.length === 0 ? (
            <EmptyState
              size="compact"
              className="border-b border-dashed border-border"
              eyebrow={t('learn.lessons.emptyEyebrow')}
              title={t('learn.lessons.noResults')}
              description={
                hasActiveFilters
                  ? t('learn.lessons.tryDifferentSearch')
                  : t('learn.lessons.checkBackSoon')
              }
              action={
                hasActiveFilters ? (
                  <Button type="button" onClick={clearFilters}>
                    {t('filters.clear')}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div
              id="lesson-results"
              data-testid="learn-results"
              data-view-mode="list"
              className="divide-y divide-border border-t border-border pt-5"
            >
              {filteredLessons.map((lesson) => (
                <LessonRow key={lesson.slug} lesson={lesson} locale={locale} />
              ))}
            </div>
          )}
        </section>

        <aside className="mt-14 border-y border-border py-7 md:mt-20 md:flex md:items-center md:justify-between md:gap-10">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
              {t('learn.future.eyebrow')}
            </p>
            <p className="mt-2 text-lg font-medium text-foreground">
              {t('learn.future.title')}
            </p>
          </div>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground md:mt-0">
            {t('learn.future.description')}
          </p>
        </aside>
      </div>
    </main>
  );
}

function LearnCatalogError() {
  const { t } = useTranslation('tutorials');

  return (
    <div
      className="border-b border-dashed border-border py-12 text-center"
      role="alert"
      data-testid="learn-error"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-destructive">
        {t('learn.lessons.errorEyebrow')}
      </p>
      <h3 className="mt-2 text-xl font-semibold text-foreground">
        {t('learn.lessons.errorTitle')}
      </h3>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
        {t('learn.lessons.errorDescription')}
      </p>
    </div>
  );
}

function LearningPathCard({
  step,
  index,
  locale,
  totalSteps,
}: {
  step: LearningPathStep;
  index: number;
  locale: string;
  totalSteps: number;
}) {
  const { t } = useTranslation('tutorials');
  const cardContent = (
    <div
      data-testid={`learning-path-step-${step.number}`}
      className="group relative grid gap-4 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/45 hover:bg-accent/20 sm:grid-cols-[minmax(150px,0.62fr)_minmax(0,1.38fr)] sm:gap-5 sm:p-4"
    >
      <span
        className="absolute -left-[2.125rem] top-1/2 hidden h-3 w-3 -translate-y-1/2 rounded-full border-2 border-[var(--brand-orange)] bg-[var(--warm-canvas)] md:block"
        aria-hidden="true"
      />
      <LearningPathPreview kind={step.kind} className="min-h-[116px]" />
      <div className="flex min-w-0 flex-col justify-center py-1 sm:py-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-primary">
          {step.label}
        </p>
        <h3 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-foreground">
          {step.title}
        </h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {step.description}
        </p>
        <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
          {index === totalSteps - 1
            ? t('learn.stack.cardPractice')
            : t('learn.stack.cardLesson')}
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        </span>
      </div>
    </div>
  );

  if (step.slug) {
    return (
      <Link
        to="/$locale/learn/$slug"
        params={{ locale, slug: step.slug }}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <Link
      to={LocaleRoutes.practice}
      params={localeParams(locale)}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {cardContent}
    </Link>
  );
}

function LessonMeta({
  lesson,
}: {
  lesson: TutorialCatalogListItemWithOverlay;
}) {
  const { t } = useTranslation('tutorials');

  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
        {t('card.estimatedTimeShort', { minutes: lesson.estimatedMinutes })}
      </span>
      {lesson.tags.map((tag) => (
        <span key={tag} className="rounded bg-muted px-1.5 py-1">
          {tag}
        </span>
      ))}
      {lesson.readingProgress > 0 && !lesson.isCompleted && (
        <span className="text-primary">
          {t('card.progress', { progress: lesson.readingProgress })}
        </span>
      )}
    </div>
  );
}

function LessonStatus({
  lesson,
}: {
  lesson: TutorialCatalogListItemWithOverlay;
}) {
  const { t } = useTranslation('tutorials');

  if (!lesson.isCompleted) return null;

  return (
    <Badge className="gap-1 rounded-md border-brand-success/25 bg-brand-success/10 px-2 py-0.5 text-[10px] text-brand-success hover:bg-brand-success/10">
      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
      {t('card.completed')}
    </Badge>
  );
}

function LessonRow({
  lesson,
  locale,
}: {
  lesson: TutorialCatalogListItemWithOverlay;
  locale: string;
}) {
  return (
    <Link
      to="/$locale/learn/$slug"
      params={{ locale, slug: lesson.slug }}
      className="group grid gap-4 border-b border-border py-5 transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-start sm:gap-6"
      data-testid="lesson-row"
      data-completed={lesson.isCompleted}
    >
      <span className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground">
        {String(lesson.order).padStart(2, '0')}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-lg font-semibold tracking-[-0.015em] text-foreground transition-colors group-hover:text-primary">
            {lesson.title}
          </h3>
          <LessonStatus lesson={lesson} />
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          {lesson.description}
        </p>
        <LessonMeta lesson={lesson} />
      </div>
      <ArrowRight
        className="hidden h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary sm:mt-1 sm:block"
        aria-hidden="true"
      />
    </Link>
  );
}

export default LearnPage;
