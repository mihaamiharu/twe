import { useEffect, useMemo, useState } from 'react';
import { createFileRoute, getRouteApi } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { BookOpen, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  PageContainer,
  PaperSurface,
  SectionHeading,
} from '@/components/cozy-quest';
import { FieldGuideFilters } from '@/components/tutorials/field-guide-filters';
import { TutorialCard } from '@/components/tutorials/tutorial-card';
import { TutorialListRow } from '@/components/tutorials/tutorial-list-row';
import {
  getTutorialStage,
  isTutorialTopic,
  tutorialStages,
  type TutorialListItem,
} from '@/components/tutorials/tutorial-types';
import { useDebounce } from '@/lib/useDebounce';
import i18n from '@/lib/i18n';
import { createSeoHead } from '@/lib/seo';
import { tutorialsListQueryOptions } from '@/lib/tutorials.query';

const TutorialsSearchSchema = z.object({
  q: z.string().optional(),
  difficulty: z
    .enum(['all', 'foundations', 'beginner', 'intermediate', 'advanced'])
    .optional(),
  topic: z.string().optional(),
  view: z.enum(['grid', 'list']).optional(),
  hideCompleted: z.coerce.boolean().optional(),
});

export const Route = createFileRoute('/$locale/tutorials/')({
  validateSearch: TutorialsSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, params, deps: search }) =>
    context.queryClient.ensureQueryData(
      tutorialsListQueryOptions({
        locale: params.locale,
        search: search.q,
        limit: 50,
      }),
    ),
  component: TutorialsPage,
  head: ({ params }) => {
    const locale = params.locale || 'en';
    return createSeoHead({
      title: i18n.t('tutorials:page.seo.title'),
      description: i18n.t('tutorials:page.seo.description'),
      path: '/tutorials',
      locale,
    });
  },
});

const routeApi = getRouteApi('/$locale/tutorials/');

