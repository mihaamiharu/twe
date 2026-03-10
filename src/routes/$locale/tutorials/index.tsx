import { useState, useMemo, useEffect } from 'react';
import { createFileRoute, Link, getRouteApi } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { tutorialsListQueryOptions } from '@/lib/tutorials.query';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BookOpen,
  Clock,
  Search,
  CheckCircle2,
  LayoutGrid,
  List,
  Layers,
  Circle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '@/lib/useDebounce';
import i18n from '@/lib/i18n';
import { createSeoHead } from '@/lib/seo';

// --- Search Params Schema ---
const TutorialsSearchSchema = z.object({
  q: z.string().optional(),
  difficulty: z.enum(['all', 'foundations', 'beginner', 'intermediate', 'advanced']).optional().default('all'),
  view: z.enum(['grid', 'list']).optional().default('grid'),
  hideCompleted: z.coerce.boolean().optional().default(false),
});

export const Route = createFileRoute('/$locale/tutorials/')({
  validateSearch: TutorialsSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, params, deps: search }) => {
    return context.queryClient.ensureQueryData(
      tutorialsListQueryOptions({
        locale: params.locale,
        search: search.q,
        limit: 50,
      }),
    );
  },
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

const difficulties = ['all', 'foundations', 'beginner', 'intermediate', 'advanced'] as const;

const routeApi = getRouteApi('/$locale/tutorials/');

