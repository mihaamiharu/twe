import { ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CTAButton, PaperSurface } from '@/components/cozy-quest';
import { Progress } from '@/components/ui/progress';

interface TutorialProgressPanelProps {
  displayProgress: number;
  estimatedMinutes: number;
  isCompleted: boolean;
  isPending: boolean;
  onComplete: () => void;
  nextTutorial?: { slug: string; title: string } | null;
  onNext: () => void;
}

export function TutorialProgressPanel({
  displayProgress,
  estimatedMinutes,
  isCompleted,
  isPending,
  onComplete,
  nextTutorial,
  onNext,
}: TutorialProgressPanelProps) {
  const { t } = useTranslation(['tutorials', 'common']);

  return (
    <PaperSurface className="p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
          {t('tutorials:sidebar.progress')}
        </p>
        {isCompleted && (
          <span className="flex items-center gap-1 text-xs font-bold text-[color:var(--quest-success)]">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            {t('tutorials:sidebar.statusCompleted')}
          </span>
        )}
      </div>

      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {t('tutorials:sidebar.reading')}
          </span>
          <span className="font-bold text-foreground">{displayProgress}%</span>
        </div>
        <Progress value={displayProgress} className="h-2.5" />
      </div>

      <div className="mt-5 flex items-center gap-2 border-t border-border/70 pt-4 text-sm text-muted-foreground">
        <Clock className="size-4" aria-hidden="true" />
        {t('tutorials:card.estimatedTime', { minutes: estimatedMinutes })}
      </div>

      {!isCompleted ? (
        <CTAButton
          type="button"
          className="mt-5 w-full"
          onClick={onComplete}
          disabled={isPending || displayProgress < 100}
        >
          <CheckCircle2 className="mr-2 size-4" aria-hidden="true" />
          {isPending
            ? t('common:messages.saving')
            : displayProgress < 100
              ? t('tutorials:sidebar.readToComplete')
              : t('tutorials:sidebar.completeAndContinue')}
        </CTAButton>
      ) : nextTutorial ? (
        <CTAButton type="button" className="mt-5 w-full" onClick={onNext}>
          <span className="min-w-0 flex-1 text-left">
            {t('tutorials:sidebar.nextLabel', { title: nextTutorial.title })}
          </span>
          <ArrowRight className="ml-2 size-4 shrink-0" aria-hidden="true" />
        </CTAButton>
      ) : null}
    </PaperSurface>
  );
}
