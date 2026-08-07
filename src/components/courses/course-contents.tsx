import { CheckCircle2, Clock3, ListTree, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type {
  CourseContentDocument,
  CourseManifest,
} from '@/lib/course-content.types';
import { getCourseCheckpointHref } from '@/lib/course-navigation';
import { cn } from '@/lib/utils';

interface CourseContentsProps {
  manifest: CourseManifest;
  content: CourseContentDocument;
  locale: 'id';
  completedCheckpointSlugs?: readonly string[];
  capstoneCompleted?: boolean;
  currentCheckpointSlug?: string;
  mode?: 'both' | 'desktop' | 'mobile';
}

interface CourseContentsItem {
  kind: 'checkpoint' | 'capstone';
  slug: string;
  order: number;
  title: string;
  href: string;
  durationMinutes?: number;
  completed: boolean;
  current: boolean;
}

function getCourseContentsItems({
  manifest,
  content,
  locale,
  completedCheckpointSlugs = [],
  capstoneCompleted = false,
  currentCheckpointSlug,
}: CourseContentsProps): CourseContentsItem[] {
  const completed = new Set(completedCheckpointSlugs);
  const contentBySlug = new Map(
    content.checkpoints.map((checkpoint) => [checkpoint.slug, checkpoint]),
  );
  const orderedCheckpoints = [...manifest.checkpoints].sort(
    (a, b) => a.order - b.order,
  );

  const checkpointItems = orderedCheckpoints.flatMap((manifestCheckpoint) => {
    const checkpoint = contentBySlug.get(manifestCheckpoint.slug);
    if (!checkpoint) return [];

    return [
      {
        kind: 'checkpoint' as const,
        slug: checkpoint.slug,
        order: manifestCheckpoint.order,
        title: checkpoint.title,
        href: getCourseCheckpointHref(locale, manifest.slug, checkpoint.slug),
        durationMinutes: checkpoint.video.durationMinutes,
        completed: completed.has(checkpoint.slug),
        current: checkpoint.slug === currentCheckpointSlug,
      },
    ];
  });

  const finalCheckpoint = orderedCheckpoints.at(-1);
  const capstoneHref = finalCheckpoint
    ? `${getCourseCheckpointHref(
        locale,
        manifest.slug,
        finalCheckpoint.slug,
      )}#capstone`
    : `/${locale}/courses/${manifest.slug}`;

  return [
    ...checkpointItems,
    {
      kind: 'capstone',
      slug: content.capstone.id,
      order: orderedCheckpoints.length + 1,
      title: content.capstone.title,
      href: capstoneHref,
      durationMinutes: content.capstone.video.durationMinutes,
      completed: capstoneCompleted,
      current: false,
    },
  ];
}

function CourseContentsList({
  items,
  closeOnSelect = false,
}: {
  items: CourseContentsItem[];
  closeOnSelect?: boolean;
}) {
  const { t } = useTranslation('courses');

  return (
    <ol className="space-y-2" data-testid="course-contents-list">
      {items.map((item) => {
        const link = (
          <a
            href={item.href}
            className={cn(
              'group flex gap-3 rounded-xl border p-3 transition-colors',
              item.current
                ? 'border-primary/50 bg-primary/[0.08]'
                : 'border-border/70 bg-background hover:border-primary/40 hover:bg-accent',
            )}
            data-testid={`course-contents-item-${item.slug}`}
            data-current={item.current}
            data-completed={item.completed}
          >
            <span
              className={cn(
                'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-bold',
                item.completed
                  ? 'border-primary/30 bg-primary/15 text-primary'
                  : item.current
                    ? 'border-primary/50 text-primary'
                    : 'border-border bg-muted/30 text-muted-foreground',
              )}
            >
              {item.completed ? (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              ) : item.kind === 'capstone' ? (
                <Target className="h-4 w-4" aria-hidden="true" />
              ) : (
                item.order
              )}
            </span>
            <span className="min-w-0 flex-1 space-y-1">
              <span className="flex flex-wrap items-center gap-1.5">
                <span className="min-w-0 flex-1 text-sm font-semibold leading-5">
                  {item.title}
                </span>
                {item.current && (
                  <Badge variant="secondary" className="text-[10px]">
                    {t('learnerShell.current')}
                  </Badge>
                )}
              </span>
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>
                  {item.completed
                    ? t('learnerShell.completed')
                    : item.kind === 'capstone'
                      ? t('learnerShell.capstone')
                      : t('learnerShell.incomplete')}
                </span>
                {item.durationMinutes !== undefined && (
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3 w-3" aria-hidden="true" />
                    {t('overview.duration', {
                      minutes: item.durationMinutes,
                    })}
                  </span>
                )}
              </span>
            </span>
          </a>
        );

        return (
          <li key={item.slug}>
            {closeOnSelect ? <SheetClose asChild>{link}</SheetClose> : link}
          </li>
        );
      })}
    </ol>
  );
}

function CourseContentsSummary({
  items,
  compact = false,
}: {
  items: CourseContentsItem[];
  compact?: boolean;
}) {
  const { t } = useTranslation('courses');
  const completedCount = items.filter((item) => item.completed).length;
  const progressPercent = Math.round((completedCount / items.length) * 100);

  return (
    <div className={cn('space-y-3', compact && 'space-y-2')}>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold">{t('learnerShell.contents')}</span>
        <span className="text-muted-foreground">
          {completedCount}/{items.length}
        </span>
      </div>
      <Progress
        value={progressPercent}
        aria-label={t('learnerShell.progress')}
        data-testid="course-contents-progress"
      />
      <p className="text-xs leading-5 text-muted-foreground">
        {t('learnerShell.progress', {
          completed: completedCount,
          total: items.length,
        })}
      </p>
    </div>
  );
}

export function CourseContents({
  manifest,
  content,
  locale,
  completedCheckpointSlugs,
  capstoneCompleted,
  currentCheckpointSlug,
  mode = 'both',
}: CourseContentsProps) {
  const { t } = useTranslation('courses');
  const items = getCourseContentsItems({
    manifest,
    content,
    locale,
    completedCheckpointSlugs,
    capstoneCompleted,
    currentCheckpointSlug,
  });
  const resumeItem = items.find((item) => !item.completed);

  return (
    <>
      {mode !== 'mobile' && (
        <div className="hidden lg:block" data-testid="course-contents-desktop">
          <div className="space-y-5 rounded-2xl border border-border bg-card p-4 hard-shadow-sm">
            <div className="flex items-center gap-2">
              <ListTree className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-bold">
                {t('learnerShell.contents')}
              </h2>
            </div>
            <CourseContentsSummary items={items} />
            {resumeItem ? (
              <Button asChild variant="outline" className="w-full">
                <a href={resumeItem.href} data-testid="course-resume-link">
                  {t('learnerShell.resume')}
                </a>
              </Button>
            ) : (
              <p className="rounded-lg border border-primary/30 bg-primary/[0.04] p-3 text-sm leading-6 text-muted-foreground">
                {t('learnerShell.allComplete')}
              </p>
            )}
            <CourseContentsList items={items} />
          </div>
        </div>
      )}

      {mode !== 'desktop' && (
        <div className="lg:hidden" data-testid="course-contents-mobile">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="inline-flex items-center gap-2">
                  <ListTree
                    className="h-4 w-4 text-primary"
                    aria-hidden="true"
                  />
                  {t('learnerShell.openContents')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {items.filter((item) => item.completed).length}/{items.length}
                </span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[min(24rem,calc(100vw-1.5rem))] overflow-y-auto"
            >
              <SheetHeader className="pr-8 text-left">
                <SheetTitle>{t('learnerShell.contents')}</SheetTitle>
                <SheetDescription>
                  {t('learnerShell.contentsDescription')}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <CourseContentsSummary items={items} compact />
                <CourseContentsList items={items} closeOnSelect />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}
    </>
  );
}

export { getCourseContentsItems };
