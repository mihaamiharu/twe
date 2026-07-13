import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

interface PaperSurfaceProps extends ComponentProps<'div'> {
  texture?: boolean;
}

export function PaperSurface({
  className,
  texture = true,
  ...props
}: PaperSurfaceProps) {
  return (
    <div
      className={cn(
        texture && 'paper-surface',
        'rounded-[1.25rem] border border-border bg-card text-card-foreground shadow-[0_16px_40px_rgba(73,62,45,0.08)]',
        className,
      )}
      {...props}
    />
  );
}
