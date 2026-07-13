import { Link } from '@tanstack/react-router';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface QuestCardProps {
  locale: string;
  title: string;
  type: string;
  difficulty: string;
  difficultyLabel: string;
  xp: number;
  slug: string;
  questLabel: string;
}

export function QuestCard({
  locale,
  title,
  type,
  difficulty,
  difficultyLabel,
  xp,
  slug,
  questLabel,
}: QuestCardProps) {
  return (
    <Link
      to="/$locale/challenges/$slug"
      params={{ locale, slug }}
      className="group block h-full rounded-[1.25rem] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
    >
      <article className="paper-surface relative flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-border bg-card p-6 shadow-[0_14px_34px_rgba(73,62,45,0.08)] transition duration-200 group-hover:-translate-y-1 group-hover:border-primary/45 group-hover:shadow-[0_18px_40px_rgba(73,62,45,0.12)]">
        <div
          className="absolute right-0 top-0 size-24 rounded-bl-full bg-accent/10"
          aria-hidden="true"
        />
        <div className="relative flex items-center justify-between gap-3">
          <Badge variant={difficulty === 'MEDIUM' ? 'default' : 'secondary'}>
            {difficultyLabel}
          </Badge>
          <span className="flex items-center gap-1 text-sm font-bold text-primary">
            <Sparkles className="size-4" /> +{xp} XP
          </span>
        </div>
        <p className="relative mt-6 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
          {questLabel}
        </p>
        <h3 className="relative mt-2 font-display text-2xl font-semibold leading-tight text-foreground">
          {title}
        </h3>
        <div className="relative mt-auto flex items-center justify-between pt-8 text-sm font-semibold text-muted-foreground">
          <span>{type}</span>
          <ArrowUpRight className="size-5 text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </article>
    </Link>
  );
}
