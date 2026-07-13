import { CheckCircle2, Circle, LockKeyhole } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type ChallengeState = 'available' | 'completed' | 'locked';

const stateConfig = {
  available: {
    icon: Circle,
    className: 'border-primary/25 bg-primary/10 text-primary',
  },
  completed: {
    icon: CheckCircle2,
    className: 'border-emerald-600/25 bg-emerald-600/10 text-emerald-800 dark:text-emerald-300',
  },
  locked: {
    icon: LockKeyhole,
    className: 'border-muted-foreground/25 bg-muted text-muted-foreground',
  },
} as const;

interface ChallengeStateIndicatorProps {
  state: ChallengeState;
  className?: string;
}

export function ChallengeStateIndicator({
  state,
  className,
}: ChallengeStateIndicatorProps) {
  const { t } = useTranslation('challenges');
  const { icon: Icon, className: stateClassName } = stateConfig[state];

  return (
    <Badge
      variant="outline"
      className={cn('gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold', stateClassName, className)}
    >
      <Icon aria-hidden="true" className="size-3" />
      <span>{t(`states.${state}`)}</span>
    </Badge>
  );
}
