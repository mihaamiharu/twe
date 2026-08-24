import { Link } from '@tanstack/react-router';
import { ArrowRight, Check, Lock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PracticeChallengeItemData {
  slug: string;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  xpReward: number;
  completionCount?: number;
  isCompleted: boolean;
  tags?: string[] | null;
}

interface PracticeChallengeItemProps {
  challenge: PracticeChallengeItemData;
  locale: string;
  typeLabel: string;
  difficultyLabel: string;
  categoryLabel: string;
  tierLabel: string;
  completionCountLabel: string;
  completedLabel: string;
  comingSoonLabel: string;
  startLabel: string;
  reviewLabel: string;
}

const difficultyStyles: Record<string, string> = {
  EASY: 'border-brand-success/25 bg-brand-success/8 text-brand-success',
  MEDIUM: 'border-brand-warning/30 bg-brand-warning/10 text-brand-warning',
  HARD: 'border-brand-error/25 bg-brand-error/8 text-brand-error',
};

function DifficultyPill({
  difficulty,
  label,
}: {
  difficulty: string;
  label: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-medium',
        difficultyStyles[difficulty] ??
          'border-border bg-muted text-muted-foreground',
      )}
    >
      {label}
    </span>
  );
}

function ChallengeItemContent({
  challenge,
  typeLabel,
  difficultyLabel,
  categoryLabel,
  tierLabel,
  completionCountLabel,
  completedLabel,
  comingSoonLabel,
  startLabel,
  reviewLabel,
}: Omit<PracticeChallengeItemProps, 'locale'>) {
  const isComingSoon = challenge.tags?.includes('coming-soon') ?? false;
  const actionLabel = challenge.isCompleted ? reviewLabel : startLabel;

  return (
    <div
      className={cn(
        'grid gap-x-5 gap-y-2 px-4 py-3.5 transition-colors sm:px-5 lg:grid-cols-[minmax(0,1fr)_minmax(26.5rem,auto)] lg:items-center lg:py-3.5',
        isComingSoon
          ? 'opacity-55'
          : 'group-hover:bg-foreground/[0.025] group-focus-visible:bg-foreground/[0.025]',
      )}
      data-testid="challenge-list-row"
    >
      <div className="min-w-0 lg:self-center">
        <div className="mb-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          <span>{typeLabel}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate normal-case tracking-normal">
            {categoryLabel}
          </span>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] tracking-[0.08em]">
            {tierLabel}
          </span>
          {isComingSoon && (
            <span className="inline-flex items-center gap-1 tracking-[0.08em]">
              <Lock className="h-3 w-3" aria-hidden="true" />
              {comingSoonLabel}
            </span>
          )}
        </div>
        <h3 className="truncate text-[15px] font-semibold leading-5 tracking-[-0.01em] text-foreground sm:text-base">
          {challenge.title}
        </h3>
        <p className="mt-0.5 line-clamp-2 text-sm leading-5 text-muted-foreground">
          {challenge.description}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs sm:gap-x-5 lg:grid lg:grid-cols-[5rem_6.5rem_5rem_5rem_minmax(4.5rem,auto)] lg:items-center lg:gap-x-3">
        <div
          className="lg:justify-self-start"
          data-testid="challenge-row-difficulty"
        >
          <DifficultyPill
            difficulty={challenge.difficulty}
            label={difficultyLabel}
          />
        </div>

        {challenge.isCompleted && !isComingSoon ? (
          <span
            className="order-3 inline-flex min-h-7 items-center gap-1 whitespace-nowrap text-xs font-medium text-brand-success lg:order-none lg:justify-self-start"
            data-testid="challenge-row-completion"
          >
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            {completedLabel}
          </span>
        ) : (
          <span
            className="order-3 hidden min-h-7 items-center lg:inline-flex lg:order-none"
            aria-hidden="true"
            data-testid="challenge-row-completion"
          />
        )}

        {!isComingSoon && challenge.completionCount !== undefined && (
          <span
            className="order-5 inline-flex items-center whitespace-nowrap text-xs tabular-nums text-muted-foreground lg:order-none lg:justify-self-start"
            aria-label={completionCountLabel}
          >
            {completionCountLabel}
          </span>
        )}

        {!isComingSoon && (
          <span
            className="order-2 inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium tabular-nums text-muted-foreground lg:order-none lg:justify-self-end"
            data-testid="challenge-row-xp"
          >
            <Zap className="h-3.5 w-3.5 text-brand-orange" aria-hidden="true" />
            {challenge.xpReward} XP
          </span>
        )}

        {!isComingSoon && (
          <span
            className="order-4 ml-auto inline-flex min-h-7 items-center gap-1 whitespace-nowrap text-xs font-medium text-muted-foreground transition-colors group-hover:text-brand-orange lg:order-none lg:ml-0 lg:justify-self-end"
            data-testid="challenge-row-action"
          >
            {actionLabel}
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        )}
      </div>
    </div>
  );
}

