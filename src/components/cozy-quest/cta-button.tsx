import type { ComponentProps } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function CTAButton({
  className,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      size="lg"
      className={cn('h-12 rounded-xl px-6 text-base font-bold', className)}
      {...props}
    />
  );
}
