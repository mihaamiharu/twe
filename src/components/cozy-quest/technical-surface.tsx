import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function TechnicalSurface({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'technical-surface rounded-xl border p-1 shadow-[0_10px_28px_rgba(32,36,42,0.08)]',
        className,
      )}
      {...props}
    />
  );
}