function TutorialsPage() {
  const { locale } = routeApi.useParams();
  const { t } = useTranslation('tutorials');
  const navigate = routeApi.useNavigate();
  const searchParams = routeApi.useSearch();
  const q = searchParams.q;
  const selectedStage = searchParams.difficulty || 'all';
  const selectedTopic = searchParams.topic;
  const viewMode = searchParams.view || 'grid';
  const hideCompleted = searchParams.hideCompleted ?? false;
  const [searchInput, setSearchInput] = useState(q ?? '');
  const debouncedSearchQuery = useDebounce(searchInput, 300);

  const updateSearch = (
    updates: Partial<z.infer<typeof TutorialsSearchSchema>>,
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

  useEffect(() => {
    setSearchInput(q ?? '');
  }, [q]);

  const { data: tutorialsResponse } = useSuspenseQuery(
    tutorialsListQueryOptions({
      locale,
      search: q || undefined,
      limit: 50,
    }),
  );

  const tutorials = (tutorialsResponse?.data ?? []) as TutorialListItem[];
  const topics = useMemo(
    () =>
      [...new Set(tutorials.flatMap((tutorial) => tutorial.tags))]
        .filter(isTutorialTopic)
        .sort(),
    [tutorials],
  );

  const filteredTutorials = useMemo(
    () =>
      tutorials.filter((tutorial) => {
        if (hideCompleted && tutorial.isCompleted) return false;
        if (
          selectedStage !== 'all' &&
          getTutorialStage(tutorial.tags) !== selectedStage
        ) {
          return false;
        }
        return !selectedTopic || tutorial.tags.includes(selectedTopic);
      }),
    [hideCompleted, selectedStage, selectedTopic, tutorials],
  );

  const groupedTutorials = useMemo(() => {
    if (selectedStage !== 'all') return null;

    const groups: Record<string, TutorialListItem[]> = {
      foundations: [],
      beginner: [],
      intermediate: [],
      advanced: [],
      other: [],
    };

    for (const tutorial of filteredTutorials) {
      groups[getTutorialStage(tutorial.tags)].push(tutorial);
    }

    return groups;
  }, [filteredTutorials, selectedStage]);

  const clearFilters = () => {
    setSearchInput('');
    updateSearch({
      q: undefined,
      difficulty: undefined,
      topic: undefined,
      hideCompleted: undefined,
    });
  };

  return (
    <main className="min-h-screen py-10 sm:py-14 lg:py-16">
      <PageContainer width="wide">
        <PaperSurface className="relative overflow-hidden px-6 py-9 sm:px-10 sm:py-12">
          <div
            aria-hidden="true"
            className="absolute -right-12 -top-14 size-56 rounded-full border-[18px] border-accent/20"
          />
          <div
            aria-hidden="true"
            className="absolute bottom-0 right-16 h-28 w-40 rounded-t-full border-x border-t border-primary/15"
          />
          <SectionHeading
            as="h1"
            align="left"
            eyebrow={t('page.eyebrow')}
            title={t('page.title')}
            description={t('page.subtitle')}
            className="relative"
          />
          <p className="relative mt-6 max-w-xl text-sm leading-6 text-muted-foreground">
            {t('page.fieldGuideDescription')}
          </p>
        </PaperSurface>

        <div className="mt-8 lg:flex lg:items-start lg:gap-6">
          <FieldGuideFilters
            searchInput={searchInput}
            onSearchInputChange={setSearchInput}
            selectedStage={selectedStage}
            selectedTopic={selectedTopic}
            topics={topics}
            hideCompleted={hideCompleted}
            viewMode={viewMode}
            resultCount={filteredTutorials.length}
            onStageChange={(stage) =>
              updateSearch({ difficulty: stage === 'all' ? undefined : stage })
            }
            onTopicChange={(topic) => updateSearch({ topic })}
            onHideCompletedChange={() =>
              updateSearch({ hideCompleted: hideCompleted ? undefined : true })
            }
            onViewModeChange={(view) => updateSearch({ view })}
            onClearFilters={clearFilters}
          >
            <div className="mt-8" aria-live="polite">
              {filteredTutorials.length === 0 ? (
                <PaperSurface className="px-6 py-14 text-center">
                  <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <BookOpen className="size-6" aria-hidden="true" />
                  </span>
                  <h2 className="mt-5 font-display text-2xl font-semibold text-foreground">
                    {t('page.noResults')}
                  </h2>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                    {q ? t('page.tryDifferentSearch') : t('page.checkBackSoon')}
                  </p>
                </PaperSurface>
              ) : viewMode === 'grid' && groupedTutorials ? (
                <div className="space-y-10">
                  {[...tutorialStages, 'other'].map((stage) => {
                    const items = groupedTutorials[stage];
                    if (!items.length) return null;

                    return (
                      <section key={stage} aria-labelledby={`guide-${stage}`}>
                        <div className="mb-4 flex items-center gap-3">
                          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Layers className="size-4" aria-hidden="true" />
                          </span>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
                              {t('page.learningStage')}
                            </p>
                            <h2
                              id={`guide-${stage}`}
                              className="font-display text-2xl font-semibold text-foreground"
                            >
                              {t(`tracks.${stage}`)}
                            </h2>
                          </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          {items.map((tutorial) => (
                            <TutorialCard
                              key={tutorial.slug}
                              tutorial={tutorial}
                              locale={locale}
                            />
                          ))}
                        </div>
                      </section>
                    );
                  })}
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredTutorials.map((tutorial) => (
                    <TutorialCard
                      key={tutorial.slug}
                      tutorial={tutorial}
                      locale={locale}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTutorials.map((tutorial) => (
                    <TutorialListRow
                      key={tutorial.slug}
                      tutorial={tutorial}
                      locale={locale}
                    />
                  ))}
                </div>
              )}
            </div>
          </FieldGuideFilters>
        </div>
      </PageContainer>
    </main>
  );
}

export default TutorialsPage;
