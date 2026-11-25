import { Code2, Crosshair, ListChecks, MousePointer2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type LearningPathPreviewKind =
  | 'judgment'
  | 'dom'
  | 'first-test'
  | 'locators'
  | 'understand'
  | 'build'
  | 'automate'
  | 'practice';

type ResolvedLearningPathPreviewKind =
  | 'judgment'
  | 'dom'
  | 'first-test'
  | 'locators';

const MODULE_SLUG_TO_PREVIEW_KIND: Record<
  string,
  ResolvedLearningPathPreviewKind
> = {
  'automation-judgment': 'judgment',
  'read-the-ui': 'dom',
  'first-test-code': 'first-test',
  'reliable-locators': 'locators',
};

const ORDERED_PREVIEW_KINDS: ResolvedLearningPathPreviewKind[] = [
  'judgment',
  'dom',
  'first-test',
  'locators',
];

export function getLearningPathPreviewKind(
  moduleSlug: string,
  index: number,
): ResolvedLearningPathPreviewKind {
  return (
    MODULE_SLUG_TO_PREVIEW_KIND[moduleSlug] ??
    ORDERED_PREVIEW_KINDS[index] ??
    'locators'
  );
}

function resolvePreviewKind(
  kind: LearningPathPreviewKind,
): ResolvedLearningPathPreviewKind {
  switch (kind) {
    case 'judgment':
    case 'understand':
      return 'judgment';
    case 'dom':
    case 'build':
      return 'dom';
    case 'first-test':
    case 'automate':
      return 'first-test';
    case 'locators':
    case 'practice':
      return 'locators';
  }
}

export function LearningPathPreview({
  kind,
  className,
}: {
  kind: LearningPathPreviewKind;
  className?: string;
}) {
  const resolvedKind = resolvePreviewKind(kind);

  if (resolvedKind === 'judgment') {
    return (
      <div
        data-preview-kind="judgment"
        className={cn(
          'rounded-md border border-[var(--soft-border)] bg-[var(--paper-surface)] p-3',
          className,
        )}
        aria-hidden="true"
      >
        <div className="flex items-center gap-2 font-mono text-[9px] text-[var(--muted-graphite)]">
          <ListChecks className="h-3.5 w-3.5 text-[var(--brand-orange-text)]" />
          <span>QA / Check design</span>
        </div>
        <div className="mt-2.5 space-y-1.5 font-mono text-[9px]">
          {(['State', 'Action', 'Evidence'] as const).map((label) => (
            <div key={label} className="flex items-center gap-2">
              <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-[var(--brand-orange)] text-[8px] text-[var(--brand-orange-text)]">
                ✓
              </span>
              <span className="text-[var(--graphite)]">{label}</span>
              <span className="h-1 flex-1 rounded-full bg-[var(--soft-border)]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (resolvedKind === 'dom') {
    return (
      <div
        data-preview-kind="dom"
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
          <span className="ml-1 font-mono text-[8px] text-[var(--muted-graphite)]">
            index.html
          </span>
        </div>
        <div className="space-y-1 p-2.5 font-mono text-[8.5px] leading-4">
          <div className="text-[var(--muted-graphite)]">
            &lt;<span className="text-[var(--graphite)]">form</span>&gt;
          </div>
          <div className="pl-2.5 text-[var(--muted-graphite)]">
            &lt;<span className="text-[var(--graphite)]">label</span> for=
            <span className="text-[var(--brand-orange-text)]">&quot;email&quot;</span>&gt;
          </div>
          <div className="flex items-center justify-between gap-1.5 pl-2.5">
            <span className="inline-flex items-center gap-1 rounded border border-[var(--brand-orange)]/50 bg-[var(--orange-tint)]/45 px-1.5 py-0.5 text-[8px] text-[var(--brand-orange-text)]">
              <MousePointer2 className="h-2.5 w-2.5 shrink-0" />
              &lt;button&gt;Sign in&lt;/button&gt;
            </span>
          </div>
          <div className="text-[var(--muted-graphite)]">&lt;/form&gt;</div>
        </div>
      </div>
    );
  }

  if (resolvedKind === 'first-test') {
    return (
      <div
        data-preview-kind="first-test"
        className={cn(
          'overflow-hidden rounded-md border border-[var(--soft-border)] bg-[var(--paper-surface)] p-3 font-mono text-[9px] leading-4',
          className,
        )}
        aria-hidden="true"
      >
        <div className="flex items-center gap-2 text-[var(--muted-graphite)]">
          <Code2 className="h-3 w-3 text-[var(--brand-orange-text)]" />
          <span>first.spec.ts</span>
        </div>
        <div className="mt-1.5 text-[var(--muted-graphite)]">
          <span className="text-[var(--brand-orange-text)]">const</span> user = &#123;
          role: <span className="text-[var(--graphite)]">&apos;QA&apos;</span> &#125;;
        </div>
        <div className="text-[var(--muted-graphite)]">
          <span className="text-[var(--brand-orange-text)]">test</span>(
          <span className="text-[var(--graphite)]">&apos;sign in&apos;</span>, async () =&gt;
        </div>
        <div className="pl-3 text-[var(--muted-graphite)]">
          <span className="text-[var(--brand-orange-text)]">await</span> page.goto(...)
        </div>
      </div>
    );
  }

  return (
    <div
      data-preview-kind="locators"
      className={cn(
        'overflow-hidden rounded-md border border-[var(--soft-border)] bg-[var(--paper-surface)] p-3 font-mono text-[9px] leading-4',
        className,
      )}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between gap-2 text-[var(--muted-graphite)]">
        <span className="flex items-center gap-1.5">
          <Crosshair className="h-3 w-3 text-[var(--brand-orange-text)]" />
          <span>getByRole</span>
        </span>
        <span className="rounded border border-[var(--brand-orange)]/40 bg-[var(--orange-tint)]/55 px-1.5 py-0.5 text-[8px] text-[var(--brand-orange-text)]">
          1 match
        </span>
      </div>
      <div className="mt-2 text-[var(--graphite)]">
        page.<span className="text-[var(--brand-orange-text)]">getByRole</span>(
      </div>
      <div className="pl-3 text-[var(--muted-graphite)]">
        <span className="text-[var(--graphite)]">&apos;button&apos;</span>, &#123; name:{' '}
        <span className="text-[var(--brand-orange-text)]">&apos;Checkout&apos;</span> &#125;
      </div>
      <div className="text-[var(--graphite)]">)</div>
    </div>
  );
}
