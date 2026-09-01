import { useTranslation } from 'react-i18next';
import { Target } from 'lucide-react';

interface PlaygroundGoalBarProps {
  description: string;
}

export function PlaygroundGoalBar({ description }: PlaygroundGoalBarProps) {
  const { t } = useTranslation(['challenges']);

  return (
    <div className="bg-workspace-panel border-b border-workspace-border px-3 md:px-4 py-1.5 md:py-2 shrink-0">
      <div className="flex items-start gap-2 md:gap-3">
        <div className="bg-brand-orange/10 p-1 rounded-md shrink-0 border border-brand-orange/30 mt-0.5">
          <Target className="h-3 w-3 md:h-3.5 md:w-3.5 text-brand-orange" />
        </div>
        <p className="text-xs md:text-sm font-medium text-workspace-text leading-snug">
          <span className="text-brand-orange mr-1 md:mr-2 font-mono text-[11px] tracking-wide">
            {t('challenges:playground.goal')}
          </span>
          {description}
        </p>
      </div>
    </div>
  );
}
