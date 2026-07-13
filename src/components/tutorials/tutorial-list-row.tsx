import { Link } from '@tanstack/react-router';
import { ArrowRight, BookOpen, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { TutorialProgressState } from './tutorial-progress-state';
import { getTutorialStage, type TutorialListItem } from './tutorial-types';

interface TutorialListRowProps {
  tutorial: TutorialListItem;
  locale: string;
}

export function TutorialListRow({ tutorial, locale }: TutorialListRowProps) {
  const { t } = useTranslation('tutorials');
  const stage = getTutorialStage(tutorial.tags);

  return (
    <Link
      to="/$locale/tutorials/$slug"
      params={{ locale, slug: tutorial.slug }}
      className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
    >
      <article className="paper-surface grid gap-4 rounded-2xl border border-border bg-card p-4 shadow-[0_10px_24px_rgba(73,62,45,0.06)] transition duration-200 group-hover:border-primary/45 group-hover:shadow-[0_14px_30px_rgba(73,62,45,0.1)] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-5 sm:p-5">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
          {tutorial.order}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{t(`tracks.${stage}`)}</Badge>
            <TutorialProgressState
              isCompleted={tutorial.isCompleted}
              readingProgress={tutorial.readingProgress}
              compact
            />
          </div>
          <h2 className="mt-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary sm:text-xl">
            {tutorial.title}
          </h2>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {tutorial.description}
          </p>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-border/70 pt-3 text-sm sm:border-t-0 sm:pt-0">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="size-4" aria-hidden="true" />
            {t('card.estimatedTimeShort', {
              minutes: tutorial.estimatedMinutes,
            })}
          </span>
          <span className="flex items-center gap-1 font-semibold text-primary">
            <span className="sr-only">
              {t('card.openTutorial', { title: tutorial.title })}
            </span>
            <BookOpen className="size-4 sm:hidden" aria-hidden="true" />
            <ArrowRight
              className="hidden size-4 transition-transform group-hover:translate-x-0.5 sm:block"
              aria-hidden="true"
            />
          </span>
        </div>
      </article>
    </Link>
  );
}
