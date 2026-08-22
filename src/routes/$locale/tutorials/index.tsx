import { useEffect, useMemo, useState } from 'react';
import { createFileRoute, getRouteApi, Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { z } from 'zod';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  Search,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LearnHeroVisual } from '@/components/rebrand-visuals';
import { omitUndefined } from '@/lib/omit-undefined';
import { useDebounce } from '@/lib/useDebounce';
import { tutorialsListQueryOptions } from '@/lib/tutorials.query';
import { createSeoHead } from '@/lib/seo';
import i18n from '@/lib/i18n';
import { localeParams, LocaleRoutes } from '@/lib/navigation';

const LearnSearchSchema = z.object({
  q: z.string().optional(),
  difficulty: z
    .enum(['all', 'foundations', 'beginner', 'intermediate', 'advanced'])
    .optional(),
  view: z.enum(['grid', 'list']).optional(),
  hideCompleted: z.coerce.boolean().optional(),
});

export const Route = createFileRoute('/$locale/tutorials/')({
  validateSearch: LearnSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, params, deps: search }) =>
    context.queryClient.ensureQueryData(
      tutorialsListQueryOptions({
        locale: params.locale,
        ...omitUndefined({ search: search.q }),
        limit: 50,
      }),
    ),
  component: LearnPage,
  head: ({ params }) => {
    const locale = params.locale || 'en';

    return createSeoHead({
      title: i18n.t('tutorials:learn.seo.title'),
      description: i18n.t('tutorials:learn.seo.description'),
      path: '/tutorials',
      locale,
    });
  },
});

const routeApi = getRouteApi('/$locale/tutorials/');

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

function LearnPage() {
  const { locale } = routeApi.useParams();
  const { t } = useTranslation('tutorials');
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
      ...omitUndefined({ search: q || undefined }),
      limit: 50,
    }),
  );

  const tutorials = (
    tutorialsResponse.success ? tutorialsResponse.data : []
  ) as LessonListItem[];

  const filteredLessons = useMemo(
    () =>
      tutorials.filter((lesson) => {
        if (hideCompleted && lesson.isCompleted) return false;
        if (selectedDifficulty === 'all') return true;
        return lesson.tags.some(
          (tag) => tag.toLowerCase() === selectedDifficulty.toLowerCase(),
        );
      }),
    [tutorials, selectedDifficulty, hideCompleted],
  );

  const heroLabels = {
    inspect: t('learn.visual.inspect'),
    execute: t('learn.visual.execute'),
    verify: t('learn.visual.verify'),
    target: t('learn.visual.target'),
    artifact: t('learn.visual.artifact'),
    result: t('learn.visual.result'),
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-5 pb-20 pt-10 md:px-10 md:pt-16">
        <section
          aria-labelledby="learn-title"
          className="grid items-center gap-8 border-b border-border pb-12 md:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] md:gap-8 md:pb-20"
        >
          <div className="max-w-2xl">
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
              href="#web-automation"
              className="mt-9 inline-flex min-h-11 items-center gap-3 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t('learn.primaryCta')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>

          <LearnHeroVisual
            labels={heroLabels}
            className="md:justify-self-end"
          />
        </section>

        <section
          id="web-automation"
          aria-labelledby="web-automation-title"
          className="scroll-mt-24 pt-14 md:pt-20"
        >
          <div className="grid gap-8 border-b border-border pb-12 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-16 md:pb-16">
            <div>
              <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em]">
                <span className="text-primary">{t('learn.path.eyebrow')}</span>
                <span className="border border-brand-success/35 bg-brand-success/10 px-2 py-1 text-brand-success">
                  {t('learn.path.status')}
                </span>
              </div>
              <h2
                id="web-automation-title"
                className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl"
              >
                {t('learn.path.title')}
              </h2>
            </div>

            <div className="max-w-2xl">
              <p className="text-lg leading-8 text-foreground">
                {t('learn.path.description')}
              </p>
              <a
                href="#web-automation-lessons"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                {t('learn.path.cta')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div id="web-automation-lessons" className="scroll-mt-24 pt-10">
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
                  to={LocaleRoutes.challenges}
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
                  onClick={() =>
                    updateSearch({ hideCompleted: !hideCompleted })
                  }
                  className="h-10 justify-start rounded-md border-border bg-card px-3 shadow-none hover:bg-accent hover:text-accent-foreground sm:justify-center"
                >
                  {hideCompleted ? (
                    <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                  ) : (
                    <Circle className="mr-2 h-4 w-4 text-muted-foreground" />
                  )}
                  {t('filters.hideCompleted')}
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
                <Badge
                  key={difficulty}
                  variant={
                    selectedDifficulty === difficulty ? 'default' : 'outline'
                  }
                  className="cursor-pointer rounded-md px-3 py-1 font-mono text-[10px] uppercase tracking-[0.08em]"
                  onClick={() =>
                    updateSearch({
                      difficulty:
                        selectedDifficulty === difficulty ? 'all' : difficulty,
                    })
                  }
                >
                  {t(`filters.${difficulty}`)}
                </Badge>
              ))}
            </div>

            {filteredLessons.length === 0 ? (
              <div className="border-y border-dashed border-border py-14 text-center">
                <BookOpen className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
                <h4 className="text-lg font-semibold text-foreground">
                  {t('learn.lessons.noResults')}
                </h4>
                <p className="mt-2 text-sm text-muted-foreground">
                  {q
                    ? t('learn.lessons.tryDifferentSearch')
                    : t('learn.lessons.checkBackSoon')}
                </p>
              </div>
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
          </div>
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
      to="/$locale/tutorials/$slug"
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
