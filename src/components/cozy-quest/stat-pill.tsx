import type { ReactNode } from 'react';

interface StatPillProps {
  value: ReactNode;
  label: ReactNode;
}

export function StatPill({ value, label }: StatPillProps) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card/90 px-4 py-4 text-center shadow-[0_8px_24px_rgba(73,62,45,0.06)]">
      <div className="text-2xl font-bold text-primary sm:text-3xl">{value}</div>
      <div className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:text-sm sm:normal-case sm:tracking-normal">
        {label}
      </div>
    </div>
  );
}
