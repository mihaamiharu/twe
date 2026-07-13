import type { ComponentProps, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type StateTone = 'neutral' | 'success' | 'danger';

interface StatePanelProps extends Omit<ComponentProps<'div'>, 'title'> {
  icon: LucideIcon;
  title: ReactNode;
  description: ReactNode;
  actions?: ReactNode;
  details?: ReactNode;
  tone?: StateTone;
  busy?: boolean;
}

function getToneClass(tone: StateTone) {
  switch (tone) {
    case 'success':
      return 'bg-[color:var(--quest-success)]/15 text-[color:var(--quest-success)]';
    case 'danger':
      return 'bg-destructive/10 text-destructive';
    default:
      return 'bg-primary/10 text-primary';
  }
}

export function StatePanel({
  icon: Icon,
  title,
  description,
  actions,
  details,
  tone = 'neutral',
  busy = false,
  className,
  ...props
}: StatePanelProps) {
  return (
    <div
      className={cn('mx-auto max-w-xl text-center', className)}
      aria-busy={busy || undefined}
      {...props}
    >
      <span
        className={cn(
          'mx-auto flex size-14 items-center justify-center rounded-2xl',
          getToneClass(tone),
        )}
      >
        <Icon
          className={cn('size-7', busy && 'animate-spin')}
          aria-hidden="true"
        />
      </span>
      <h1 className="mt-5 font-display text-3xl font-semibold text-foreground">
        {title}
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
        {description}
      </p>
      {details && <div className="mt-5 text-left">{details}</div>}
      {actions && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
