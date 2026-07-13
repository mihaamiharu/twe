import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

interface IllustratedPanelProps extends ComponentProps<'div'> {
  imageSrc: string;
  imageAlt?: string;
  imageClassName?: string;
}

export function IllustratedPanel({
  imageSrc,
  imageAlt = '',
  imageClassName,
  className,
  children,
  ...props
}: IllustratedPanelProps) {
  return (
    <div
      className={cn(
        'relative isolate overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-[0_24px_70px_rgba(70,61,46,0.12)]',
        className,
      )}
      {...props}
    >
      <img
        src={imageSrc}
        alt={imageAlt}
        className={cn(
          'absolute inset-0 h-full w-full object-cover',
          imageClassName,
        )}
      />
      <div className="absolute inset-0 bg-card/80 sm:bg-gradient-to-r sm:from-card sm:via-card/90 sm:to-card/10" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
