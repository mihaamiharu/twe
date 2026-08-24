import { Code2, ListChecks, MousePointer2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type LearningPathPreviewKind =
  | 'understand'
  | 'build'
  | 'automate'
  | 'practice';

export function LearningPathPreview({
  kind,
  className,
}: {
  kind: LearningPathPreviewKind;
  className?: string;
}) {
  if (kind === 'understand') {
    return (
      <div
        className={cn(
          'overflow-hidden rounded-md border border-[var(--soft-border)] bg-white',
          className,
        )}
        aria-hidden="true"
      >
        <div className="flex items-center gap-1 border-b border-[var(--soft-border)] bg-[var(--paper-surface)] px-2 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#c74b42]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#b78327]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#23856d]" />
          <span className="ml-1 h-1.5 w-16 rounded-full bg-[var(--soft-border)]" />
        </div>
        <div className="space-y-2 p-3">
          <div className="h-1.5 w-16 rounded-full bg-[var(--soft-border)]" />
          <div className="h-2.5 w-28 rounded border border-[var(--soft-border)]" />
          <div className="flex items-center justify-between gap-2">
            <div className="h-2.5 w-20 rounded border border-[var(--soft-border)]" />
            <span className="flex items-center gap-1 rounded border border-[var(--brand-orange)]/50 px-1.5 py-1 font-mono text-[8px] text-[var(--brand-orange)]">
              <MousePointer2 className="h-2.5 w-2.5" />
              &lt;button&gt;
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (kind === 'build') {
    return (
      <div
        className={cn(
          'overflow-hidden rounded-md border border-[var(--soft-border)] bg-[var(--paper-surface)] p-3 font-mono text-[9px] leading-4',
          className,
        )}
        aria-hidden="true"
      >
        <div className="flex items-center gap-2 text-[var(--muted-graphite)]">
          <Code2 className="h-3 w-3 text-[var(--brand-orange)]" />
          <span>user.js</span>
        </div>
        <div className="mt-2 text-[var(--muted-graphite)]">
          <span className="text-[var(--brand-orange)]">const</span> user = &#123;
        </div>
        <div className="pl-3 text-[var(--graphite)]">
          name: <span className="text-[var(--brand-orange)]">&apos;Ekki&apos;</span>,
        </div>
        <div className="pl-3 text-[var(--graphite)]">
          role: <span className="text-[var(--brand-orange)]">&apos;QA&apos;</span>,
        </div>
        <div className="text-[var(--muted-graphite)]">&#125;;</div>
      </div>
    );
  }

  if (kind === 'automate') {
    return (
      <div
        className={cn(
          'overflow-hidden rounded-md border border-[var(--soft-border)] bg-[var(--paper-surface)] p-3 font-mono text-[9px] leading-4',
          className,
        )}
        aria-hidden="true"
      >
        <div className="flex items-center gap-2 text-[var(--muted-graphite)]">
          <Code2 className="h-3 w-3 text-[var(--brand-orange)]" />
          <span>login.spec.ts</span>
        </div>
        <div className="mt-2 text-[var(--muted-graphite)]">
          <span className="text-[var(--brand-orange)]">test</span>(
          <span className="text-[var(--graphite)]">&apos;has title&apos;</span>,
        </div>
        <div className="pl-3 text-[var(--graphite)]">async (&#123; page &#125;) =&gt;</div>
        <div className="pl-3 text-[var(--muted-graphite)]">
          <span className="text-[var(--brand-orange)]">await</span> page.goto(...)
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-md border border-[var(--soft-border)] bg-[var(--paper-surface)] p-3',
        className,
      )}
      aria-hidden="true"
    >
      <div className="flex items-center gap-2 font-mono text-[9px] text-[var(--muted-graphite)]">
        <ListChecks className="h-3.5 w-3.5 text-[var(--brand-orange)]" />
        E2E / Checkout flow
      </div>
      <div className="mt-3 space-y-2">
        {[0, 1, 2].map((item) => (
          <div key={item} className="flex items-center gap-2">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[var(--brand-orange)] text-[8px] text-[var(--brand-orange)]">
              ✓
            </span>
            <span
              className={cn(
                'h-1.5 rounded-full bg-[var(--soft-border)]',
                item === 0 ? 'w-24' : item === 1 ? 'w-20' : 'w-28',
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
