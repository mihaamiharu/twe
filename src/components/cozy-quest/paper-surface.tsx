import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function PaperSurface({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'paper-surface rounded-[1.25rem] border border-border bg-card text-card-foreground shadow-[0_16px_40px_rgba(73,62,45,0.08)]',
        className,
      )}
      {...props}
    />
  );
}
