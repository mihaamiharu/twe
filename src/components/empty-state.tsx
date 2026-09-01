import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const illustrationSources = {
  thinking: '/illustrations/twe-inspector-male-thinking.png',
} as const;

const sizeStyles = {
  compact: {
    layout: 'gap-4 py-7 sm:gap-7',
    image: 'h-28 w-24 sm:h-32 sm:w-28',
    eyebrow: 'text-[10px]',
    title: 'text-lg',
    description: 'text-sm',
  },
  default: {
    layout: 'gap-5 py-10 sm:gap-9',
    image: 'h-36 w-[7.5rem] sm:h-44 sm:w-36',
    eyebrow: 'text-[11px]',
    title: 'text-xl',
    description: 'text-sm leading-6',
  },
  large: {
    layout: 'gap-6 py-12 sm:gap-12',
    image: 'h-48 w-40 sm:h-56 sm:w-44',
    eyebrow: 'text-[11px]',
    title: 'text-2xl',
    description: 'text-base leading-7',
  },
} as const;

export interface EmptyStateProps {
  title: ReactNode;
  description: ReactNode;
  eyebrow?: ReactNode;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  illustration?: keyof typeof illustrationSources;
  illustrationAlt?: string;
  showIllustration?: boolean;
  size?: keyof typeof sizeStyles;
  className?: string;
}

export function EmptyState({
  title,
  description,
  eyebrow,
  action,
  secondaryAction,
  illustration = 'thinking',
  illustrationAlt = '',
  showIllustration = true,
  size = 'default',
  className,
}: EmptyStateProps) {
  const styles = sizeStyles[size];
  const hasActions = Boolean(action || secondaryAction);
  const isDecorative = illustrationAlt.length === 0;
  const layoutClassName = showIllustration
    ? 'flex flex-col items-center justify-center text-center sm:flex-row sm:text-left'
    : 'block text-left';

  return (
    <div
      className={cn(
        layoutClassName,
        styles.layout,
        className,
      )}
      data-empty-state
      data-empty-state-illustration={illustration}
    >
      <div className="min-w-0 max-w-xl">
        {eyebrow && (
          <p
            className={cn(
              'font-mono uppercase tracking-[0.16em] text-primary',
              styles.eyebrow,
            )}
          >
            {eyebrow}
          </p>
        )}
        <h2
          className={cn(
            'mt-2 font-semibold tracking-[-0.025em] text-foreground',
            styles.title,
          )}
        >
          {title}
        </h2>
        <p className={cn('mt-2 text-muted-foreground', styles.description)}>
          {description}
        </p>
        {hasActions && (
          <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:items-center">
            {action}
            {secondaryAction}
          </div>
        )}
      </div>

      {showIllustration && (
        <div
          className={cn('flex shrink-0 items-end justify-center', styles.image)}
          aria-hidden={isDecorative ? true : undefined}
        >
          <img
            src={illustrationSources[illustration]}
            alt={illustrationAlt}
            className="h-full w-full object-contain"
            width={1148}
            height={1370}
            loading="lazy"
            draggable={false}
          />
        </div>
      )}
    </div>
  );
}
