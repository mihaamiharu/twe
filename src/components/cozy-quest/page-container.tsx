import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

const widths = {
  narrow: 'max-w-4xl',
  default: 'max-w-6xl',
  wide: 'max-w-7xl',
} as const;

interface PageContainerProps extends ComponentProps<'div'> {
  width?: keyof typeof widths;
}

export function PageContainer({
  width = 'default',
  className,
  ...props
}: PageContainerProps) {
  const widthClass =
    width === 'narrow'
      ? widths.narrow
      : width === 'wide'
        ? widths.wide
        : widths.default;

  return (
    <div
      className={cn(
        'mx-auto w-full px-5 sm:px-6 lg:px-8',
        widthClass,
        className,
      )}
      {...props}
    />
  );
}
