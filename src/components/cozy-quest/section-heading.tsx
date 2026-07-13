import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  align?: 'left' | 'center';
  as?: ElementType;
  className?: string;
}

export function SectionHeading({
  title,
  description,
  eyebrow,
  align = 'center',
  as: Heading = 'h2',
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'space-y-3',
        align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl',
        className,
      )}
    >
      {eyebrow && (
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          {eyebrow}
        </p>
      )}
      <Heading className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl">
        {title}
      </Heading>
      {description && (
        <p className="text-base leading-7 text-muted-foreground sm:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}
