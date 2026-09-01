import { cn } from '@/lib/utils';

export { QaEngineerIllustration } from '@/components/qa-engineer-illustration';

export type QaDoodleKind = 'bug' | 'check' | 'cursor' | 'magnifier' | 'trace';
export type QaAnnotationStep = 'inspect' | 'execute' | 'verify';

const annotationCopy: Record<
  QaAnnotationStep,
  { number: string; label: string }
> = {
  inspect: { number: '01', label: 'INSPECT' },
  execute: { number: '02', label: 'RUN' },
  verify: { number: '03', label: 'VERIFY' },
};

/** Small, theme-aware marks shared by public QA illustrations. */
export function QaDoodle({
  kind,
  className,
  label,
}: {
  kind: QaDoodleKind;
  className?: string;
  label?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn('h-10 w-10', className)}
      fill="none"
      stroke="var(--graphite)"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      data-qa-doodle={kind}
    >
      {kind === 'bug' && (
        <>
          <path
            d="M24 14v-3M18 16l-3-3M30 16l3-3M16 23h-5M16 29h-5M32 23h5M32 29h5"
            stroke="var(--brand-orange)"
          />
          <path
            d="M17 25c0-6 3-10 7-10s7 4 7 10v5c0 4-3 7-7 7s-7-3-7-7Z"
            fill="var(--orange-tint)"
          />
          <path d="M20 22h8M20 28h8M24 15v22" stroke="var(--brand-orange)" />
          <circle cx="21" cy="20" r="1" fill="var(--graphite)" stroke="none" />
          <circle cx="27" cy="20" r="1" fill="var(--graphite)" stroke="none" />
        </>
      )}

      {kind === 'check' && (
        <>
          <circle
            cx="24"
            cy="24"
            r="15"
            fill="var(--paper-surface)"
            stroke="var(--brand-success)"
          />
          <path
            d="m17 24 5 5 10-11"
            stroke="var(--brand-success)"
            strokeWidth="2"
          />
          <path
            d="M24 5v4M24 39v4M5 24h4M39 24h4"
            stroke="var(--brand-orange)"
          />
        </>
      )}

      {kind === 'cursor' && (
        <>
          <path
            d="m11 6 23 21-10 1 6 11-6 3-6-12-7 7Z"
            fill="var(--paper-surface)"
            stroke="var(--brand-orange)"
          />
          <path d="M32 10v5M38 16h-5M36 8l-3 3" stroke="var(--brand-orange)" />
        </>
      )}

      {kind === 'magnifier' && (
        <>
          <circle
            cx="21"
            cy="21"
            r="11"
            fill="var(--paper-surface)"
            stroke="var(--brand-orange)"
          />
          <path d="m29 29 9 9" stroke="var(--brand-orange)" strokeWidth="2" />
          <path d="M17 21h8M21 17v8" stroke="var(--graphite)" />
          <path
            d="M8 11V7h4M37 11V7h-4M8 37v4h4"
            stroke="var(--muted-graphite)"
          />
        </>
      )}

      {kind === 'trace' && (
        <>
          <path
            d="M8 32c7-13 12 3 18-10 5-10 8 1 14-7"
            stroke="var(--brand-orange)"
            strokeDasharray="3 4"
          />
          <circle
            cx="8"
            cy="32"
            r="3"
            fill="var(--paper-surface)"
            stroke="var(--brand-orange)"
          />
          <circle
            cx="26"
            cy="22"
            r="3"
            fill="var(--paper-surface)"
            stroke="var(--brand-orange)"
          />
          <circle
            cx="40"
            cy="15"
            r="3"
            fill="var(--brand-success)"
            stroke="var(--brand-success)"
          />
          <path d="m37 12 3 3-3 3" stroke="var(--paper-surface)" />
        </>
      )}
    </svg>
  );
}

function AnnotationArrow({ direction }: { direction: 'right' | 'down' }) {
  const vertical = direction === 'down';

  return (
    <svg
      viewBox={vertical ? '0 0 16 20' : '0 0 20 16'}
      className={vertical ? 'h-5 w-4 shrink-0' : 'h-4 w-5 shrink-0'}
      fill="none"
      aria-hidden="true"
    >
      <path
        d={
          vertical
            ? 'M8 1v14M8 15l-4-4M8 15l4-4'
            : 'M1 8h14M15 8l-5-5M15 8l-5 5'
        }
        stroke="var(--brand-orange)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

export function QaAnnotation({
  step,
  arrow = 'before',
  direction = 'right',
  className,
}: {
  step: QaAnnotationStep;
  arrow?: 'before' | 'after';
  direction?: 'right' | 'down';
  className?: string;
}) {
  const copy = annotationCopy[step];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 font-mono text-[11px] text-[var(--brand-orange)]',
        className,
      )}
      aria-label={`${copy.number} ${copy.label}`}
      data-qa-annotation={step}
    >
      {arrow === 'before' && <AnnotationArrow direction={direction} />}
      <span>
        {copy.number} / {copy.label}
      </span>
      {arrow === 'after' && <AnnotationArrow direction={direction} />}
    </span>
  );
}
