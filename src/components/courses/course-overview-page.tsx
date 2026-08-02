import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock3,
  ExternalLink,
  ListChecks,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type {
  CourseContentDocument,
  CourseManifest,
} from '@/lib/course-content.types';
import { cn } from '@/lib/utils';

export interface CourseOverviewData {
  manifest: CourseManifest;
  content: CourseContentDocument;
  completedCheckpointSlugs: readonly string[];
  capstoneCompleted: boolean;
}

interface CourseOverviewPageProps {
  course: CourseOverviewData;
  locale: 'id';
}

function CourseOverviewPage({ course, locale }: CourseOverviewPageProps) {
  const { t } = useTranslation('courses');
  const { manifest, content, completedCheckpointSlugs, capstoneCompleted } =
    course;
  const completed = new Set(completedCheckpointSlugs);
  const courseSlug = manifest.slug;
  const orderedCheckpoints = [...manifest.checkpoints].sort(
    (a, b) => a.order - b.order,
  );
  const contentBySlug = new Map(
    content.checkpoints.map((checkpoint) => [checkpoint.slug, checkpoint]),
  );

  return (
    <main
      className="min-h-screen bg-background px-4 py-8 md:px-8 md:py-12"
      data-testid="course-overview"
    >
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 hard-shadow md:p-10">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative max-w-3xl space-y-5">
            <Badge variant="outline" className="gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              {t('overview.language')}
            </Badge>
            <div className="space-y-3">
              <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                {content.overview.title}
              </h1>
              <p className="text-lg leading-8 text-muted-foreground md:text-xl">
                {content.overview.subtitle}
              </p>
            </div>
            <Button asChild size="lg">
              <a href="#start-here">
                {t('overview.startHere')}
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </header>

        <div className="grid gap-5 md:grid-cols-2">
          <InfoCard
            icon={<Target className="h-5 w-5" />}
            title={t('overview.targetAudience')}
            description={content.overview.targetAudience}
          />
          <InfoCard
            icon={<Sparkles className="h-5 w-5" />}
            title={t('overview.outcome')}
            description={content.overview.outcome}
          />
        </div>

        <section id="start-here" className="scroll-mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Play className="h-5 w-5 text-primary" />
                {content.overview.startHere.title}
              </CardTitle>
              <CardDescription className="max-w-3xl text-base leading-7">
                {content.overview.startHere.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-8 md:grid-cols-2">
              <div>
                <h2 className="mb-3 font-semibold">
                  {t('overview.prerequisites')}
                </h2>
                <BulletList items={content.overview.prerequisites} />
              </div>
              <div>
                <h2 className="mb-3 font-semibold">
                  {t('overview.setupRequirements')}
                </h2>
                <BulletList items={content.overview.setupRequirements} />
              </div>
              <div className="md:col-span-2">
                <h2 className="mb-3 font-semibold">
                  {t('overview.startHere')}
                </h2>
                <ol className="grid gap-3 md:grid-cols-2">
                  {content.overview.startHere.steps.map((step, index) => (
                    <li
                      key={step}
                      className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/20 p-3 text-sm leading-6"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="checkpoints" className="scroll-mt-6 space-y-5">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">
                {t('overview.recommendedSequence')}
              </p>
              <h2 className="text-2xl font-bold md:text-3xl">
                {t('overview.checkpoints')}
              </h2>
              <p className="mt-2 max-w-3xl leading-7 text-muted-foreground">
                {content.overview.recommendedSequence}
              </p>
            </div>
            <Badge variant="secondary" className="w-fit gap-1.5">
              <ListChecks className="h-3.5 w-3.5" />
              {t('overview.progress', {
                completed: completedCheckpointSlugs.length,
                total: orderedCheckpoints.length,
              })}
            </Badge>
          </div>

          <ol className="grid gap-4">
            {orderedCheckpoints.map((checkpoint) => {
              const checkpointContent = contentBySlug.get(checkpoint.slug);
              if (!checkpointContent) return null;

              const isCompleted = completed.has(checkpoint.slug);
              const checkpointHref = `/${locale}/courses/${courseSlug}/checkpoints/${checkpoint.slug}`;

              return (
                <li key={checkpoint.slug}>
                  <Card
                    className={cn(
                      'transition-colors',
                      isCompleted && 'border-primary/40 bg-primary/[0.03]',
                    )}
                    data-testid={`course-checkpoint-${checkpoint.slug}`}
                    data-completed={isCompleted}
                  >
                    <CardContent className="flex flex-col gap-5 p-5 md:flex-row md:items-center md:p-6">
                      <div className="flex items-start gap-4 md:flex-1">
                        <div
                          className={cn(
                            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-lg font-bold',
                            isCompleted
                              ? 'border-primary/30 bg-primary/15 text-primary'
                              : 'border-border bg-muted/30 text-muted-foreground',
                          )}
                        >
                          {checkpoint.order}
                        </div>
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold">
                              {checkpointContent.title}
                            </h3>
                            <Badge
                              variant={isCompleted ? 'default' : 'outline'}
                              className="gap-1"
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              ) : (
                                <Circle className="h-3.5 w-3.5" />
                              )}
                              {isCompleted
                                ? t('overview.completed')
                                : t('overview.incomplete')}
                            </Badge>
                          </div>
                          <p className="leading-6 text-muted-foreground">
                            {checkpointContent.objective}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Clock3 className="h-3.5 w-3.5" />
                              {t('overview.duration', {
                                minutes:
                                  checkpointContent.video.durationMinutes,
                              })}
                            </span>
                            <span>{checkpoint.repositoryPath}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        asChild
                        variant={isCompleted ? 'outline' : 'default'}
                      >
                        <a
                          href={checkpointHref}
                          data-testid={`course-checkpoint-link-${checkpoint.slug}`}
                        >
                          {t('overview.openCheckpoint')}
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ol>
        </section>

        <section id="capstone" className="scroll-mt-6">
          <Card
            className="border-primary/30 bg-primary/[0.04]"
            data-testid="course-capstone"
          >
            <CardHeader>
              <div className="flex flex-wrap items-center gap-3">
                <CardTitle className="text-2xl">
                  {t('overview.capstone')}
                </CardTitle>
                <Badge variant={capstoneCompleted ? 'default' : 'outline'}>
                  {capstoneCompleted
                    ? t('overview.completed')
                    : t('overview.incomplete')}
                </Badge>
              </div>
              <CardDescription className="max-w-3xl text-base leading-7">
                {content.overview.outcome}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
              <div>
                <h2 className="mb-3 font-semibold">{content.capstone.title}</h2>
                <p className="leading-7 text-muted-foreground">
                  {t('overview.capstoneDescription')}
                </p>
              </div>
              <div>
                <h2 className="mb-3 font-semibold">
                  {t('overview.capstoneRequirements')}
                </h2>
                <BulletList items={content.capstone.requirements} />
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

function InfoCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
          {icon}
        </div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="leading-7 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm leading-6">
          <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export { CourseOverviewPage };
