import { CheckCircle2, CircleDot, Compass } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface TutorialProgressStateProps {
  isCompleted: boolean;
  readingProgress: number;
  compact?: boolean;
}

export function TutorialProgressState({
  isCompleted,
  readingProgress,
  compact = false,
}: TutorialProgressStateProps) {
  const { t } = useTranslation('tutorials');

  const inProgress = !isCompleted && readingProgress > 0;
  const Icon = isCompleted ? CheckCircle2 : inProgress ? CircleDot : Compass;
  const label = isCompleted
    ? t('progress.completed')
    : inProgress
      ? t('progress.inProgress', { percent: readingProgress })
      : t('progress.notStarted');

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold',
        compact ? 'text-xs' : 'px-2.5 py-1 text-xs',
        isCompleted
          ? 'bg-[color:var(--quest-success)]/12 text-[color:var(--quest-success)]'
          : inProgress
            ? 'bg-accent/55 text-accent-foreground'
            : 'bg-secondary text-secondary-foreground',
      )}
    >
      <Icon
        className={cn(compact ? 'size-3.5' : 'size-4')}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
