import { useEffect, useMemo, useState } from 'react';
import { createFileRoute, getRouteApi, Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { ArrowRight, CheckCircle2, Circle, Clock, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  LearningPathPreview,
  type LearningPathPreviewKind,
} from '@/components/learning-path-preview';
import { useDebounce } from '@/lib/useDebounce';
import { tutorialsListQueryOptions } from '@/lib/tutorials.query';
import { authQueryOptions } from '@/lib/auth.query';
import { createSeoHead } from '@/lib/seo';
import i18n from '@/lib/i18n';
import { localeParams, LocaleRoutes } from '@/lib/navigation';
import { cn } from '@/lib/utils';

const LearnSearchSchema = z.object({
  q: z.string().optional(),
  difficulty: z
    .enum(['all', 'foundations', 'beginner', 'intermediate', 'advanced'])
    .optional(),
  view: z.enum(['grid', 'list']).optional(),
  hideCompleted: z.coerce.boolean().optional(),
});

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

interface LessonListItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  tags: string[];
  isCompleted: boolean;
  readingProgress: number;
}

interface LearningPathStep {
  number: string;
  kind: LearningPathPreviewKind;
  label: string;
  title: string;
  description: string;
  slug?: string;
}

function LearnPage() {
  const { locale } = routeApi.useParams();
  const { t } = useTranslation('tutorials');
  const { data: auth } = useSuspenseQuery(authQueryOptions);
  const navigate = routeApi.useNavigate();
  const searchParams = routeApi.useSearch();
  const q = searchParams.q;
  const selectedDifficulty = searchParams.difficulty || 'all';
  const hideCompleted = searchParams.hideCompleted ?? false;
  const [searchInput, setSearchInput] = useState(q ?? '');
  const debouncedSearchQuery = useDebounce(searchInput, 300);

  const updateSearch = (
    updates: Partial<z.infer<typeof LearnSearchSchema>>,
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

  const { data: tutorialsResponse } = useSuspenseQuery(
    tutorialsListQueryOptions({
      locale,
      viewerId: auth.user?.id,
    }),
  );

  const tutorials = tutorialsResponse.success ? tutorialsResponse.data : [];
  const normalizedSearchQuery = searchInput.trim().toLocaleLowerCase();

  const filteredLessons = useMemo(
    () =>
      tutorials.filter((lesson) => {
        if (
          normalizedSearchQuery &&
          ![lesson.title, lesson.description].some((value) =>
            value.toLocaleLowerCase().includes(normalizedSearchQuery),
          )
        ) {
          return false;
        }
        if (hideCompleted && lesson.isCompleted) return false;
        if (selectedDifficulty === 'all') return true;
        return lesson.tags.some(
          (tag) => tag.toLowerCase() === selectedDifficulty.toLowerCase(),
        );
      }),
    [tutorials, selectedDifficulty, hideCompleted, normalizedSearchQuery],
  );

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
              className="mt-9 inline-flex min-h-11 items-center gap-3 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
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
        >
          <div className="flex flex-col gap-5 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
                {t('learn.lessons.eyebrow')}
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-foreground">
                {t('learn.lessons.title')}
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                {t('learn.lessons.description')}
              </p>
              <Link
                to={LocaleRoutes.practice}
                params={localeParams(locale)}
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                {t('learn.lessons.practiceLink')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <label className="relative min-w-0 flex-1 lg:w-64">
                <span className="sr-only">
                  {t('learn.lessons.searchLabel')}
                </span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('learn.lessons.searchPlaceholder')}
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  className="h-10 rounded-md border-border bg-card pl-9 shadow-none"
                />
              </label>
              <Button
                variant="outline"
                aria-pressed={hideCompleted}
                onClick={() => updateSearch({ hideCompleted: !hideCompleted })}
                className="h-10 justify-start rounded-md border-border bg-card px-3 shadow-none hover:bg-accent hover:text-accent-foreground sm:justify-center"
              >
                {hideCompleted ? (
                  <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                ) : (
                  <Circle className="mr-2 h-4 w-4 text-muted-foreground" />
                )}
                {t(
                  hideCompleted
                    ? 'filters.showCompleted'
                    : 'filters.hideCompleted',
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 py-5">
            {(
              [
                'all',
                'foundations',
                'beginner',
                'intermediate',
                'advanced',
              ] as const
            ).map((difficulty) => (
              <button
                key={difficulty}
                type="button"
                aria-pressed={selectedDifficulty === difficulty}
                className={cn(
                  'inline-flex min-h-9 items-center rounded-md border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  selectedDifficulty === difficulty
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
                onClick={() =>
                  updateSearch({
                    difficulty:
                      selectedDifficulty === difficulty ? 'all' : difficulty,
                  })
                }
              >
                {t(`filters.${difficulty}`)}
              </button>
            ))}
          </div>

          {filteredLessons.length === 0 ? (
            <EmptyState
              size="compact"
              className="border-y border-dashed border-border"
              eyebrow={t('learn.lessons.emptyEyebrow')}
              title={t('learn.lessons.noResults')}
              description={
                searchInput
                  ? t('learn.lessons.tryDifferentSearch')
                  : t('learn.lessons.checkBackSoon')
              }
            />
          ) : (
            <div className="border-t border-border">
              {filteredLessons.map((lesson, index) => (
                <LessonRow
                  key={lesson.slug}
                  lesson={lesson}
                  index={index}
                  locale={locale}
                  completedLabel={t('card.completed')}
                  minutesLabel={t('card.estimatedTimeShort', {
                    minutes: lesson.estimatedMinutes,
                  })}
                />
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
        className="block"
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <Link
      to={LocaleRoutes.practice}
      params={localeParams(locale)}
      className="block"
    >
      {cardContent}
    </Link>
  );
}

function LessonRow({
  lesson,
  index,
  locale,
  completedLabel,
  minutesLabel,
}: {
  lesson: LessonListItem;
  index: number;
  locale: string;
  completedLabel: string;
  minutesLabel: string;
}) {
  return (
    <Link
      to="/$locale/learn/$slug"
      params={{ locale, slug: lesson.slug }}
      className="group grid gap-4 border-b border-border py-5 transition-colors hover:bg-accent/40 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-start sm:gap-6"
    >
      <span className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground">
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h4 className="text-lg font-semibold tracking-[-0.015em] text-foreground transition-colors group-hover:text-primary">
            {lesson.title}
          </h4>
          {lesson.isCompleted && (
            <Badge className="gap-1 rounded-md border-brand-success/25 bg-brand-success/10 px-2 py-0.5 text-[10px] text-brand-success hover:bg-brand-success/10">
              <CheckCircle2 className="h-3 w-3" />
              {completedLabel}
            </Badge>
          )}
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          {lesson.description}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
          {lesson.tags.slice(0, 2).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {minutesLabel}
          </span>
        </div>
      </div>
      <ArrowRight
        className="hidden h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary sm:mt-1 sm:block"
        aria-hidden="true"
      />
    </Link>
  );
}

export default LearnPage;
