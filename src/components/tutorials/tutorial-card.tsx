import { Link } from '@tanstack/react-router';
import { ArrowUpRight, BookOpen, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { TutorialProgressState } from './tutorial-progress-state';
import { getTutorialStage, type TutorialListItem } from './tutorial-types';

interface TutorialCardProps {
  tutorial: TutorialListItem;
  locale: string;
}

export function TutorialCard({ tutorial, locale }: TutorialCardProps) {
  const { t } = useTranslation('tutorials');
  const stage = getTutorialStage(tutorial.tags);
  const topic = tutorial.tags.find((tag) => tag.toLowerCase() !== stage);

  return (
    <Link
      to="/$locale/tutorials/$slug"
      params={{ locale, slug: tutorial.slug }}
      className="group block h-full rounded-[1.25rem] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
    >
      <article className="paper-surface relative flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-border bg-card p-5 shadow-[0_14px_34px_rgba(73,62,45,0.08)] transition duration-200 group-hover:-translate-y-1 group-hover:border-primary/45 group-hover:shadow-[0_18px_40px_rgba(73,62,45,0.12)] sm:p-6">
        <div
          aria-hidden="true"
          className="absolute right-0 top-0 size-24 rounded-bl-full bg-accent/15"
        />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                {t(`tracks.${stage}`)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t('card.guideNumber', { number: tutorial.order })}
              </p>
            </div>
          </div>
          <TutorialProgressState
            isCompleted={tutorial.isCompleted}
            readingProgress={tutorial.readingProgress}
            compact
          />
        </div>

        <h2 className="relative mt-6 font-display text-2xl font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
          {tutorial.title}
        </h2>
        <p className="relative mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
          {tutorial.description}
        </p>

        <div className="relative mt-5 flex flex-wrap gap-1.5">
          {topic && <Badge variant="secondary">{topic}</Badge>}
          {tutorial.tags.slice(0, 3).map((tag) =>
            tag === topic ? null : (
              <Badge key={tag} variant="outline" className="bg-card/70">
                {tag}
              </Badge>
            ),
          )}
        </div>

        {!tutorial.isCompleted && tutorial.readingProgress > 0 && (
          <div className="relative mt-5 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${tutorial.readingProgress}%` }}
            />
          </div>
        )}

        <div className="relative mt-auto flex items-center justify-between border-t border-border/70 pt-5 text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="size-4" aria-hidden="true" />
            {t('card.estimatedTime', { minutes: tutorial.estimatedMinutes })}
          </span>
          <span className="flex items-center gap-1 font-semibold text-primary">
            {tutorial.isCompleted
              ? t('card.reviewTutorial')
              : tutorial.readingProgress > 0
                ? t('card.continueTutorial')
                : t('card.startTutorial')}
            <ArrowUpRight
              className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </span>
        </div>
      </article>
    </Link>
  );
}
