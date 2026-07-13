import { LayoutGrid, List, Search, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PaperSurface } from '@/components/cozy-quest';
import { cn } from '@/lib/utils';

export type ChallengeFilterStatus = 'all' | 'available' | 'completed' | 'locked';
export type ChallengeFilterDifficulty = 'all' | 'EASY' | 'MEDIUM' | 'HARD';

interface QuestBoardFiltersProps {
  search: string;
  status: ChallengeFilterStatus;
  difficulty: ChallengeFilterDifficulty;
  view: 'grid' | 'list';
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ChallengeFilterStatus) => void;
  onDifficultyChange: (value: ChallengeFilterDifficulty) => void;
  onViewChange: (value: 'grid' | 'list') => void;
}

export function QuestBoardFilters({
  search,
  status,
  difficulty,
  view,
  onSearchChange,
  onStatusChange,
  onDifficultyChange,
  onViewChange,
}: QuestBoardFiltersProps) {
  const { t } = useTranslation('challenges');

  return (
    <PaperSurface className="p-3 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t('filters.searchPlaceholder')}
            className="h-10 bg-background pl-9"
            aria-label={t('filters.searchPlaceholder')}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <Select value={status} onValueChange={(value) => onStatusChange(value as ChallengeFilterStatus)}>
            <SelectTrigger className="h-10 w-full min-w-0 bg-background sm:w-[140px]" aria-label={t('filters.status')}>
              <SlidersHorizontal aria-hidden="true" className="size-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.statusAll')}</SelectItem>
              <SelectItem value="available">{t('states.available')}</SelectItem>
              <SelectItem value="completed">{t('states.completed')}</SelectItem>
              <SelectItem value="locked">{t('states.locked')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={difficulty} onValueChange={(value) => onDifficultyChange(value as ChallengeFilterDifficulty)}>
            <SelectTrigger className="h-10 w-full min-w-0 bg-background sm:w-[150px]" aria-label={t('filters.difficulty')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.allDifficulties')}</SelectItem>
              <SelectItem value="EASY">{t('difficulty.EASY')}</SelectItem>
              <SelectItem value="MEDIUM">{t('difficulty.MEDIUM')}</SelectItem>
              <SelectItem value="HARD">{t('difficulty.HARD')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center rounded-lg border border-border bg-background p-1" aria-label={t('filters.view')}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn('size-8', view === 'grid' && 'bg-secondary text-secondary-foreground')}
            aria-label={t('filters.gridView')}
            aria-pressed={view === 'grid'}
            onClick={() => onViewChange('grid')}
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn('size-8', view === 'list' && 'bg-secondary text-secondary-foreground')}
            aria-label={t('filters.listView')}
            aria-pressed={view === 'list'}
            onClick={() => onViewChange('list')}
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>
    </PaperSurface>
  );
}
