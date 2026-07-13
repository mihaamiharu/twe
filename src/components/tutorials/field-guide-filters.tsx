import { Circle, Filter, LayoutGrid, List, Search, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { PaperSurface } from '@/components/cozy-quest';
import { cn } from '@/lib/utils';
import { tutorialStages, type TutorialStage } from './tutorial-types';

type CatalogueStage = Exclude<TutorialStage, 'other'> | 'all';

interface FieldGuideFiltersProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  selectedStage: CatalogueStage;
  selectedTopic?: string;
  topics: string[];
  hideCompleted: boolean;
  viewMode: 'grid' | 'list';
  resultCount: number;
  onStageChange: (stage: CatalogueStage) => void;
  onTopicChange: (topic?: string) => void;
  onHideCompletedChange: () => void;
  onViewModeChange: (view: 'grid' | 'list') => void;
  onClearFilters: () => void;
  children?: ReactNode;
}

export function FieldGuideFilters({
  searchInput,
  onSearchInputChange,
  selectedStage,
  selectedTopic,
  topics,
  hideCompleted,
  viewMode,
  resultCount,
  onStageChange,
  onTopicChange,
  onHideCompletedChange,
  onViewModeChange,
  onClearFilters,
  children,
}: FieldGuideFiltersProps) {
  const { t } = useTranslation('tutorials');
  const hasFilters =
    Boolean(searchInput) ||
    selectedStage !== 'all' ||
    Boolean(selectedTopic) ||
    hideCompleted;
  const activeFilterCount = [
    selectedStage !== 'all',
    Boolean(selectedTopic),
  ].filter(Boolean).length;

  const stageControls = (compact = false) => (
    <div
      className={cn('space-y-1', compact && 'grid grid-cols-2 gap-2 space-y-0')}
    >
      {(['all', ...tutorialStages] as const).map((stage) => {
        const active = selectedStage === stage;
        return (
          <button
            key={stage}
            type="button"
            aria-pressed={active}
            onClick={() => onStageChange(stage)}
            className={cn(
              'flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30',
              active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            <span
              className={cn(
                'size-2 rounded-full',
                active ? 'bg-primary-foreground' : 'bg-primary/50',
              )}
              aria-hidden="true"
            />
            {t(`filters.${stage}`)}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block lg:w-56 lg:shrink-0">
        <PaperSurface className="sticky top-24 p-3">
          <p className="px-3 pb-2 pt-1 text-xs font-bold uppercase tracking-[0.16em] text-primary">
            {t('filters.guideSections')}
          </p>
          {stageControls()}
        </PaperSurface>
      </aside>

      <div className="min-w-0 flex-1">
        <PaperSurface className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative flex-1">
              <span className="sr-only">{t('filters.searchLabel')}</span>
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={searchInput}
                onChange={(event) => onSearchInputChange(event.target.value)}
                placeholder={t('page.searchPlaceholder')}
                className="h-11 rounded-xl border-border bg-background pl-10 shadow-none"
              />
            </label>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                aria-pressed={hideCompleted}
                onClick={onHideCompletedChange}
                className={cn(
                  'h-11 flex-1 rounded-xl border-border bg-card px-3 text-sm sm:flex-none',
                  hideCompleted &&
                    'border-primary/50 bg-primary/5 text-primary',
                )}
              >
                <Circle className="mr-2 size-4" aria-hidden="true" />
                {t('filters.hideCompleted')}
              </Button>
              <div
                className="flex h-11 items-center gap-1 rounded-xl border border-border bg-secondary/65 p-1"
                role="group"
                aria-label={t('view.label')}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t('view.grid')}
                  aria-pressed={viewMode === 'grid'}
                  onClick={() => onViewModeChange('grid')}
                  className={cn(
                    'size-9 rounded-lg',
                    viewMode === 'grid' && 'bg-card shadow-sm',
                  )}
                >
                  <LayoutGrid className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t('view.list')}
                  aria-pressed={viewMode === 'list'}
                  onClick={() => onViewModeChange('list')}
                  className={cn(
                    'size-9 rounded-lg',
                    viewMode === 'list' && 'bg-card shadow-sm',
                  )}
                >
                  <List className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-4 hidden flex-wrap items-center gap-2 border-t border-border/70 pt-4 lg:flex">
            <span className="mr-1 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {t('filters.topics')}
            </span>
            {topics.map((topic) => {
              const active = selectedTopic === topic;
              return (
                <button
                  key={topic}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onTopicChange(active ? undefined : topic)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/45 hover:text-foreground',
                  )}
                >
                  {topic}
                </button>
              );
            })}
            {hasFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="ml-auto rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="mr-1 size-3.5" aria-hidden="true" />
                {t('filters.clear')}
              </Button>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl"
                >
                  <Filter className="mr-2 size-4" aria-hidden="true" />
                  {t('filters.filterGuides')}
                  {activeFilterCount > 0 && (
                    <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-bold text-primary">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="max-h-[85dvh] overflow-y-auto rounded-t-[1.5rem]"
              >
                <SheetHeader>
                  <SheetTitle>{t('filters.guideSections')}</SheetTitle>
                  <SheetDescription>
                    {t('filters.filterDescription')}
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6">{stageControls(true)}</div>
                <div className="mt-6 border-t border-border pt-5">
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    {t('filters.topics')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {topics.map((topic) => {
                      const active = selectedTopic === topic;
                      return (
                        <button
                          key={topic}
                          type="button"
                          aria-pressed={active}
                          onClick={() =>
                            onTopicChange(active ? undefined : topic)
                          }
                          className={cn(
                            'min-h-11 rounded-full border px-3 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30',
                            active
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-background text-muted-foreground hover:border-primary/45 hover:text-foreground',
                          )}
                        >
                          {topic}
                        </button>
                      );
                    })}
                  </div>
                  {hasFilters && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="mt-4"
                      onClick={onClearFilters}
                    >
                      <X className="mr-1 size-3.5" aria-hidden="true" />
                      {t('filters.clear')}
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
            <span aria-live="polite">
              {t('page.resultCount', { count: resultCount })}
            </span>
          </div>
        </PaperSurface>
        {children}
      </div>
    </>
  );
}