export function PracticeChallengeRow(props: PracticeChallengeItemProps) {
  const isComingSoon = props.challenge.tags?.includes('coming-soon') ?? false;
  const content = <ChallengeItemContent {...props} />;

  if (isComingSoon) {
    return (
      <div
        className="relative border-b border-border last:border-b-0"
        aria-label={props.comingSoonLabel}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      to="/$locale/practice/$slug"
      params={{ locale: props.locale, slug: props.challenge.slug }}
      className="group relative block border-b border-border outline-none last:border-b-0 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange"
    >
      {content}
    </Link>
  );
}

export function PracticeChallengeGridCard(props: PracticeChallengeItemProps) {
  const isComingSoon = props.challenge.tags?.includes('coming-soon') ?? false;
  const content = (
    <div
      className={cn(
        'flex min-h-[172px] flex-col justify-between bg-card p-4 transition-colors',
        isComingSoon
          ? 'opacity-55'
          : 'group-hover:bg-foreground/[0.025] group-focus-visible:bg-foreground/[0.025]',
      )}
    >
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          <span className="flex min-w-0 items-center gap-2">
            <span>{props.typeLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate normal-case tracking-normal">
              {props.categoryLabel}
            </span>
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] tracking-[0.08em]">
            {props.tierLabel}
          </span>
          {props.challenge.isCompleted && !isComingSoon && (
            <Check
              className="h-3.5 w-3.5 text-brand-success"
              aria-label={props.completedLabel}
            />
          )}
        </div>
        <h3 className="text-base font-semibold tracking-[-0.01em] text-foreground">
          {props.challenge.title}
        </h3>
        <p className="mt-1 line-clamp-3 text-sm leading-5 text-muted-foreground">
          {props.challenge.description}
        </p>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <DifficultyPill
            difficulty={props.challenge.difficulty}
            label={props.difficultyLabel}
          />
          {props.challenge.completionCount !== undefined && (
            <span className="text-xs tabular-nums text-muted-foreground">
              {props.completionCountLabel}
            </span>
          )}
          {!isComingSoon && (
            <span className="inline-flex items-center gap-1 text-xs font-medium tabular-nums text-muted-foreground">
              <Zap
                className="h-3.5 w-3.5 text-brand-orange"
                aria-hidden="true"
              />
              {props.challenge.xpReward} XP
            </span>
          )}
        </div>
        {!isComingSoon && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-brand-orange">
            {props.challenge.isCompleted ? props.reviewLabel : props.startLabel}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        )}
      </div>
    </div>
  );

  if (isComingSoon) {
    return <div aria-label={props.comingSoonLabel}>{content}</div>;
  }

  return (
    <Link
      to="/$locale/practice/$slug"
      params={{ locale: props.locale, slug: props.challenge.slug }}
      className="group block outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
    >
      {content}
    </Link>
  );
}
