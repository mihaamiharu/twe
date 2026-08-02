import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  FileCheck2,
  FolderOpen,
  ListChecks,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { completeCourseCheckpoint } from '@/server/course-progress.fn';
import type {
  CourseCheckpointContent,
  CourseContentDocument,
  CourseManifest,
} from '@/lib/course-content.types';

export interface CourseCheckpointData {
  manifest: CourseManifest;
  content: CourseContentDocument;
  checkpoint: CourseCheckpointContent;
  completed: boolean;
}

interface CourseCheckpointPageProps {
  course: CourseCheckpointData;
  locale: 'id';
}

function CourseCheckpointPage({ course, locale }: CourseCheckpointPageProps) {
  const { t } = useTranslation('courses');
  const { checkpoint, content, manifest } = course;
  const [isCompleted, setIsCompleted] = useState(course.completed);
  const [exerciseConfirmed, setExerciseConfirmed] = useState(false);
  const [reflectionConfirmed, setReflectionConfirmed] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);

  const overviewHref = `/${locale}/courses/${manifest.slug}`;
  const nextManifestCheckpoint = manifest.checkpoints.find(
    (candidate) => candidate.order === checkpoint.order + 1,
  );
  const nextCheckpoint = nextManifestCheckpoint
    ? content.checkpoints.find(
        (candidate) => candidate.slug === nextManifestCheckpoint.slug,
      )
    : null;
  const nextCheckpointHref = nextManifestCheckpoint
    ? `/${locale}/courses/${manifest.slug}/checkpoints/${nextManifestCheckpoint.slug}`
    : null;

  const completionMutation = useMutation({
    mutationFn: async () => {
      const result = await completeCourseCheckpoint({
        data: {
          courseSlug: manifest.slug,
          locale,
          checkpointSlug: checkpoint.slug,
          completionId: checkpoint.completionAction.id,
          reflectionId: checkpoint.reflectionId,
          exerciseConfirmed: true,
          reflectionConfirmed: true,
        },
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: () => {
      setIsCompleted(true);
      setCompletionError(null);
      toast.success(t('checkpoint.completionSuccess'));
    },
    onError: (error) => {
      setCompletionError(
        error instanceof Error
          ? error.message
          : t('checkpoint.completionError'),
      );
    },
  });

  const canComplete = exerciseConfirmed && reflectionConfirmed;

  return (
    <main
      className="min-h-screen bg-background px-4 py-8 md:px-8 md:py-12"
      data-testid="course-checkpoint-01-requirements"
    >
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 hard-shadow md:p-10">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative max-w-4xl space-y-5">
            <Button asChild variant="ghost" size="sm" className="-ml-3">
              <a href={overviewHref}>
                <ArrowLeft className="h-4 w-4" />
                {t('checkpoint.backToCourse')}
              </a>
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                {t('checkpoint.badge', { order: checkpoint.order })}
              </Badge>
              <Badge variant="secondary">
                {t('overview.duration', {
                  minutes: checkpoint.video.durationMinutes,
                })}
              </Badge>
              {isCompleted && (
                <Badge className="gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t('overview.completed')}
                </Badge>
              )}
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                {checkpoint.title}
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-muted-foreground md:text-xl">
                {checkpoint.objective}
              </p>
            </div>
          </div>
        </header>

        <Card data-testid="course-checkpoint-objective">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Target className="h-5 w-5 text-primary" />
              {t('checkpoint.learningObjective')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="max-w-4xl text-lg leading-8 text-muted-foreground">
              {checkpoint.objective}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="course-checkpoint-video">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Play className="h-5 w-5 text-primary" />
                {t('checkpoint.video')}
              </CardTitle>
              <Badge variant="outline">
                {checkpoint.video.status === 'planned'
                  ? t('checkpoint.videoPlanned')
                  : t('checkpoint.videoReady')}
              </Badge>
            </div>
            <CardDescription className="text-base leading-7">
              {t('checkpoint.videoDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div>
              <h3 className="mb-2 text-lg font-semibold">
                {checkpoint.video.title}
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {t('overview.duration', {
                  minutes: checkpoint.video.durationMinutes,
                })}
              </p>
            </div>
            <p className="leading-7 text-muted-foreground">
              {checkpoint.video.focus}
            </p>
          </CardContent>
        </Card>

        <section data-testid="course-checkpoint-written-lesson">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <FileCheck2 className="h-5 w-5 text-primary" />
                {t('checkpoint.writtenLesson')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MarkdownRenderer content={checkpoint.writtenLesson} />
            </CardContent>
          </Card>
        </section>

        <Card data-testid="course-checkpoint-ai-activity">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="h-5 w-5 text-primary" />
              {t('checkpoint.aiActivity')}
            </CardTitle>
            <CardDescription className="max-w-4xl text-base leading-7">
              {checkpoint.aiActivity.goal}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-5">
              <h3 className="mb-2 font-semibold">{t('checkpoint.prompt')}</h3>
              <p className="leading-7 text-muted-foreground">
                {checkpoint.aiActivity.prompt}
              </p>
            </div>
            <div>
              <h3 className="mb-3 font-semibold">
                {t('checkpoint.learnerActions')}
              </h3>
              <ol className="grid gap-3 md:grid-cols-2">
                {checkpoint.aiActivity.learnerActions.map((action, index) => (
                  <li
                    key={action}
                    className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/20 p-4 text-sm leading-6"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                      {index + 1}
                    </span>
                    <span>{action}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">
                {t('checkpoint.expectedOutput')}
              </h3>
              <p className="leading-7 text-muted-foreground">
                {checkpoint.aiActivity.expectedOutput}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="course-checkpoint-local-exercise">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <FolderOpen className="h-5 w-5 text-primary" />
              {t('checkpoint.localExercise')}
            </CardTitle>
            <CardDescription className="max-w-4xl text-base leading-7">
              {t('checkpoint.repositoryGuidance')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="mb-3 font-semibold">
                {t('checkpoint.repositoryPaths')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {checkpoint.localExercise.repositoryPaths.map((path) => (
                  <code
                    key={path}
                    className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-primary"
                  >
                    {path}
                  </code>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-3 font-semibold">
                {t('checkpoint.instructions')}
              </h3>
              <BulletList items={checkpoint.localExercise.instructions} />
            </div>
            <div>
              <h3 className="mb-3 font-semibold">
                {t('checkpoint.expectedArtifacts')}
              </h3>
              <BulletList items={checkpoint.localExercise.expectedArtifacts} />
            </div>
            <div className="rounded-xl border border-destructive/30 bg-destructive/[0.04] p-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <CircleAlert className="h-5 w-5 text-primary" />
                {t('checkpoint.safetyNotes')}
              </h3>
              <BulletList items={checkpoint.localExercise.safetyNotes} />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="course-checkpoint-evidence">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <ListChecks className="h-5 w-5 text-primary" />
              {t('checkpoint.evidenceChecklist')}
            </CardTitle>
            <CardDescription className="text-base leading-7">
              {t('checkpoint.evidenceDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BulletList items={checkpoint.evidenceChecklist} />
          </CardContent>
        </Card>

        <Card data-testid="course-checkpoint-reflection">
          <CardHeader>
            <CardTitle className="text-2xl">
              {t('checkpoint.reflection')}
            </CardTitle>
            <CardDescription className="text-base leading-7">
              {t('checkpoint.reflectionDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="grid gap-4 md:grid-cols-3">
              {checkpoint.reflectionPrompts.map((prompt, index) => (
                <li
                  key={prompt}
                  className="rounded-xl border border-border bg-muted/20 p-4 text-sm leading-7"
                >
                  <span className="mb-2 block font-semibold text-primary">
                    {index + 1}
                  </span>
                  {prompt}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card
          className="border-primary/30 bg-primary/[0.04]"
          data-testid="course-checkpoint-completion"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              {t('checkpoint.completion')}
            </CardTitle>
            <CardDescription className="max-w-4xl text-base leading-7">
              {isCompleted
                ? t('checkpoint.completionRecorded')
                : checkpoint.completionAction.requirements.join(' ')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {!isCompleted && (
              <>
                <label className="flex items-start gap-3 rounded-lg border border-border bg-background p-4 text-sm leading-6">
                  <input
                    type="checkbox"
                    checked={exerciseConfirmed}
                    onChange={(event) =>
                      setExerciseConfirmed(event.target.checked)
                    }
                    className="mt-1 h-4 w-4 accent-primary"
                    data-testid="course-checkpoint-exercise-confirmation"
                  />
                  <span>{t('checkpoint.confirmExercise')}</span>
                </label>
                <label className="flex items-start gap-3 rounded-lg border border-border bg-background p-4 text-sm leading-6">
                  <input
                    type="checkbox"
                    checked={reflectionConfirmed}
                    onChange={(event) =>
                      setReflectionConfirmed(event.target.checked)
                    }
                    className="mt-1 h-4 w-4 accent-primary"
                    data-testid="course-checkpoint-reflection-confirmation"
                  />
                  <span>{t('checkpoint.confirmReflection')}</span>
                </label>
                <Button
                  type="button"
                  onClick={() => {
                    if (!canComplete || completionMutation.isPending) return;
                    setCompletionError(null);
                    completionMutation.mutate();
                  }}
                  disabled={!canComplete || completionMutation.isPending}
                  data-testid="course-checkpoint-complete"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {completionMutation.isPending
                    ? t('checkpoint.saving')
                    : checkpoint.completionAction.label}
                </Button>
                {completionError && (
                  <p
                    className="text-sm text-destructive"
                    role="alert"
                    data-testid="course-checkpoint-completion-error"
                  >
                    {completionError}
                  </p>
                )}
              </>
            )}
            {isCompleted && (
              <p
                className="flex items-center gap-2 rounded-lg border border-primary/30 bg-background p-4 text-sm leading-6"
                data-testid="course-checkpoint-completed"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                {t('checkpoint.completionRecorded')}
              </p>
            )}
          </CardContent>
        </Card>

        {nextCheckpoint && nextCheckpointHref && (
          <Card data-testid="course-checkpoint-next">
            <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
              <div className="space-y-1">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                  {t('checkpoint.nextRecommended')}
                </p>
                <h2 className="text-xl font-semibold">
                  {nextCheckpoint.title}
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  {nextCheckpoint.objective}
                </p>
              </div>
              <Button asChild variant="outline">
                <a
                  href={nextCheckpointHref}
                  data-testid="course-checkpoint-next-link"
                >
                  {t('checkpoint.openNext')}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="grid gap-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm leading-6">
          <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export { CourseCheckpointPage };
