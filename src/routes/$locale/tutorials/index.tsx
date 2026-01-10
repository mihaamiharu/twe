import { useState, useMemo } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getTutorials } from '@/server/tutorials.fn';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
  AlertCircle,
  CheckCircle2,
  LayoutGrid,
  List,
  Layers,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/$locale/tutorials/')({
  component: TutorialsPage,
  head: () => ({
    meta: [
      {
        title: 'Testing Tutorials | TestingWithEkki',
      },
      {
        name: 'description',
        content:
          'Step-by-step guides for mastering software testing. Learn Playwright, end-to-end testing strategies, and best practices.',
      },
    ],
  }),
});

const difficulties = ['all', 'beginner', 'intermediate', 'advanced'] as const;

function TutorialsPage() {
  const { locale } = Route.useParams();
  const { t } = useTranslation('tutorials');
  const [search, setSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<(typeof difficulties)[number]>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const {
    data: tutorialsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['tutorials', search],
    queryFn: async () => {
      const result = await getTutorials({
        data: {
          locale,
          search: search || undefined,
          limit: 50,
        },
      });
      if (!result.success) throw new Error(result.error);
      return result;
    },
  });

  const tutorials = tutorialsResponse?.data ?? [];

  // Group tutorials for the "All" view (Track view)
  const groupedTutorials = useMemo(() => {
    if (selectedDifficulty !== 'all') return null;

    const groups: Record<string, typeof tutorials> = {
      beginner: [],
      intermediate: [],
      advanced: [],
      other: [],
    };

    tutorials.forEach((t) => {
      const tag = t.tags?.find((tag) =>
        ['beginner', 'intermediate', 'advanced'].includes(tag.toLowerCase()),
      );
      if (tag) {
        const key = tag.toLowerCase();
        if (groups[key]) groups[key].push(t);
        else groups['other'].push(t);
      } else {
        groups['other'].push(t);
      }
    });

    return groups;
  }, [tutorials, selectedDifficulty]);

  const filteredTutorials = useMemo(() => {
    if (selectedDifficulty === 'all') return tutorials;
    return tutorials.filter((t) =>
      t.tags?.some(
        (tag) => tag.toLowerCase() === selectedDifficulty.toLowerCase(),
      ),
    );
  }, [tutorials, selectedDifficulty]);

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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 self-end md:self-auto bg-muted/50 p-1 rounded-lg border border-border">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 w-8 p-0"
                title={t('view.grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 w-8 p-0"
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
                  setSelectedDifficulty(
                    selectedDifficulty === difficulty ? 'all' : difficulty,
                  )
                }
              >
                {t(`filters.${difficulty}`)}
              </Badge>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="h-full glass-card">
                <CardHeader>
                  <Skeleton className="h-6 w-24 mb-2" />
                  <Skeleton className="h-8 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t('page.failedToLoad')}
            </h3>
            <p className="text-muted-foreground">{t('page.pleaseTryAgain')}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredTutorials.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t('page.noResults')}
            </h3>
            <p className="text-muted-foreground">
              {search ? t('page.tryDifferentSearch') : t('page.checkBackSoon')}
            </p>
          </div>
        )}

        {/* Tutorials Content */}
        {!isLoading && !error && filteredTutorials.length > 0 && (
          <>
            {/* Track View (Grouped) - Only in Grid Mode and when 'All' is selected */}
            {viewMode === 'grid' && groupedTutorials ? (
              <div className="space-y-12">
                {(
                  ['beginner', 'intermediate', 'advanced', 'other'] as const
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
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
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
                    tutorial.difficulty === 'BEGINNER'
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