function TutorialsPage() {
  const { locale } = routeApi.useParams();
  const { t } = useTranslation('tutorials');
  const navigate = routeApi.useNavigate();

  // URL-based State
  const { q, difficulty, view, hideCompleted } = routeApi.useSearch();
  const selectedDifficulty = difficulty;
  const viewMode = view;

  // Local state for search input (debounced to URL)
  const [searchInput, setSearchInput] = useState(q ?? '');
  const debouncedSearchQuery = useDebounce(searchInput, 300);

  // Helper to update URL search params
  const updateSearch = (updates: Partial<z.infer<typeof TutorialsSearchSchema>>) => {
    void navigate({
      to: '.',
      search: (prev) => ({ ...prev, ...updates }),
      replace: true,
    });
  };

  // Sync debounced search to URL
  useEffect(() => {
    if (debouncedSearchQuery !== (q ?? '')) {
      updateSearch({ q: debouncedSearchQuery || undefined });
    }
  }, [debouncedSearchQuery]);

  const { data: tutorialsResponse } = useSuspenseQuery(
    tutorialsListQueryOptions({
      locale,
      search: q || undefined,
      limit: 50,
    }),
  );

  const tutorials = tutorialsResponse?.data ?? [];

  // Group tutorials for the "All" view (Track view)
  const groupedTutorials = useMemo(() => {
    if (selectedDifficulty !== 'all') return null;

    const groups: Record<string, typeof tutorials> = {
      foundations: [],
      beginner: [],
      intermediate: [],
      advanced: [],
      other: [],
    };

    tutorials.forEach((t) => {
      if (hideCompleted && t.isCompleted) return;
      const tag = t.tags?.find((tag: string) =>
        ['foundations', 'beginner', 'intermediate', 'advanced'].includes(tag.toLowerCase()),
      );
      if (tag) {
        // Explicitly cast tag to string to avoid typescript error since we just checked it
        const key = (tag as string).toLowerCase();
        if (groups[key]) groups[key].push(t);
        else groups['other'].push(t);
      } else {
        groups['other'].push(t);
      }
    });

    return groups;
  }, [tutorials, selectedDifficulty, hideCompleted]);

  const filteredTutorials = useMemo(() => {
    return tutorials.filter((t) => {
      if (hideCompleted && t.isCompleted) return false;
      if (selectedDifficulty === 'all') return true;
      return t.tags?.some(
        (tag: string) => tag.toLowerCase() === selectedDifficulty.toLowerCase(),
      );
    });
  }, [tutorials, selectedDifficulty, hideCompleted]);

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold gradient-text mb-3">
            {t('page.title')}
          </h1>
          <p className="text-muted-foreground text-lg">{t('page.subtitle')}</p>
        </div>

        {/* Search, Filters, and View Toggle */}
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('page.searchPlaceholder')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 h-11 bg-card border-border rounded-xl shadow-sm focus-visible:ring-primary/20"
              />
            </div>

            <Button
              variant="outline"
              onClick={() => updateSearch({ hideCompleted: !hideCompleted })}
              className={`h-11 px-4 rounded-lg shadow-sm whitespace-nowrap border-border bg-card hover:bg-accent hover:text-accent-foreground self-end md:self-auto ${hideCompleted ? 'ring-2 ring-primary/20 border-primary/50 text-foreground' : 'text-muted-foreground'
                }`}
            >
              {hideCompleted ? (
                <CheckCircle2 className="mr-2 h-5 w-5 text-primary fill-primary/10" />
              ) : (
                <Circle className="mr-2 h-5 w-5 text-muted-foreground/50" />
              )}
              <span className={hideCompleted ? 'font-medium' : 'font-normal'}>
                {t('filters.hideCompleted', { defaultValue: 'Hide Completed' })}
              </span>
            </Button>
            <div className="flex items-center gap-2 self-end md:self-auto bg-muted/50 h-11 px-1.5 rounded-xl border border-border shadow-sm shrink-0">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => updateSearch({ view: 'grid' })}
                className={`h-8 w-8 p-0 rounded-lg ${viewMode === 'grid' ? 'bg-background shadow-sm' : ''}`}
                title={t('view.grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => updateSearch({ view: 'list' })}
                className={`h-8 w-8 p-0 rounded-lg ${viewMode === 'list' ? 'bg-background shadow-sm' : ''}`}
                title={t('view.list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {difficulties.map((difficulty) => (
              <Badge
                key={difficulty}
                variant={
                  selectedDifficulty === difficulty ? 'default' : 'outline'
                }
                className="cursor-pointer px-3 py-1 text-sm"
                onClick={() =>
                  updateSearch({
                    difficulty: selectedDifficulty === difficulty ? 'all' : difficulty,
                  })
                }
              >
                {t(`filters.${difficulty}`)}
              </Badge>
            ))}
          </div>
        </div>





        {/* Empty State */}
        {filteredTutorials.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t('page.noResults')}
            </h3>
            <p className="text-muted-foreground">
              {q ? t('page.tryDifferentSearch') : t('page.checkBackSoon')}
            </p>
          </div>
        )}

        {/* Tutorials Content */}
        {filteredTutorials.length > 0 && (
          <>
            {/* Track View (Grouped) - Only in Grid Mode and when 'All' is selected */}
            {viewMode === 'grid' && groupedTutorials ? (
              <div className="space-y-12">
                {(
                  ['foundations', 'beginner', 'intermediate', 'advanced', 'other'] as const
                ).map((level) => {
                  const items = groupedTutorials[level];
                  if (!items || items.length === 0) return null;

                  return (
                    <div key={level} className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-brand-teal/20 flex items-center justify-center border border-brand-teal/30">
                          <Layers className="h-4 w-4 text-brand-teal-dark" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">
                          {t(`tracks.${level}`)}
                        </h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pl-4 border-l-2 border-border/50 ml-4">
                        {items.map((tutorial) => (
                          <TutorialCard
                            key={tutorial.slug}
                            tutorial={tutorial}
                            locale={locale}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : /* Filtered Grid or List View */
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTutorials.map((tutorial) => (
                    <TutorialCard
                      key={tutorial.slug}
                      tutorial={tutorial}
                      locale={locale}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-md border bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead className="w-[300px]">
                          {t('table.title')}
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          {t('table.description')}
                        </TableHead>
                        <TableHead>{t('table.tags')}</TableHead>
                        <TableHead className="text-right">
                          {t('table.time')}
                        </TableHead>
                        <TableHead className="w-[100px] text-right">
                          {t('table.status')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTutorials.map((tutorial) => (
                        <TableRow
                          key={tutorial.slug}
                          className="group cursor-pointer"
                        >
                          <TableCell>
                            <Link
                              to="/$locale/tutorials/$slug"
                              params={{ locale, slug: tutorial.slug }}
                              className="block h-full w-full flex items-center justify-center text-muted-foreground group-hover:text-primary"
                            >
                              <BookOpen className="h-4 w-4" />
                            </Link>
                          </TableCell>
                          <TableCell className="font-medium group-hover:text-primary transition-colors">
                            <Link
                              to="/$locale/tutorials/$slug"
                              params={{ locale, slug: tutorial.slug }}
                              className="block"
                            >
                              {tutorial.title}
                            </Link>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground max-w-[300px] truncate">
                            {tutorial.description}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {tutorial.tags?.slice(0, 2).map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-xs px-1.5 py-0 border-border/50"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {tutorial.estimatedMinutes}m
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end">
                              {tutorial.isCompleted && (
                                <Badge
                                  variant="outline"
                                  className="border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400 gap-1 pr-2"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  {t('card.completed')}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
          </>
        )}
      </div>
    </div>
  );
}

interface TutorialListItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  tags: string[];
  order: number;
  viewCount: number;
  isCompleted: boolean;
  readingProgress: number;
  difficulty?: 'FOUNDATIONS' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}

function TutorialCard({
  tutorial,
  locale,
}: {
  tutorial: TutorialListItem;
  locale: string;
}) {
  const { t } = useTranslation('tutorials');
  return (
    <Link
      to="/$locale/tutorials/$slug"
      params={{ locale, slug: tutorial.slug }}
      className="group"
    >
      <Card className="h-full glass-card hover:border-brand-teal/50 hover:scale-[1.02] transition-all duration-300 hover:shadow-xl hover:shadow-brand-teal/10 relative overflow-hidden border border-border flex flex-col mx-auto w-full">
        {/* Completed Badge */}
        {tutorial.isCompleted && (
          <div className="absolute top-0 right-0 p-2 bg-green-500/10 rounded-bl-lg border-l border-b border-green-500/20 z-10">
            <div className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t('card.completed')}
            </div>
          </div>
        )}
        <CardHeader>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-brand-teal/10 text-brand-teal">
              <BookOpen className="h-5 w-5" />
            </div>
            {tutorial.tags && tutorial.tags.length > 0 && (
              <Badge
                variant="secondary"
                className="border-transparent bg-secondary/50 text-secondary-foreground"
              >
                {tutorial.tags[0]}
              </Badge>
            )}
          </div>
          <CardTitle className="group-hover:text-brand-teal transition-colors text-xl leading-tight">
            {tutorial.title}
          </CardTitle>
          <CardDescription className="line-clamp-3 mt-2 text-base">
            {tutorial.description}
          </CardDescription>
        </CardHeader>
        {/* Spacer to push content to bottom if needed */}
        <div className="flex-grow" />
        <CardContent className="mt-auto pt-0">
          <div className="flex items-center gap-4 text-sm text-muted-foreground border-t border-border/50 pt-4">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span className="font-medium">
                {tutorial.estimatedMinutes} min
              </span>
            </div>
            {tutorial.difficulty && (
              <div className="flex items-center gap-1.5 capitalize ml-auto">
                <span
                  className={
                    tutorial.difficulty === 'FOUNDATIONS'
                      ? 'text-purple-500'
                      : tutorial.difficulty === 'BEGINNER'
                        ? 'text-green-500'
                        : tutorial.difficulty === 'INTERMEDIATE'
                          ? 'text-yellow-500'
                          : 'text-red-500'
                  }
                >
                  ●
                </span>
                {tutorial.difficulty.toLowerCase()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default TutorialsPage;
